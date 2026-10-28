import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_supplier_login_and_auth():
    """1 & 2: Test supplier login and role authorization."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/supplier/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "name" in data
    assert "capabilities" in data


def test_company_profile_update_and_verification():
    """3 & 16: Test updating company profile and submitting verification request."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    update_data = {
        "legal_business_name": "Apex Precision Engineering Pvt. Ltd.",
        "factory_location": "Peenya Industrial Area, Phase II",
        "production_capacity": "80,000 components / month",
        "export_countries": "India, Germany, United States, Japan, Singapore",
        "materials_supported": "SS 304, SS 316, Al 6061, Brass, Inconel"
    }
    res = client.put("/api/v1/supplier/profile", headers=headers, json=update_data)
    assert res.status_code == 200
    data = res.json()
    assert data["legal_business_name"] == "Apex Precision Engineering Pvt. Ltd."
    assert data["profile_completeness"] >= 80

    # Verification request
    verif_data = {
        "business_registration_number": "REG-KA-2026-99120",
        "tax_id_or_gst": "29AAAAA0000A1Z5",
        "certification_names": "ISO 9001:2015, AS9100D",
        "notes": "Annual ISO audit renewal completed."
    }
    res2 = client.post("/api/v1/supplier/profile/request-verification", headers=headers, json=verif_data)
    assert res2.status_code == 200
    assert res2.json()["status"] == "PENDING"


def test_product_lifecycle_and_marketplace_visibility():
    """4 & 5: Test product creation, editing, publishing, and shared marketplace visibility."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Create new product
    prod_data = {
        "name": "Aerospace High-Tolerance Bushing M12",
        "sku": "AERO-BUSH-M12",
        "category": "CNC Machining",
        "description": "High precision CNC turned stainless steel bushing for aerospace assemblies.",
        "unit_price": 28.50,
        "currency": "USD",
        "moq": 50,
        "lead_time_days": 14,
        "material": "SS 316L",
        "origin_country": "India",
        "available_quantity": 3000,
        "status": "PUBLISHED"
    }
    res = client.post("/api/v1/supplier/products", headers=headers, json=prod_data)
    assert res.status_code == 201
    created = res.json()
    prod_id = created["id"]
    assert created["name"] == prod_data["name"]

    # Verify visibility in public shared marketplace
    m_res = client.get(f"/api/v1/products?search=Aerospace%20High-Tolerance")
    assert m_res.status_code == 200
    marketplace_items = m_res.json()["items"]
    found = any(it["id"] == prod_id for it in marketplace_items)
    assert found, "Product should appear in shared public marketplace catalogue"

    # Edit product
    edit_res = client.put(
        f"/api/v1/supplier/products/{prod_id}",
        headers=headers,
        json={"unit_price": 26.50, "moq": 40}
    )
    assert edit_res.status_code == 200
    assert edit_res.json()["unit_price"] == 26.50


def test_supplier_rfqs_and_quotation_workflow():
    """6, 7, 8, 9: Test incoming RFQs, actioning, and quotation submission with revision."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Get incoming RFQs
    res = client.get("/api/v1/supplier/rfqs", headers=headers)
    assert res.status_code == 200
    rfqs = res.json()
    assert len(rfqs) > 0
    target_rfq_id = rfqs[0]["rfq_id"]

    # RFQ Detail
    detail_res = client.get(f"/api/v1/supplier/rfqs/{target_rfq_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "title" in detail

    # Submit quotation
    quote_data = {
        "rfq_id": target_rfq_id,
        "unit_price": 16.20,
        "currency": "USD",
        "moq": 100,
        "lead_time_days": 18,
        "incoterms": "FOB",
        "payment_terms": "Net 30",
        "estimated_shipping_cost": 200.0,
        "warranty_info": "12 Months Manufacturer Warranty",
        "notes": "Includes complete mill test report and dimensional QA sheet."
    }
    q_res = client.post("/api/v1/supplier/quotations", headers=headers, json=quote_data)
    assert q_res.status_code == 201
    quote = q_res.json()
    assert quote["unit_price"] == 16.20
    first_quote_id = quote["id"]

    # Create revised quote
    rev_data = {
        "rfq_id": target_rfq_id,
        "unit_price": 15.80,
        "currency": "USD",
        "moq": 150,
        "lead_time_days": 16,
        "incoterms": "FOB",
        "payment_terms": "Net 30",
        "parent_quotation_id": first_quote_id,
        "notes": "Revised volume tier discount."
    }
    rev_res = client.post("/api/v1/supplier/quotations", headers=headers, json=rev_data)
    assert rev_res.status_code == 201
    assert rev_res.json()["unit_price"] == 15.80


def test_negotiation_workspace():
    """12: Test negotiations exchange between supplier and buyer."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # List negotiations
    res = client.get("/api/v1/supplier/negotiations", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Post message
    msg_data = {
        "rfq_id": 1,
        "message": "We can accommodate expedited delivery within 14 days if tooling is signed off by Friday.",
        "proposed_price": 15.40,
        "proposed_lead_time_days": 14
    }
    post_res = client.post("/api/v1/supplier/negotiations", headers=headers, json=msg_data)
    assert post_res.status_code == 201
    assert post_res.json()["proposed_price"] == 15.40


def test_seller_ai_assistant_specialist_roles():
    """14: Test AI Seller Assistant across 6 specialist roles."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    roles = [
        "RFQ_MATCHING",
        "QUOTATION_BUILDER",
        "PRODUCT_LISTING",
        "MANUFACTURING_SPECS",
        "NEGOTIATION_STRATEGY",
        "WORKFLOW_COORDINATOR"
    ]

    for role in roles:
        req = {
            "role": role,
            "prompt": "Evaluate current operations and provide expert operational recommendations."
        }
        res = client.post("/api/v1/supplier/ai-assistant", headers=headers, json=req)
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == role
        assert len(data["reply"]) > 20
        assert data["output_mode"] == "DEMO_AI"


