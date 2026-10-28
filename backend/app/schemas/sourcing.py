from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field


class SourcingParseRequest(BaseModel):
    raw_input: str = Field(..., min_length=5, description="Natural language sourcing requirement text")


class ParsedSpecificationField(BaseModel):
    field_name: str
    value: Any
    confidence: float
    requires_confirmation: bool = False
    source_snippet: Optional[str] = None


class SourcingExtractionResult(BaseModel):
    title: str
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: str = "pieces"
    target_budget: Optional[float] = None
    currency: str = "USD"
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    required_delivery_date: Optional[str] = None
    manufacturing_process: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    tolerances: Optional[str] = None
    required_certifications: Optional[str] = None
    notes: Optional[str] = None
    confidence_score: float = 0.90
    extracted_fields: List[ParsedSpecificationField] = []
    missing_fields: List[str] = []
    mode: str = "DEMO"  # DEMO or LIVE


class SourcingRequestCreate(BaseModel):
    raw_input: str
    title: str
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: str = "pieces"
    target_budget: Optional[float] = None
    currency: str = "USD"
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    required_delivery_date: Optional[str] = None
    manufacturing_process: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    tolerances: Optional[str] = None
    required_certifications: Optional[str] = None
    notes: Optional[str] = None
    status: str = "CONFIRMED"


class SourcingRequestUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    target_budget: Optional[float] = None
    currency: Optional[str] = None
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    required_delivery_date: Optional[str] = None
    manufacturing_process: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    tolerances: Optional[str] = None
    required_certifications: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class SourcingRequestOut(BaseModel):
    id: int
    request_code: str
    title: str
    raw_input: str
    status: str
    user_id: Optional[int] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: str
    target_budget: Optional[float] = None
    currency: str
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    required_delivery_date: Optional[str] = None
    manufacturing_process: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    tolerances: Optional[str] = None
    required_certifications: Optional[str] = None
    notes: Optional[str] = None
    confidence_score: float
    extraction_metadata: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SourcingRequestListResponse(BaseModel):
    items: List[SourcingRequestOut]
    total: int
