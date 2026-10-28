"""
Unit and integration tests for AI Seller Assistant: Inactive Customer Analytics
in Namade Kadda Supplier Workspace.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.seed.seed_customer_retention import seed_customer_retention_data

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_retention_seed():
    db = SessionLocal()
    seed_customer_retention_data(db, 1)
    db.close()


def get_supplier_token():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "supplier@namadekadda.demo",
        "password": "NmkSupplier@2026"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    return login_resp.json()["access_token"]


def test_customer_insights_overview():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/supplier/customers/insights", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    summary = data["summary"]
    assert summary["total_customers"] >= 5
    assert summary["regular_count"] >= 1
    assert summary["at_risk_count"] >= 1
    assert summary["inactive_count"] >= 1
    assert summary["total_historical_revenue"] > 50000.0

    companies = [c["company_name"] for c in data["customers"]]
    assert "Siemens Mobility AG" in companies
    assert "KUKA Robotics GmbH" in companies
    assert "Nordic Wind Energy Systems" in companies

    # Check disclaimer
    assert "analytical estimates" in data["disclaimer"].lower()


def test_customer_status_classification():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/supplier/customers/insights", headers=headers)
    assert resp.status_code == 200
    customers = {c["company_name"]: c for c in resp.json()["customers"]}

    # Siemens Mobility: Inactive (> 90 days, > 3x interval)
    siemens = customers.get("Siemens Mobility AG")
    assert siemens is not None
    assert siemens["status"] == "INACTIVE"
    assert siemens["risk_level"] == "HIGH"
    assert siemens["days_since_last_purchase"] > 90

    # KUKA Robotics: At-Risk (62 days ago vs ~40d interval)
    kuka = customers.get("KUKA Robotics GmbH")
    assert kuka is not None
    assert kuka["status"] == "AT_RISK"
    assert kuka["risk_level"] == "MEDIUM"

    # Nordic Wind: Regular (~18 days ago)
    nordic = customers.get("Nordic Wind Energy Systems")
    assert nordic is not None
    assert nordic["status"] == "REGULAR"
    assert nordic["risk_level"] == "LOW"


def test_cancelled_orders_excluded_from_spend():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/supplier/customers/insights", headers=headers)
    assert resp.status_code == 200
    customers = {c["company_name"]: c for c in resp.json()["customers"]}

    emirates = customers.get("Emirates Heavy Industries LLC")
    assert emirates is not None
    # Emirates has 1 completed ($42,000) and 1 cancelled ($38,000). Total spend must be $42,000, NOT $80,000.
    assert emirates["total_completed_orders"] == 1
    assert emirates["cancelled_orders_count"] == 1
    assert emirates["total_historical_spend"] == 42000.00


def test_filter_non_regular_customers():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Filter NON_REGULAR (At-Risk + Inactive)
    resp = client.get("/api/v1/supplier/customers/insights?status=NON_REGULAR", headers=headers)
    assert resp.status_code == 200
    customers = resp.json()["customers"]
    for c in customers:
        assert c["status"] in ("AT_RISK", "INACTIVE")

    # Filter INACTIVE
    resp_in = client.get("/api/v1/supplier/customers/insights?status=INACTIVE", headers=headers)
    assert resp_in.status_code == 200
    for c in resp_in.json()["customers"]:
        assert c["status"] == "INACTIVE"


def test_search_and_country_filters():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Search "Siemens"
    resp = client.get("/api/v1/supplier/customers/insights?search=Siemens", headers=headers)
    assert resp.status_code == 200
    names = [c["company_name"] for c in resp.json()["customers"]]
    assert "Siemens Mobility AG" in names
    assert len(names) == 1

    # Filter by Country "Germany"
    resp_de = client.get("/api/v1/supplier/customers/insights?country=Germany", headers=headers)
    assert resp_de.status_code == 200
    for c in resp_de.json()["customers"]:
        assert c["country"] == "Germany"


def test_customer_detail_analytics_graphs_and_products():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/supplier/customers/Siemens%20Mobility%20AG/analytics", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    summary = data["customer_summary"]
    assert summary["company_name"] == "Siemens Mobility AG"
    assert summary["status"] == "INACTIVE"
    assert summary["total_completed_orders"] == 3
    assert summary["total_historical_spend"] > 80000.0

    # Products previously purchased table
    products = data["products_purchased"]
    assert len(products) >= 2
    p_names = [p["product_name"] for p in products]
    assert "CNC Machined Flange Adapter SS 316" in p_names
    assert "Aluminum Electronics Housing" in p_names

    flange = next(p for p in products if p["product_name"] == "CNC Machined Flange Adapter SS 316")
    assert flange["total_quantity"] == 2700
    assert flange["order_count"] == 2
    assert len(flange["orders_breakdown"]) == 2

    # Verify 5 interactive graphs data structures
    graphs = data["graphs"]
    assert len(graphs["activity_over_time"]) >= 2
    assert len(graphs["products_breakdown"]) >= 2
    assert len(graphs["category_distribution"]) >= 1
    assert len(graphs["purchase_frequency"]) >= 2
    assert len(graphs["historical_spending"]) >= 2
    assert graphs["availability"]["activity"] is True

    # Verify AI Recommendations (Separation of Facts from Suggestions)
    ai = data["ai_recommendations"]
    assert ai["retention_risk_level"] == "HIGH"
    assert len(ai["facts"]) >= 2
    assert len(ai["suggestions"]) >= 2
    # Verify fact contains deterministic numbers
    assert any("Siemens Mobility AG" in f for f in ai["facts"])
    assert any("CNC Machined Flange" in f for f in ai["facts"])


def test_follow_up_reminder_creation():
    token = get_supplier_token()
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/supplier/customers/Siemens%20Mobility%20AG/reminder",
        json={"notes": "Call Markus Becker regarding Q2 flange restocking."},
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "Siemens Mobility AG" in data["message"]

    # Verify notification appears in supplier notifications list
    notif_resp = client.get("/api/v1/supplier/notifications", headers=headers)
    assert notif_resp.status_code == 200
    notifs = notif_resp.json()
    found = any("Siemens Mobility AG" in n["title"] for n in notifs)
    assert found is True


def test_unauthorized_access_prevented():
    # Attempting to access customer insights without token must return 401
    resp = client.get("/api/v1/supplier/customers/insights")
    assert resp.status_code == 401
