from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.supplier import SupplierOut
from app.schemas.sourcing import SourcingRequestOut
from app.schemas.quotation import QuotationOut


class RFQSupplierOut(BaseModel):
    id: int
    rfq_id: int
    supplier_id: int
    status: str
    invited_at: datetime
    decline_reason: Optional[str] = None
    clarification_questions: Optional[str] = None
    responded_at: Optional[datetime] = None
    supplier: Optional[SupplierOut] = None

    model_config = ConfigDict(from_attributes=True)


class RFQCreate(BaseModel):
    sourcing_request_id: int
    title: str
    deadline_date: Optional[datetime] = None
    terms: Optional[str] = "Standard B2B Commercial Terms - Delivery DDP"
    notes: Optional[str] = None
    supplier_ids: List[int] = []


class RFQUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    deadline_date: Optional[datetime] = None
    terms: Optional[str] = None
    notes: Optional[str] = None


class RFQOut(BaseModel):
    id: int
    rfq_code: str
    sourcing_request_id: int
    title: str
    status: str
    issue_date: datetime
    deadline_date: Optional[datetime] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    supplier_invitations: List[RFQSupplierOut] = []
    sourcing_request: Optional[SourcingRequestOut] = None
    quotations: Optional[List[QuotationOut]] = []

    model_config = ConfigDict(from_attributes=True)
