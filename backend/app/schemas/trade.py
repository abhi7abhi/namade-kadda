from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TradeDocumentRequirement(BaseModel):
    document_name: str
    purpose: str
    issuing_authority: str
    mandatory: bool = True


class TradeEstimateRequest(BaseModel):
    sourcing_request_id: Optional[int] = None
    origin_country: str = Field("China")
    destination_country: str = Field("India")
    product_description: str = Field("Stainless steel industrial mounting brackets")
    declared_value: float = Field(5000.0, gt=0)
    quantity: Optional[float] = Field(500.0, ge=1)
    unit_price: Optional[float] = None
    currency: str = Field("USD")
    freight_insurance_estimate: float = Field(350.0, ge=0)
    supplier_name: Optional[str] = None


class TradeEstimateResponse(BaseModel):
    id: Optional[int] = None
    origin_country: str
    destination_country: str
    product_description: str
    declared_value: float
    quantity: Optional[float] = 500.0
    unit_price: Optional[float] = None
    cost_per_unit: Optional[float] = None
    currency: str
    hs_code_candidate: str
    estimated_duty_rate_percent: float
    estimated_tax_rate_percent: float
    cif_value: float
    duty_estimate: float
    tax_estimate: float
    total_landed_estimate: float
    compliance_checklist: List[TradeDocumentRequirement]
    source_basis: str
    supplier_name: Optional[str] = "Global Industrial Vendor"
    disclaimer: str = (
        "ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION. "
        "Applicable Basic Customs Duty, IGST, cess, valuation rules, and port handling depend on "
        "official classification at the port of entry and current national regulations. "
        "Independent verification with a licensed customs broker is strictly required."
    )
    is_simulated_estimate: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
