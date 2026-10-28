from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.supplier import CatalogItemOut


class SupplierProfileUpdate(BaseModel):
    name: Optional[str] = None
    legal_business_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state_region: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    contact_email: Optional[str] = None
    years_of_operation: Optional[int] = None
    business_type: Optional[str] = None
    factory_location: Optional[str] = None
    export_countries: Optional[str] = None
    languages_supported: Optional[str] = None
    typical_lead_time_days: Optional[int] = None
    moq: Optional[int] = None
    production_capacity: Optional[str] = None
    manufacturing_capabilities: Optional[str] = None
    materials_supported: Optional[str] = None
    certifications: Optional[str] = None
    business_registration_number: Optional[str] = None


class SupplierVerificationRequest(BaseModel):
    business_registration_number: str
    tax_id_or_gst: Optional[str] = None
    certification_names: str
    supporting_document_reference: Optional[str] = "Uploaded verification package (VAT/GST + ISO 9001 Certificate PDF)"
    notes: Optional[str] = None


class SupplierProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    part_number: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    unit_price: float
    currency: str = "USD"
    moq: int = 50
    lead_time_days: int = 14
    material: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    manufacturing_process: Optional[str] = None
    origin_country: str = "India"
    available_quantity: int = 1000
    image_url: Optional[str] = None
    manufacturing_capability: Optional[str] = None
    customization_options: Optional[str] = None
    certifications: Optional[str] = None
    shipping_options: Optional[str] = "Air Cargo, Ocean Freight, Express Courier"
    supported_destinations: Optional[str] = "Global, United States, Germany, India, UAE, Japan"
    unit_of_measurement: str = "pieces"
    production_capacity: Optional[str] = "10,000 units / month"
    stock_status: str = "IN_STOCK"
    datasheet_url: Optional[str] = None
    technical_specifications: Optional[str] = None
    status: str = "PUBLISHED"  # DRAFT, PUBLISHED, UNPUBLISHED, ARCHIVED


class SupplierProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    part_number: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None
    material: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    manufacturing_process: Optional[str] = None
    origin_country: Optional[str] = None
    available_quantity: Optional[int] = None
    image_url: Optional[str] = None
    manufacturing_capability: Optional[str] = None
    customization_options: Optional[str] = None
    certifications: Optional[str] = None
    shipping_options: Optional[str] = None
    supported_destinations: Optional[str] = None
    unit_of_measurement: Optional[str] = None
    production_capacity: Optional[str] = None
    stock_status: Optional[str] = None
    datasheet_url: Optional[str] = None
    technical_specifications: Optional[str] = None
    status: Optional[str] = None


class SupplierProductListResponse(BaseModel):
    items: List[CatalogItemOut]
    total: int
    page: int
    size: int
    pages: int
    categories: List[str] = []
    statuses_count: Dict[str, int] = {}


class SupplierRFQActionRequest(BaseModel):
    action: str  # ACCEPT, DECLINE, CLARIFICATION
    reason: Optional[str] = None
    question: Optional[str] = None


