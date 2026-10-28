from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class SpecificationDetails(BaseModel):
    material_grade: Optional[str] = None
    manufacturing_process: Optional[str] = None
    dimensions: Optional[str] = None
    tolerances: Optional[str] = None
    required_certifications: Optional[str] = None
    notes: Optional[str] = None


class RelevantBuyerMatch(BaseModel):
    id: str  # Composite ID e.g. "rb-rfq-1-supp-2"
    buyer_id: int
    buyer_name: str
    buyer_company: str
    buyer_country: str
    buyer_industry: Optional[str] = None
    buyer_email: Optional[str] = None  # Sanitized for messaging

    # Sourcing / RFQ Context
    rfq_id: Optional[int] = None
    rfq_code: Optional[str] = None
    rfq_title: str
    rfq_status: str
    sourcing_request_id: Optional[int] = None
    created_at: datetime
    deadline_date: Optional[datetime] = None

    # Matching Details
    matching_product_name: str
    matching_category: str
    supplier_catalog_item_id: Optional[int] = None
    supplier_catalog_item_name: Optional[str] = None

    # Commercial & Specs
    requested_quantity: int
    requested_unit: str = "pieces"
    target_budget: Optional[float] = None
    target_currency: str = "USD"
    specifications: SpecificationDetails = SpecificationDetails()

    # Scoring & Explanations
    match_score: float = Field(..., description="Explainable relevance score 0-100")
    match_level: str = Field(..., description="EXCEPTIONAL_MATCH, STRONG_MATCH, MODERATE_MATCH, PARTIAL_MATCH")
    match_reasons: List[str] = []
    match_summary: str

    # Score breakdown
    score_breakdown: Dict[str, float] = {}

    # Invitation & Response state
    is_invited: bool = False
    invitation_status: Optional[str] = None  # INVITED, ACCEPTED, DECLINED, QUOTED

    model_config = ConfigDict(from_attributes=True)


class RelevantSupplierMatch(BaseModel):
    id: str  # Composite ID e.g. "rs-supp-3-prod-2"
    supplier_id: int
    supplier_name: str
    supplier_slug: str
    supplier_country: str
    supplier_city: str
    supplier_email: str
    supplier_rating: float = 4.5
    is_verified: bool = True
    verification_status: str = "APPROVED"

    # Product Details
    catalog_item_id: int
    matching_product_name: str
    part_number: Optional[str] = None
    category: str
    description: Optional[str] = None
    specifications: str = ""
    material: Optional[str] = None
    unit_price: float
    currency: str = "USD"
    moq: int = 50
    lead_time_days: int = 14
    available_quantity: int = 1000
    certifications: List[str] = []
    image_url: Optional[str] = None

    # Buyer Sourcing Reference
    buyer_rfq_id: Optional[int] = None
    buyer_rfq_code: Optional[str] = None
    buyer_sourcing_title: Optional[str] = None

    # Scoring & Explanations
    match_score: float = Field(..., description="Explainable relevance score 0-100")
    match_level: str = Field(..., description="EXCEPTIONAL_MATCH, STRONG_MATCH, MODERATE_MATCH, PARTIAL_MATCH")
    match_reasons: List[str] = []
    match_summary: str

    # Score breakdown
    score_breakdown: Dict[str, float] = {}

    # Status & availability
    in_stock: bool = True
    comparable_price: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class MatchingFilterOptions(BaseModel):
    categories: List[str] = []
    countries: List[str] = []
    statuses: List[str] = []
    certifications: List[str] = []
    min_quantity: int = 0
    max_quantity: int = 100000
