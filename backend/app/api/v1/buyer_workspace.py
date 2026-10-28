from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_optional_current_user, get_current_user
from app.models.user import User
from app.services.buyer_workspace_service import BuyerWorkspaceService
from app.services.matching_service import MatchingService
from app.schemas.buyer_workspace import (
    BuyerDashboardKPIs,
    ProductPriceComparisonResponse,
    BuyerOrderNegotiationSummary,
    ContactSupplierRequest,
    CreateBuyerRFQRequest,
    BuyerRFQItem,
    BuyerRFQSupplierResponse,
    InviteSuppliersRequest,
    AcceptRFQQuotationResponse
)
from app.schemas.matching import (
    RelevantSupplierMatch,
    MatchingFilterOptions
)
from app.schemas.rfq import RFQOut
from app.schemas.supplier_workspace import (
    SupplierNegotiationCreateRequest,
    OrderProposalActionRequest,
    NegotiationMessageOut
)

router = APIRouter(prefix="/buyer", tags=["Buyer Workspace"])


@router.get("/dashboard-kpis", response_model=BuyerDashboardKPIs)
def get_buyer_dashboard_kpis(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Aggregated Buyer KPI metrics, business activity trends, and country business analysis."""
    return BuyerWorkspaceService.get_dashboard_kpis(db, current_user)


@router.get("/price-comparison", response_model=ProductPriceComparisonResponse)
def get_product_price_comparison(
    product: Optional[str] = Query(None, description="Product name to compare across countries and suppliers"),
    db: Session = Depends(get_db)
):
    """Country and company price comparisons with cheapest sourcing country identification."""
    return BuyerWorkspaceService.get_product_price_comparison(db, product_name=product)


@router.get("/relevant-suppliers", response_model=List[RelevantSupplierMatch])
def get_relevant_suppliers(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    max_price: Optional[float] = Query(None),
    max_moq: Optional[int] = Query(None),
    max_lead_time: Optional[int] = Query(None),
    certification: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("best_match"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Recommend compatible suppliers based on buyer's sourcing requests, RFQs, specs, and volume."""
    return MatchingService.get_relevant_suppliers(
        db=db,
        buyer_user=current_user,
        search=search,
        category=category,
        country=country,
        max_price=max_price,
        max_moq=max_moq,
        max_lead_time=max_lead_time,
        certification=certification,
        min_score=min_score,
        sort_by=sort_by
    )


@router.get("/filter-options", response_model=MatchingFilterOptions)
def get_matching_filter_options(db: Session = Depends(get_db)):
    """Retrieve distinct categories, countries, and certifications for search filters."""
    return MatchingService.get_filter_options(db)


@router.get("/negotiations/orders", response_model=List[BuyerOrderNegotiationSummary])
def list_buyer_order_negotiations(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List all order negotiations for the buyer with commercial baselines and unread counts."""
    return BuyerWorkspaceService.list_order_negotiations(db, current_user)


@router.get("/negotiations/orders/{order_id}")
def get_buyer_order_negotiation(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Retrieve message thread, supplier details, and order baseline for buyer."""
    try:
        return BuyerWorkspaceService.get_order_negotiation(db, order_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/negotiations/orders/{order_id}/messages", response_model=NegotiationMessageOut, status_code=status.HTTP_201_CREATED)
def post_buyer_order_negotiation_message(
    order_id: int,
    data: SupplierNegotiationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buyer posts message or structured commercial counteroffer on an order."""
    try:
        return BuyerWorkspaceService.post_order_negotiation(
            db=db,
            order_id=order_id,
            user_name=current_user.full_name,
            user_role="BUYER",
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/negotiations/orders/{order_id}/proposals/{message_id}/action")
def action_buyer_order_proposal(
    order_id: int,
    message_id: int,
    data: OrderProposalActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Buyer accepts, declines, or counters a supplier's commercial proposal."""
    try:
        return BuyerWorkspaceService.action_order_proposal(
            db=db,
            order_id=order_id,
            message_id=message_id,
            user_name=current_user.full_name,
            user_role="BUYER",
            data=data
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/suppliers/contact")
def contact_supplier(
    data: ContactSupplierRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Directly message a supplier from supplier directory or relevant suppliers."""
    try:
        return BuyerWorkspaceService.contact_supplier(db, current_user, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rfqs", response_model=RFQOut, status_code=status.HTTP_201_CREATED)
def create_buyer_rfq(
    data: CreateBuyerRFQRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Create a new RFQ with backing sourcing request and invite multiple suppliers."""
    return BuyerWorkspaceService.create_buyer_rfq(db, current_user, data)


@router.get("/rfqs", response_model=List[BuyerRFQItem])
def list_buyer_rfqs(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """List all RFQs created by the buyer's company with independent supplier responses."""
    return BuyerWorkspaceService.get_buyer_rfqs(db, current_user)


@router.get("/rfqs/{rfq_id}", response_model=BuyerRFQItem)
def get_buyer_rfq_detail(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Get single buyer RFQ with all technical specifications and detailed supplier responses."""
    try:
        return BuyerWorkspaceService.get_buyer_rfq_detail(db, rfq_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/rfqs/{rfq_id}/invite")
def invite_suppliers_to_rfq(
    rfq_id: int,
    data: InviteSuppliersRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Invite additional verified suppliers to an existing buyer RFQ."""
    try:
        return BuyerWorkspaceService.invite_suppliers_to_rfq(db, rfq_id, data.supplier_ids, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/rfqs/{rfq_id}/quotes/{quotation_id}/accept", response_model=AcceptRFQQuotationResponse)
def accept_buyer_quotation(
    rfq_id: int,
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Buyer accepts quotation, confirming into a PO order appearing in Delivery Status."""
    try:
        return BuyerWorkspaceService.accept_rfq_quotation(db, rfq_id, quotation_id, current_user)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

