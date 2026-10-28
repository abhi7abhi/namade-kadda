from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class MetricCard(BaseModel):
    label: str
    value: Any
    unit: Optional[str] = None
    change_text: Optional[str] = None
    indicator: str = "REAL_DATA"  # REAL_DATA or DEMO_DATA


class StatusCount(BaseModel):
    name: str
    count: int
    fill: Optional[str] = None


class SupplierQuoteStat(BaseModel):
    supplier_name: str
    quote_count: int
    avg_amount: float


class SpendMonthStat(BaseModel):
    month: str
    amount: float


class LeadTimeStat(BaseModel):
    category: str
    avg_days: float


class RecentActivityItem(BaseModel):
    id: str
    type: str  # SOURCING, RFQ, QUOTATION, ORDER, AGENT
    title: str
    subtitle: str
    timestamp: str
    status: str
    badge_color: str


class LeakageItem(BaseModel):
    order_code: str
    item_name: str
    contracted_unit_price: float
    actual_unit_price: float
    variance_amount: float
    reason: str


class AgreementLeakageReport(BaseModel):
    total_leakage: float
    leakage_percent: float
    formula_definition: str
    items: List[LeakageItem]


class SupplierSpendReport(BaseModel):
    supplier_name: str
    country: str
    currency: str
    po_count: int
    total_po_amount: float
    committed_amount: float
    delivered_amount: float


class PRToPOCycleTimeReport(BaseModel):
    average_days: float
    median_days: float
    sample_records_count: int
    formula_definition: str


class SavingsOpportunityItem(BaseModel):
    opportunity_type: str  # COMPETITIVE_BIDDING, VOLUME_CONSOLIDATION, CORRIDOR_OPTIMIZATION
    title: str
    potential_savings: float
    baseline_reference: str
    confidence_level: str


class AnalyticsDashboardResponse(BaseModel):
    is_demo_data: bool = True
    total_sourcing_requests: int
    open_rfqs: int
    received_quotations: int
    active_orders: int
    total_spend: float
    total_suppliers: int
    rfqs_by_status: List[StatusCount]
    orders_by_status: List[StatusCount]
    quotations_by_supplier: List[SupplierQuoteStat]
    spend_by_month: List[SpendMonthStat]
    lead_time_by_category: List[LeadTimeStat]
    recent_activity: List[RecentActivityItem]
    pending_decisions: List[Dict[str, Any]]

    # Section 15 Required Specific Procurement Metrics:
    # A. PO Amount Breakdown
    po_total_value: float = 0.0
    po_committed_value: float = 0.0
    po_approved_value: float = 0.0
    po_draft_value: float = 0.0
    po_cancelled_value: float = 0.0

    # B. Received Amount (Goods Receipts vs Invoicing)
    received_goods_value: float = 0.0
    cash_settled_value: float = 0.0

    # C. Agreement Leakages
    agreement_leakages: Optional[AgreementLeakageReport] = None

    # D. Supplier Amount Distribution
    supplier_spend_breakdown: List[SupplierSpendReport] = []

    # E. Received Late %
    received_late_percent: float = 0.0
    on_time_deliveries_count: int = 0
    late_deliveries_count: int = 0

    # F. PR-to-PO Cycle Time
    pr_to_po_cycle_time: Optional[PRToPOCycleTimeReport] = None

    # G. Savings Opportunities
    savings_opportunities_total: float = 0.0
    savings_opportunities: List[SavingsOpportunityItem] = []

    # H. AP Overdue
    ap_overdue_status: str = "Invoice/payment data not configured"
    ap_overdue_amount: float = 0.0
    ap_overdue_note: str = "External ERP accounts payable settlement integration is simulated; no overdue balance."


class BuyerAnalyticsSuggestion(BaseModel):
    id: str
    name: str
    category: str  # "company", "product", "country"
    subtitle: str
    badge: Optional[str] = None
    count_hint: Optional[int] = None


class BuyerAnalyticsSuggestionsResponse(BaseModel):
    query: str
    total: int
    suggestions: List[BuyerAnalyticsSuggestion]


class DynamicChartSeries(BaseModel):
    key: str
    label: str
    color: str


class DynamicChartData(BaseModel):
    title: str
    subtitle: Optional[str] = None
    chart_type: str  # "bar", "line", "pie", "area"
    x_key: Optional[str] = "name"
    y_key: Optional[str] = "value"
    series: Optional[List[DynamicChartSeries]] = None
    data: List[Dict[str, Any]] = []


class DynamicSummaryCard(BaseModel):
    title: str
    value: str
    sub: Optional[str] = None
    color: str = "emerald"  # "emerald", "blue", "purple", "amber", "cyan"
    icon_key: Optional[str] = None
    href: Optional[str] = None


class BuyerSearchAnalyticsResponse(BaseModel):
    query: str
    selected_category: str  # "auto", "company", "product", "country"
    detected_category: str  # "company", "product", "country"
    entity_name: str
    entity_description: Optional[str] = None
    is_ambiguous: bool = False
    alternative_categories: List[str] = []
    matched_records_count: int = 0
    empty: bool = False
    empty_message: Optional[str] = None
    summary_cards: List[DynamicSummaryCard] = []
    charts: Dict[str, DynamicChartData] = {}
    data_tables: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}

