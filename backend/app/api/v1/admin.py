import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.v1.auth import require_role, get_current_user
from app.models.user import User
from app.models.supplier import Supplier
from app.models.document import CompanyDocument
from app.models.sourcing import SourcingRequest
from app.models.rfq import RFQ
from app.models.quotation import Quotation
from app.models.order import Order
from app.models.audit import AuditLog
from app.schemas.user import UserOut, AuditLogOut
from app.schemas.supplier import SupplierOut
from app.schemas.document import (
    AdminDocumentItemOut,
    DocumentReviewRequest,
    AdminCompanyVerifyRequest,
    CompanyDocumentOut
)

router = APIRouter(prefix="/admin", tags=["Administrator Dashboard"], dependencies=[Depends(require_role(["ADMIN"]))])


class AdminMetricsResponse(BaseModel):
    total_users: int
    total_buyers: int
    total_suppliers: int
    verified_suppliers: int
    pending_suppliers: int
    total_sourcing_requests: int
    total_rfqs: int
    total_quotations: int
    total_orders: int
    total_platform_gmv: float


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


class VerifySupplierRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    rejection_reason: Optional[str] = None


@router.get("/metrics", response_model=AdminMetricsResponse)
def get_admin_platform_metrics(db: Session = Depends(get_db)):
    """Retrieve platform-wide operational and financial statistics for the admin dashboard."""
    total_users = db.query(User).count()
    total_buyers = db.query(User).filter(User.role == "BUYER").count()
    total_suppliers = db.query(User).filter(User.role == "SUPPLIER").count()
    verified_suppliers = db.query(Supplier).filter(Supplier.verification_status == "VERIFIED").count()
    pending_suppliers = db.query(Supplier).filter(Supplier.verification_status == "PENDING_REVIEW").count()

    total_sourcing = db.query(SourcingRequest).count()
    total_rfqs = db.query(RFQ).count()
    total_quotations = db.query(Quotation).count()
    total_orders = db.query(Order).count()

    gmv_res = db.query(func.sum(Order.total_amount)).scalar()
    total_platform_gmv = float(gmv_res or 0.0)

    return AdminMetricsResponse(
        total_users=total_users,
        total_buyers=total_buyers,
        total_suppliers=total_suppliers,
        verified_suppliers=verified_suppliers,
        pending_suppliers=pending_suppliers,
        total_sourcing_requests=total_sourcing,
        total_rfqs=total_rfqs,
        total_quotations=total_quotations,
        total_orders=total_orders,
        total_platform_gmv=total_platform_gmv
    )


