import io
import pytest
from fastapi.testclient import TestClient


def get_token(client: TestClient, email: str, password: str, admin_id: str = None) -> str:
    payload = {"email": email, "password": password}
    res = client.post("/api/v1/auth/login", json=payload)
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    data = res.json()
    return data.get("access_token") or data.get("token")


def test_complaints_references_and_options(client: TestClient):
    """Test fetching target companies, orders, and RFQs for filing a complaint."""
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    headers = {"Authorization": f"Bearer {buyer_token}"}

    res = client.get("/api/v1/complaints/references", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "target_companies" in data
    assert len(data["target_companies"]) > 0
    assert "orders" in data
    assert "rfqs" in data

    # Supplier should also be able to fetch references
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")
    s_headers = {"Authorization": f"Bearer {supplier_token}"}
    s_res = client.get("/api/v1/complaints/references", headers=s_headers)
    assert s_res.status_code == 200
    s_data = s_res.json()
    assert "target_companies" in s_data


def test_buyer_raise_complaint_and_audit(client: TestClient):
    """Test buyer raising a complaint against a supplier with sequential code and audit record."""
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    headers = {"Authorization": f"Bearer {buyer_token}"}

    payload = {
        "accused_company_name": "Precision Tech Components Ltd",
        "accused_supplier_id": 1,
        "category": "Product Quality",
        "subject": "Critical failure in batch of precision machined flanges",
        "description": "Flanges in shipment PO-2026-001 showed 2.5mm deviation exceeding allowable tolerance (+/-0.1mm).",
        "priority": "HIGH"
    }

    res = client.post("/api/v1/complaints", json=payload, headers=headers)
    assert res.status_code == 201
    complaint = res.json()
    assert complaint["complaint_code"].startswith("CMP-2026-")
    assert complaint["status"] == "SUBMITTED"
    assert complaint["complainant_role"] == "BUYER"
    assert complaint["priority"] == "HIGH"
    assert complaint["accused_company_name"] == "Precision Tech Components Ltd"

    complaint_id = complaint["id"]

    # Complainant views own complaint detail
    detail_res = client.get(f"/api/v1/complaints/{complaint_id}", headers=headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["subject"] == payload["subject"]
    assert detail["description"] == payload["description"]
    assert len(detail["history"]) >= 1
    assert detail["history"][0]["new_status"] == "SUBMITTED"


def test_strict_privacy_isolation_accused_never_sees(client: TestClient):
    """
    CRITICAL REQUIREMENT:
    Accused company and unrelated users must NEVER receive alerts,
    list visibility, or direct access to complaints filed against them.
    """
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 1. Buyer files complaint against Supplier 1
    create_res = client.post("/api/v1/complaints", json={
        "accused_company_name": "Apex Micro Electronics",
        "accused_supplier_id": 2,
        "category": "Delivery Delay",
        "subject": "Severe 3-week delay on sensor modules",
        "description": "Sensors were due on Oct 5. No updates or logistics tracking provided.",
        "priority": "URGENT"
    }, headers=b_headers)
    assert create_res.status_code == 201
    complaint_id = create_res.json()["id"]

    # 2. Accused supplier logs in
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")
    s_headers = {"Authorization": f"Bearer {supplier_token}"}

    # Supplier calls list endpoint -> MUST NOT contain the complaint filed against them
    s_list_res = client.get("/api/v1/complaints", headers=s_headers)
    assert s_list_res.status_code == 200
    supplier_visible_ids = [c["id"] for c in s_list_res.json()]
    assert complaint_id not in supplier_visible_ids, "SECURITY BREACH: Accused supplier saw complaint filed against them!"

    # Supplier attempts direct access -> MUST return 403 Forbidden
    s_detail_res = client.get(f"/api/v1/complaints/{complaint_id}", headers=s_headers)
    assert s_detail_res.status_code == 403, "SECURITY BREACH: Accused supplier accessed complaint detail directly!"


def test_supplier_raise_complaint_against_buyer(client: TestClient):
    """Test supplier raising a complaint against a buyer with strict isolation."""
    supplier_token = get_token(client, "supplier@namadekadda.demo", "NmkSupplier@2026")
    s_headers = {"Authorization": f"Bearer {supplier_token}"}

    payload = {
        "accused_company_name": "Nexus Aerospace Procurement",
        "category": "Payment Default or Delay",
        "subject": "Unsettled invoice past net-60 terms",
        "description": "Invoice INV-2026-881 for $42,500 remains unpaid 68 days post-delivery.",
        "priority": "HIGH"
    }

    res = client.post("/api/v1/complaints", json=payload, headers=s_headers)
    assert res.status_code == 201
    cmp_data = res.json()
    assert cmp_data["complainant_role"] == "SUPPLIER"
    assert cmp_data["status"] == "SUBMITTED"
    supplier_cmp_id = cmp_data["id"]

    # Accused buyer logs in and checks list -> must NOT see it
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    b_list = client.get("/api/v1/complaints", headers=b_headers).json()
    assert supplier_cmp_id not in [c["id"] for c in b_list]

    # Direct access forbidden
    b_direct = client.get(f"/api/v1/complaints/{supplier_cmp_id}", headers=b_headers)
    assert b_direct.status_code == 403


def test_admin_complaint_overview_and_full_docket(client: TestClient):
    """Test admin overview telemetry and full visibility across all complaints."""
    admin_token = get_token(client, "admin@namadekadda.demo", "NmkAdmin@2026", admin_id="202601")
    a_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Overview metrics
    ov_res = client.get("/api/v1/complaints/admin/overview", headers=a_headers)
    assert ov_res.status_code == 200
    overview = ov_res.json()
    assert overview["total_complaints"] >= 2
    assert "by_category" in overview
    assert "by_complainant_role" in overview
    assert "by_priority" in overview

    # 2. Admin list sees all complaints
    all_res = client.get("/api/v1/complaints", headers=a_headers)
    assert all_res.status_code == 200
    all_complaints = all_res.json()
    assert len(all_complaints) >= 2


def test_admin_workflow_arbitration_and_2way_messaging(client: TestClient):
    """
    Test complete lifecycle:
    1. Buyer raises complaint
    2. Admin marks UNDER_REVIEW with internal notes
    3. Admin marks AWAITING_INFO and sends official response
    4. Buyer verifies response visible, but internal notes hidden
    5. Buyer sends follow-up message
    6. Admin marks RESOLVED with resolution outcome
    """
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    b_headers = {"Authorization": f"Bearer {buyer_token}"}
    admin_token = get_token(client, "admin@namadekadda.demo", "NmkAdmin@2026", admin_id="202601")
    a_headers = {"Authorization": f"Bearer {admin_token}"}

    # Step 1: Buyer creates complaint
    c_res = client.post("/api/v1/complaints", json={
        "accused_company_name": "Titanium Dynamics",
        "category": "Misleading Information",
        "subject": "Incorrect material certification standard listed",
        "description": "Claimed AMS 4928 aerospace titanium, but delivered commercial grade 5.",
        "priority": "HIGH"
    }, headers=b_headers)
    assert c_res.status_code == 201
    cid = c_res.json()["id"]

    # Step 2: Admin transitions to UNDER_REVIEW with internal notes
    u_res1 = client.patch(f"/api/v1/complaints/{cid}/status", json={
        "new_status": "UNDER_REVIEW",
        "assigned_admin_name": "Chief Auditor James",
        "notes": "Reviewed mill test certs submitted by buyer. Needs spectrometer analysis."
    }, headers=a_headers)
    assert u_res1.status_code == 200
    assert u_res1.json()["status"] == "UNDER_REVIEW"

    # Step 3: Admin transitions to AWAITING_INFO with official response to complainant
    u_res2 = client.patch(f"/api/v1/complaints/{cid}/status", json={
        "new_status": "AWAITING_INFO",
        "notes": "Requested lab test report from buyer.",
        "response_to_complainant": "Please provide third-party laboratory chemical analysis confirming the grade discrepancy."
    }, headers=a_headers)
    assert u_res2.status_code == 200
    assert u_res2.json()["status"] == "AWAITING_INFO"

    # Step 4: Buyer views detail: can see message, but NOT internal notes
    b_detail = client.get(f"/api/v1/complaints/{cid}", headers=b_headers).json()
    assert b_detail["internal_notes"] is None, "SECURITY LEAK: Complainant saw internal admin notes!"
    assert len(b_detail["messages"]) >= 1
    assert "laboratory chemical analysis" in b_detail["messages"][0]["message"]

    # Step 5: Buyer sends reply
    msg_res = client.post(f"/api/v1/complaints/{cid}/messages", json={
        "message": "Attached spectrometer report from SGS Labs verifying 5.8% vanadium instead of required aerospace spec."
    }, headers=b_headers)
    assert msg_res.status_code == 200

    # Step 6: Admin marks as RESOLVED
    res_res = client.patch(f"/api/v1/complaints/{cid}/status", json={
        "new_status": "RESOLVED",
        "notes": "Supplier agreed to full replacement with accredited aerospace lot and issued $12,000 credit."
    }, headers=a_headers)
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
    assert res_res.json()["resolution_notes"] is not None

    # Step 7: Check complete audit history has all steps
    final_detail = client.get(f"/api/v1/complaints/{cid}", headers=a_headers).json()
    history_statuses = [h["new_status"] for h in final_detail["history"]]
    assert "SUBMITTED" in history_statuses
    assert "UNDER_REVIEW" in history_statuses
    assert "AWAITING_INFO" in history_statuses
    assert "RESOLVED" in history_statuses


def test_evidence_upload(client: TestClient):
    """Test supporting evidence document upload and privacy."""
    buyer_token = get_token(client, "buyer@namadekadda.demo", "NmkBuyer@2026")
    b_headers = {"Authorization": f"Bearer {buyer_token}"}

    c_res = client.post("/api/v1/complaints", json={
        "accused_company_name": "Micro Systems Ltd",
        "category": "Incorrect Product or Quantity",
        "subject": "Missing 500 units in consignment",
        "description": "Packing slip says 1,500 units; received only 1,000.",
        "priority": "MEDIUM"
    }, headers=b_headers)
    cid = c_res.json()["id"]

    # Upload mock file
    file_bytes = b"%PDF-1.4 Mock Inspection and Packing Slip Evidence"
    files = {"file": ("inspection_report.pdf", io.BytesIO(file_bytes), "application/pdf")}
    upload_res = client.post(f"/api/v1/complaints/{cid}/evidence", files=files, headers=b_headers)
    assert upload_res.status_code == 200
    detail = upload_res.json()
    assert len(detail["evidence"]) == 1
    assert detail["evidence"][0]["file_name"] == "inspection_report.pdf"
    assert detail["evidence"][0]["file_size"] == len(file_bytes)
