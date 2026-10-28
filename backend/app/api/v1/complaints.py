import os
import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.complaint import Complaint, ComplaintEvidence, ComplaintMessage, ComplaintStatusHistory
from app.models.order import Order
from app.models.rfq import RFQ
from app.models.quotation import Quotation
from app.models.supplier import Supplier
from app.schemas.complaint import (
    ComplaintCreateRequest,
    ComplaintSummaryOut,
    ComplaintDetailOut,
    ComplaintMessageCreateRequest,
    ComplaintMessageOut,
    ComplaintStatusUpdateRequest,
    ComplaintAdminOverviewOut,
    ComplaintReferenceOptionsOut,
    COMPLAINT_CATEGORIES,
    COMPLAINT_STATUSES
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

UPLOAD_DIR = os.path.join("uploads", "complaint_evidence")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/references", response_model=ComplaintReferenceOptionsOut)
def get_complaint_reference_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns available reference targets for filing a complaint:
    accused companies, recent purchase orders, RFQs, and quotations.
    """
    # 1. Target companies (role-appropriate and properly mapped)
    target_companies = []

    if current_user.role == "BUYER":
        # Buyers file complaints against eligible Suppliers
        suppliers = db.query(Supplier).all()
        seen_supplier_names = set()
        for s in suppliers:
            if current_user.supplier_id and s.id == current_user.supplier_id:
                continue
            norm_name = s.name.strip().lower()
            if norm_name in seen_supplier_names:
                continue
            seen_supplier_names.add(norm_name)
            target_companies.append({
                "id": s.id,
                "key": f"supplier_{s.id}",
                "name": s.name,
                "country": s.country or "",
                "type": "SUPPLIER"
            })
    elif current_user.role == "SUPPLIER":
        # Suppliers file complaints against Buyer companies
        buyers = db.query(User).filter(User.role == "BUYER").all()
        # Deduplicate buyer users by company name to present unique enterprise entities
        buyer_by_company = {}
        for b in buyers:
            if not b.company_name or not b.company_name.strip():
                continue
            norm_name = b.company_name.strip().lower()
            # Retain the record with country populated or prefer richer record
            if norm_name not in buyer_by_company or (b.country and not buyer_by_company[norm_name].country):
                buyer_by_company[norm_name] = b

        for norm_name, b in buyer_by_company.items():
            target_companies.append({
                "id": b.id,
                "key": f"buyer_{b.id}",
                "name": b.company_name.strip(),
                "country": b.country or "India",
                "type": "BUYER"
            })
    else:
        # Administrative / Arbiter overview: includes both with unique typed keys
        suppliers = db.query(Supplier).all()
        seen_supplier_names = set()
        for s in suppliers:
            norm_name = s.name.strip().lower()
            if norm_name in seen_supplier_names:
                continue
            seen_supplier_names.add(norm_name)
            target_companies.append({
                "id": s.id,
                "key": f"supplier_{s.id}",
                "name": s.name,
                "country": s.country or "",
                "type": "SUPPLIER"
            })

        buyers = db.query(User).filter(User.role == "BUYER").all()
        buyer_by_company = {}
        for b in buyers:
            if not b.company_name or not b.company_name.strip():
                continue
            norm_name = b.company_name.strip().lower()
            if norm_name not in buyer_by_company or (b.country and not buyer_by_company[norm_name].country):
                buyer_by_company[norm_name] = b

        for norm_name, b in buyer_by_company.items():
            target_companies.append({
                "id": b.id,
                "key": f"buyer_{b.id}",
                "name": b.company_name.strip(),
                "country": b.country or "India",
                "type": "BUYER"
            })

    # 2. Associated Orders
    orders_q = db.query(Order).all()
    user_orders = []
    for o in orders_q:
        if (current_user.role == "BUYER" and (o.buyer_id == current_user.id or o.buyer_company_name == current_user.company_name)) or \
           (current_user.role == "SUPPLIER" and o.supplier_id == current_user.supplier_id) or \
           current_user.role == "ADMIN":
            user_orders.append({
                "id": o.id,
                "order_code": o.order_code,
                "total_amount": float(o.total_amount),
                "status": o.status,
                "supplier_name": o.supplier.name if o.supplier else "Supplier",
                "buyer_company": o.buyer_company_name
            })

    # 3. Associated RFQs
    rfqs = db.query(RFQ).all()
    user_rfqs = []
    for r in rfqs[:20]:
        user_rfqs.append({
            "id": r.id,
            "rfq_code": r.rfq_code,
            "title": r.title,
            "status": r.status
        })

    return ComplaintReferenceOptionsOut(
        target_companies=target_companies,
        orders=user_orders[:15],
        rfqs=user_rfqs[:15],
        quotations=[]
    )


@router.post("", response_model=ComplaintSummaryOut, status_code=status.HTTP_201_CREATED)
def raise_complaint(
    req: ComplaintCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Raises a new complaint against a counterparty company.
    Strict privacy: Accused company is NEVER alerted or granted access.
    Only the complainant and authorized admins have access.
    """
    if req.category not in COMPLAINT_CATEGORIES and req.category != "Other":
        req.category = "Other"

    # Generate sequential complaint code
    count = db.query(Complaint).count()
    code = f"CMP-2026-{(count + 1):03d}"

    complaint = Complaint(
        complaint_code=code,
        complainant_user_id=current_user.id,
        complainant_role=current_user.role,
        complainant_company_name=current_user.company_name or current_user.full_name or "Enterprise User",
        accused_company_name=req.accused_company_name.strip(),
        accused_supplier_id=req.accused_supplier_id,
        accused_user_id=req.accused_buyer_id,
        category=req.category,
        subject=req.subject.strip(),
        description=req.description.strip(),
        priority=req.priority.upper() if req.priority in ["LOW", "MEDIUM", "HIGH", "URGENT"] else "MEDIUM",
        status="SUBMITTED",
        related_order_id=req.related_order_id,
        related_rfq_id=req.related_rfq_id,
        related_quotation_id=req.related_quotation_id
    )
    db.add(complaint)
    db.flush()

    # Create initial audit history record
    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        previous_status=None,
        new_status="SUBMITTED",
        changed_by_name=current_user.full_name or current_user.email,
        changed_by_role=current_user.role,
        notes="Complaint submitted for administrative arbitration."
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    return _build_complaint_summary(complaint)


@router.get("", response_model=List[ComplaintSummaryOut])
def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists complaints based on role-based privacy:
    - Admins see all complaints.
    - Buyers and Suppliers see ONLY complaints filed by their own account.
    - Accused companies NEVER see complaints filed against them.
    """
    q = db.query(Complaint)

    if current_user.role != "ADMIN":
        q = q.filter(Complaint.complainant_user_id == current_user.id)

    if status_filter and status_filter != "ALL":
        q = q.filter(Complaint.status == status_filter)

    if category and category != "ALL":
        q = q.filter(Complaint.category == category)

    if priority and priority != "ALL":
        q = q.filter(Complaint.priority == priority)

    complaints = q.order_by(Complaint.id.desc()).all()

    if search:
        s_lower = search.lower()
        complaints = [
            c for c in complaints
            if s_lower in c.complaint_code.lower() or
               s_lower in c.subject.lower() or
               s_lower in c.accused_company_name.lower() or
               s_lower in c.complainant_company_name.lower()
        ]

    return [_build_complaint_summary(c) for c in complaints]


@router.get("/admin/overview", response_model=ComplaintAdminOverviewOut)
def get_complaint_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only aggregated metrics and category telemetry across all complaints."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrative access required.")

    all_complaints = db.query(Complaint).all()
    overview = ComplaintAdminOverviewOut(
        total_complaints=len(all_complaints),
        submitted_count=sum(1 for c in all_complaints if c.status == "SUBMITTED"),
        under_review_count=sum(1 for c in all_complaints if c.status == "UNDER_REVIEW"),
        awaiting_info_count=sum(1 for c in all_complaints if c.status == "AWAITING_INFO"),
        resolved_count=sum(1 for c in all_complaints if c.status == "RESOLVED"),
        rejected_count=sum(1 for c in all_complaints if c.status == "REJECTED"),
        closed_count=sum(1 for c in all_complaints if c.status == "CLOSED")
    )

    by_cat = {}
    for c in all_complaints:
        by_cat[c.category] = by_cat.get(c.category, 0) + 1
    overview.by_category = by_cat

    by_role = {}
    for c in all_complaints:
        by_role[c.complainant_role] = by_role.get(c.complainant_role, 0) + 1
    overview.by_complainant_role = by_role

    by_prio = {}
    for c in all_complaints:
        by_prio[c.priority] = by_prio.get(c.priority, 0) + 1
    overview.by_priority = by_prio

    return overview


@router.get("/{complaint_id}", response_model=ComplaintDetailOut)
def get_complaint_detail(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches full complaint details.
    Access Control: Only the filing complainant or an Administrator is permitted.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role != "ADMIN" and complaint.complainant_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You are not authorized to view this complaint.")

    return _build_complaint_detail(complaint, is_admin=(current_user.role == "ADMIN"))


@router.patch("/{complaint_id}/status", response_model=ComplaintDetailOut)
def update_complaint_status(
    complaint_id: int,
    update: ComplaintStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Admin-only status transition and resolution recording."""
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrative access required.")

    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    prev_status = complaint.status
    target_status = update.new_status.upper()
    if target_status not in COMPLAINT_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid complaint status: {target_status}")

    complaint.status = target_status
    if update.priority:
        complaint.priority = update.priority.upper()
    if update.assigned_admin_name:
        complaint.assigned_admin_name = update.assigned_admin_name
    elif not complaint.assigned_admin_name:
        complaint.assigned_admin_name = current_user.full_name or "Administrator"

    if update.notes:
        complaint.internal_notes = (complaint.internal_notes or "") + f"\n[{datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {update.notes}"

    if target_status == "RESOLVED":
        complaint.resolved_at = datetime.datetime.utcnow()
        complaint.resolution_notes = update.notes or "Resolved by administration."
    elif target_status == "REJECTED":
        complaint.rejection_reason = update.notes or "Rejected by administration."
    elif target_status == "CLOSED":
        complaint.closed_at = datetime.datetime.utcnow()

    # Record history
    hist = ComplaintStatusHistory(
        complaint_id=complaint.id,
        previous_status=prev_status,
        new_status=target_status,
        changed_by_name=current_user.full_name or "Administrator",
        changed_by_role="ADMIN",
        notes=update.notes
    )
    db.add(hist)

    # Optional response to complainant
    if update.response_to_complainant:
        msg = ComplaintMessage(
            complaint_id=complaint.id,
            sender_user_id=current_user.id,
            sender_role="ADMIN",
            sender_name=current_user.full_name or "Administrator",
            message=update.response_to_complainant,
            is_internal=False
        )
        db.add(msg)

    db.commit()
    db.refresh(complaint)
    return _build_complaint_detail(complaint, is_admin=True)


@router.post("/{complaint_id}/messages", response_model=ComplaintMessageOut)
def send_complaint_message(
    complaint_id: int,
    req: ComplaintMessageCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exchange messages between Complainant and Administrator."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role != "ADMIN" and complaint.complainant_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You cannot message on this complaint.")

    msg = ComplaintMessage(
        complaint_id=complaint.id,
        sender_user_id=current_user.id,
        sender_role=current_user.role,
        sender_name=current_user.full_name or current_user.email,
        message=req.message.strip(),
        is_internal=req.is_internal if current_user.role == "ADMIN" else False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.post("/{complaint_id}/evidence", response_model=ComplaintDetailOut)
async def upload_complaint_evidence(
    complaint_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uploads supporting documentation / evidence file for a complaint."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role != "ADMIN" and complaint.complainant_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot upload evidence to this complaint.")

    filename = f"cmp_{complaint.id}_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    ev = ComplaintEvidence(
        complaint_id=complaint.id,
        file_name=file.filename or filename,
        stored_filename=filename,
        file_path=file_path,
        file_size=len(contents),
        mime_type=file.content_type or "application/octet-stream",
        download_url=f"/uploads/complaint_evidence/{filename}",
        uploaded_by_user_id=current_user.id,
        uploaded_by_role=current_user.role
    )
    db.add(ev)
    db.commit()
    db.refresh(complaint)

    return _build_complaint_detail(complaint, is_admin=(current_user.role == "ADMIN"))


# Helper builders
def _build_complaint_summary(c: Complaint) -> ComplaintSummaryOut:
    latest_admin_msg = next((m.message for m in reversed(c.messages) if m.sender_role == "ADMIN" and not m.is_internal), None)
    return ComplaintSummaryOut(
        id=c.id,
        complaint_code=c.complaint_code,
        complainant_user_id=c.complainant_user_id,
        complainant_role=c.complainant_role,
        complainant_company_name=c.complainant_company_name,
        accused_company_name=c.accused_company_name,
        category=c.category,
        subject=c.subject,
        priority=c.priority,
        status=c.status,
        related_order_id=c.related_order_id,
        related_order_code=c.related_order.order_code if c.related_order else None,
        related_rfq_id=c.related_rfq_id,
        related_rfq_code=c.related_rfq.rfq_code if c.related_rfq else None,
        assigned_admin_name=c.assigned_admin_name,
        has_admin_response=latest_admin_msg is not None,
        latest_admin_response=latest_admin_msg,
        messages_count=len(c.messages),
        evidence_count=len(c.evidence),
        created_at=c.created_at,
        updated_at=c.updated_at
    )


def _build_complaint_detail(c: Complaint, is_admin: bool = False) -> ComplaintDetailOut:
    summary = _build_complaint_summary(c)
    filtered_messages = c.messages if is_admin else [m for m in c.messages if not m.is_internal]

    return ComplaintDetailOut(
        **summary.model_dump(),
        description=c.description,
        internal_notes=c.internal_notes if is_admin else None,
        resolution_notes=c.resolution_notes,
        rejection_reason=c.rejection_reason,
        related_quotation_id=c.related_quotation_id,
        related_quotation_code=c.related_quotation.quote_code if c.related_quotation else None,
        evidence=c.evidence,
        messages=filtered_messages,
        history=c.history,
        resolved_at=c.resolved_at,
        closed_at=c.closed_at
    )
