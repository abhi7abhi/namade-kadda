import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class CancelTradeRequest(BaseModel):
    reason: str


class AdminSourcingTransactionItem(BaseModel):
    id: int
    order_code: str
    rfq_id: Optional[int] = None
    rfq_code: Optional[str] = None
    rfq_title: Optional[str] = None
    sourcing_request_id: Optional[int] = None
    buyer_id: Optional[int] = None
    buyer_company_name: str
    buyer_country: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    supplier_id: int
    supplier_name: str
    supplier_country: Optional[str] = None
    supplier_email: Optional[str] = None
    supplier_verification_status: Optional[str] = None
    product_name: str
    product_description: Optional[str] = None
    quantity: int
    unit_price: float
    currency: str
    total_amount: float
    payment_status: str
    payment_terms: Optional[str] = None
    order_status: str
    delivery_status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    expected_delivery_date: Optional[datetime.datetime] = None
    latest_status_update: Optional[str] = None
    shipping_address: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[Dict[str, Any]] = []
    history: List[Dict[str, Any]] = []
    quotation: Optional[Dict[str, Any]] = None
    rfq: Optional[Dict[str, Any]] = None
    negotiations: List[Dict[str, Any]] = []
    is_cancellable: bool = False
    cancellation_reason: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
