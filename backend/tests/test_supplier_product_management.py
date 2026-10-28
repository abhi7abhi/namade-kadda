import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.models.supplier import Supplier, CatalogItem
from app.core.security import get_password_hash

client = TestClient(app)


def get_token(email: str = "supplier@namadekadda.demo", password: str = "NmkSupplier@2026") -> str:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def get_buyer_token() -> str:
    return get_token("buyer@namadekadda.demo", "NmkBuyer@2026")


def test_supplier_product_create_edit_publish_archive_lifecycle():
    """Complete product lifecycle: create draft -> publish -> buyer discovery -> pause -> archive."""
    supplier_token = get_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    supp_headers = {"Authorization": f"Bearer {supplier_token}"}

    # 1. Create a new product in DRAFT status
    payload = {
        "name": "Titanium Aerospace Flange Coupling T6",
        "sku": "AERO-FLG-9901",
        "part_number": "PN-AERO-9901",
        "category": "CNC Machining",
        "subcategory": "Aerospace Couplings",
        "description": "High-strength aerospace grade titanium coupling for high-pressure avionics conduits.",
        "unit_price": 42.50,
        "currency": "USD",
        "moq": 25,
        "unit_of_measurement": "pieces",
        "lead_time_days": 18,
        "production_capacity": "5,000 units / month",
        "material": "Titanium Grade 5",
        "material_grade": "Ti-6Al-4V",
        "dimensions": "110 x 85 x 30 mm",
        "weight": "0.45 kg",
        "manufacturing_process": "5-Axis CNC High Speed Turning",
        "technical_specifications": '{"Tolerances": "±0.01 mm", "Surface Finish": "Ra 0.4 µm", "Yield Strength": "880 MPa"}',
        "origin_country": "India",
        "stock_status": "IN_STOCK",
        "available_quantity": 800,
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
        "datasheet_url": "https://example.com/datasheets/aero-flg-9901.pdf",
        "certifications": "AS9100D, ISO 9001:2015",
        "shipping_options": "Air Cargo Priority",
        "supported_destinations": "Global, United States, Germany, France, Japan",
        "status": "DRAFT"
    }

    create_res = client.post("/api/v1/supplier/products", headers=supp_headers, json=payload)
    assert create_res.status_code == 201, f"Product creation failed: {create_res.text}"
    created_prod = create_res.json()
    product_id = created_prod["id"]
    assert created_prod["name"] == payload["name"]
    assert created_prod["status"] == "DRAFT"
    assert created_prod["subcategory"] == "Aerospace Couplings"
    assert created_prod["unit_of_measurement"] == "pieces"

    # 2. Verify DRAFT is in supplier's catalog listing
    list_res = client.get("/api/v1/supplier/products?search=Titanium+Aerospace", headers=supp_headers)
    assert list_res.status_code == 200
    supp_list = list_res.json()
    assert supp_list["total"] >= 1
    found = any(p["id"] == product_id for p in supp_list["items"])
    assert found, "Draft product not found in supplier list"

    # 3. Verify DRAFT is NOT visible in public buyer marketplace
    buyer_token = get_buyer_token()
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    buyer_search_res = client.get("/api/v1/products?search=AERO-FLG-9901")
    assert buyer_search_res.status_code == 200
    buyer_catalog = buyer_search_res.json()
    assert not any(p["id"] == product_id for p in buyer_catalog["items"]), "Draft product should not be visible to buyers"

    # 4. Update and Publish Product
    publish_res = client.post(f"/api/v1/supplier/products/{product_id}/publish", headers=supp_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "PUBLISHED"

    # 5. Verify published product is now discoverable by buyers
    buyer_search_res2 = client.get("/api/v1/products?search=Titanium+Aerospace")
    assert buyer_search_res2.status_code == 200
    buyer_catalog2 = buyer_search_res2.json()
    assert any(p["id"] == product_id for p in buyer_catalog2["items"]), "Published product must be discoverable by buyers"

    # 6. Verify buyer can filter by category, origin country, and company name
    cat_filter = client.get("/api/v1/products?category=CNC+Machining&search=Titanium+Aerospace")
    assert cat_filter.status_code == 200
    assert any(p["id"] == product_id for p in cat_filter.json()["items"])

    # 7. Unpublish (Pause) product
    unpub_res = client.post(f"/api/v1/supplier/products/{product_id}/unpublish", headers=supp_headers)
    assert unpub_res.status_code == 200
    assert unpub_res.json()["status"] == "UNPUBLISHED"

    # Verify hidden again from buyers
    buyer_search_res3 = client.get("/api/v1/products?search=AERO-FLG-9901")
    assert not any(p["id"] == product_id for p in buyer_search_res3.json()["items"])

    # 8. Archive product
    archive_res = client.post(f"/api/v1/supplier/products/{product_id}/archive", headers=supp_headers)
    assert archive_res.status_code == 200
    assert archive_res.json()["status"] == "ARCHIVED"


def test_server_side_authorization_and_validation():
    """Verify authorization checks: non-supplier cannot add products, suppliers cannot edit others' products."""
    # 1. Unauthenticated user rejected
    no_auth = client.post(
        "/api/v1/supplier/products",
        json={"name": "No Auth Item", "category": "CNC Machining", "unit_price": 10.0}
    )
    assert no_auth.status_code == 401

    # 2. Buyer cannot create supplier product
    buyer_token = get_buyer_token()
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    bad_create = client.post(
        "/api/v1/supplier/products",
        headers=buyer_headers,
        json={"name": "Illegal Item", "category": "CNC Machining", "unit_price": 25.0}
    )
    assert bad_create.status_code in [403, 404]

    # 3. Input validation checks
    supplier_token = get_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    supp_headers = {"Authorization": f"Bearer {supplier_token}"}

    # Missing name
    val_err1 = client.post("/api/v1/supplier/products", headers=supp_headers, json={"name": "", "category": "CNC Machining", "unit_price": 10})
    assert val_err1.status_code == 400

    # Negative price
    val_err2 = client.post("/api/v1/supplier/products", headers=supp_headers, json={"name": "Negative Price Part", "category": "CNC Machining", "unit_price": -5.0})
    assert val_err2.status_code == 400

    # Zero MOQ
    val_err3 = client.post("/api/v1/supplier/products", headers=supp_headers, json={"name": "Zero MOQ Part", "category": "CNC Machining", "unit_price": 10.0, "moq": 0})
    assert val_err3.status_code == 400


def test_file_upload_validation():
    """Test image and datasheet upload validation."""
    supplier_token = get_token("supplier@namadekadda.demo", "NmkSupplier@2026")
    supp_headers = {"Authorization": f"Bearer {supplier_token}"}

    # 1. Allowed image file upload
    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01")
    upload_res = client.post(
        "/api/v1/supplier/products/upload",
        headers=supp_headers,
        files={"file": ("part_sample.png", fake_png, "image/png")}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    img_data = upload_res.json()
    assert img_data["file_type"] == "IMAGE"
    assert "/uploads/products/" in img_data["url"]

    # 2. Allowed document file upload
    fake_pdf = io.BytesIO(b"%PDF-1.4\n%...\n%%EOF")
    doc_res = client.post(
        "/api/v1/supplier/products/upload",
        headers=supp_headers,
        files={"file": ("spec_sheet.pdf", fake_pdf, "application/pdf")}
    )
    assert doc_res.status_code == 200
    doc_data = doc_res.json()
    assert doc_data["file_type"] == "DOCUMENT"
    assert "/uploads/products/" in doc_data["url"]

    # 3. Disallowed file type
    fake_exe = io.BytesIO(b"MZ\x90\x00")
    bad_res = client.post(
        "/api/v1/supplier/products/upload",
        headers=supp_headers,
        files={"file": ("malicious.exe", fake_exe, "application/octet-stream")}
    )
    assert bad_res.status_code == 400
    assert "Unsupported file type" in bad_res.json()["detail"]


def test_buyer_rfq_creation_linked_to_product():
    """Buyer creates an RFQ linked to a product and supplier."""
    buyer_token = get_buyer_token()
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    rfq_payload = {
        "title": "Production Batch of CNC Stainless Steel Brackets",
        "category": "CNC Machining",
        "quantity": 500,
        "unit": "pieces",
        "target_budget": 8500.0,
        "currency": "USD",
        "destination_country": "India",
        "destination_city": "Bangalore",
        "required_delivery_date": "Within 4 weeks",
        "manufacturing_process": "5-Axis CNC Milling",
        "material_grade": "Stainless Steel 304",
        "deadline_days": 14,
        "supplier_ids": [1],
        "notes": "Initiated from Product Catalog listing"
    }

    res = client.post("/api/v1/buyer/rfqs", headers=buyer_headers, json=rfq_payload)
    assert res.status_code == 201, f"RFQ creation failed: {res.text}"
    created_rfq = res.json()
    assert created_rfq["rfq_code"].startswith("RFQ-2026-")
    assert any(inv["supplier_id"] == 1 for inv in created_rfq["supplier_invitations"])
