from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ComponentCatalogMatchOut(BaseModel):
    id: int
    name: str
    part_number: Optional[str] = None
    unit_price: float
    currency: str = "USD"
    moq: int
    lead_time_days: int
    in_stock: bool
    material: Optional[str] = None


class ComponentMatchSupplierOut(BaseModel):
    supplier_id: int
    name: str
    country: str
    city: str
    verification_status: str
    is_verified: bool
    rating: float
    moq: int
    lead_time_days: int
    price_rating: str = "$$"
    matching_products: List[ComponentCatalogMatchOut] = []


class ComponentItemOut(BaseModel):
    id: Optional[int] = None
    name: str
    category: str
    typical_purpose: str
    quantity: float = 1.0
    unit: str = "pcs"
    specification_details: Optional[str] = None
    verification_status: str = "VERIFIED"  # VERIFIED, CURATED_REFERENCE, AI_SUGGESTED
    source: str = "Namade Kadda Knowledge Base"
    product_model_applicability: Optional[str] = "Standard Industrial / Commercial Grade"
    estimated_cost_reference: Optional[float] = None
    cost_currency: str = "USD"
    subcomponents: List[str] = []
    supplier_matches: List[ComponentMatchSupplierOut] = []
    has_matching_suppliers: bool = False
    compatible_alternatives: List[str] = []
    compatibility_notes: Optional[str] = None
    configuration_scope: Optional[str] = "TOWER_AND_BUNDLE"


class ProductUsageOut(BaseModel):
    id: Optional[int] = None
    product_name: str
    product_category: str
    how_component_is_used: str
    other_key_components: List[str] = []
    quantity_per_product: float = 1.0
    unit: str = "pcs"
    verification_status: str = "VERIFIED"  # VERIFIED, CURATED_REFERENCE, AI_SUGGESTED
    source: str = "Namade Kadda Knowledge Base"
    supplier_matches: List[ComponentMatchSupplierOut] = []


class DisambiguationOption(BaseModel):
    label: str
    type: str  # PRODUCT, COMPONENT, RAW_MATERIAL
    query: str
    description: str


class ComponentIntelligenceSearchResponse(BaseModel):
    query: str
    resolved_query: str
    mode: str  # find_components, find_products, auto_detect
    detected_type: str  # PRODUCT, COMPONENT, RAW_MATERIAL, AMBIGUOUS, UNKNOWN
    item_name: str
    item_category: str
    overview: str
    is_ambiguous: bool = False
    disambiguation_options: List[DisambiguationOption] = []
    components: List[ComponentItemOut] = []
    products: List[ProductUsageOut] = []
    suggestions: List[str] = []
    total_results: int = 0
    active_configuration: Optional[str] = None
    configuration_types: List[str] = []
    compatibility_summary: Optional[str] = None


class ExportToBOMRequest(BaseModel):
    product_name: str
    description: Optional[str] = None
    components: List[Dict[str, Any]] = []


class ExportToBOMResponse(BaseModel):
    bom_project_id: int
    title: str
    items_count: int
    message: str


class CreateComponentSourcingRequest(BaseModel):
    component_name: str
    category: Optional[str] = None
    quantity: int = 500
    unit: str = "pcs"
    material: Optional[str] = None
    specifications: Optional[str] = None
    target_budget: Optional[float] = None
    currency: str = "USD"
    destination_country: str = "India"


class CreateComponentSourcingResponse(BaseModel):
    sourcing_request_id: int
    request_code: str
    title: str
    message: str


class SaveSearchRequest(BaseModel):
    query: str
    search_mode: str
    detected_type: Optional[str] = None
    result_count: int = 0
    notes: Optional[str] = None


class SavedSearchOut(BaseModel):
    id: int
    query: str
    search_mode: str
    detected_type: Optional[str] = None
    result_count: int
    created_at: str
