import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.product_service import ProductService
from app.schemas.product import ProductOut, ProductListResponse, ProductCreate

router = APIRouter(prefix="/products", tags=["Product Marketplace"])


@router.get("", response_model=ProductListResponse)
def list_products(
    search: Optional[str] = Query(None, description="Search by name, description, part number, or material"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    origin_country: Optional[str] = Query(None, description="Filter by country of origin"),
    supplier_country: Optional[str] = Query(None, description="Filter by supplier location country"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum unit price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum unit price"),
    max_moq: Optional[int] = Query(None, ge=1, description="Maximum MOQ"),
    max_lead_time: Optional[int] = Query(None, ge=1, description="Maximum lead time in days"),
    manufacturing_capability: Optional[str] = Query(None, description="Filter by capability"),
    sort_by: Optional[str] = Query("price_asc", description="Sort by price_asc, price_desc, lead_time_asc, name_asc"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Browse, search, and filter industrial products from worldwide suppliers."""
    items, total, meta = ProductService.list_products(
        db,
        search=search,
        category=category,
        origin_country=origin_country,
        supplier_country=supplier_country,
        min_price=min_price,
        max_price=max_price,
        max_moq=max_moq,
        max_lead_time=max_lead_time,
        manufacturing_capability=manufacturing_capability,
        sort_by=sort_by,
        page=page,
        size=size
    )
    pages = math.ceil(total / size) if size > 0 else 1
    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
        available_categories=meta.get("categories", []),
        available_countries=meta.get("countries", []),
        min_price=meta.get("min_price", 0.0),
        max_price=meta.get("max_price", 1000.0)
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product_detail(product_id: int, db: Session = Depends(get_db)):
    """Retrieve full product specifications, origin details, and supplier profile."""
    product = ProductService.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in marketplace catalog")
    return product


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    """Add a new product listing to the catalog."""
    return ProductService.create_product(db, data)
