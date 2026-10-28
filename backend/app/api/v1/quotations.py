from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.quotation import Quotation
from app.services.quotation_service import QuotationService
from app.services.order_service import OrderService
from app.schemas.quotation import (
    QuotationCreate,
    QuotationOut,
    QuotationComparisonWeights,
    QuotationComparisonResponse,
    QuotationAcceptRequest,
    QuotationRejectRequest
)
from app.schemas.order import OrderOut

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.get("", response_model=List[QuotationOut])
def list_quotations(
    rfq_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Quotation)
    if rfq_id:
        q = q.filter(Quotation.rfq_id == rfq_id)
    if supplier_id:
        q = q.filter(Quotation.supplier_id == supplier_id)
    return q.order_by(Quotation.created_at.desc()).all()


@router.post("", response_model=QuotationOut, status_code=201)
def create_quotation(data: QuotationCreate, db: Session = Depends(get_db)):
    return QuotationService.create_quotation(db, data)


@router.post("/compare/{rfq_id}", response_model=QuotationComparisonResponse)
def compare_quotations(
    rfq_id: int,
    weights: QuotationComparisonWeights = QuotationComparisonWeights(),
    db: Session = Depends(get_db)
):
    return QuotationService.compare_quotations(db, rfq_id, weights)


@router.post("/{quotation_id}/accept", response_model=QuotationOut)
def accept_quotation(
    quotation_id: int,
    req: QuotationAcceptRequest,
    db: Session = Depends(get_db)
):
    try:
        quote = QuotationService.accept_quotation(db, quotation_id, req)
        if req.generate_order:
            OrderService.create_order_from_quotation(db, quotation_id)
        return quote
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{quotation_id}/reject", response_model=QuotationOut)
def reject_quotation(
    quotation_id: int,
    req: QuotationRejectRequest,
    db: Session = Depends(get_db)
):
    try:
        return QuotationService.reject_quotation(db, quotation_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
