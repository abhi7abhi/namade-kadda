import os
import uuid
import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Response, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_role
from app.models.user import User
from app.models.supplier import Supplier
from app.services.supplier_workspace_service import SupplierWorkspaceService
from app.services.customer_retention_service import CustomerRetentionService
from app.services.matching_service import MatchingService
from app.schemas.matching import RelevantBuyerMatch
from app.schemas.supplier import SupplierOut, CatalogItemOut
from app.schemas.quotation import QuotationOut
from app.schemas.order import OrderOut
from app.schemas.supplier_workspace import (
    SupplierProfileUpdate,
    SupplierVerificationRequest,
    SupplierProductCreate,
    SupplierProductUpdate,
    SupplierProductListResponse,
    SupplierRFQActionRequest,
    SupplierQuotationCreateRequest,
    SupplierNegotiationCreateRequest,
    SupplierOrderStatusUpdateRequest,
    SupplierAIAssistantRequest,
    SupplierAIAssistantResponse,
    NotificationOut,
    NegotiationMessageOut,
    CustomerReminderRequest,
    OrderProposalActionRequest,
    OrderNegotiationSummaryOut,
    DiscoverBuyerOut,
    ContactBuyerRequest
)

router = APIRouter(prefix="/supplier", tags=["Seller Workspace"])


def get_active_supplier(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Supplier:
    """Resolve the active supplier context for the authenticated user with security isolation."""
    if current_user.role not in ["SUPPLIER", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only registered suppliers and administrators may manage supplier workspace operations."
        )
    supp = SupplierWorkspaceService.get_supplier_for_user(db, current_user)
    if not supp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier profile not found. Please complete supplier registration."
        )
    return supp


@router.get("/me", response_model=SupplierOut)
def get_supplier_me(
    supplier: Supplier = Depends(get_active_supplier)
):
    """Retrieve active supplier profile, capabilities, and verification status."""
    return supplier


