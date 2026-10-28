from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.supplier import SupplierOut


class OrderItemBase(BaseModel):
    item_name: str
    quantity: int
    unit_price: float
    total_price: float


class OrderItemOut(OrderItemBase):
    id: int
    order_id: int

    model_config = ConfigDict(from_attributes=True)


class OrderStatusHistoryOut(BaseModel):
    id: int
    order_id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_by: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    new_status: str = Field(..., description="Target status, e.g. IN_PRODUCTION, SHIPPED, DELIVERED")
    notes: Optional[str] = None
    production_notes: Optional[str] = None
    tracking_number: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None
    changed_by: str = "Procurement Manager"


class OrderCreate(BaseModel):
    sourcing_request_id: Optional[int] = None
    quotation_id: Optional[int] = None
    supplier_id: int
    total_amount: float
    currency: str = "USD"
    expected_delivery_date: Optional[datetime] = None
    shipping_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemBase] = []


class OrderOut(BaseModel):
    id: int
    order_code: str
    sourcing_request_id: Optional[int] = None
    quotation_id: Optional[int] = None
    supplier_id: int
    total_amount: float
    currency: str
    status: str
    expected_delivery_date: Optional[datetime] = None
    shipping_address: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierOut] = None
    items: List[OrderItemOut] = []
    history: List[OrderStatusHistoryOut] = []

    # Associated Buyer Context
    buyer_company_name: Optional[str] = None
    buyer_country: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
