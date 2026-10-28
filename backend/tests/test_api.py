import json
import pytest


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True
    assert data["ai_mode"] == "DEMO"
    assert data["is_demo_mode"] is True


def test_suppliers_list_and_filter(client):
    # Test list
    response = client.get("/api/v1/suppliers")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 5

    # Test country filter
    resp_india = client.get("/api/v1/suppliers?country=India")
    assert resp_india.status_code == 200
    india_data = resp_india.json()
    for item in india_data["items"]:
        assert "India" in item["country"]

    # Test search
    resp_search = client.get("/api/v1/suppliers?search=Apex")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert len(search_data["items"]) >= 1
    assert "Apex" in search_data["items"][0]["name"]


def test_sourcing_parse_and_create(client):
    # 1. Parse natural language requirement
    raw = "Source 1000 stainless-steel mounting brackets, grade 304, thickness 4 mm, manufactured in India, delivered within four weeks."
    parse_resp = client.post("/api/v1/sourcing/parse", json={"raw_input": raw})
    assert parse_resp.status_code == 200
    parsed = parse_resp.json()
    assert parsed["quantity"] == 1000
    assert "Stainless" in parsed["material_grade"]
    assert parsed["destination_country"] == "India"
    assert parsed["mode"] == "DEMO"

    # 2. Save confirmed sourcing request
    create_resp = client.post("/api/v1/sourcing", json={
        "raw_input": raw,
        "title": parsed["title"],
        "category": parsed["category"],
        "quantity": parsed["quantity"],
        "unit": parsed["unit"],
        "destination_country": parsed["destination_country"],
        "material_grade": parsed["material_grade"],
        "manufacturing_process": parsed["manufacturing_process"],
        "dimensions": parsed["dimensions"],
        "required_delivery_date": parsed["required_delivery_date"],
        "status": "CONFIRMED"
    })
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["id"] > 0
    assert created["request_code"].startswith("SR-2026-")
    assert created["quantity"] == 1000

    # 3. Retrieve detail
    get_resp = client.get(f"/api/v1/sourcing/{created['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == created["id"]


def test_rfq_and_quotation_workflow(client):
    # Create RFQ
    rfq_resp = client.post("/api/v1/rfqs", json={
        "sourcing_request_id": 1,
        "title": "RFQ for Industrial Batch Production",
        "supplier_ids": [1, 2]
    })
    assert rfq_resp.status_code == 201
    rfq = rfq_resp.json()
    assert rfq["id"] > 0
    assert rfq["status"] == "ISSUED"

    # Submit Quotation
    quote_resp = client.post("/api/v1/quotations", json={
        "rfq_id": rfq["id"],
        "supplier_id": 1,
        "total_amount": 9500.00,
        "unit_price": 19.00,
        "moq": 100,
        "lead_time_days": 18,
        "shipping_estimate": 300.00,
        "payment_terms": "Net 30",
        "notes": "Including packaging and sample test coupons",
        "items": [
            {
                "item_name": "Bracket Line 1",
                "quantity": 500,
                "unit_price": 19.00,
                "total_price": 9500.00,
                "lead_time_days": 18
            }
        ]
    })
    assert quote_resp.status_code == 201
    quote = quote_resp.json()
    assert quote["status"] == "SUBMITTED"

    # Compare quotations with weighted scoring
    compare_resp = client.post(f"/api/v1/quotations/compare/{rfq['id']}", json={
        "price_weight": 0.5,
        "lead_time_weight": 0.3,
        "reliability_weight": 0.2
    })
    assert compare_resp.status_code == 200
    comp_data = compare_resp.json()
    assert comp_data["rfq_id"] == rfq["id"]
    assert len(comp_data["quotations"]) >= 1
    assert "transparency_explanation" in comp_data

    # Accept quotation with justification
    accept_resp = client.post(f"/api/v1/quotations/{quote['id']}/accept", json={
        "acceptance_reason": "Verified ISO certification and compliant lead time",
        "generate_order": True
    })
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "ACCEPTED"


def test_order_status_transitions(client):
    orders_resp = client.get("/api/v1/orders")
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    assert len(orders) >= 1
    order_id = orders[0]["id"]
    current_status = orders[0]["status"]

    # If it's CONFIRMED, transition to IN_PRODUCTION first
    if current_status == "CONFIRMED":
        prod_resp = client.patch(f"/api/v1/orders/{order_id}/status", json={
            "new_status": "IN_PRODUCTION",
            "notes": "Materials loaded into CNC machinery",
            "changed_by": "Floor Supervisor"
        })
        assert prod_resp.status_code == 200
        assert prod_resp.json()["status"] == "IN_PRODUCTION"

    # Valid transition to READY_TO_SHIP
    update_resp = client.patch(f"/api/v1/orders/{order_id}/status", json={
        "new_status": "READY_TO_SHIP",
        "notes": "Quality inspection passed 100%",
        "changed_by": "Senior QA Inspector"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "READY_TO_SHIP"

    # Transition to SHIPPED should populate simulated tracking code
    ship_resp = client.patch(f"/api/v1/orders/{order_id}/status", json={
        "new_status": "SHIPPED",
        "notes": "Dispatched via road carrier",
        "changed_by": "Logistics Lead"
    })
    assert ship_resp.status_code == 200
    shipped = ship_resp.json()
    assert shipped["status"] == "SHIPPED"
    assert shipped["tracking_number"] is not None
    assert "SIM-TRK-" in shipped["tracking_number"]

    # Invalid transition (e.g. going back to DRAFT from SHIPPED) should fail with 400
    bad_resp = client.patch(f"/api/v1/orders/{order_id}/status", json={
        "new_status": "DRAFT",
        "notes": "Illegal backward transition"
    })
    assert bad_resp.status_code == 400


def test_bom_management_and_csv(client):
    # Create BOM
    bom_resp = client.post("/api/v1/bom/projects", json={
        "title": "Test Assembly BOM",
        "currency": "USD",
        "items": [
            {
                "part_name": "Machined Shaft",
                "material": "Al 6061",
                "quantity": 10,
                "unit": "pcs",
                "estimated_unit_cost": 25.00
            },
            {
                "part_name": "Sealing O-Ring",
                "material": "Viton",
                "quantity": 20,
                "unit": "pcs",
                "estimated_unit_cost": 2.50
            }
        ]
    })
    assert bom_resp.status_code == 201
    bom = bom_resp.json()
    # 10*25 + 20*2.5 = 250 + 50 = 300
    assert float(bom["total_estimated_cost"]) == 300.00

    # Add item
    add_resp = client.post(f"/api/v1/bom/projects/{bom['id']}/items", json={
        "part_name": "Fastener Kit M6",
        "quantity": 50,
        "unit": "pcs",
        "estimated_unit_cost": 1.00
    })
    assert add_resp.status_code == 201

    # Verify updated subtotal (300 + 50 = 350)
    get_proj = client.get(f"/api/v1/bom/projects/{bom['id']}")
    assert get_proj.status_code == 200
    assert float(get_proj.json()["total_estimated_cost"]) == 350.00

    # Test CSV export
    csv_resp = client.get(f"/api/v1/bom/projects/{bom['id']}/export-csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Machined Shaft" in csv_resp.text
    assert "Subtotal" in csv_resp.text


def test_ai_agent_orchestration_demo_mode(client):
    run_resp = client.post("/api/v1/agents/run", json={
        "prompt": "Evaluate procurement of 500 stainless brackets with priority on delivery lead time.",
        "sourcing_request_id": 1,
        "force_demo_mode": True
    })
    assert run_resp.status_code == 200
    data = run_resp.json()
    assert data["mode"] == "DEMO"
    assert data["status"] == "COMPLETED"
    assert len(data["events"]) == 6  # All 6 specialist agents executed

    # Verify agent roles executed in order
    agent_names = [e["agent_name"] for e in data["events"]]
    assert "Procurement Agent" in agent_names
    assert "Supplier Matching Agent" in agent_names
    assert "Engineering Agent" in agent_names
    assert "Trade & Compliance Agent" in agent_names
    assert "Negotiation Agent" in agent_names
    assert "Coordinator Agent" in agent_names


def test_trade_compliance_estimate(client):
    trade_resp = client.post("/api/v1/trade/estimate", json={
        "origin_country": "China",
        "destination_country": "India",
        "product_description": "Industrial stainless steel mounting brackets",
        "declared_value": 10000.00,
        "currency": "USD",
        "freight_insurance_estimate": 800.00
    })
    assert trade_resp.status_code == 200
    data = trade_resp.json()
    assert data["cif_value"] == 10800.00
    assert data["hs_code_candidate"] == "7326.90.99"
    assert data["is_simulated_estimate"] is True
    assert "ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION" in data["disclaimer"]
    assert len(data["compliance_checklist"]) >= 4


def test_analytics_dashboard_backed_by_db(client):
    resp = client.get("/api/v1/analytics/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_sourcing_requests"] >= 1
    assert data["total_suppliers"] >= 5
    assert data["total_spend"] > 0
    assert len(data["rfqs_by_status"]) >= 1
    assert len(data["orders_by_status"]) >= 1
    assert len(data["recent_activity"]) >= 1


def test_demo_accounts_authentication(client):
    # Test Buyer Demo Login
    buyer_resp = client.post("/api/v1/auth/login", json={
        "email": "buyer@namadekadda.demo",
        "password": "NmkBuyer@2026"
    })
    assert buyer_resp.status_code == 200
    buyer_data = buyer_resp.json()
    assert "access_token" in buyer_data
    assert buyer_data["user"]["role"] == "BUYER"
    assert buyer_data["user"]["email"] == "buyer@namadekadda.demo"

    # Test Supplier Demo Login
    supp_resp = client.post("/api/v1/auth/login", json={
        "email": "supplier@namadekadda.demo",
        "password": "NmkSupplier@2026"
    })
    assert supp_resp.status_code == 200
    supp_data = supp_resp.json()
    assert "access_token" in supp_data
    assert supp_data["user"]["role"] == "SUPPLIER"
    assert supp_data["user"]["supplier_id"] is not None

    # Test Admin Demo Login
    admin_resp = client.post("/api/v1/auth/login", json={
        "email": "admin@namadekadda.demo",
        "password": "NmkAdmin@2026"
    })
    assert admin_resp.status_code == 200
    admin_data = admin_resp.json()
    assert "access_token" in admin_data
    assert admin_data["user"]["role"] == "ADMIN"

    # Test Invalid Password
    bad_pw_resp = client.post("/api/v1/auth/login", json={
        "email": "buyer@namadekadda.demo",
        "password": "WrongPassword123!"
    })
    assert bad_pw_resp.status_code == 401

    # Test Nonexistent User
    unknown_resp = client.post("/api/v1/auth/login", json={
        "email": "unknown@domain.com",
        "password": "NmkBuyer@2026"
    })
    assert unknown_resp.status_code == 401


def test_buyer_registration_and_profile(client):
    reg_resp = client.post("/api/v1/auth/register/buyer", json={
        "email": "procurement.lead@aerotech.com",
        "password": "AeroPassword@2026",
        "full_name": "Anita Rao",
        "company_name": "AeroTech Components",
        "country": "India",
        "business_category": "Aerospace & Defense"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["user"]["role"] == "BUYER"
    token = data["access_token"]

    # Verify profile with token
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "procurement.lead@aerotech.com"

    # Duplicate registration should fail
    dup_resp = client.post("/api/v1/auth/register/buyer", json={
        "email": "procurement.lead@aerotech.com",
        "password": "DifferentPassword@2026",
        "full_name": "Anita Rao",
        "company_name": "AeroTech Components",
        "country": "India"
    })
    assert dup_resp.status_code == 400


def test_supplier_registration_and_admin_verification(client):
    # 1. Register new supplier
    reg_resp = client.post("/api/v1/auth/register/supplier", json={
        "email": "operations@hydraulics-direct.com",
        "password": "HydraulicsPassword@2026",
        "full_name": "Sunil Varma",
        "company_name": "Hydraulics Direct Manufacturing",
        "country": "India",
        "business_category": "Hydraulics & Heavy Machinery",
        "product_categories": "Hydraulic cylinders, valves, CNC manifold blocks",
        "contact_phone": "+91-98450-11223"
    })
    assert reg_resp.status_code == 201
    supp_data = reg_resp.json()
    assert supp_data["user"]["role"] == "SUPPLIER"
    supplier_id = supp_data["user"]["supplier_id"]
    assert supplier_id is not None

    # 2. Login as Admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@namadekadda.demo",
        "password": "NmkAdmin@2026"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 3. Check review queue
    queue_resp = client.get("/api/v1/admin/suppliers/review-queue", headers=admin_headers)
    assert queue_resp.status_code == 200
    pending_list = queue_resp.json()
    assert any(s["id"] == supplier_id for s in pending_list)

    # 4. Admin verifies the supplier
    verify_resp = client.put(
        f"/api/v1/admin/suppliers/{supplier_id}/verify",
        json={"action": "APPROVE"},
        headers=admin_headers
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_verified"] is True
    assert verify_resp.json()["verification_status"] == "VERIFIED"


def test_role_based_access_control(client):
    # 1. Unauthenticated access to admin metrics -> 401
    anon_resp = client.get("/api/v1/admin/metrics")
    assert anon_resp.status_code == 401

    # 2. Buyer access to admin metrics -> 403 Forbidden
    buyer_login = client.post("/api/v1/auth/login", json={
        "email": "buyer@namadekadda.demo",
        "password": "NmkBuyer@2026"
    })
    buyer_token = buyer_login.json()["access_token"]
    forbidden_resp = client.get("/api/v1/admin/metrics", headers={"Authorization": f"Bearer {buyer_token}"})
    assert forbidden_resp.status_code == 403

    # 3. Admin access to admin metrics -> 200 OK
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@namadekadda.demo",
        "password": "NmkAdmin@2026"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    metrics_resp = client.get("/api/v1/admin/metrics", headers=admin_headers)
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()
    assert metrics["total_users"] >= 3
    assert metrics["total_buyers"] >= 1
    assert metrics["total_suppliers"] >= 1

    # 4. Admin audit logs
    audit_resp = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) >= 1


def test_forgot_password_simulated(client):
    resp = client.post("/api/v1/auth/forgot-password", json={
        "email": "buyer@namadekadda.demo"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_simulated"] is True
    assert "Student/Demo Environment Notice" in data["dev_note"]


def test_quotations_list_endpoint(client):
    resp = client.get("/api/v1/quotations")
    assert resp.status_code == 200
    quotes = resp.json()
    assert len(quotes) >= 1
    assert "quote_code" in quotes[0]
    assert "total_amount" in quotes[0]


def test_products_marketplace_api(client):
    # 1. List all products
    resp = client.get("/api/v1/products")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 6
    assert len(data["items"]) >= 6
    assert len(data["available_countries"]) >= 4

    # 2. Filter by origin country (e.g. Germany)
    resp_de = client.get("/api/v1/products?origin_country=Germany")
    assert resp_de.status_code == 200
    de_data = resp_de.json()
    assert len(de_data["items"]) >= 1
    for item in de_data["items"]:
        assert "Germany" in item["origin_country"]

    # 3. Search by keyword
    resp_search = client.get("/api/v1/products?search=Brackets")
    assert resp_search.status_code == 200
    s_data = resp_search.json()
    assert len(s_data["items"]) >= 1
    assert "Bracket" in s_data["items"][0]["name"]

    # 4. Product Detail
    first_id = data["items"][0]["id"]
    detail_resp = client.get(f"/api/v1/products/{first_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == first_id
    assert detail["supplier"] is not None
    assert "name" in detail["supplier"]
    assert detail["origin_country"] is not None


def test_trade_cost_pdf_generation(client):
    req_payload = {
        "origin_country": "Germany",
        "destination_country": "India",
        "product_description": "Industrial ball bearings high precision ABEC-5",
        "declared_value": 7500.0,
        "quantity": 200,
        "unit_price": 37.5,
        "currency": "USD",
        "freight_insurance_estimate": 450.0,
        "supplier_name": "Rhineland Machining GmbH"
    }

    pdf_resp = client.post("/api/v1/trade/pdf", json=req_payload)
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers["content-type"]
    assert "attachment" in pdf_resp.headers["content-disposition"]
    # Verify PDF magic bytes
    assert pdf_resp.content.startswith(b"%PDF")
    assert len(pdf_resp.content) > 1000