@router.put("/profile", response_model=SupplierOut)
def update_supplier_profile(
    data: SupplierProfileUpdate,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Update supplier operational profile, capacity, and materials."""
    return SupplierWorkspaceService.update_profile(db, supplier, data)


@router.post("/profile/request-verification")
def request_verification(
    req: SupplierVerificationRequest,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit formal accreditation review request."""
    return SupplierWorkspaceService.request_verification(db, supplier, current_user, req)


@router.get("/dashboard")
def get_supplier_dashboard(
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Get aggregated KPI metrics, matching RFQs, pending quotations, and active orders."""
    return SupplierWorkspaceService.get_dashboard(db, supplier)


@router.get("/products", response_model=SupplierProductListResponse)
def list_supplier_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    stock_status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=100),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """List products managed by this supplier with filtering, search, and pagination."""
    items, total, pages, categories, statuses_count = SupplierWorkspaceService.list_products(
        db,
        supplier.id,
        search=search,
        category=category,
        status=status,
        stock_status=stock_status,
        page=page,
        size=size
    )
    return SupplierProductListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
        categories=categories,
        statuses_count=statuses_count
    )


@router.get("/products/{product_id}", response_model=CatalogItemOut)
def get_supplier_product(
    product_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Retrieve full product specification details ensuring supplier authorization."""
    item = SupplierWorkspaceService.get_product(db, product_id, supplier.id)
    if not item:
        raise HTTPException(status_code=404, detail="Product listing not found or unauthorized")
    return item


@router.post("/products", response_model=CatalogItemOut, status_code=status.HTTP_201_CREATED)
def create_supplier_product(
    data: SupplierProductCreate,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Add a new product listing associated with the authenticated supplier's company."""
    # Server-side validation
    if not data.name or not data.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required.")
    if data.unit_price <= 0:
        raise HTTPException(status_code=400, detail="Unit price must be greater than zero.")
    if data.moq < 1:
        raise HTTPException(status_code=400, detail="Minimum Order Quantity (MOQ) must be at least 1.")
    if data.lead_time_days < 1:
        raise HTTPException(status_code=400, detail="Lead time must be at least 1 day.")
    if data.available_quantity < 0:
        raise HTTPException(status_code=400, detail="Available quantity cannot be negative.")

    return SupplierWorkspaceService.create_product(db, supplier.id, data)


@router.put("/products/{product_id}", response_model=CatalogItemOut)
def update_supplier_product(
    product_id: int,
    data: SupplierProductUpdate,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Update specifications or pricing for an existing catalog item ensuring ownership."""
    if data.unit_price is not None and data.unit_price <= 0:
        raise HTTPException(status_code=400, detail="Unit price must be greater than zero.")
    if data.moq is not None and data.moq < 1:
        raise HTTPException(status_code=400, detail="Minimum Order Quantity (MOQ) must be at least 1.")
    if data.lead_time_days is not None and data.lead_time_days < 1:
        raise HTTPException(status_code=400, detail="Lead time must be at least 1 day.")

    prod = SupplierWorkspaceService.update_product(db, product_id, supplier.id, data)
    if not prod:
        raise HTTPException(status_code=404, detail="Product listing not found or unauthorized")
    return prod


@router.post("/products/{product_id}/publish", response_model=CatalogItemOut)
def publish_supplier_product(
    product_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Publish a product listing to the public marketplace."""
    prod = SupplierWorkspaceService.set_product_status(db, product_id, supplier.id, "PUBLISHED")
    if not prod:
        raise HTTPException(status_code=404, detail="Product listing not found or unauthorized")
    return prod


@router.post("/products/{product_id}/unpublish", response_model=CatalogItemOut)
def unpublish_supplier_product(
    product_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Unpublish (pause) a product listing."""
    prod = SupplierWorkspaceService.set_product_status(db, product_id, supplier.id, "UNPUBLISHED")
    if not prod:
        raise HTTPException(status_code=404, detail="Product listing not found or unauthorized")
    return prod


@router.post("/products/{product_id}/archive", response_model=CatalogItemOut)
def archive_supplier_product(
    product_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Archive a product listing."""
    prod = SupplierWorkspaceService.set_product_status(db, product_id, supplier.id, "ARCHIVED")
    if not prod:
        raise HTTPException(status_code=404, detail="Product listing not found or unauthorized")
    return prod


@router.delete("/products/{product_id}")
def delete_supplier_product(
    product_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Archive / delete a product listing."""
    deleted = SupplierWorkspaceService.delete_product(db, product_id, supplier.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product listing not found or unauthorized")
    return {"message": "Product archived successfully", "id": product_id}


@router.post("/products/upload")
async def upload_product_file(
    file: UploadFile = File(...),
    supplier: Supplier = Depends(get_active_supplier)
):
    """Upload product images or datasheets with validation of file type and size."""
    allowed_image_exts = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    allowed_doc_exts = {".pdf", ".doc", ".docx"}
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in allowed_image_exts and ext not in allowed_doc_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed types: JPG, PNG, WEBP, PDF, DOCX."
        )

    contents = await file.read()
    max_bytes = 10 * 1024 * 1024  # 10MB
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10MB (size: {len(contents) / (1024*1024):.2f}MB)."
        )

    upload_dir = os.path.join("uploads", "products")
    os.makedirs(upload_dir, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex[:12]}_{os.path.basename(filename).replace(' ', '_')}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/products/{safe_filename}"
    file_type = "IMAGE" if ext in allowed_image_exts else "DOCUMENT"

    return {
        "url": file_url,
        "filename": filename,
        "size_bytes": len(contents),
        "file_type": file_type,
        "content_type": file.content_type
    }


@router.get("/rfqs")
def list_incoming_rfqs(
    status: Optional[str] = Query(None),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Retrieve incoming buyer RFQ opportunities directed to this supplier."""
    return SupplierWorkspaceService.list_incoming_rfqs(db, supplier.id, status_filter=status)


@router.get("/rfqs/{rfq_id}")
def get_rfq_detail(
    rfq_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Get full buyer requirement details for a specific RFQ."""
    detail = SupplierWorkspaceService.get_rfq_detail(db, rfq_id, supplier.id)
    if not detail:
        raise HTTPException(status_code=404, detail="RFQ not found or not invited")
    return detail


@router.post("/rfqs/{rfq_id}/action")
def action_rfq(
    rfq_id: int,
    data: SupplierRFQActionRequest,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Accept opportunity, decline with explanation, or ask clarification."""
    return SupplierWorkspaceService.action_rfq(db, rfq_id, supplier.id, data)


@router.post("/rfqs/{rfq_id}/accept")
def accept_rfq(
    rfq_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Express binding intent to quote on buyer RFQ."""
    return SupplierWorkspaceService.accept_rfq(db, rfq_id, supplier.id)


@router.post("/rfqs/{rfq_id}/decline")
def decline_rfq(
    rfq_id: int,
    data: Optional[SupplierRFQActionRequest] = None,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Decline RFQ with operational explanation."""
    reason = data.reason if data else None
    return SupplierWorkspaceService.decline_rfq(db, rfq_id, supplier.id, reason=reason)


@router.get("/quotations", response_model=List[QuotationOut])
def list_supplier_quotations(
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """List quotations submitted by this supplier."""
    from app.models.quotation import Quotation
    return db.query(Quotation).filter(Quotation.supplier_id == supplier.id).order_by(Quotation.created_at.desc()).all()


@router.post("/quotations", response_model=QuotationOut, status_code=status.HTTP_201_CREATED)
def create_supplier_quotation(
    data: SupplierQuotationCreateRequest,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Prepare and submit a binding quotation."""
    try:
        return SupplierWorkspaceService.create_quotation(db, supplier.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/negotiations", response_model=List[NegotiationMessageOut])
def list_negotiations(
    rfq_id: Optional[int] = Query(None),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Retrieve negotiation messages and counteroffers."""
    return SupplierWorkspaceService.list_negotiations(db, supplier.id, rfq_id=rfq_id)


@router.post("/negotiations", response_model=NegotiationMessageOut, status_code=status.HTTP_201_CREATED)
def post_negotiation_message(
    data: SupplierNegotiationCreateRequest,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post counteroffer or clarification message in negotiation workspace."""
    return SupplierWorkspaceService.post_negotiation(
        db,
        supplier_id=supplier.id,
        sender_role=current_user.role,
        sender_name=current_user.full_name,
        data=data
    )


@router.get("/orders", response_model=List[OrderOut])
def list_supplier_orders(
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """List purchase orders assigned to this supplier."""
    from app.models.order import Order
    return db.query(Order).filter(Order.supplier_id == supplier.id).order_by(Order.created_at.desc()).all()


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_supplier_order_detail(
    order_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Retrieve full order details including line items, shipping address, and tracking history."""
    from app.models.order import Order
    order = db.query(Order).filter(Order.id == order_id, Order.supplier_id == supplier.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or unauthorized")
    return order


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    data: SupplierOrderStatusUpdateRequest,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update fulfilment stage (IN_PRODUCTION, READY_TO_SHIP, SHIPPED, DELIVERED)."""
    try:
        return SupplierWorkspaceService.update_order_stage(
            db,
            order_id=order_id,
            supplier_id=supplier.id,
            user_name=current_user.full_name,
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/negotiations/orders", response_model=List[OrderNegotiationSummaryOut])
def list_order_negotiations(
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """List all order negotiations with buyer details, commercial values, and unread counts."""
    return SupplierWorkspaceService.list_order_negotiations(db, supplier.id)


@router.get("/negotiations/orders/{order_id}")
def get_order_negotiation(
    order_id: int,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Retrieve message thread, latest commercial proposal, and order baseline."""
    try:
        return SupplierWorkspaceService.get_order_negotiation(db, order_id, supplier.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/negotiations/orders/{order_id}/messages", response_model=NegotiationMessageOut, status_code=status.HTTP_201_CREATED)
def post_order_negotiation_message(
    order_id: int,
    data: SupplierNegotiationCreateRequest,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Post standard chat message or formal structured proposal scoped to an order."""
    try:
        return SupplierWorkspaceService.post_order_negotiation(
            db=db,
            order_id=order_id,
            supplier_id=supplier.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/negotiations/orders/{order_id}/proposals/{message_id}/action")
def action_order_proposal(
    order_id: int,
    message_id: int,
    data: OrderProposalActionRequest,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept, Decline, or Counter a commercial proposal on an order."""
    try:
        return SupplierWorkspaceService.action_order_proposal(
            db=db,
            order_id=order_id,
            message_id=message_id,
            supplier_id=supplier.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/dashboard/analytics")
def get_supplier_dashboard_analytics(
    date_range: str = Query("ALL_TIME"),
    country: Optional[str] = Query(None),
    product: Optional[str] = Query(None),
    buyer: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Retrieve real database KPI cards and 5 dynamic Recharts graphs with multi-filtering."""
    return SupplierWorkspaceService.get_dashboard_analytics(
        db=db,
        supplier=supplier,
        date_range=date_range,
        country=country,
        product=product,
        buyer=buyer,
        status=status
    )


@router.get("/relevant-buyers", response_model=List[RelevantBuyerMatch])
def get_relevant_buyers(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    min_quantity: Optional[int] = Query(None),
    max_quantity: Optional[int] = Query(None),
    rfq_status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("best_match"),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Recommend suitable buyers whose purchasing requirements and RFQs match supplier's products."""
    return MatchingService.get_relevant_buyers(
        db=db,
        supplier_id=supplier.id,
        search=search,
        category=category,
        country=country,
        min_quantity=min_quantity,
        max_quantity=max_quantity,
        rfq_status=rfq_status,
        min_score=min_score,
        sort_by=sort_by
    )


@router.get("/buyers", response_model=List[DiscoverBuyerOut])
def list_discover_buyers(
    search: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    activity_level: Optional[str] = Query(None),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Directory of registered enterprise buyers with sanitized public sourcing activity."""
    return SupplierWorkspaceService.list_discover_buyers(
        db=db,
        search=search,
        country=country,
        industry=industry,
        activity_level=activity_level
    )


@router.post("/buyers/contact")
def contact_buyer(
    data: ContactBuyerRequest,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Directly introduce company catalog and initiate authorized buyer conversation."""
    try:
        return SupplierWorkspaceService.contact_buyer(
            db=db,
            supplier=supplier,
            user=current_user,
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ai-assistant", response_model=SupplierAIAssistantResponse)
def run_ai_seller_assistant(
    req: SupplierAIAssistantRequest,
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Specialized AI assistant for suppliers across 6 expert operational roles."""
    return SupplierWorkspaceService.run_ai_seller_assistant(db, supplier, req)


@router.get("/analytics")
def get_supplier_analytics(
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Aggregated sales, quotation win rate, and fulfilment performance analytics."""
    return SupplierWorkspaceService.get_analytics(db, supplier)


@router.get("/analytics/export-csv")
def export_supplier_analytics_csv(
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """Download RFC 4180 CSV export of commercial sales metrics."""
    data = SupplierWorkspaceService.get_analytics(db, supplier)
    csv_str = SupplierWorkspaceService.export_analytics_csv(data)
    filename = f"namade_kadda_supplier_analytics_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.get("/notifications", response_model=List[NotificationOut])
def get_supplier_notifications(
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get in-app notifications for the active supplier."""
    return SupplierWorkspaceService.list_notifications(db, supplier_id=supplier.id, user_id=current_user.id)


@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    success = SupplierWorkspaceService.mark_notification_read(db, notif_id)
    return {"success": success, "id": notif_id}


@router.post("/notifications/mark-all-read")
def mark_all_notifications_read(
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all unread notifications as read."""
    count = SupplierWorkspaceService.mark_all_notifications_read(db, supplier_id=supplier.id, user_id=current_user.id)
    return {"marked_read": count}


# ============================================================================
# Customer Insights & Inactive Customer Retention Analytics Endpoints
# ============================================================================

@router.get("/customers/insights")
def get_customer_insights(
    status: Optional[str] = Query(None, description="Filter: ALL, REGULAR, AT_RISK, INACTIVE, NON_REGULAR, PROSPECT"),
    country: Optional[str] = Query(None, description="Country filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    search: Optional[str] = Query(None, description="Search term for company, product, or country"),
    sort_by: str = Query("last_purchase_desc", description="Sorting criterion"),
    at_risk_threshold_days: int = Query(45, ge=1, le=365, description="Days inactivity threshold for At-Risk status"),
    inactive_threshold_days: int = Query(90, ge=1, le=730, description="Days inactivity threshold for Inactive status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """
    Retrieve customer retention telemetry, categorizing buyer companies as
    Regular, At-Risk, or Inactive based on historical completed orders and buying cycles.
    """
    return CustomerRetentionService.get_customers_overview(
        db=db,
        supplier_id=supplier.id,
        status=status,
        country=country,
        category=category,
        search=search,
        sort_by=sort_by,
        at_risk_threshold_days=at_risk_threshold_days,
        inactive_threshold_days=inactive_threshold_days,
        page=page,
        limit=limit
    )


@router.get("/customers/{company_name}/analytics")
def get_customer_company_analytics(
    company_name: str,
    at_risk_threshold_days: int = Query(45, ge=1, le=365),
    inactive_threshold_days: int = Query(90, ge=1, le=730),
    supplier: Supplier = Depends(get_active_supplier),
    db: Session = Depends(get_db)
):
    """
    Deep-dive purchasing analytics, product tables, 5 interactive graphs,
    and AI retention advisory recommendations for a selected customer organization.
    """
    return CustomerRetentionService.get_customer_detail_analytics(
        db=db,
        supplier_id=supplier.id,
        company_name=company_name,
        at_risk_threshold_days=at_risk_threshold_days,
        inactive_threshold_days=inactive_threshold_days
    )


@router.post("/customers/{company_name}/reminder")
def create_customer_follow_up_reminder(
    company_name: str,
    req: CustomerReminderRequest = None,
    supplier: Supplier = Depends(get_active_supplier),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create an in-app follow-up reminder notification for an inactive or at-risk customer.
    """
    notes = req.notes if req else None
    notif = CustomerRetentionService.create_customer_reminder(
        db=db,
        supplier_id=supplier.id,
        user_id=current_user.id,
        company_name=company_name,
        reminder_notes=notes
    )
    return {
        "success": True,
        "notification_id": notif.id,
        "message": f"Follow-up reminder for {company_name} successfully scheduled.",
        "created_at": notif.created_at.isoformat()
    }

