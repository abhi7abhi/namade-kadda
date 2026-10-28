import pytest
from fastapi.testclient import TestClient


def get_token(client: TestClient, email: str = "buyer@namadekadda.demo", password: str = "NmkBuyer@2026", role: str = "BUYER"):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password, "role": role})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def test_ai_procurement_council_unchanged(client: TestClient):
    """1. AI Procurement Council remains unchanged and operational."""
    resp = client.post(
        "/api/v1/agents/run",
        json={"prompt": "Source 500 precision CNC mounting brackets in 3 weeks", "force_demo_mode": True}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "agent_trace" in data or "run_code" in data or "id" in data


def test_buyer_incoming_rfqs_workflow(client: TestClient):
    """
    2-6. Buyer sends RFQ to multiple suppliers, tracks independent responses,
    suppliers accept/decline/quote, and buyer confirms quotation into a PO.
    """
    buyer_token = get_token(client, email="buyer@namadekadda.demo", role="BUYER")
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    supplier_token = get_token(client, email="supplier@namadekadda.demo", password="NmkSupplier@2026", role="SUPPLIER")
    supplier_headers = {"Authorization": f"Bearer {supplier_token}"}

    # 1. Buyer creates RFQ inviting Supplier 1 and Supplier 2
    rfq_create_payload = {
        "title": "Industrial Titanium Bushings High-Precision",
        "category": "CNC Machining",
        "quantity": 1000,
        "unit": "pieces",
        "target_budget": 18000,
        "currency": "USD",
        "destination_country": "India",
        "destination_city": "Bangalore",
        "required_delivery_date": "Within 3 weeks",
        "manufacturing_process": "5-Axis CNC Milling",
        "material_grade": "Titanium Grade 5 (Ti-6Al-4V)",
        "dimensions": "Outer Dia 50mm, Inner Dia 30mm, Length 80mm",
        "tolerances": "±0.01 mm",
        "required_certifications": "ISO 9001:2015, AS9100D",
        "deadline_days": 14,
        "notes": "Requires raw material mill certificate and ultrasonic NDT test report.",
        "terms": "Standard B2B Commercial Terms - Delivery DDP Destination",
        "supplier_ids": [1, 2]
    }
    rfq_resp = client.post("/api/v1/buyer/rfqs", json=rfq_create_payload, headers=buyer_headers)
    assert rfq_resp.status_code == 201
    created_rfq = rfq_resp.json()
    rfq_id = created_rfq["id"]

    # 2. Buyer views Incoming RFQs list - verify independent supplier responses
    rfqs_resp = client.get("/api/v1/buyer/rfqs", headers=buyer_headers)
    assert rfqs_resp.status_code == 200
    rfqs_list = rfqs_resp.json()
    target_rfq = next((r for r in rfqs_list if r["id"] == rfq_id), None)
    assert target_rfq is not None
    assert len(target_rfq["supplier_responses"]) == 2
    # Initially both are Pending
    for supp_resp in target_rfq["supplier_responses"]:
        assert supp_resp["status"] in ("PENDING", "INVITED")
        assert supp_resp["status_label"] == "Pending"

    # 3. Supplier 1 (Apex Precision Engineering) confirms intent to quote (Accept RFQ)
    accept_resp = client.post(f"/api/v1/supplier/rfqs/{rfq_id}/accept", headers=supplier_headers)
    assert accept_resp.status_code == 200

    # 4. Buyer re-checks RFQs: Supplier 1 is now "Accepted (Quoting)"
    rfq_detail_resp = client.get(f"/api/v1/buyer/rfqs/{rfq_id}", headers=buyer_headers)
    assert rfq_detail_resp.status_code == 200
    detail = rfq_detail_resp.json()
    s1_resp = next((s for s in detail["supplier_responses"] if s["supplier_id"] == 1), None)
    assert s1_resp is not None
    assert s1_resp["status"] == "ACCEPTED"
    assert s1_resp["status_label"] == "Accepted"

    # 5. Supplier 1 submits quotation
    quote_payload = {
        "rfq_id": rfq_id,
        "supplier_id": 1,
        "unit_price": 17.50,
        "total_amount": 17500.0,
        "currency": "USD",
        "moq": 500,
        "lead_time_days": 18,
        "notes": "Premium Grade 5 Titanium sourced with full aerospace trace."
    }
    quote_resp = client.post("/api/v1/quotations", json=quote_payload, headers=supplier_headers)
    assert quote_resp.status_code == 201
    created_quote = quote_resp.json()
    quote_id = created_quote["id"]

    # 6. Buyer re-checks RFQs: Supplier 1 is now "Quotation Received"
    rfq_detail_resp2 = client.get(f"/api/v1/buyer/rfqs/{rfq_id}", headers=buyer_headers)
    detail2 = rfq_detail_resp2.json()
    s1_resp2 = next((s for s in detail2["supplier_responses"] if s["supplier_id"] == 1), None)
    assert s1_resp2 is not None
    assert s1_resp2["status"] == "QUOTED"
    assert s1_resp2["status_label"] == "Quotation Received"
    assert s1_resp2["unit_price"] == 17.50
    assert s1_resp2["moq"] == 500
    assert s1_resp2["lead_time_days"] == 18

    # 7. Buyer accepts quotation & confirms into a PO
    accept_quote_resp = client.post(
        f"/api/v1/buyer/rfqs/{rfq_id}/quotes/{quote_id}/accept",
        headers=buyer_headers
    )
    assert accept_quote_resp.status_code == 200
    accepted_data = accept_quote_resp.json()
    assert accepted_data["success"] is True
    po_order_id = accepted_data["order_id"]
    po_order_code = accepted_data["order_code"]
    assert "PO-2026-" in po_order_code

    # 8. Delivery Status: Confirmed PO appears in Buyer orders
    orders_resp = client.get("/api/v1/orders", headers=buyer_headers)
    assert orders_resp.status_code == 200
    buyer_orders = orders_resp.json()
    new_order = next((o for o in buyer_orders if o["id"] == po_order_id), None)
    assert new_order is not None
    assert new_order["status"] == "CONFIRMED"
    assert new_order["order_code"] == po_order_code

    # 9. Supplier updates delivery status in Supplier Workspace (Supplier -> Order & Fulfilment)
    stage_update_payload = {
        "new_status": "IN_PRODUCTION",
        "notes": "CNC batch milling began on Machining Center #4.",
        "tracking_number": "TRK-EXP-99212"
    }
    stage_resp = client.patch(
        f"/api/v1/supplier/orders/{po_order_id}/status",
        json=stage_update_payload,
        headers=supplier_headers
    )
    assert stage_resp.status_code == 200
    assert stage_resp.json()["status"] == "IN_PRODUCTION"

    # 10. Buyer sees live updated status and audit history in Delivery Status
    buyer_order_detail = client.get(f"/api/v1/orders/{po_order_id}", headers=buyer_headers)
    assert buyer_order_detail.status_code == 200
    order_data = buyer_order_detail.json()
    assert order_data["status"] == "IN_PRODUCTION"
    assert order_data["tracking_number"] == "TRK-EXP-99212"
    history_entries = order_data["history"]
    assert len(history_entries) >= 2
    latest_hist = history_entries[-1]
    assert latest_hist["new_status"] == "IN_PRODUCTION"
    assert "Machining Center #4" in (latest_hist["notes"] or "")

    # 11. Negotiation: Order-linked messaging between buyer and supplier
    buyer_msg_payload = {
        "message": "Can we expedite production to 14 days? We can accept partial shipment.",
        "proposed_price": 17.50,
        "proposed_quantity": 1000,
        "proposed_lead_time_days": 14
    }
    neg_resp = client.post(
        f"/api/v1/buyer/negotiations/orders/{po_order_id}/messages",
        json=buyer_msg_payload,
        headers=buyer_headers
    )
    assert neg_resp.status_code == 201

    # Verify thread retrieved by buyer
    neg_thread_resp = client.get(f"/api/v1/buyer/negotiations/orders/{po_order_id}", headers=buyer_headers)
    assert neg_thread_resp.status_code == 200
    thread_data = neg_thread_resp.json()
    assert len(thread_data["messages"]) >= 1
    assert "expedite production" in thread_data["messages"][-1]["message"]


def test_discover_suppliers_and_contact(client: TestClient):
    """
    11. Buyer discovers registered suppliers, filters by country/category,
    and initiates a direct conversation.
    """
    buyer_token = get_token(client, email="buyer@namadekadda.demo", role="BUYER")
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Discover suppliers with filtering
    resp = client.get("/api/v1/suppliers?country=India", headers=buyer_headers)
    assert resp.status_code == 200
    suppliers = resp.json()["items"]
    assert len(suppliers) > 0
    first_supplier = suppliers[0]
    assert first_supplier["country"] == "India"
    assert len(first_supplier["capabilities"]) > 0

    # Contact supplier
    contact_payload = {
        "supplier_id": first_supplier["id"],
        "product_name": "Precision CNC Components",
        "quantity": 500,
        "initial_price_offer": 15.00,
        "message": "Hello, we are interested in discussing an annual supply contract for CNC parts."
    }
    contact_resp = client.post("/api/v1/buyer/suppliers/contact", json=contact_payload, headers=buyer_headers)
    assert contact_resp.status_code == 200
    assert contact_resp.json()["status"] == "SENT"


def test_buyer_dashboard_and_price_comparison(client: TestClient):
    """
    10-11. Buyer dashboard overview and product price comparison across countries and companies.
    """
    buyer_token = get_token(client, email="buyer@namadekadda.demo", role="BUYER")
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Dashboard KPIs
    kpi_resp = client.get("/api/v1/buyer/dashboard-kpis", headers=buyer_headers)
    assert kpi_resp.status_code == 200
    kpis = kpi_resp.json()
    assert "total_rfqs" in kpis
    assert "country_sourcing_analysis" in kpis
    assert len(kpis["country_sourcing_analysis"]) > 0

    # Product Price Comparison
    comp_resp = client.get("/api/v1/buyer/price-comparison?product=Stainless-Steel Mounting Brackets", headers=buyer_headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert comp_data["product_name"] == "Stainless-Steel Mounting Brackets"
    assert len(comp_data["countries"]) > 0
    assert len(comp_data["companies"]) > 0
    assert comp_data["cheapest_country_insight"]["has_data"] is True


def test_authorization_enforcement(client: TestClient):
    """
    12. Access control: Unauthorized buyer cannot view or access another company's private orders or RFQs.
    """
    # Buyer A: Siemens Mobility AG (user id 8, markus.becker@siemens-mobility.demo)
    siemens_token = get_token(client, email="markus.becker@siemens-mobility.demo", password="NmkBuyer@2026", role="BUYER")
    siemens_headers = {"Authorization": f"Bearer {siemens_token}"}

    # Buyer B: Apex Dynamics (user id 4, buyer@namadekadda.demo)
    apex_token = get_token(client, email="buyer@namadekadda.demo", password="NmkBuyer@2026", role="BUYER")
    apex_headers = {"Authorization": f"Bearer {apex_token}"}

    # Order 5 belongs to Siemens Mobility AG (PO-2025-071)
    # Siemens can view Order 5
    siemens_view = client.get("/api/v1/orders/5", headers=siemens_headers)
    assert siemens_view.status_code == 200

    # Apex Dynamics cannot view Order 5 (403 Forbidden)
    apex_view = client.get("/api/v1/orders/5", headers=apex_headers)
    assert apex_view.status_code == 403