class SupplierQuotationItemInput(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: int
    unit_price: float
    lead_time_days: int = 21


class SupplierQuotationCreateRequest(BaseModel):
    rfq_id: int
    unit_price: float
    currency: str = "USD"
    moq: int = 100
    lead_time_days: int = 21
    incoterms: str = "FOB"
    payment_terms: str = "Net 30, EXW Factory"
    estimated_shipping_cost: float = 0.00
    discounts: float = 0.00
    tax_amount: float = 0.00
    validity_date: Optional[datetime] = None
    warranty_info: str = "12 Months Manufacturer Warranty against material defects"
    packaging_details: str = "Export-grade wooden crate with VCI anti-corrosion wrap"
    technical_deviations: Optional[str] = None
    notes: Optional[str] = None
    items: List[SupplierQuotationItemInput] = []
    parent_quotation_id: Optional[int] = None


class SupplierNegotiationCreateRequest(BaseModel):
    rfq_id: Optional[int] = None
    order_id: Optional[int] = None
    quotation_id: Optional[int] = None
    message: str
    action_type: str = "MESSAGE"  # MESSAGE, PROPOSAL, COUNTER
    proposed_price: Optional[float] = None
    proposed_quantity: Optional[int] = None
    proposed_currency: Optional[str] = "USD"
    proposed_lead_time_days: Optional[int] = None
    proposed_delivery_date: Optional[datetime] = None
    proposed_payment_terms: Optional[str] = None
    proposed_moq: Optional[int] = None


class OrderProposalActionRequest(BaseModel):
    action: str  # ACCEPT, DECLINE, COUNTER
    reason: Optional[str] = None
    counter_price: Optional[float] = None
    counter_quantity: Optional[int] = None
    counter_lead_time_days: Optional[int] = None
    counter_delivery_date: Optional[datetime] = None
    counter_terms: Optional[str] = None
    message: Optional[str] = None


class OrderNegotiationSummaryOut(BaseModel):
    order_id: int
    order_code: str
    buyer_company: str
    buyer_name: str
    buyer_country: str
    product_name: str
    quantity: int
    unit_price: float
    total_amount: float
    currency: str
    status: str
    delivery_status: str
    last_message: Optional[str] = None
    last_activity: Optional[datetime] = None
    unread_count: int = 0
    messages_count: int = 0


class SupplierOrderStatusUpdateRequest(BaseModel):
    new_status: str  # CONFIRMED, PREPARING, IN_PRODUCTION, READY_FOR_DISPATCH, READY_TO_SHIP, DISPATCHED, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELIVERY_EXCEPTION, CANCELLED
    notes: Optional[str] = None
    production_notes: Optional[str] = None  # alias
    tracking_number: Optional[str] = None
    estimated_dispatch_date: Optional[str] = None
    expected_delivery_date: Optional[datetime] = None


class SupplierAIAssistantRequest(BaseModel):
    role: str = "WORKFLOW_COORDINATOR"  # RFQ_MATCHING, QUOTATION_BUILDER, PRODUCT_LISTING, MANUFACTURING_SPECS, NEGOTIATION_STRATEGY, WORKFLOW_COORDINATOR
    prompt: str
    rfq_id: Optional[int] = None
    quotation_id: Optional[int] = None
    product_id: Optional[int] = None


class SupplierAIAssistantResponse(BaseModel):
    role: str
    role_title: str
    reply: str
    suggested_actions: List[str] = []
    data_sources_used: List[str] = []
    assumptions_and_limitations: List[str] = []
    output_mode: str = "DEMO_AI"


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerReminderRequest(BaseModel):
    notes: Optional[str] = None


class NegotiationMessageOut(BaseModel):
    id: int
    rfq_id: Optional[int] = None
    quotation_id: Optional[int] = None
    supplier_id: int
    order_id: Optional[int] = None
    buyer_id: Optional[int] = None
    sender_role: str
    sender_name: str
    message: str
    action_type: str = "MESSAGE"
    proposed_price: Optional[float] = None
    proposed_quantity: Optional[int] = None
    proposed_currency: Optional[str] = "USD"
    proposed_lead_time_days: Optional[int] = None
    proposed_delivery_date: Optional[datetime] = None
    proposed_payment_terms: Optional[str] = None
    proposed_moq: Optional[int] = None
    status: str = "OPEN"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DiscoverBuyerOut(BaseModel):
    id: int
    company_name: str
    contact_name: str
    country: str
    city: Optional[str] = None
    industry: str
    is_verified: bool
    member_since: str
    active_rfqs_count: int
    total_sourcing_requests: int
    categories_of_interest: List[str] = []
    recent_rfqs: List[Dict[str, Any]] = []


class ContactBuyerRequest(BaseModel):
    buyer_id: int
    catalog_item_id: Optional[int] = None
    rfq_id: Optional[int] = None
    subject: str = "Product Introduction & Commercial Sourcing Capability"
    message: str
