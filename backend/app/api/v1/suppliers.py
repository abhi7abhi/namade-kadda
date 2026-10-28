import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.supplier_service import SupplierService
from app.schemas.supplier import SupplierOut, SupplierListResponse, SupplierCreate

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("", response_model=SupplierListResponse)
def list_suppliers(
    search: Optional[str] = Query(None, description="Search by name, city, country"),
    country: Optional[str] = Query(None, description="Filter by country"),
    category: Optional[str] = Query(None, description="Filter by process or capability category"),
    max_moq: Optional[int] = Query(None, description="Maximum Minimum Order Quantity"),
    max_lead_time: Optional[int] = Query(None, description="Maximum lead time in days"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    items, total = SupplierService.list_suppliers(
        db, search=search, country=country, category=category,
        max_moq=max_moq, max_lead_time=max_lead_time, page=page, size=size
    )
    pages = math.ceil(total / size) if size > 0 else 1
    return SupplierListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier_detail(supplier_id: int, db: Session = Depends(get_db)):
    supp = SupplierService.get_by_id(db, supplier_id)
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supp


@router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    return SupplierService.create_supplier(db, data)
