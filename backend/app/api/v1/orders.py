from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.order_service import OrderService
from app.schemas.order import OrderOut, OrderStatusUpdate
from app.api.v1.auth import get_optional_current_user
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[OrderOut])
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    return OrderService.list_orders(db, skip=skip, limit=limit, user=current_user)


@router.get("/{order_id}", response_model=OrderOut)
def get_order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    try:
        order = OrderService.get_by_id(db, order_id, user=current_user)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(order_id: int, update: OrderStatusUpdate, db: Session = Depends(get_db)):
    try:
        return OrderService.update_order_status(db, order_id, update)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
