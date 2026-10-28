import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_buyer_analytics_suggestions():
    # 1. Country query
    resp = client.get("/api/v1/analytics/buyer/suggestions?q=Ind")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any(s["category"] == "country" and "India" in s["name"] for s in data["suggestions"])

    # 2. Company query
    resp = client.get("/api/v1/analytics/buyer/suggestions?q=Apex")
    assert resp.status_code == 200
    data = resp.json()
    assert any(s["category"] == "company" and "Apex" in s["name"] for s in data["suggestions"])

    # 3. Product query
    resp = client.get("/api/v1/analytics/buyer/suggestions?q=Smart")
    assert resp.status_code == 200
    data = resp.json()
    assert any(s["category"] == "product" for s in data["suggestions"])


def test_buyer_search_analytics_country():
    resp = client.get("/api/v1/analytics/buyer/search?q=India")
    assert resp.status_code == 200
    data = resp.json()
    assert data["detected_category"] == "country"
    assert data["entity_name"] == "India"
    assert data["empty"] is False
    assert len(data["summary_cards"]) >= 4
    assert "hubs_chart" in data["charts"]
    assert "fulfilment_chart" in data["charts"]
    assert "categories_chart" in data["charts"]
    assert "timeline_chart" in data["charts"]
    assert len(data["data_tables"]["suppliers"]) >= 1


def test_buyer_search_analytics_company():
    resp = client.get("/api/v1/analytics/buyer/search?q=Apex Precision Engineering")
    assert resp.status_code == 200
    data = resp.json()
    assert data["detected_category"] == "company"
    assert "Apex Precision Engineering" in data["entity_name"]
    assert data["empty"] is False
    assert len(data["summary_cards"]) >= 4
    assert "pipeline_chart" in data["charts"]
    assert "order_status_chart" in data["charts"]
    assert "capabilities_chart" in data["charts"]
    assert "activity_chart" in data["charts"]


def test_buyer_search_analytics_product():
    resp = client.get("/api/v1/analytics/buyer/search?q=Smartphone")
    assert resp.status_code == 200
    data = resp.json()
    assert data["detected_category"] == "product"
    assert data["entity_name"] == "Smartphone"
    assert data["empty"] is False
    assert len(data["summary_cards"]) >= 5
    assert "price_chart" in data["charts"]
    assert "order_status_chart" in data["charts"]
    assert "bom_chart" in data["charts"]
    assert "timeline_chart" in data["charts"]
    assert len(data["data_tables"]["components"]) >= 5


def test_buyer_search_analytics_samsung_and_apple():
    # Test Samsung
    resp_s = client.get("/api/v1/analytics/buyer/search?q=Samsung")
    assert resp_s.status_code == 200
    data_s = resp_s.json()
    assert data_s["detected_category"] == "company"
    assert "Samsung" in data_s["entity_name"]
    assert data_s["empty"] is False

    # Test Apple
    resp_a = client.get("/api/v1/analytics/buyer/search?q=Apple")
    assert resp_a.status_code == 200
    data_a = resp_a.json()
    assert data_a["detected_category"] == "company"
    assert "Apple" in data_a["entity_name"]
    assert data_a["empty"] is False


def test_buyer_search_analytics_no_matches():
    resp = client.get("/api/v1/analytics/buyer/search?q=NonExistentEntity9999")
    assert resp.status_code == 200
    data = resp.json()
    assert data["empty"] is True
    assert "No catalog items or procurement records found" in data["empty_message"]


def test_buyer_search_category_override():
    # Force searching 'India' as company
    resp = client.get("/api/v1/analytics/buyer/search?q=India&category=company")
    assert resp.status_code == 200
    data = resp.json()
    assert data["selected_category"] == "company"
    assert data["detected_category"] == "company"
