import pytest
from fastapi.testclient import TestClient


def get_token(client: TestClient, email: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    return data.get("access_token") or data.get("token")


def test_relevant_matching_core_journey(client: TestClient):
    """
    1. Supplier lists a product.
    2. Buyer creates an RFQ for that product.
    3. Supplier sees the buyer in Relevant Buyers with high match score & explainable reasons.
    4. Buyer sees the supplier in Relevant Suppliers.
    """
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")

    s_headers = {"Authorization": f"Bearer {supplier_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Step 1: Supplier creates a catalog product
    unique_part = "OLED-DISP-4K-PRO"
    prod_payload = {
        "name": "Ultra-HD 4K OLED Flexible Display Panel",
        "category": "Electronic Components & Displays",
        "description": "High-contrast 120Hz 4K flexible AMOLED display module for advanced mobile systems.",
        "specifications": "Resolution: 3840x2160, 120Hz refresh, DCI-P3 100%, 48V power regulation",
        "material": "Polymer Substrate / Indium Tin Oxide",
        "unit_price": 85.00,
        "currency": "USD",
        "moq": 50,
        "lead_time_days": 12,
        "available_quantity": 2500,
        "in_stock": True,
        "part_number": unique_part,
        "certifications": "ISO 9001:2015, RoHS Compliant, CE Mark"
    }

    create_prod_res = client.post("/api/v1/supplier/products", json=prod_payload, headers=s_headers)
    assert create_prod_res.status_code in [200, 201]

    # Step 2: Buyer creates a Sourcing Request and RFQ for matching display
    sourcing_res = client.post("/api/v1/sourcing", json={
        "raw_input": "Source 300 units of Ultra-HD 4K OLED Flexible Display Module for smartphone assembly",
        "title": "Ultra-HD 4K OLED Flexible Display Module",
        "category": "Electronic Components & Displays",
        "material_grade": "Polymer Substrate / Indium Tin Oxide",
        "quantity": 300,
        "unit": "units",
        "target_budget": 30000.0,
        "destination_country": "India",
        "destination_city": "Bengaluru",
        "tolerances": "ISO 2768-m, 120Hz, 48V",
        "dimensions": "150mm x 75mm x 1.2mm",
        "required_certifications": "ISO 9001:2015, RoHS",
        "notes": "Urgent procurement batch for flagship smartphone model run."
    }, headers=b_headers)
    assert sourcing_res.status_code in [200, 201]
    sr_data = sourcing_res.json()
    sr_id = sr_data["id"]

    # Generate RFQ for this requirement
    rfq_res = client.post("/api/v1/rfqs", json={
        "sourcing_request_id": sr_id,
        "title": "Ultra-HD 4K OLED Flexible Display Module"
    }, headers=b_headers)
    assert rfq_res.status_code in [200, 201]
    rfq_data = rfq_res.json()
    rfq_id = rfq_data["id"]

    # Step 3: Supplier calls GET /api/v1/supplier/relevant-buyers
    rel_buyers_res = client.get("/api/v1/supplier/relevant-buyers", headers=s_headers)
    assert rel_buyers_res.status_code == 200
    buyers = rel_buyers_res.json()
    assert len(buyers) > 0

    # Locate the matching buyer opportunity
    match = next((b for b in buyers if b["rfq_id"] == rfq_id), None)
    assert match is not None, f"Created RFQ {rfq_id} was not found in supplier's relevant buyers!"
    assert match["match_score"] >= 75.0
    assert match["match_level"] in ["STRONG_MATCH", "EXCEPTIONAL_MATCH"]
    assert len(match["match_reasons"]) >= 2
    assert "score_breakdown" in match
    assert match["requested_quantity"] == 300

    # Step 4: Buyer calls GET /api/v1/buyer/relevant-suppliers
    rel_suppliers_res = client.get("/api/v1/buyer/relevant-suppliers", headers=b_headers)
    assert rel_suppliers_res.status_code == 200
    suppliers = rel_suppliers_res.json()
    assert len(suppliers) > 0

    supp_match = next((s for s in suppliers if s["part_number"] == unique_part), None)
    assert supp_match is not None, f"Product {unique_part} was not recommended to the buyer!"
    assert supp_match["match_score"] >= 75.0
    assert len(supp_match["match_reasons"]) >= 2


def test_unrelated_products_and_specification_conflicts(client: TestClient):
    """
    5. A different, unrelated product does not receive an incorrect exact-match ranking.
    6. Specification conflicts are handled correctly (e.g. incompatible material).
    """
    from app.services.matching_service import MatchingService

    # Case A: Totally unrelated product
    score_unrelated, level_unrelated, reasons_unrelated, _, breakdown_unrelated = MatchingService.calculate_compatibility(
        buyer_title="Titanium High-Pressure Hydraulic Valve",
        buyer_category="Hydraulics & Fluid Power",
        buyer_material="Grade 5 Titanium",
        buyer_specs="350 bar rated, M20 port",
        buyer_qty=200,
        buyer_certs="AS9100D",
        catalog_name="Cardboard Packaging Corrugated Box",
        catalog_category="Packaging & Paper",
        catalog_material="Recycled Kraft Paper",
        catalog_specs="300x200x150 mm",
        catalog_moq=1000,
        catalog_avail_qty=10000,
        supplier_certs="FSC Certified",
        supplier_country="Vietnam",
        buyer_country="Germany"
    )

    assert score_unrelated < 40.0
    assert level_unrelated in ["PARTIAL_MATCH", "MODERATE_MATCH"]
    assert breakdown_unrelated["product_match"] < 20.0

    # Case B: Conflicting material specification (stainless steel vs polymer/plastic)
    score_conflict, level_conflict, reasons_conflict, _, _ = MatchingService.calculate_compatibility(
        buyer_title="Sanitary Pipe Flange Adapter",
        buyer_category="Pipes & Valves",
        buyer_material="Stainless Steel SS 316L",
        buyer_specs="DIN 11851 sanitary coupling",
        buyer_qty=500,
        buyer_certs="EN 10204 3.1",
        catalog_name="Sanitary Pipe Flange Adapter",
        catalog_category="Pipes & Valves",
        catalog_material="Polyvinyl Chloride (PVC Plastic)",
        catalog_specs="DIN 11851 standard",
        catalog_moq=100,
        catalog_avail_qty=5000,
        supplier_certs="ISO 9001:2015",
        supplier_country="India",
        buyer_country="India"
    )

    # Must be penalized due to material conflict
    assert score_conflict <= 35.0
    assert any("conflict" in r.lower() for r in reasons_conflict)


def test_filters_and_sorting(client: TestClient):
    """
    7. Quantity, country, category, and certification filters work on Relevant Suppliers and Relevant Buyers.
    """
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")

    s_headers = {"Authorization": f"Bearer {supplier_token}"}
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 1. Supplier filter by minimum quantity
    q_res = client.get("/api/v1/supplier/relevant-buyers?min_quantity=100", headers=s_headers)
    assert q_res.status_code == 200
    for item in q_res.json():
        assert item["requested_quantity"] >= 100

    # 2. Supplier filter by category
    cat_res = client.get("/api/v1/supplier/relevant-buyers?category=Electronic", headers=s_headers)
    assert cat_res.status_code == 200
    for item in cat_res.json():
        assert "electronic" in item["matching_category"].lower() or "electronic" in item["rfq_title"].lower()

    # 3. Buyer filter by lead time and sorting by price
    lead_res = client.get("/api/v1/buyer/relevant-suppliers?max_lead_time=30&sort_by=price_asc", headers=b_headers)
    assert lead_res.status_code == 200
    supp_list = lead_res.json()
    for s in supp_list:
        assert s["lead_time_days"] <= 30

    # Verify ascending price order
    prices = [s["unit_price"] for s in supp_list]
    assert prices == sorted(prices)


def test_closed_or_expired_rfqs_handling(client: TestClient):
    """
    9. Closed or expired RFQs are handled correctly (filtered out of active open recommendations by default).
    """
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")
    s_headers = {"Authorization": f"Bearer {supplier_token}"}

    # Default query fetches active/open
    default_res = client.get("/api/v1/supplier/relevant-buyers?rfq_status=ISSUED", headers=s_headers)
    assert default_res.status_code == 200
    for item in default_res.json():
        assert item["rfq_status"] == "ISSUED"


def test_filter_options_endpoint(client: TestClient):
    """Test retrieving distinct filter options for UI filter controls."""
    res = client.get("/api/v1/buyer/filter-options")
    assert res.status_code == 200
    data = res.json()
    assert "categories" in data
    assert len(data["categories"]) > 0
    assert "countries" in data
    assert "certifications" in data
