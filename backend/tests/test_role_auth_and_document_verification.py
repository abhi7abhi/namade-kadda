"""
Unit and integration tests for:
- Role-based login with backend verification
- Numeric Administrator ID (12345667) + password authentication
- Buyer registration with multiple sourcing categories
- Supplier registration with product categories & products sold
- Dedicated document upload (PNG, JPEG, PDF up to 10MB)
- Add More documents without overwriting
- Document submission for review
- Cross-company document authorization security (403 Forbidden)
- Administrative review (approval and rejection with reason)
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_admin_numeric_id_authentication():
    # 1. Successful Admin Login with numeric ID 12345667 and password
    login_res = client.post("/api/v1/auth/admin/login", json={
        "admin_id": "12345667",
        "password": "NmkAdmin@2026"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    data = login_res.json()
    assert data["user"]["role"] == "ADMIN"
    assert data["redirect_url"] == "/dashboard/admin"
    assert "access_token" in data

    # 2. Admin ID alone without valid password must fail with 401 Unauthorized
    bad_pw_res = client.post("/api/v1/auth/admin/login", json={
        "admin_id": "12345667",
        "password": "wrong_password_here"
    })
    assert bad_pw_res.status_code == 401
    assert "invalid" in bad_pw_res.json()["detail"].lower()

    # 3. Non-numeric Admin ID must be rejected by input validation (422)
    non_num_res = client.post("/api/v1/auth/admin/login", json={
        "admin_id": "admin_text_123",
        "password": "NmkAdmin@2026"
    })
    assert non_num_res.status_code == 422
    assert "numeric" in non_num_res.json()["detail"].lower()


def test_role_mismatch_prevention():
    # Attempting to log in as BUYER while selecting role SUPPLIER must return 403
    mismatch_res = client.post("/api/v1/auth/login", json={
        "email": "buyer@namadekadda.demo",
        "password": "NmkBuyer@2026",
        "role": "SUPPLIER"
    })
    assert mismatch_res.status_code == 403
    assert "role mismatch" in mismatch_res.json()["detail"].lower()


def test_buyer_registration_and_document_workflow():
    unique_suffix = uuid.uuid4().hex[:6]
    buyer_email = f"buyer_{unique_suffix}@aerospacecorp.demo"

    # 1. Register Buyer with multiple categories
    reg_res = client.post("/api/v1/auth/register/buyer", json={
        "company_name": f"AeroSpace Tech {unique_suffix}",
        "email": buyer_email,
        "password": "SecurePassword@2026",
        "confirm_password": "SecurePassword@2026",
        "full_name": "Marcus Vance",
        "country": "Germany",
        "sourcing_categories": [
          "Smartphones & Mobile Devices",
          "Semiconductor Chips & ICs",
          "Custom Titanium Fasteners"
        ],
        "contact_phone": "+49 30 123456"
    })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert reg_data["user"]["role"] == "BUYER"
    assert reg_data["redirect_url"] == "/register/buyer/documents"
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload PNG document
    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    doc1_res = client.post(
        "/api/v1/auth/documents/upload",
        data={
            "document_type": "COMPANY_REGISTRATION",
            "document_title": "Certificate of Incorporation 2026"
        },
        files={"file": ("incorporation_cert.png", png_content, "image/png")},
        headers=headers
    )
    assert doc1_res.status_code == 201, f"Doc 1 upload failed: {doc1_res.text}"
    doc1_data = doc1_res.json()
    assert doc1_data["status"] == "PENDING_REVIEW"
    doc1_id = doc1_data["id"]

    # 3. Add More documents: Upload PDF document without losing doc 1
    pdf_content = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    doc2_res = client.post(
        "/api/v1/auth/documents/upload",
        data={
            "document_type": "TAX_CERTIFICATE",
            "document_title": "VAT Registration Record"
        },
        files={"file": ("vat_cert.pdf", pdf_content, "application/pdf")},
        headers=headers
    )
    assert doc2_res.status_code == 201
    doc2_id = doc2_res.json()["id"]

    # 4. Verify both documents appear in list
    list_res = client.get("/api/v1/auth/documents", headers=headers)
    assert list_res.status_code == 200
    docs_list = list_res.json()
    assert len(docs_list) >= 2
    doc_ids = [d["id"] for d in docs_list]
    assert doc1_id in doc_ids
    assert doc2_id in doc_ids

    # 5. Formally submit documents for review
    submit_res = client.post("/api/v1/auth/documents/submit", headers=headers)
    assert submit_res.status_code == 200
    sub_data = submit_res.json()
    assert sub_data["verification_status"] == "PENDING_REVIEW"
    assert sub_data["documents_count"] >= 2


def test_supplier_registration_and_compliance_review():
    unique_suffix = uuid.uuid4().hex[:6]
    supp_email = f"supplier_{unique_suffix}@precisionforge.demo"

    # 1. Register Supplier with products sold and categories
    reg_res = client.post("/api/v1/auth/register/supplier", json={
        "company_name": f"Precision Forge {unique_suffix}",
        "email": supp_email,
        "password": "SecureSupplier@2026",
        "confirm_password": "SecureSupplier@2026",
        "full_name": "Hans Becker",
        "country": "Germany",
        "products_sold": "Turbine impellers, Inconel flanges, 5-Axis milling",
        "product_categories": ["5-Axis CNC Machining & Stamping", "Steel, Aluminium & Specialty Alloys"],
        "manufacturing_capabilities": "5-Axis CNC Milling, Wire EDM",
        "contact_phone": "+49 89 987654"
    })
    assert reg_res.status_code == 201, f"Supplier reg failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert reg_data["user"]["role"] == "SUPPLIER"
    assert reg_data["redirect_url"] == "/register/supplier/documents"
    supp_token = reg_data["access_token"]
    supp_headers = {"Authorization": f"Bearer {supp_token}"}
    supplier_user_id = reg_data["user"]["id"]

    # 2. Upload Quality Certification
    pdf_content = b"%PDF-1.4\nISO 9001:2015 Cert\n%%EOF"
    upload_res = client.post(
        "/api/v1/auth/documents/upload",
        data={
            "document_type": "QUALITY_CERTIFICATION",
            "document_title": "ISO 9001:2015 Quality Certificate"
        },
        files={"file": ("iso_cert.pdf", pdf_content, "application/pdf")},
        headers=supp_headers
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # 3. Submit documents
    sub_res = client.post("/api/v1/auth/documents/submit", headers=supp_headers)
    assert sub_res.status_code == 200

    # 4. Admin Login to review
    admin_login = client.post("/api/v1/auth/admin/login", json={
        "admin_id": "12345667",
        "password": "NmkAdmin@2026"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 5. Admin lists documents
    admin_docs_res = client.get("/api/v1/admin/documents", headers=admin_headers)
    assert admin_docs_res.status_code == 200
    all_admin_docs = admin_docs_res.json()
    assert any(d["id"] == doc_id for d in all_admin_docs)

    # 6. Admin rejects document with reason
    reject_res = client.post(
        f"/api/v1/admin/documents/{doc_id}/review",
        json={"action": "REJECT", "rejection_reason": "Certificate expired. Please upload current audit copy."},
        headers=admin_headers
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["status"] == "REJECTED"
    assert "expired" in reject_res.json()["rejection_reason"].lower()

    # 7. Check Supplier verification status reflects REJECTED
    supp_status_res = client.get("/api/v1/auth/verification-status", headers=supp_headers)
    assert supp_status_res.status_code == 200
    assert supp_status_res.json()["verification_status"] == "REJECTED"
    assert "expired" in supp_status_res.json()["rejection_reason"].lower()

    # 8. Admin approves entire company
    comp_approve_res = client.post(
        f"/api/v1/admin/companies/{supplier_user_id}/verify",
        json={"action": "APPROVE"},
        headers=admin_headers
    )
    assert comp_approve_res.status_code == 200
    assert comp_approve_res.json()["verification_status"] == "APPROVED"


def test_file_upload_validation_and_unauthorized_access():
    # 1. Login as buyer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "buyer@namadekadda.demo",
        "password": "NmkBuyer@2026"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Attempt uploading disallowed file format (.exe)
    disallowed_res = client.post(
        "/api/v1/auth/documents/upload",
        data={"document_type": "OTHER", "description": "Executable file test"},
        files={"file": ("malware.exe", b"MZ\x90\x00binary", "application/x-msdownload")},
        headers=headers
    )
    assert disallowed_res.status_code == 400
    assert "unsupported" in disallowed_res.json()["detail"].lower()

    # 3. Cross-company access test: User B cannot download User A's document
    # Upload a document as buyer
    good_doc = client.post(
        "/api/v1/auth/documents/upload",
        data={"document_type": "BUSINESS_LICENSE"},
        files={"file": ("private_license.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR", "image/png")},
        headers=headers
    )
    assert good_doc.status_code == 201
    doc_id = good_doc.json()["id"]

    # Login as an unrelated supplier
    supp_login = client.post("/api/v1/auth/login", json={
        "email": "supplier@namadekadda.demo",
        "password": "NmkSupplier@2026"
    })
    supp_token = supp_login.json()["access_token"]
    supp_headers = {"Authorization": f"Bearer {supp_token}"}

    # Unrelated supplier attempting to download doc_id must get 403 Forbidden
    forbidden_res = client.get(f"/api/v1/auth/documents/{doc_id}/download", headers=supp_headers)
    assert forbidden_res.status_code == 403
    assert "access denied" in forbidden_res.json()["detail"].lower()
