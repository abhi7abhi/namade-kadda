from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.supplier import SupplierOut


class QuotationItemBase(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float
    lead_time_days: int = 21


class QuotationItemCreate(QuotationItemBase):
    pass


class QuotationItemOut(QuotationItemBase):
    id: int
    quotation_id: int

    model_config = ConfigDict(from_attributes=True)


class QuotationBase(BaseModel):
    rfq_id: int
    supplier_id: int
    total_amount: float
    currency: str = "USD"
    unit_price: float
    moq: int = 100
    lead_time_days: int = 21
    shipping_estimate: float = 0.00
    payment_terms: str = "Net 30"
    validity_date: Optional[datetime] = None
    notes: Optional[str] = None


class QuotationCreate(QuotationBase):
    items: List[QuotationItemCreate] = []


class QuotationOut(QuotationBase):
    id: int
    quote_code: str
    status: str
    rejection_reason: Optional[str] = None
    acceptance_reason: Optional[str] = None
    comparison_score: float
    score_breakdown: Optional[str] = None
    missing_fields: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierOut] = None
    items: List[QuotationItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class QuotationComparisonWeights(BaseModel):
    price_weight: float = Field(0.50, ge=0.0, le=1.0)
    lead_time_weight: float = Field(0.30, ge=0.0, le=1.0)
    reliability_weight: float = Field(0.20, ge=0.0, le=1.0)


class QuotationComparisonItem(BaseModel):
    quotation_id: int
    quote_code: str
    supplier_name: str
    supplier_country: str
    total_amount: float
    unit_price: float
    lead_time_days: int
    moq: int
    shipping_estimate: float
    payment_terms: str
    comparison_score: float
    rank: int
    missing_fields: List[str] = []
    score_details: Dict[str, Any] = {}
    recommendation_note: str = ""


class QuotationComparisonResponse(BaseModel):
    rfq_id: int
    quotations: List[QuotationComparisonItem]
    weights_applied: QuotationComparisonWeights
    transparency_explanation: str
    disclaimer: str = "Demo comparison calculation. Human review and commercial evaluation required."


class QuotationAcceptRequest(BaseModel):
    acceptance_reason: str = Field(..., min_length=3, description="Justification for selecting this offer")
    generate_order: bool = True


class QuotationRejectRequest(BaseModel):
    rejection_reason: str = Field(..., min_length=3, description="Reason for rejecting this offer")
