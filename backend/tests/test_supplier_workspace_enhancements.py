import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(email: str = "supplier@namadekadda.demo", password: str = "NmkSupplier@2026") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_order_fulfilment_delivery_tracking_and_history():
    """Module 2: Test orders listing, detail, delivery tracking, and history updates."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List supplier orders
    res = client.get("/api/v1/supplier/orders", headers=headers)
    assert res.status_code == 200
    orders = res.json()
    assert len(orders) > 0
    first_order = orders[0]
    assert "order_code" in first_order
    assert "buyer_company_name" in first_order
    assert "buyer_country" in first_order
    assert "status" in first_order

    order_id = first_order["id"]

    # 2. Get order detail
    detail_res = client.get(f"/api/v1/supplier/orders/{order_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == order_id
    assert "items" in detail
    assert "history" in detail

    # 3. Update order fulfilment status to READY_FOR_DISPATCH
    update_payload = {
        "new_status": "READY_FOR_DISPATCH",
        "production_notes": "Quality audit completed and packaged in export crate.",
        "tracking_number": "TRK-EXP-9921820"
    }
    patch_res = client.patch(f"/api/v1/supplier/orders/{order_id}/status", headers=headers, json=update_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "READY_FOR_DISPATCH"
    assert updated["tracking_number"] == "TRK-EXP-9921820"

    # Verify history entry
    hist = updated["history"]
    assert any(h["new_status"] == "READY_FOR_DISPATCH" for h in hist)


def test_order_based_negotiations_and_structured_proposals():
    """Module 3: Test order negotiations, message thread, sending proposal, and accepting proposal."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List order negotiations
    list_res = client.get("/api/v1/supplier/negotiations/orders", headers=headers)
    assert list_res.status_code == 200
    order_negs = list_res.json()
    assert len(order_negs) > 0
    target_order_id = order_negs[0]["order_id"]

    # 2. Get negotiation thread for this order
    thread_res = client.get(f"/api/v1/supplier/negotiations/orders/{target_order_id}", headers=headers)
    assert thread_res.status_code == 200
    thread_data = thread_res.json()
    assert "order" in thread_data
    assert "messages" in thread_data

    # 3. Post a message with structured commercial proposal
    proposal_payload = {
        "order_id": target_order_id,
        "message": "We can expedite this delivery if unit rate is revised to $18.50 for 600 units.",
        "action_type": "PROPOSAL",
        "proposed_price": 18.50,
        "proposed_quantity": 600,
        "proposed_lead_time_days": 14,
        "proposed_payment_terms": "Net 30, CIF Port"
    }
    msg_res = client.post(
        f"/api/v1/supplier/negotiations/orders/{target_order_id}/messages",
        headers=headers,
        json=proposal_payload
    )
    assert msg_res.status_code == 201
    created_msg = msg_res.json()
    assert created_msg["action_type"] == "PROPOSAL"
    assert created_msg["proposed_price"] == 18.50
    proposal_id = created_msg["id"]

    # 4. Accept proposal and verify order terms updated
    action_payload = {
        "action": "ACCEPT",
        "message": "Agreed to revised terms of $18.50 for 600 units."
    }
    action_res = client.post(
        f"/api/v1/supplier/negotiations/orders/{target_order_id}/proposals/{proposal_id}/action",
        headers=headers,
        json=action_payload
    )
    assert action_res.status_code == 200
    action_data = action_res.json()
    assert action_data["success"] is True
    assert action_data["action"] == "ACCEPT"
    # Expected total is 18.50 * 600 = 11,100
    assert action_data["new_total"] == 11100.0


def test_supplier_dashboard_dynamic_analytics_and_5_graphs():
    """Module 4: Test supplier analytics with 5 dynamic Recharts graphs and multi-filter support."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch dashboard analytics with default filters
    res = client.get("/api/v1/supplier/dashboard/analytics", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Check KPI cards
    kpis = data["kpis"]
    assert "total_completed_orders" in kpis
    assert "active_orders" in kpis
    assert "total_sales_revenue" in kpis
    assert "unique_buyers" in kpis
    assert "active_products" in kpis
    assert "pending_rfqs" in kpis

    # Check 5 dynamic graphs
    graphs = data["graphs"]
    assert "business_by_country" in graphs
    assert "best_selling_products" in graphs
    assert "regular_buyers" in graphs
    assert "sales_over_time" in graphs
    assert "order_status_distribution" in graphs

    assert len(graphs["business_by_country"]) > 0
    assert len(graphs["best_selling_products"]) > 0
    assert len(graphs["regular_buyers"]) > 0
    assert len(graphs["sales_over_time"]) > 0
    assert len(graphs["order_status_distribution"]) > 0

    # 2. Test multi-filtering (by country and date range)
    filter_res = client.get(
        "/api/v1/supplier/dashboard/analytics?country=Germany&date_range=ALL_TIME",
        headers=headers
    )
    assert filter_res.status_code == 200
    filtered_data = filter_res.json()
    assert filtered_data["filters"]["active"]["country"] == "Germany"


def test_discover_buyers_directory_and_contact_workflow():
    """Module 5: Test discover buyers directory, search, and direct contact."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List buyers directory
    buyers_res = client.get("/api/v1/supplier/buyers", headers=headers)
    assert buyers_res.status_code == 200
    buyers = buyers_res.json()
    assert len(buyers) > 0
    first_buyer = buyers[0]
    assert "company_name" in first_buyer
    assert "country" in first_buyer
    assert "industry" in first_buyer
    assert "categories_of_interest" in first_buyer
    assert "active_rfqs_count" in first_buyer

    # 2. Search buyers
    search_res = client.get("/api/v1/supplier/buyers?search=Siemens", headers=headers)
    assert search_res.status_code == 200
    search_results = search_res.json()
    assert len(search_results) > 0
    assert any("Siemens" in b["company_name"] for b in search_results)

    # 3. Contact buyer
    contact_payload = {
        "buyer_id": first_buyer["id"],
        "subject": "Direct Introduction: AS9100 Certified CNC Machining",
        "message": "We have open manufacturing slots for high-precision components matching your recent requirements."
    }
    contact_res = client.post("/api/v1/supplier/buyers/contact", headers=headers, json=contact_payload)
    assert contact_res.status_code == 200
    contact_data = contact_res.json()
    assert contact_data["success"] is True
    assert "message_id" in contact_data


def test_incoming_rfqs_review_accept_and_decline():
    """Module 6: Test incoming RFQ review, accept, and decline actions."""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List incoming RFQs
    res = client.get("/api/v1/supplier/rfqs", headers=headers)
    assert res.status_code == 200
    rfqs = res.json()
    assert len(rfqs) > 0
    rfq_id = rfqs[0]["rfq_id"]

    # 2. Accept RFQ
    accept_res = client.post(f"/api/v1/supplier/rfqs/{rfq_id}/accept", headers=headers)
    assert accept_res.status_code == 200
    accept_data = accept_res.json()
    assert accept_data["status"] == "ACCEPTED"

    # 3. Decline RFQ
    decline_res = client.post(
        f"/api/v1/supplier/rfqs/{rfq_id}/decline",
        headers=headers,
        json={"action": "DECLINE", "reason": "Machine bed size insufficient for requested 1200mm parts."}
    )
    assert decline_res.status_code == 200
    decline_data = decline_res.json()
    assert decline_data["status"] == "DECLINED"
