from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.sourcing_service import SourcingService
from app.schemas.sourcing import (
    SourcingParseRequest,
    SourcingExtractionResult,
    SourcingRequestCreate,
    SourcingRequestUpdate,
    SourcingRequestOut,
    SourcingRequestListResponse
)
from app.api.v1.auth import get_optional_current_user
from app.models.user import User

router = APIRouter(prefix="/sourcing", tags=["Sourcing"])


@router.post("/parse", response_model=SourcingExtractionResult)
def parse_natural_language_requirement(req: SourcingParseRequest):
    return SourcingService.extract_specifications_from_text(req.raw_input)


@router.post("", response_model=SourcingRequestOut, status_code=201)
def create_sourcing_request(
    data: SourcingRequestCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    user_id = current_user.id if current_user else None
    return SourcingService.create_sourcing_request(db, data, user_id=user_id)


@router.get("", response_model=SourcingRequestListResponse)
def list_sourcing_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items = SourcingService.get_all(db, skip=skip, limit=limit)
    total = len(items)
    return SourcingRequestListResponse(items=items, total=total)


@router.get("/{request_id}", response_model=SourcingRequestOut)
def get_sourcing_request_detail(request_id: int, db: Session = Depends(get_db)):
    req = SourcingService.get_by_id(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Sourcing request not found")
    return req


@router.patch("/{request_id}", response_model=SourcingRequestOut)
def update_sourcing_request(request_id: int, data: SourcingRequestUpdate, db: Session = Depends(get_db)):
    req = SourcingService.update_sourcing_request(db, request_id, data)
    if not req:
        raise HTTPException(status_code=404, detail="Sourcing request not found")
    return req
