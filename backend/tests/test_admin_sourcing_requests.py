import pytest
from fastapi.testclient import TestClient


def get_token(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json().get("access_token")


def test_admin_sourcing_requests_list_and_filters(client: TestClient):
    """Test administrator listing sourcing transactions with filters and search."""
    admin_token = get_token(client, "admin@namadekadda.demo", "NmkAdmin@2026")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Full list
    res = client.get("/api/v1/admin/sourcing-requests", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 18

    # 2. Search by order code
    res_search = client.get("/api/v1/admin/sourcing-requests?search=PO-2026-001", headers=headers)
    assert res_search.status_code == 200
    search_items = res_search.json()
    assert len(search_items) >= 1
    assert search_items[0]["order_code"] == "PO-2026-001"

    # 3. Filter by status
    res_status = client.get("/api/v1/admin/sourcing-requests?status=DELIVERED", headers=headers)
    assert res_status.status_code == 200
    for it in res_status.json():
        assert it["order_status"] == "DELIVERED"


def test_admin_sourcing_request_details(client: TestClient):
    """Test retrieving complete available details of a sourcing transaction."""
    admin_token = get_token(client, "admin@namadekadda.demo", "NmkAdmin@2026")
    headers = {"Authorization": f"Bearer {admin_token}"}

    res = client.get("/api/v1/admin/sourcing-requests/1", headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["order_code"] == "PO-2026-001"
    assert data["buyer_company_name"] == "Apex Dynamics Pvt Ltd"
    assert data["supplier_name"] == "Bharat ForgeTech Solutions"
    assert len(data["items"]) >= 1
    assert data["rfq_code"] == "RFQ-2026-001"
    assert data["quotation"] is not None
    assert data["quotation"]["quote_code"] == "QT-2026-0002"
    assert len(data["negotiations"]) >= 1
    assert len(data["history"]) >= 1


def test_cancel_trade_authorization_and_rules(client: TestClient):
    """Test trade cancellation permissions and state rules."""
    admin_token = get_token(client, "admin@namadekadda.demo", "NmkAdmin@2026")
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")

    # 1. Unauthorized non-admin attempts
    res_buyer = client.post("/api/v1/admin/sourcing-requests/2/cancel", json={"reason": "Unauthorized"}, headers={"Authorization": f"Bearer {buyer_token}"})
    assert res_buyer.status_code == 403

    res_supplier = client.post("/api/v1/admin/sourcing-requests/2/cancel", json={"reason": "Unauthorized"}, headers={"Authorization": f"Bearer {supplier_token}"})
    assert res_supplier.status_code == 403

    # 2. Cannot cancel already DELIVERED order (e.g. order 3)
    res_delivered = client.post("/api/v1/admin/sourcing-requests/3/cancel", json={"reason": "Try cancel delivered"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_delivered.status_code == 400
    assert "delivered" in res_delivered.json()["detail"].lower()

    # 3. Cannot cancel already CANCELLED order (e.g. order 18)
    res_cancelled = client.post("/api/v1/admin/sourcing-requests/18/cancel", json={"reason": "Try cancel cancelled"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_cancelled.status_code == 400
    assert "already cancelled" in res_cancelled.json()["detail"].lower()