def test_supplier_analytics_and_csv_export():
    """14: Test seller analytics calculations and CSV export."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    # Analytics dashboard
    res = client.get("/api/v1/supplier/analytics", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_quoted_value" in data
    assert "accepted_order_value" in data
    assert "quotation_acceptance_rate" in data
    assert "payments_received_status" in data

    # CSV Export
    csv_res = client.get("/api/v1/supplier/analytics/export-csv", headers=headers)
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "NAMADE KADDA - SUPPLIER SALES" in csv_res.text


def test_in_app_notifications():
    """13: Test in-app notifications listing and read toggle."""
    token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/supplier/notifications", headers=headers)
    assert res.status_code == 200
    notifs = res.json()
    assert len(notifs) > 0
    first_id = notifs[0]["id"]

    # Mark as read
    read_res = client.patch(f"/api/v1/supplier/notifications/{first_id}/read", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["success"] is True


def test_full_buyer_to_seller_journey():
    """
    End-to-end integration journey:
    Buyer creates sourcing request ->
    RFQ created and matching supplier invited ->
    Supplier submits quotation ->
    Buyer accepts quotation ->
    Purchase order appears in supplier workspace ->
    Supplier updates order stage to IN_PRODUCTION ->
    Buyer sees updated stage and tracking in order timeline.
    """
    buyer_token = get_auth_token("buyer@namadekadda.demo", "NmkBuyer@2026")
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    supplier_token = get_auth_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    supplier_headers = {"Authorization": f"Bearer {supplier_token}"}

    # 1. Buyer creates Sourcing Request
    sr_res = client.post("/api/v1/sourcing", headers=buyer_headers, json={
        "raw_input": "Need 500 units of custom CNC machined flange couplings in SS 304 for hydraulic lines.",
        "title": "500x SS 304 Flange Couplings",
        "category": "CNC Machining",
        "quantity": 500,
        "unit": "pieces",
        "target_budget": 9500.0,
        "destination_country": "India",
        "destination_city": "Pune",
        "manufacturing_process": "5-Axis CNC Milling",
        "material_grade": "SS 304",
        "confidence_score": 0.95
    })
    assert sr_res.status_code == 201
    sourcing_id = sr_res.json()["id"]

    # 2. Buyer issues RFQ
    rfq_res = client.post("/api/v1/rfqs", headers=buyer_headers, json={
        "sourcing_request_id": sourcing_id,
        "title": "RFQ: 500x SS 304 Flange Couplings",
        "terms": "Standard Commercial Terms DDP Pune",
        "supplier_ids": [1] # Explicitly invite supplier 1
    })
    assert rfq_res.status_code == 201
    rfq_id = rfq_res.json()["id"]

    # 3. Supplier sees RFQ in Incoming RFQs
    s_rfq_res = client.get(f"/api/v1/supplier/rfqs/{rfq_id}", headers=supplier_headers)
    assert s_rfq_res.status_code == 200
    assert s_rfq_res.json()["rfq_id"] == rfq_id

    # 4. Supplier submits Quotation
    quote_res = client.post("/api/v1/supplier/quotations", headers=supplier_headers, json={
        "rfq_id": rfq_id,
        "unit_price": 18.00,
        "currency": "USD",
        "moq": 100,
        "lead_time_days": 15,
        "incoterms": "FOB",
        "payment_terms": "Net 30",
        "estimated_shipping_cost": 300.0,
        "notes": "CNC milled with inspection certificate."
    })
    assert quote_res.status_code == 201
    quote_id = quote_res.json()["id"]

    # 5. Buyer accepts the Quotation
    accept_res = client.post(
        f"/api/v1/quotations/{quote_id}/accept",
        headers=buyer_headers,
        json={
            "acceptance_reason": "Meets technical requirements and delivery schedule.",
            "generate_order": True
        }
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 6. Supplier sees the new Purchase Order in their Orders & Fulfilment workspace
    s_orders_res = client.get("/api/v1/supplier/orders", headers=supplier_headers)
    assert s_orders_res.status_code == 200
    supplier_orders = s_orders_res.json()
    matched_order = next((o for o in supplier_orders if o["quotation_id"] == quote_id), None)
    assert matched_order is not None, "Order should appear in supplier workspace"
    order_id = matched_order["id"]

    # 7. Supplier advances order stage to IN_PRODUCTION with tracking
    update_res = client.patch(
        f"/api/v1/supplier/orders/{order_id}/status",
        headers=supplier_headers,
        json={
            "new_status": "IN_PRODUCTION",
            "production_notes": "SS 304 billets loaded onto CNC mill. Machining underway.",
            "tracking_number": "SIM-TRK-JOURNEY-9901"
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "IN_PRODUCTION"

    # 8. Buyer reads the exact same Order and sees the updated status and history
    b_order_res = client.get(f"/api/v1/orders/{order_id}", headers=buyer_headers)
    assert b_order_res.status_code == 200
    buyer_order = b_order_res.json()
    assert buyer_order["status"] == "IN_PRODUCTION"
    assert buyer_order["tracking_number"] == "SIM-TRK-JOURNEY-9901"
    assert len(buyer_order["history"]) >= 2
    assert any(h["new_status"] == "IN_PRODUCTION" for h in buyer_order["history"])