@router.get("/users", response_model=List[UserOut])
def list_users(role: Optional[str] = None, db: Session = Depends(get_db)):
    """List all registered users with optional role filtering."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role.upper())
    return [UserOut.model_validate(u) for u in q.order_by(User.created_at.desc()).all()]


@router.put("/users/{user_id}/status", response_model=UserOut)
def update_user_status(user_id: int, payload: UpdateUserStatusRequest, db: Session = Depends(get_db)):
    """Activate or deactivate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = payload.is_active
    audit = AuditLog(
        action="USER_STATUS_UPDATED",
        entity_type="User",
        entity_id=str(user.id),
        details=f"User {user.email} active status changed to {user.is_active}",
        user_email="admin"
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/suppliers/review-queue", response_model=List[SupplierOut])
def get_supplier_review_queue(db: Session = Depends(get_db)):
    """List suppliers awaiting verification or sample review."""
    suppliers = db.query(Supplier).filter(
        Supplier.verification_status.in_(["PENDING_REVIEW", "SAMPLE_DATA"])
    ).all()
    return [SupplierOut.model_validate(s) for s in suppliers]


@router.put("/suppliers/{supplier_id}/verify", response_model=SupplierOut)
@router.post("/suppliers/{supplier_id}/verify", response_model=SupplierOut)
def verify_supplier(supplier_id: int, payload: VerifySupplierRequest, db: Session = Depends(get_db)):
    """Approve or reject a supplier's marketplace listing application."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    if payload.action.upper() == "APPROVE":
        supplier.is_verified = True
        supplier.verification_status = "VERIFIED"
        action_note = f"Supplier {supplier.name} approved and verified for public catalog."
    else:
        supplier.is_verified = False
        supplier.verification_status = "REJECTED"
        action_note = f"Supplier {supplier.name} rejected. Reason: {payload.rejection_reason or 'Documentation incomplete'}"

    # Update associated user verification status if any
    user = db.query(User).filter(User.supplier_id == supplier.id).first()
    if user:
        user.verification_status = supplier.verification_status

    audit = AuditLog(
        action="SUPPLIER_VERIFICATION",
        entity_type="Supplier",
        entity_id=str(supplier.id),
        details=action_note,
        user_email="admin"
    )
    db.add(audit)
    db.commit()
    db.refresh(supplier)
    return SupplierOut.model_validate(supplier)


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve chronological platform activity event stream."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [AuditLogOut.model_validate(l) for l in logs]


# =============================================================================
# Document Verification & Compliance Review
# =============================================================================

@router.get("/documents", response_model=List[AdminDocumentItemOut])
def list_all_verification_documents(
    status: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all uploaded company verification documents with user and company context.
    Supports filtering by review status and role.
    """
    q = db.query(CompanyDocument, User).join(User, CompanyDocument.user_id == User.id)

    if status and status.upper() != "ALL":
        q = q.filter(CompanyDocument.status == status.upper())
    if role and role.upper() != "ALL":
        q = q.filter(User.role == role.upper())

    results = q.order_by(CompanyDocument.created_at.desc()).all()

    items = []
    for doc, user in results:
        item = AdminDocumentItemOut(
            id=doc.id,
            user_id=doc.user_id,
            supplier_id=doc.supplier_id,
            user_email=user.email,
            company_name=user.company_name,
            role=user.role,
            country=user.country,
            document_type=doc.document_type,
            document_title=doc.document_title,
            description=doc.description,
            original_filename=doc.original_filename,
            file_size=doc.file_size,
            mime_type=doc.mime_type,
            status=doc.status,
            rejection_reason=doc.rejection_reason,
            reviewed_by=doc.reviewed_by,
            reviewed_at=doc.reviewed_at,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            download_url=f"/api/v1/auth/documents/{doc.id}/download"
        )
        items.append(item)
    return items


@router.post("/documents/{document_id}/review", response_model=CompanyDocumentOut)
def review_verification_document(
    document_id: int,
    payload: DocumentReviewRequest,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject an individual company verification document.
    If rejected, updates company verification status to REJECTED and records reason.
    If approved and all company documents are approved, automatically updates company to APPROVED.
    """
    doc = db.query(CompanyDocument).filter(CompanyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    action = payload.action.strip().upper()
    now = datetime.datetime.utcnow()

    if action == "APPROVE":
        doc.status = "APPROVED"
        doc.rejection_reason = None
        doc.reviewed_by = current_admin.email
        doc.reviewed_at = now

        # Check if all documents for this user are now approved
        user_docs = db.query(CompanyDocument).filter(CompanyDocument.user_id == doc.user_id).all()
        all_approved = all(d.status == "APPROVED" for d in user_docs)

        user = db.query(User).filter(User.id == doc.user_id).first()
        if user and all_approved:
            user.verification_status = "APPROVED"
            user.verification_reviewed_at = now
            user.verification_rejection_reason = None
            if user.supplier_id:
                supplier = db.query(Supplier).filter(Supplier.id == user.supplier_id).first()
                if supplier:
                    supplier.is_verified = True
                    supplier.verification_status = "VERIFIED"
                    supplier.verification_reviewed_at = now

        audit = AuditLog(
            action="DOCUMENT_APPROVED",
            entity_type="CompanyDocument",
            entity_id=str(doc.id),
            details=f"Document '{doc.document_title}' approved by {current_admin.email}",
            user_email=current_admin.email
        )
        db.add(audit)

    elif action == "REJECT":
        doc.status = "REJECTED"
        doc.rejection_reason = payload.rejection_reason or "Document does not satisfy verification criteria. Please provide a clear, valid copy."
        doc.reviewed_by = current_admin.email
        doc.reviewed_at = now

        user = db.query(User).filter(User.id == doc.user_id).first()
        if user:
            user.verification_status = "REJECTED"
            user.verification_reviewed_at = now
            user.verification_rejection_reason = doc.rejection_reason
            if user.supplier_id:
                supplier = db.query(Supplier).filter(Supplier.id == user.supplier_id).first()
                if supplier:
                    supplier.is_verified = False
                    supplier.verification_status = "REJECTED"
                    supplier.verification_rejection_reason = doc.rejection_reason

        audit = AuditLog(
            action="DOCUMENT_REJECTED",
            entity_type="CompanyDocument",
            entity_id=str(doc.id),
            details=f"Document '{doc.document_title}' rejected by {current_admin.email}. Reason: {doc.rejection_reason}",
            user_email=current_admin.email
        )
        db.add(audit)
    else:
        raise HTTPException(status_code=400, detail="Action must be either 'APPROVE' or 'REJECT'.")

    db.commit()
    db.refresh(doc)

    out = CompanyDocumentOut.model_validate(doc)
    out.download_url = f"/api/v1/auth/documents/{doc.id}/download"
    return out


@router.post("/companies/{user_id}/verify")
def verify_entire_company(
    user_id: int,
    payload: AdminCompanyVerifyRequest,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Approve or reject an entire company registration package in one administrative decision.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User / company not found.")

    action = payload.action.strip().upper()
    now = datetime.datetime.utcnow()

    # Get all company documents
    docs = db.query(CompanyDocument).filter(CompanyDocument.user_id == user.id).all()

    if action == "APPROVE":
        user.verification_status = "APPROVED"
        user.verification_reviewed_at = now
        user.verification_rejection_reason = None

        for d in docs:
            d.status = "APPROVED"
            d.reviewed_by = current_admin.email
            d.reviewed_at = now

        if user.supplier_id:
            supplier = db.query(Supplier).filter(Supplier.id == user.supplier_id).first()
            if supplier:
                supplier.is_verified = True
                supplier.verification_status = "VERIFIED"
                supplier.verification_reviewed_at = now
                supplier.verification_rejection_reason = None

        action_msg = f"Company {user.company_name} ({user.email}) approved and fully verified"

    elif action == "REJECT":
        reason = payload.rejection_reason or "Company documentation does not satisfy requirements. Please re-upload updated documents."
        user.verification_status = "REJECTED"
        user.verification_reviewed_at = now
        user.verification_rejection_reason = reason

        for d in docs:
            if d.status != "APPROVED":
                d.status = "REJECTED"
                d.rejection_reason = reason
                d.reviewed_by = current_admin.email
                d.reviewed_at = now

        if user.supplier_id:
            supplier = db.query(Supplier).filter(Supplier.id == user.supplier_id).first()
            if supplier:
                supplier.is_verified = False
                supplier.verification_status = "REJECTED"
                supplier.verification_rejection_reason = reason

        action_msg = f"Company {user.company_name} rejected. Reason: {reason}"
    else:
        raise HTTPException(status_code=400, detail="Action must be 'APPROVE' or 'REJECT'.")

    audit = AuditLog(
        action="COMPANY_VERIFICATION_DECISION",
        entity_type="User",
        entity_id=str(user.id),
        details=action_msg,
        user_email=current_admin.email
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": action_msg,
        "user_id": user.id,
        "company_name": user.company_name,
        "verification_status": user.verification_status
    }


# =========================================================================
# SECTION 1: SOURCING REQUESTS & TRADE MONITORING (ADMIN DOMAIN)
# =========================================================================
from app.models.negotiation import NegotiationMessage
from app.models.order import OrderStatusHistory
from app.schemas.admin_sourcing import AdminSourcingTransactionItem, CancelTradeRequest


def _build_admin_sourcing_item(order: Order, db: Session) -> AdminSourcingTransactionItem:
    items = order.items or []
    first_item = items[0] if items else None
    product_name = first_item.item_name if first_item else "B2B Manufactured Product"
    quantity = sum(item.quantity for item in items) if items else 1
    unit_price = float(first_item.unit_price) if first_item else float(order.total_amount)
    product_desc = first_item.item_name if first_item else ""

    quote = order.quotation
    rfq = None
    if quote and quote.rfq_id:
        rfq = db.query(RFQ).filter(RFQ.id == quote.rfq_id).first()
    elif order.sourcing_request and order.sourcing_request.rfqs:
        rfq = order.sourcing_request.rfqs[0]

    rfq_code = rfq.rfq_code if rfq else None
    rfq_title = rfq.title if rfq else None
    rfq_id = rfq.id if rfq else None

    payment_terms = quote.payment_terms if quote and quote.payment_terms else "Net 30, EXW Factory"
    if order.status == "CANCELLED":
        payment_status = "CANCELLED / REFUNDED"
    elif order.status == "DELIVERED":
        payment_status = "SETTLED / PAID"
    elif order.status in ["SHIPPED", "DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"]:
        payment_status = "ESCROW SECURED"
    elif "NET" in (payment_terms or "").upper():
        payment_status = "NET 30 / UNPAID"
    else:
        payment_status = "ESCROW / AUTHORIZED"

    latest_update = None
    if order.history:
        sorted_h = sorted(order.history, key=lambda x: x.created_at, reverse=True)
        latest_update = sorted_h[0].notes or f"Status: {sorted_h[0].new_status}"
    else:
        latest_update = f"Order {order.status}"

    is_cancellable = order.status in ["CONFIRMED", "PREPARING", "IN_PRODUCTION", "READY_FOR_DISPATCH", "READY_TO_SHIP"]

    cancellation_reason = None
    if order.status == "CANCELLED":
        for h in order.history:
            if h.new_status == "CANCELLED":
                cancellation_reason = h.notes
                break
        if not cancellation_reason and order.notes and "CANCELLED" in order.notes:
            cancellation_reason = order.notes

    items_out = [
        {
            "id": it.id,
            "item_name": it.item_name,
            "quantity": it.quantity,
            "unit_price": float(it.unit_price),
            "total_price": float(it.total_price)
        }
        for it in items
    ]

    history_out = [
        {
            "id": h.id,
            "previous_status": h.previous_status,
            "new_status": h.new_status,
            "changed_by": h.changed_by,
            "notes": h.notes,
            "created_at": h.created_at.isoformat() if h.created_at else None
        }
        for h in sorted(order.history, key=lambda x: x.created_at if x.created_at else datetime.datetime.min)
    ]

    quote_out = None
    if quote:
        quote_out = {
            "id": quote.id,
            "quote_code": quote.quote_code,
            "unit_price": float(quote.unit_price),
            "total_amount": float(quote.total_amount),
            "moq": quote.moq,
            "lead_time_days": quote.lead_time_days,
            "payment_terms": quote.payment_terms,
            "incoterms": quote.incoterms,
            "warranty_info": quote.warranty_info,
            "packaging_details": quote.packaging_details,
            "validity_date": quote.validity_date.isoformat() if quote.validity_date else None,
            "acceptance_reason": quote.acceptance_reason
        }

    rfq_out = None
    if rfq:
        rfq_out = {
            "id": rfq.id,
            "rfq_code": rfq.rfq_code,
            "title": rfq.title,
            "status": rfq.status,
            "terms": rfq.terms,
            "notes": rfq.notes,
            "issue_date": rfq.issue_date.isoformat() if rfq.issue_date else None,
            "deadline_date": rfq.deadline_date.isoformat() if rfq.deadline_date else None
        }

    negs_q = db.query(NegotiationMessage)
    if rfq and order.id:
        negs = negs_q.filter(
            (NegotiationMessage.rfq_id == rfq.id) | (NegotiationMessage.order_id == order.id)
        ).order_by(NegotiationMessage.created_at.asc()).all()
    elif order.id:
        negs = negs_q.filter(NegotiationMessage.order_id == order.id).order_by(NegotiationMessage.created_at.asc()).all()
    else:
        negs = []

    negs_out = [
        {
            "id": n.id,
            "sender_role": n.sender_role,
            "sender_name": n.sender_name,
            "message": n.message,
            "action_type": n.action_type,
            "proposed_price": float(n.proposed_price) if n.proposed_price else None,
            "proposed_quantity": n.proposed_quantity,
            "created_at": n.created_at.isoformat() if n.created_at else None
        }
        for n in negs
    ]

    supplier = order.supplier
    supplier_name = supplier.name if supplier else "Unknown Supplier"
    supplier_country = supplier.country if supplier else "India"
    supplier_email = supplier.contact_email if supplier else None
    supplier_verification = supplier.verification_status if supplier else "VERIFIED"

    return AdminSourcingTransactionItem(
        id=order.id,
        order_code=order.order_code,
        rfq_id=rfq_id,
        rfq_code=rfq_code,
        rfq_title=rfq_title,
        sourcing_request_id=order.sourcing_request_id,
        buyer_id=order.buyer_id,
        buyer_company_name=order.buyer_company_name,
        buyer_country=order.buyer_country,
        buyer_name=order.buyer_name,
        buyer_email=order.buyer_email,
        supplier_id=order.supplier_id,
        supplier_name=supplier_name,
        supplier_country=supplier_country,
        supplier_email=supplier_email,
        supplier_verification_status=supplier_verification,
        product_name=product_name,
        product_description=product_desc,
        quantity=quantity,
        unit_price=unit_price,
        currency=order.currency,
        total_amount=float(order.total_amount),
        payment_status=payment_status,
        payment_terms=payment_terms,
        order_status=order.status,
        delivery_status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
        expected_delivery_date=order.expected_delivery_date,
        latest_status_update=latest_update,
        shipping_address=order.shipping_address,
        tracking_number=order.tracking_number,
        notes=order.notes,
        items=items_out,
        history=history_out,
        quotation=quote_out,
        rfq=rfq_out,
        negotiations=negs_out,
        is_cancellable=is_cancellable,
        cancellation_reason=cancellation_reason
    )


@router.get("/sourcing-requests", response_model=List[AdminSourcingTransactionItem])
def list_admin_sourcing_requests(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    buyer_company: Optional[str] = None,
    supplier_company: Optional[str] = None,
    search: Optional[str] = None,
    date_range: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Administrator Sourcing Requests monitoring list.
    Returns real sourcing transactions with comprehensive search and filtering capabilities.
    """
    orders = db.query(Order).order_by(Order.id.desc()).all()
    results = [_build_admin_sourcing_item(o, db) for o in orders]

    # Filters
    if status and status != "ALL":
        results = [r for r in results if r.order_status.upper() == status.upper()]

    if payment_status and payment_status != "ALL":
        p_lower = payment_status.lower()
        results = [r for r in results if p_lower in r.payment_status.lower()]

    if buyer_company and buyer_company != "ALL":
        results = [r for r in results if r.buyer_company_name.lower() == buyer_company.lower()]

    if supplier_company and supplier_company != "ALL":
        results = [r for r in results if r.supplier_name.lower() == supplier_company.lower()]

    if date_range and date_range != "ALL":
        now = datetime.datetime.utcnow()
        if date_range == "LAST_7_DAYS":
            cutoff = now - datetime.timedelta(days=7)
            results = [r for r in results if r.created_at >= cutoff]
        elif date_range == "LAST_30_DAYS":
            cutoff = now - datetime.timedelta(days=30)
            results = [r for r in results if r.created_at >= cutoff]
        elif date_range == "LAST_90_DAYS":
            cutoff = now - datetime.timedelta(days=90)
            results = [r for r in results if r.created_at >= cutoff]

    if search:
        s_lower = search.lower().strip()
        results = [
            r for r in results
            if s_lower in r.order_code.lower()
            or (r.rfq_code and s_lower in r.rfq_code.lower())
            or s_lower in r.product_name.lower()
            or s_lower in r.buyer_company_name.lower()
            or s_lower in r.supplier_name.lower()
            or s_lower in (r.buyer_name or "").lower()
        ]

    return results


@router.get("/sourcing-requests/{order_id}", response_model=AdminSourcingTransactionItem)
def get_admin_sourcing_request_detail(order_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a single sourcing transaction."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sourcing transaction / order not found.")
    return _build_admin_sourcing_item(order, db)


@router.post("/sourcing-requests/{order_id}/cancel", response_model=AdminSourcingTransactionItem)
def cancel_admin_trade(
    order_id: int,
    payload: CancelTradeRequest,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel Trade action executed by an authorized platform administrator.
    Enforces business rules, records cancellation in order history and audit logs,
    and propagates the update to Buyer and Supplier workspaces.
    """
    if current_admin.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Administrative access required.")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sourcing transaction / order not found.")

    reason = payload.reason.strip() if payload.reason else ""
    if not reason:
        raise HTTPException(status_code=400, detail="A cancellation reason is required.")

    # Rule checks
    if order.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Trade is already cancelled.")

    if order.status == "DELIVERED":
        raise HTTPException(
            status_code=400,
            detail="Order has already been fulfilled and delivered. Direct trade cancellation is not permitted; please initiate dispute or refund handling under Complaint Management."
        )

    if order.status in ["SHIPPED", "DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"]:
        raise HTTPException(
            status_code=400,
            detail="Order is currently in transit or dispatched. Direct cancellation cannot reverse physical transit. Additional refund or dispute handling is required under Complaint Management."
        )

    prev_status = order.status
    now = datetime.datetime.utcnow()

    # Update order
    order.status = "CANCELLED"
    order.notes = (order.notes or "") + f"\n[CANCELLED BY ADMIN on {now.strftime('%Y-%m-%d %H:%M')}: {reason}]"

    # Record OrderStatusHistory
    history = OrderStatusHistory(
        order_id=order.id,
        previous_status=prev_status,
        new_status="CANCELLED",
        changed_by=f"Admin: {current_admin.full_name or current_admin.email}",
        notes=f"Trade cancelled by Platform Administration. Reason: {reason}",
        created_at=now
    )
    db.add(history)

    # Record AuditLog
    audit = AuditLog(
        action="CANCEL_TRADE",
        entity_type="Order",
        entity_id=str(order.id),
        details=f"Administrator {current_admin.email} cancelled trade {order.order_code}. Reason: {reason}",
        user_email=current_admin.email,
        created_at=now
    )
    db.add(audit)

    # If linked to a SourcingRequest, update its status
    if order.sourcing_request:
        order.sourcing_request.status = "CANCELLED"

    db.commit()
    db.refresh(order)

    return _build_admin_sourcing_item(order, db)

