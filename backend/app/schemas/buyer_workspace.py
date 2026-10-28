from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.supplier import SupplierOut
from app.schemas.order import OrderOut, OrderItemOut, OrderStatusHistoryOut


class BuyerSummaryCard(BaseModel):
    title: str
    value: Any
    change: Optional[str] = None
    trend: Optional[str] = "neutral"  # up, down, neutral
    subtitle: Optional[str] = None
    icon: Optional[str] = None
    category: Optional[str] = None  # quotation, spending, order, rfq


class CountrySourcingStat(BaseModel):
    country: str
    supplier_count: int = 0
    quotations_count: int = 0
    completed_orders_count: int = 0
    active_orders_count: int = 0
    total_spend_usd: float = 0.0
    average_lead_time_days: int = 0
    primary_categories: List[str] = []


class BuyerDashboardKPIs(BaseModel):
    # Summary Cards
    total_rfqs: int = 0
    accepted_rfqs: int = 0
    pending_rfqs: int = 0
    quotations_received: int = 0
    active_orders: int = 0
    completed_orders: int = 0
    total_completed_purchase_value: float = 0.0
    total_committed_purchase_value: float = 0.0
    suppliers_engaged: int = 0

    # Section A: Business Activity
    rfqs_over_time: List[Dict[str, Any]] = []
    orders_by_status: List[Dict[str, Any]] = []
    purchasing_activity_over_time: List[Dict[str, Any]] = []
    spending_over_time: List[Dict[str, Any]] = []
    categories_sourced: List[Dict[str, Any]] = []

    # Section B: Country Business Analysis (Supplier Registered Country)
    country_sourcing_analysis: List[CountrySourcingStat] = []
    ranked_countries: List[Dict[str, Any]] = []


class ProductComparisonCountry(BaseModel):
    country: str
    quotation_count: int = 0
    lowest_unit_price: float = 0.0
    average_unit_price: float = 0.0
    highest_unit_price: float = 0.0
    available_qty: int = 0
    lead_time_days: int = 0


class ProductComparisonCompany(BaseModel):
    supplier_id: int
    supplier_name: str
    supplier_country: str
    quoted_unit_price: float
    currency: str = "USD"
    moq: int = 50
    available_quantity: int = 1000
    lead_time_days: int = 14
    validity_date: Optional[str] = None
    quotation_id: int
    quotation_code: str
    status: str = "SUBMITTED"
    last_updated: str


class CheapestSourcingCountry(BaseModel):
    cheapest_country: Optional[str] = None
    lowest_unit_price: Optional[float] = None
    currency: str = "USD"
    supplier_name: Optional[str] = None
    supplier_id: Optional[int] = None
    price_label: str = "Lowest Quoted Unit Price (Ex-Works / FOB)"
    landed_cost_notice: str = (
        "Unit price reflects manufacturer quote. Landed cost requires statutory destination freight, "
        "customs tariffs, and local GST/VAT unless expressly quoted as DDP."
    )
    savings_vs_average_pct: float = 0.0
    has_data: bool = False
    message: Optional[str] = None


class ProductPriceComparisonResponse(BaseModel):
    product_name: str
    available_products: List[str] = []
    countries: List[ProductComparisonCountry] = []
    companies: List[ProductComparisonCompany] = []
    cheapest_country_insight: CheapestSourcingCountry


class BuyerOrderNegotiationSummary(BaseModel):
    order_id: int
    order_code: str
    supplier_id: int
    supplier_name: str
    supplier_country: str
    supplier_email: str
    product_name: str
    quantity: int
    unit_price: float
    total_amount: float
    currency: str
    status: str  # ACTIVE, AWAITING_BUYER, AWAITING_SUPPLIER, AGREED, CLOSED
    delivery_status: str
    last_message: Optional[str] = None
    last_activity: Optional[str] = None
    unread_count: int = 0
    messages_count: int = 0


class ContactSupplierRequest(BaseModel):
    supplier_id: int
    product_name: Optional[str] = None
    quantity: Optional[int] = None
    message: str
    initial_price_offer: Optional[float] = None


class CreateBuyerRFQRequest(BaseModel):
    title: str
    category: Optional[str] = "Industrial Component"
    quantity: int
    unit: str = "pieces"
    target_budget: Optional[float] = None
    currency: str = "USD"
    destination_country: Optional[str] = "India"
    destination_city: Optional[str] = "Bangalore"
    required_delivery_date: Optional[str] = "Within 4 weeks"
    manufacturing_process: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    tolerances: Optional[str] = None
    required_certifications: Optional[str] = "ISO 9001:2015"
    deadline_days: int = 14
    notes: Optional[str] = None
    terms: Optional[str] = "Standard B2B Commercial Terms - DDP Destination"
    supplier_ids: List[int] = []


class BuyerRFQSupplierResponse(BaseModel):
    supplier_id: int
    supplier_name: str
    supplier_country: str
    supplier_rating: float = 4.5
    supplier_moq: int = 50
    status: str  # PENDING, ACCEPTED, DECLINED, QUOTED
    status_label: str  # "Pending", "Accepted", "Rejected", "Quotation Received"
    decline_reason: Optional[str] = None
    responded_at: Optional[str] = None
    quotation_id: Optional[int] = None
    quotation_code: Optional[str] = None
    unit_price: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = "USD"
    moq: Optional[int] = None
    lead_time_days: Optional[int] = None
    validity_date: Optional[str] = None
    quotation_status: Optional[str] = None


class BuyerRFQItem(BaseModel):
    id: int
    rfq_code: str
    sourcing_request_id: Optional[int] = None
    title: str
    product_name: str
    status: str
    issue_date: str
    deadline_date: Optional[str] = None
    requested_quantity: int
    unit: str = "pieces"
    target_budget: Optional[float] = None
    currency: str = "USD"
    destination_country: Optional[str] = None
    destination_city: Optional[str] = None
    required_delivery_date: Optional[str] = None
    specifications: Dict[str, Any] = {}
    terms: Optional[str] = None
    notes: Optional[str] = None
    supplier_responses: List[BuyerRFQSupplierResponse] = []
    quotations_count: int = 0
    invited_suppliers_count: int = 0
    accepted_count: int = 0
    rejected_count: int = 0
    pending_count: int = 0
    created_at: str


class InviteSuppliersRequest(BaseModel):
    supplier_ids: List[int]


class AcceptRFQQuotationResponse(BaseModel):
    success: bool
    message: str
    order_id: int
    order_code: str
    quotation_id: int
    rfq_id: int

