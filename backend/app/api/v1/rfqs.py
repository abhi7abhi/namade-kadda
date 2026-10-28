from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.rfq_service import RFQService
from app.schemas.rfq import RFQCreate, RFQUpdate, RFQOut

router = APIRouter(prefix="/rfqs", tags=["RFQs"])


@router.post("", response_model=RFQOut, status_code=201)
def create_rfq(data: RFQCreate, db: Session = Depends(get_db)):
    return RFQService.create_rfq(db, data)


@router.get("", response_model=List[RFQOut])
def list_rfqs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return RFQService.list_rfqs(db, skip=skip, limit=limit)


@router.get("/{rfq_id}", response_model=RFQOut)
def get_rfq_detail(rfq_id: int, db: Session = Depends(get_db)):
    rfq = RFQService.get_by_id(db, rfq_id)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq


@router.patch("/{rfq_id}", response_model=RFQOut)
def update_rfq(rfq_id: int, data: RFQUpdate, db: Session = Depends(get_db)):
    rfq = RFQService.update_rfq(db, rfq_id, data)
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    return rfq
