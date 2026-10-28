from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.document import CompanyDocumentOut


class CategoryCountItem(BaseModel):
    name: str
    count: int
    percentage: Optional[float] = None


class AdminRecentSubmission(BaseModel):
    user_id: int
    company_name: str
    email: str
    role: str
    country: str
    verification_status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime


class AdminRecentReview(BaseModel):
    user_id: int
    company_name: str
    email: str
    role: str
    decision: str  # APPROVED, REJECTED, MORE_INFO_REQUIRED
    reviewed_by: Optional[str] = None
    reviewed_at: datetime
    feedback: Optional[str] = None


class AdminDashboardAnalytics(BaseModel):
    total_companies: int
    pending_applications: int
    approved_companies: int
    rejected_applications: int
    suspended_companies: int
    active_buyers: int
    active_suppliers: int
    total_platform_gmv: float
    total_orders: int
    total_rfqs: int
    total_quotations: int
    total_products: int
    recently_submitted: List[AdminRecentSubmission] = []
    recently_reviewed: List[AdminRecentReview] = []
    companies_by_country: List[CategoryCountItem] = []
    companies_by_status: List[CategoryCountItem] = []
    companies_by_role: List[CategoryCountItem] = []


class CompanyApprovalRequestItem(BaseModel):
    user_id: int
    company_name: str
    email: str
    role: str  # BUYER or SUPPLIER
    country: str
    contact_phone: Optional[str] = None
    business_category: Optional[str] = None
    categories: List[str] = []
    products_sold: Optional[str] = None
    submission_date: Optional[datetime] = None
    created_at: datetime
    verification_status: str  # PENDING_REVIEW, MORE_INFO_REQUIRED, REJECTED, APPROVED
    rejection_reason: Optional[str] = None
    more_info_requested: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    documents: List[CompanyDocumentOut] = []
    documents_count: int = 0
    approved_documents_count: int = 0
    pending_documents_count: int = 0
    rejected_documents_count: int = 0


class CompanyDecisionRequest(BaseModel):
    action: str = Field(..., description="'APPROVE', 'REJECT', or 'REQUEST_INFO'")
    reason: Optional[str] = Field(None, description="Reason required if action is REJECT")
    instructions: Optional[str] = Field(None, description="Detailed instructions required if action is REQUEST_INFO")


class CompanyListItem(BaseModel):
    user_id: int
    supplier_id: Optional[int] = None
    company_name: str
    role: str
    email: str
    country: str
    contact_phone: Optional[str] = None
    registration_date: datetime
    verification_status: str
    account_status: str  # ACTIVE, SUSPENDED, REMOVED
    is_active: bool
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    removal_reason: Optional[str] = None
    products_count: int = 0
    rfqs_count: int = 0
    quotations_count: int = 0
    orders_count: int = 0
    total_revenue_or_spend: float = 0.0
    documents_count: int = 0


class CompanySuspendRequest(BaseModel):
    reason: Optional[str] = None


class CompanyRemoveRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Reason for removing/deactivating the company")


class CompanyReportSelectorItem(BaseModel):
    user_id: int
    supplier_id: Optional[int] = None
    company_name: str
    role: str
    email: str
    country: str
    verification_status: str
    orders_count: int = 0
    total_amount: float = 0.0


# Detailed Report Breakdown Sub-models
class TimeSeriesDataPoint(BaseModel):
    period: str  # e.g. "2026-01", "2026-02"
    count: int
    amount: float


class PartnerEngagementItem(BaseModel):
    partner_id: int
    partner_name: str
    partner_country: str
    quotations_count: int = 0
    orders_count: int = 0
    total_amount: float = 0.0


class ProductSalesItem(BaseModel):
    product_name: str
    category: str
    units_sold: int = 0
    orders_count: int = 0
    revenue: float = 0.0


class BuyerDetailedReport(BaseModel):
    rfqs_created: int
    supplier_responses: int
    negotiations_count: int
    orders_placed: int
    total_purchases_gmv: float
    completed_purchases_count: int
    cancelled_orders_count: int
    in_production_orders_count: int
    purchase_activity_over_time: List[TimeSeriesDataPoint] = []
    sourcing_categories_breakdown: List[CategoryCountItem] = []
    top_suppliers_engaged: List[PartnerEngagementItem] = []
    recent_rfqs: List[Dict[str, Any]] = []
    recent_orders: List[Dict[str, Any]] = []


class SupplierDetailedReport(BaseModel):
    products_listed: int
    incoming_rfqs: int
    rfq_response_rate: float
    quotations_submitted: int
    quotations_accepted: int
    quotation_acceptance_rate: float
    orders_received: int
    total_sales_revenue: float
    completed_sales_count: int
    on_time_delivery_rate: float
    sales_trend_over_time: List[TimeSeriesDataPoint] = []
    sales_by_product: List[ProductSalesItem] = []
    sales_by_country: List[CategoryCountItem] = []
    repeat_buyers: List[Dict[str, Any]] = []
    fulfilment_status_breakdown: List[CategoryCountItem] = []
    recent_orders: List[Dict[str, Any]] = []
    recent_quotations: List[Dict[str, Any]] = []


class CompanyDetailedReportResponse(BaseModel):
    company: CompanyListItem
    role: str
    generated_at: datetime
    buyer_report: Optional[BuyerDetailedReport] = None
    supplier_report: Optional[SupplierDetailedReport] = None
