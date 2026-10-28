/**
 * Namade Kadda Typed API Client
 * Connects Next.js frontend to FastAPI backend
 */

export function normalizeApiUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return "http://127.0.0.1:8000/api/v1";
  if (trimmed.endsWith("/api/v1")) return trimmed;
  if (trimmed.endsWith("/api")) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (envUrl) {
      try {
        const parsed = new URL(envUrl);
        // If configured as localhost or 127.0.0.1 or private LAN, match current browser hostname to avoid IPv4/IPv6 mismatches
        if (
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(parsed.hostname)
        ) {
          const currentHost = window.location.hostname || "localhost";
          const port = parsed.port || "8000";
          const pathname = (parsed.pathname || "/api/v1").replace(/\/+$/, "");
          const cleanPath = pathname === "" || pathname === "/" ? "/api/v1" : pathname;
          return `${parsed.protocol}//${currentHost}:${port}${cleanPath}`;
        }
        return normalizeApiUrl(envUrl);
      } catch {
        return normalizeApiUrl(envUrl);
      }
    }
    const host = window.location.hostname || "localhost";
    return `http://${host}:8000/api/v1`;
  }
  return normalizeApiUrl(envUrl || "http://127.0.0.1:8000/api/v1");
}

export const API_BASE = (
  typeof window !== "undefined"
    ? getApiBaseUrl()
    : normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1")
);

export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export interface CustomerInsightsSummary {
  total_customers: number;
  regular_count: number;
  at_risk_count: number;
  inactive_count: number;
  prospect_count: number;
  non_regular_count: number;
  total_historical_revenue: number;
  currency: string;
  retention_rate: number;
}

export interface CustomerRecord {
  company_name: string;
  country: string;
  business_category: string;
  buyer_user_id?: number | null;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  status: "REGULAR" | "AT_RISK" | "INACTIVE" | "PROSPECT";
  status_label: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  total_completed_orders: number;
  cancelled_orders_count: number;
  last_purchase_date: string | null;
  first_purchase_date: string | null;
  days_since_last_purchase: number | null;
  avg_interval_days: number | null;
  purchase_frequency_label: string;
  total_historical_spend: number;
  currency: string;
  distinct_products_count: number;
  most_frequent_product: string | null;
  products_summary: string[];
}

export interface CustomerInsightsResponse {
  summary: CustomerInsightsSummary;
  customers: CustomerRecord[];
  available_countries: string[];
  available_categories: string[];
  thresholds: {
    at_risk_threshold_days: number;
    inactive_threshold_days: number;
  };
  disclaimer: string;
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
  };
}

export interface CustomerProductItem {
  product_name: string;
  category: string;
  total_quantity: number;
  order_count: number;
  last_purchased_date: string | null;
  total_value: number;
  currency: string;
  unit_price_range: string;
  orders_breakdown: Array<{
    order_code: string;
    date: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: string;
  }>;
}

export interface CustomerDetailAnalyticsResponse {
  customer_summary: {
    company_name: string;
    country: string;
    business_category: string;
    buyer_user_id?: number | null;
    contact_name: string;
    contact_email: string;
    contact_phone?: string | null;
    status: "REGULAR" | "AT_RISK" | "INACTIVE" | "PROSPECT";
    status_label: string;
    status_explanation: string;
    risk_level: "LOW" | "MEDIUM" | "HIGH";
    total_completed_orders: number;
    cancelled_orders_count: number;
    distinct_products_count: number;
    last_purchase_date: string | null;
    first_purchase_date: string | null;
    days_since_last_purchase: number | null;
    avg_interval_days: number | null;
    expected_interval_days: number | null;
    total_historical_spend: number;
    currency: string;
    has_sufficient_history: boolean;
  };
  products_purchased: CustomerProductItem[];
  graphs: {
    activity_over_time: Array<{
      period: string;
      label: string;
      order_count: number;
      spend: number;
      currency: string;
    }>;
    products_breakdown: Array<{
      product_name: string;
      short_name: string;
      quantity: number;
      order_count: number;
      total_value: number;
    }>;
    category_distribution: Array<{
      category: string;
      order_count: number;
      total_quantity: number;
      total_value: number;
      percentage: number;
    }>;
    purchase_frequency: Array<{
      period: string;
      label: string;
      purchases_count: number;
      cumulative_orders: number;
    }>;
    historical_spending: Array<{
      period: string;
      label: string;
      spend: number;
      cumulative_spend: number;
      currency: string;
    }>;
    availability: {
      activity: boolean;
      products: boolean;
      categories: boolean;
      frequency: boolean;
      spending: boolean;
      insufficient_data_reason?: string | null;
    };
  };
  ai_recommendations: {
    retention_risk_level: string;
    status_label: string;
    facts: string[];
    suggestions: string[];
    disclaimer: string;
  };
  order_history: Array<{
    id: number;
    order_code: string;
    status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    created_at_formatted: string;
    expected_delivery_date?: string | null;
    tracking_number?: string | null;
    shipping_address?: string | null;
    items: Array<{
      item_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  }>;
  available_follow_up_actions: Array<{
    action_id: string;
    label: string;
    type: string;
    href?: string;
    target?: string;
  }>;
}

export interface HealthInfo {
  status: string;
  app_name: string;
  environment: string;
  database_connected: boolean;
  ai_mode: "LIVE" | "DEMO";
  llm_provider: string;
  is_demo_mode: boolean;
}

export interface SupplierCapability {
  id: number;
  category: string;
  process_type: string;
  materials?: string;
  certifications?: string;
}

export interface ProductSupplierInfo {
  id: number;
  name: string;
  country: string;
  city: string;
  verification_status: string;
  is_verified: boolean;
  rating: number;
  price_rating: string;
}

export interface Product {
  id: number;
  supplier_id: number;
  name: string;
  part_number?: string;
  sku?: string;
  category: string;
  subcategory?: string;
  description?: string;
  unit_price: number;
  currency: string;
  moq: number;
  lead_time_days: number;
  material?: string;
  material_grade?: string;
  dimensions?: string;
  weight?: string;
  manufacturing_process?: string;
  specifications?: string;
  origin_country: string;
  available_quantity: number;
  image_url?: string;
  manufacturing_capability?: string;
  in_stock: boolean;
  customization_options?: string;
  certifications?: string;
  shipping_options?: string;
  supported_destinations?: string;
  unit_of_measurement?: string;
  production_capacity?: string;
  stock_status?: string;
  datasheet_url?: string;
  technical_specifications?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
  supplier?: ProductSupplierInfo;
  is_demo_data: boolean;
}

export interface SupplierProductListResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
  categories: string[];
  statuses_count: Record<string, number>;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
  available_categories: string[];
  available_countries: string[];
  min_price: number;
  max_price: number;
}

export interface CatalogItem {
  id: number;
  name: string;
  part_number?: string;
  category: string;
  description?: string;
  unit_price: number;
  currency: string;
  moq: number;
  lead_time_days: number;
  material?: string;
  in_stock: boolean;
}

export interface Supplier {
  id: number;
  name: string;
  slug: string;
  description?: string;
  country: string;
  city: string;
  address?: string;
  website?: string;
  contact_email: string;
  phone?: string;
  moq: number;
  lead_time_days: number;
  price_rating: string;
  is_verified: boolean;
  verification_status: string;
  rating: number;
  created_at: string;
  legal_business_name?: string;
  factory_location?: string;
  export_countries?: string[];
  production_capacity?: string;
  materials_supported?: string[];
  certifications_held?: string[];
  verification_request_status?: string;
  profile_completeness?: number;
  capabilities: SupplierCapability[];
  catalog_items: CatalogItem[];
}

export interface SupplierListResponse {
  items: Supplier[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ParsedSpecificationField {
  field_name: string;
  value: any;
  confidence: number;
  requires_confirmation: boolean;
  source_snippet?: string;
}

export interface SourcingExtractionResult {
  title: string;
  category?: string;
  quantity?: number;
  unit: string;
  target_budget?: number;
  currency: string;
  destination_country?: string;
  destination_city?: string;
  required_delivery_date?: string;
  manufacturing_process?: string;
  material_grade?: string;
  dimensions?: string;
  tolerances?: string;
  required_certifications?: string;
  notes?: string;
  confidence_score: number;
  extracted_fields: ParsedSpecificationField[];
  missing_fields: string[];
  mode: string;
}

export interface SourcingRequest {
  id: number;
  request_code: string;
  title: string;
  raw_input: string;
  status: string;
  user_id?: number;
  category?: string;
  quantity?: number;
  unit: string;
  target_budget?: number;
  currency: string;
  destination_country?: string;
  destination_city?: string;
  required_delivery_date?: string;
  manufacturing_process?: string;
  material_grade?: string;
  dimensions?: string;
  tolerances?: string;
  required_certifications?: string;
  notes?: string;
  confidence_score: number;
  extraction_metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface RFQSupplier {
  id: number;
  rfq_id: number;
  supplier_id: number;
  status: string;
  invited_at: string;
  supplier?: Supplier;
}

export interface RFQ {
  id: number;
  rfq_code: string;
  sourcing_request_id: number;
  title: string;
  status: string;
  issue_date: string;
  deadline_date?: string;
  terms?: string;
  notes?: string;
  created_at: string;
  supplier_invitations: RFQSupplier[];
}

export interface QuotationItem {
  id: number;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  lead_time_days: number;
}

export interface Quotation {
  id: number;
  quote_code: string;
  rfq_id: number;
  supplier_id: number;
  total_amount: number;
  currency: string;
  unit_price: number;
  moq: number;
  lead_time_days: number;
  shipping_estimate: number;
  payment_terms: string;
  validity_date?: string;
  notes?: string;
  status: string;
  rejection_reason?: string;
  acceptance_reason?: string;
  comparison_score: number;
  score_breakdown?: string;
  missing_fields?: string;
  created_at: string;
  supplier?: Supplier;
  rfq?: any;
  revision_number?: number;
  incoterms?: string;
  estimated_shipping_cost?: number;
  warranty_info?: string;
  packaging_details?: string;
  technical_deviations?: string;
  items: QuotationItem[];
}

export interface QuotationComparisonItem {
  quotation_id: number;
  quote_code: string;
  supplier_name: string;
  supplier_country: string;
  total_amount: number;
  unit_price: number;
  lead_time_days: number;
  moq: number;
  shipping_estimate: number;
  payment_terms: string;
  comparison_score: number;
  rank: number;
  missing_fields: string[];
  score_details: Record<string, any>;
  recommendation_note: string;
}

export interface QuotationComparisonResponse {
  rfq_id: number;
  quotations: QuotationComparisonItem[];
  weights_applied: {
    price_weight: number;
    lead_time_weight: number;
    reliability_weight: number;
  };
  transparency_explanation: string;
  disclaimer: string;
}

export interface OrderItem {
  id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderStatusHistory {
  id: number;
  previous_status?: string;
  new_status: string;
  changed_by: string;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_code: string;
  sourcing_request_id?: number;
  quotation_id?: number;
  supplier_id: number;
  total_amount: number;
  currency: string;
  status: string;
  expected_delivery_date?: string;
  shipping_address?: string;
  tracking_number?: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  items: OrderItem[];
  history: OrderStatusHistory[];
  buyer_company_name?: string;
  buyer_country?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_id?: number;
}

export interface BOMItem {
  id: number;
  bom_project_id: number;
  part_name: string;
  description?: string;
  material?: string;
  dimensions?: string;
  quantity: number;
  unit: string;
  manufacturing_process?: string;
  estimated_unit_cost: number;
  total_cost: number;
  supplier_id?: number;
  specification_status: string;
  notes?: string;
  created_at: string;
}

export interface BOMProject {
  id: number;
  title: string;
  description?: string;
  sourcing_request_id?: number;
  currency: string;
  total_estimated_cost: number;
  status: string;
  created_at: string;
  items: BOMItem[];
}

export interface TradeDocumentRequirement {
  document_name: string;
  purpose: string;
  issuing_authority: string;
  mandatory: boolean;
}

export interface TradeEstimateResponse {
  id?: number;
  origin_country: string;
  destination_country: string;
  product_description: string;
  declared_value: number;
  currency: string;
  hs_code_candidate: string;
  estimated_duty_rate_percent: number;
  estimated_tax_rate_percent: number;
  cif_value: number;
  duty_estimate: number;
  tax_estimate: number;
  total_landed_estimate: number;
  compliance_checklist: TradeDocumentRequirement[];
  source_basis: string;
  disclaimer: string;
  is_simulated_estimate: boolean;
}

export interface AgentStepResult {
  agent_name: string;
  task: string;
  inputs_used: Record<string, any>;
  result: Record<string, any>;
  assumptions: string[];
  warnings: string[];
  mode: "LIVE" | "DEMO" | "ESTIMATE";
  human_approval_required: boolean;
  timestamp: string;
  execution_order: number;
}

export interface AgentRunOut {
  id: number;
  run_code: string;
  request_id?: number;
  prompt: string;
  provider: string;
  model: string;
  mode: "LIVE" | "DEMO";
  status: string;
  summary?: string;
  started_at: string;
  completed_at?: string;
  events: AgentStepResult[];
}

export interface ComponentCatalogMatch {
  id: number;
  name: string;
  part_number?: string;
  unit_price: number;
  currency: string;
  moq: number;
  lead_time_days: number;
  in_stock: boolean;
  material?: string;
}

export interface ComponentMatchSupplier {
  supplier_id: number;
  name: string;
  country: string;
  city: string;
  verification_status: string;
  is_verified: boolean;
  rating: number;
  moq: number;
  lead_time_days: number;
  price_rating: string;
  matching_products: ComponentCatalogMatch[];
}

export interface ComponentItem {
  id?: number;
  name: string;
  category: string;
  typical_purpose: string;
  quantity: number;
  unit: string;
  specification_details?: string;
  verification_status: "VERIFIED" | "CURATED_REFERENCE" | "AI_SUGGESTED" | string;
  source: string;
  product_model_applicability?: string;
  estimated_cost_reference?: number;
  cost_currency: string;
  subcomponents: string[];
  supplier_matches: ComponentMatchSupplier[];
  has_matching_suppliers: boolean;
  compatible_alternatives?: string[];
  compatibility_notes?: string;
  configuration_scope?: string;
}

export interface ProductUsage {
  id?: number;
  product_name: string;
  product_category: string;
  how_component_is_used: string;
  other_key_components: string[];
  quantity_per_product: number;
  unit: string;
  verification_status: "VERIFIED" | "CURATED_REFERENCE" | "AI_SUGGESTED" | string;
  source: string;
  supplier_matches: ComponentMatchSupplier[];
}

export interface DisambiguationOption {
  label: string;
  type: "PRODUCT" | "COMPONENT" | "RAW_MATERIAL" | string;
  query: string;
  description: string;
}

export interface ComponentIntelligenceSearchResponse {
  query: string;
  resolved_query: string;
  mode: "find_components" | "find_products" | "auto_detect" | string;
  detected_type: "PRODUCT" | "COMPONENT" | "RAW_MATERIAL" | "AMBIGUOUS" | "UNKNOWN" | string;
  item_name: string;
  item_category: string;
  overview: string;
  is_ambiguous: boolean;
  disambiguation_options: DisambiguationOption[];
  components: ComponentItem[];
  products: ProductUsage[];
  suggestions: string[];
  total_results: number;
  active_configuration?: string;
  configuration_types?: string[];
  compatibility_summary?: string;
}

export interface ExportToBOMRequest {
  product_name: string;
  description?: string;
  components: any[];
}

export interface ExportToBOMResponse {
  bom_project_id: number;
  title: string;
  items_count: number;
  message: string;
}

export interface CreateComponentSourcingRequest {
  component_name: string;
  category?: string;
  quantity: number;
  unit: string;
  material?: string;
  specifications?: string;
  target_budget?: number;
  currency?: string;
  destination_country?: string;
}

export interface CreateComponentSourcingResponse {
  sourcing_request_id: number;
  request_code: string;
  title: string;
  message: string;
}

export interface SavedComponentSearchItem {
  id: number;
  query: string;
  search_mode: string;
  detected_type?: string;
  result_count: number;
  created_at: string;
}

export interface LeakageItem {
  order_code: string;
  item_name: string;
  contracted_unit_price: number;
  actual_unit_price: number;
  variance_amount: number;
  reason: string;
}

export interface AgreementLeakageReport {
  total_leakage: number;
  leakage_percent: number;
  formula_definition: string;
  items: LeakageItem[];
}

export interface SupplierSpendReport {
  supplier_name: string;
  country: string;
  currency: string;
  po_count: number;
  total_po_amount: number;
  committed_amount: number;
  delivered_amount: number;
}

export interface PRToPOCycleTimeReport {
  average_days: number;
  median_days: number;
  sample_records_count: number;
  formula_definition: string;
}

export interface SavingsOpportunityItem {
  opportunity_type: string;
  title: string;
  potential_savings: number;
  baseline_reference: string;
  confidence_level: string;
}

export interface AnalyticsDashboardResponse {
  is_demo_data: boolean;
  total_sourcing_requests: number;
  open_rfqs: number;
  received_quotations: number;
  active_orders: number;
  total_spend: number;
  total_suppliers: number;
  rfqs_by_status: { name: string; count: number; fill?: string }[];
  orders_by_status: { name: string; count: number; fill?: string }[];
  quotations_by_supplier: { supplier_name: string; quote_count: number; avg_amount: number }[];
  spend_by_month: { month: string; amount: number }[];
  lead_time_by_category: { category: string; avg_days: number }[];
  recent_activity: {
    id: string;
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
    status: string;
    badge_color: string;
  }[];
  pending_decisions: any[];

  // Section 15 Core Metrics
  po_total_value?: number;
  po_committed_value?: number;
  po_approved_value?: number;
  po_draft_value?: number;
  po_cancelled_value?: number;
  received_goods_value?: number;
  cash_settled_value?: number;
  agreement_leakages?: AgreementLeakageReport;
  supplier_spend_breakdown?: SupplierSpendReport[];
  received_late_percent?: number;
  on_time_deliveries_count?: number;
  late_deliveries_count?: number;
  pr_to_po_cycle_time?: PRToPOCycleTimeReport;
  savings_opportunities_total?: number;
  savings_opportunities?: SavingsOpportunityItem[];
  ap_overdue_status?: string;
  ap_overdue_amount?: number;
  ap_overdue_note?: string;
}

export interface BuyerAnalyticsSuggestion {
  id: string;
  name: string;
  category: "company" | "product" | "country";
  subtitle: string;
  badge?: string;
  count_hint?: number;
}

export interface BuyerAnalyticsSuggestionsResponse {
  query: string;
  total: number;
  suggestions: BuyerAnalyticsSuggestion[];
}

export interface DynamicChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface DynamicChartData {
  title: string;
  subtitle?: string;
  chart_type: "bar" | "line" | "pie" | "area";
  x_key?: string;
  y_key?: string;
  series?: DynamicChartSeries[];
  data: any[];
}

export interface DynamicSummaryCard {
  title: string;
  value: string;
  sub?: string;
  color: "emerald" | "blue" | "purple" | "amber" | "cyan";
  icon_key?: string;
  href?: string;
}

export interface BuyerSearchAnalyticsResponse {
  query: string;
  selected_category: "auto" | "company" | "product" | "country";
  detected_category: "company" | "product" | "country";
  entity_name: string;
  entity_description?: string;
  is_ambiguous: boolean;
  alternative_categories: string[];
  matched_records_count: number;
  empty: boolean;
  empty_message?: string;
  summary_cards: DynamicSummaryCard[];
  charts: Record<string, DynamicChartData>;
  data_tables: {
    suppliers?: any[];
    catalog_items?: any[];
    capabilities?: any[];
    components?: any[];
    rfqs?: any[];
    orders?: any[];
  };
  metadata: Record<string, any>;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: "BUYER" | "SUPPLIER" | "ADMIN";
  admin_id?: string;
  company_name?: string;
  country?: string;
  business_category?: string;
  sourcing_categories?: string;
  contact_phone?: string;
  supplier_id?: number;
  verification_status: string;
  verification_rejection_reason?: string;
  verification_submitted_at?: string;
  verification_reviewed_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  redirect_url?: string;
}

export interface CompanyDocument {
  id: number;
  user_id: number;
  supplier_id?: number;
  document_type: string;
  document_title: string;
  description?: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  download_url?: string;
}

export interface AdminDocumentItem extends CompanyDocument {
  user_email: string;
  company_name?: string;
  role: string;
  country?: string;
}

export interface CompanyVerificationStatus {
  user_id: number;
  company_name?: string;
  role: string;
  verification_status: "NOT_SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVE";
  rejection_reason?: string;
  submitted_at?: string;
  reviewed_at?: string;
  documents: CompanyDocument[];
  documents_count: number;
  approved_documents_count: number;
  rejected_documents_count: number;
  pending_documents_count: number;
}

export interface AdminMetrics {
  total_users: number;
  total_buyers: number;
  total_suppliers: number;
  verified_suppliers: number;
  pending_suppliers: number;
  total_sourcing_requests: number;
  total_rfqs: number;
  total_quotations: number;
  total_orders: number;
  total_platform_gmv: number;
}

export interface AuditLogItem {
  id: number;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: string;
  user_email?: string;
  created_at: string;
}

// Seller Workspace Interfaces
export interface SupplierDashboardData {
  supplier_name: string;
  verification_status: string;
  is_verified: boolean;
  profile_completeness: number;
  kpis: {
    listed_products: number;
    incoming_rfqs: number;
    quotations_submitted: number;
    pending_buyer_decisions: number;
    active_orders: number;
    total_quoted_value: number;
    accepted_order_value: number;
    delivered_sales_value: number;
    orders_awaiting_dispatch: number;
    payment_records_status: string;
  };
  new_buyer_requirements: {
    id: number;
    rfq_code: string;
    title: string;
    category: string;
    quantity: string;
    target_budget: string;
    destination: string;
    deadline: string;
    invitation_status: string;
  }[];
  pending_quotations: {
    id: number;
    quote_code: string;
    rfq_code: string;
    total_amount: number;
    currency: string;
    unit_price: number;
    lead_time_days: number;
    status: string;
    created_at: string;
  }[];
  active_orders: {
    id: number;
    order_code: string;
    total_amount: number;
    currency: string;
    status: string;
    shipping_address: string;
    expected_delivery_date: string;
    tracking_number?: string;
  }[];
  sales_trend: {
    month: string;
    quoted: number;
    accepted: number;
  }[];
  product_performance: {
    id: number;
    name: string;
    sku: string;
    unit_price: number;
    moq: number;
    rfq_inquiries: number;
    quotations_generated: number;
    orders_fulfilled: number;
  }[];
  recent_activity: {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    status: string;
  }[];
}

export interface SupplierRFQItem {
  rfq_id: number;
  rfq_code: string;
  title: string;
  buyer_company: string;
  category: string;
  quantity: number;
  unit: string;
  material: string;
  specifications: string;
  destination_country: string;
  destination_city: string;
  required_delivery_date: string;
  target_budget?: number;
  currency: string;
  requested_certifications: string;
  request_date: string;
  deadline_date: string;
  invitation_status: string;
  decline_reason?: string;
  has_submitted_quote: boolean;
  quote_code?: string;
  quote_id?: number;
}

export interface SupplierRFQDetail {
  rfq_id: number;
  rfq_code: string;
  title: string;
  terms: string;
  notes?: string;
  buyer_company: string;
  category: string;
  quantity: number;
  unit: string;
  target_budget?: number;
  currency: string;
  destination_country: string;
  destination_city: string;
  required_delivery_date?: string;
  manufacturing_process: string;
  material_grade: string;
  dimensions?: string;
  tolerances?: string;
  required_certifications?: string;
  status: string;
  decline_reason?: string;
  clarifications: {
    id: string;
    question: string;
    submitted_at: string;
    status: string;
  }[];
  issue_date: string;
  deadline_date: string;
  seller_quote?: {
    id: number;
    quote_code: string;
    total_amount: number;
    unit_price: number;
    status: string;
  };
}

export interface NegotiationMessageItem {
  id: number;
  rfq_id?: number;
  quotation_id?: number;
  supplier_id: number;
  order_id?: number;
  buyer_id?: number;
  sender_role: string;
  sender_name: string;
  message: string;
  action_type?: string;
  proposed_price?: number;
  proposed_quantity?: number;
  proposed_currency?: string;
  proposed_lead_time_days?: number;
  proposed_delivery_date?: string;
  proposed_payment_terms?: string;
  proposed_moq?: number;
  status: string;
  created_at: string;
}

export interface OrderNegotiationSummary {
  order_id: number;
  order_code: string;
  buyer_company: string;
  buyer_name: string;
  buyer_country: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  status: string;
  delivery_status: string;
  last_message: string;
  last_activity: string;
  unread_count: number;
  messages_count: number;
}

export interface OrderNegotiationDetailResponse {
  order: {
    id: number;
    order_code: string;
    buyer_company: string;
    buyer_name: string;
    buyer_country: string;
    buyer_email?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    currency: string;
    status: string;
    expected_delivery_date?: string;
    shipping_address?: string;
    tracking_number?: string;
    notes?: string;
  };
  messages: NegotiationMessageItem[];
}

export interface SupplierDashboardAnalyticsResponse {
  kpis: {
    total_completed_orders: number;
    active_orders: number;
    total_sales_revenue: number;
    unique_buyers: number;
    active_products: number;
    pending_rfqs: number;
    quotations_awaiting_decision: number;
    orders_awaiting_fulfilment: number;
  };
  graphs: {
    business_by_country: Array<{ country: string; order_count: number; total_spend: number }>;
    best_selling_products: Array<{ name: string; quantity_sold: number; revenue: number }>;
    regular_buyers: Array<{ company_name: string; country: string; completed_orders: number; total_orders: number; total_spend: number }>;
    sales_over_time: Array<{ period: string; revenue: number; order_count: number; units_sold: number }>;
    order_status_distribution: Array<{ status: string; count: number; percentage: number }>;
  };
  filters: {
    available_countries: string[];
    available_buyers: string[];
    available_products: string[];
    available_statuses: string[];
    active: {
      date_range: string;
      country?: string;
      product?: string;
      buyer?: string;
      status?: string;
    };
  };
}

export interface DiscoverBuyerItem {
  id: number;
  company_name: string;
  contact_name: string;
  country: string;
  city?: string;
  industry: string;
  is_verified: boolean;
  member_since: string;
  active_rfqs_count: number;
  total_sourcing_requests: number;
  categories_of_interest: string[];
  recent_rfqs: Array<{
    id: number;
    rfq_code: string;
    title: string;
    category: string;
    quantity: string;
  }>;
}

export interface SupplierAnalyticsData {
  total_quoted_value: number;
  accepted_order_value: number;
  delivered_sales_value: number;
  payments_received_status: string;
  payments_received_amount: number;
  incoming_rfqs_count: number;
  rfq_status_counts: Record<string, number>;
  quotation_acceptance_rate: number;
  average_response_time_hours: number;
  on_time_delivery_rate: number;
  product_performance: {
    product_name: string;
    category: string;
    views: number;
    rfqs_received: number;
    quotes_sent: number;
    orders_converted: number;
    conversion_rate: string;
  }[];
  revenue_by_country: Record<string, number>;
  pending_fulfilment_count: number;
  sales_trend: {
    month: string;
    quoted_value: number;
    accepted_value: number;
    delivered_value: number;
  }[];
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface SupplierAIAssistantResult {
  role: string;
  role_title: string;
  reply: string;
  suggested_actions: string[];
  data_sources_used: string[];
  assumptions_and_limitations: string[];
  output_mode: string;
}

// Fetch wrapper with enhanced error diagnostics
async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);
  let res: Response;

  const method = (options?.method || "GET").toUpperCase();
  const defaultHeaders: Record<string, string> = {};
  if (options?.body || method === "POST" || method === "PUT" || method === "PATCH") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  let authHeader: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem("nk_auth_token");
      if (token) {
        authHeader = { Authorization: `Bearer ${token}` };
      }
    } catch {
      // ignore storage access error
    }
  }

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...authHeader,
        ...(options?.headers || {})
      }
    });
  } catch (networkError: any) {
    const errorMsg = `Unable to connect to backend at ${url}. ` +
      `Please ensure the FastAPI backend is running (python -m uvicorn app.main:app --port 8000) and reachable from your browser. ` +
      `(${networkError?.message || "Failed to fetch"})`;
    console.warn(`[API Connection Error] ${endpoint}:`, networkError?.message || networkError);
    throw new Error(errorMsg);
  }

  if (!res.ok) {
    let errDetail = "";
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const errorData = await res.json();
        errDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
      } else {
        errDetail = await res.text();
      }
    } catch {
      errDetail = res.statusText || `HTTP ${res.status}`;
    }

    let statusSpecific = "";
    switch (res.status) {
      case 400:
        statusSpecific = `Bad Request (400): ${errDetail}`;
        break;
      case 401:
        statusSpecific = `Authentication Required (401): ${errDetail || "Session expired or invalid credentials. Please log in."}`;
        break;
      case 403:
        statusSpecific = `Access Denied (403): ${errDetail || "Insufficient permissions for this action."}`;
        break;
      case 404:
        statusSpecific = `Endpoint Not Found (404): ${url} was not found on backend.`;
        break;
      case 422:
        statusSpecific = `Validation Error (422): ${errDetail || "Request input parameters failed validation."}`;
        break;
      case 500:
        statusSpecific = `Backend Internal Error (500) on ${endpoint}: ${errDetail || "An unexpected error occurred in backend services."}`;
        break;
      default:
        statusSpecific = `API Error ${res.status} on ${endpoint}: ${errDetail || res.statusText}`;
    }

    console.warn(`[API HTTP ${res.status}] ${endpoint}:`, statusSpecific);
    throw new Error(statusSpecific);
  }

  // Handle 204 No Content or empty responses safely
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return {} as T;
  }

  try {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    const textData = await res.text();
    try {
      return JSON.parse(textData);
    } catch {
      return textData as unknown as T;
    }
  } catch (parseError: any) {
    console.error(`[API Parse Error] ${endpoint}:`, parseError);
    throw new Error(`Failed to parse backend response from ${endpoint}: ${parseError?.message}`);
  }
}

export const api = {
  // Health
  getHealth: () => fetchJson<HealthInfo>("/health"),

  // Analytics
  getAnalytics: () => fetchJson<AnalyticsDashboardResponse>("/analytics/dashboard"),
  getBuyerAnalyticsSuggestions: (q: string, category: string = "auto") => {
    const params = new URLSearchParams({ q, category });
    return fetchJson<BuyerAnalyticsSuggestionsResponse>(`/analytics/buyer/suggestions?${params.toString()}`);
  },
  searchBuyerAnalytics: (q: string, category: string = "auto") => {
    const params = new URLSearchParams({ q, category });
    return fetchJson<BuyerSearchAnalyticsResponse>(`/analytics/buyer/search?${params.toString()}`);
  },

  // Suppliers
  getSuppliers: (params?: {
    search?: string;
    country?: string;
    category?: string;
    max_moq?: number;
    max_lead_time?: number;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.country) q.append("country", params.country);
    if (params?.category) q.append("category", params.category);
    if (params?.max_moq) q.append("max_moq", params.max_moq.toString());
    if (params?.max_lead_time) q.append("max_lead_time", params.max_lead_time.toString());
    if (params?.page) q.append("page", params.page.toString());
    if (params?.size) q.append("size", params.size.toString());
    return fetchJson<SupplierListResponse>(`/suppliers?${q.toString()}`);
  },
  getSupplier: (id: number) => fetchJson<Supplier>(`/suppliers/${id}`),

  // Sourcing
  parseRequirement: (raw_input: string) =>
    fetchJson<SourcingExtractionResult>("/sourcing/parse", {
      method: "POST",
      body: JSON.stringify({ raw_input })
    }),
  createSourcingRequest: (data: Partial<SourcingRequest>) =>
    fetchJson<SourcingRequest>("/sourcing", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getSourcingRequests: () => fetchJson<{ items: SourcingRequest[]; total: number }>("/sourcing"),
  getSourcingRequest: (id: number) => fetchJson<SourcingRequest>(`/sourcing/${id}`),

  // RFQs
  getRFQs: () => fetchJson<RFQ[]>("/rfqs"),
  getRFQ: (id: number) => fetchJson<RFQ>(`/rfqs/${id}`),
  createRFQ: (data: { sourcing_request_id: number; title: string; supplier_ids: number[]; terms?: string; notes?: string }) =>
    fetchJson<RFQ>("/rfqs", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // Quotations
  createQuotation: (data: any) =>
    fetchJson<Quotation>("/quotations", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  compareQuotations: (rfq_id: number, weights?: { price_weight: number; lead_time_weight: number; reliability_weight: number }) =>
    fetchJson<QuotationComparisonResponse>(`/quotations/compare/${rfq_id}`, {
      method: "POST",
      body: JSON.stringify(weights || { price_weight: 0.5, lead_time_weight: 0.3, reliability_weight: 0.2 })
    }),
  acceptQuotation: (id: number, acceptance_reason: string, generate_order: boolean = true) =>
    fetchJson<Quotation>(`/quotations/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({ acceptance_reason, generate_order })
    }),
  rejectQuotation: (id: number, rejection_reason: string) =>
    fetchJson<Quotation>(`/quotations/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason })
    }),

  // Orders
  getOrders: () => fetchJson<Order[]>("/orders"),
  getOrder: (id: number) => fetchJson<Order>(`/orders/${id}`),
  updateOrderStatus: (id: number, new_status: string, notes?: string, changed_by?: string) =>
    fetchJson<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ new_status, notes, changed_by: changed_by || "Procurement Manager" })
    }),

  // BOM
  getBOMProjects: () => fetchJson<BOMProject[]>("/bom/projects"),
  getBOMProject: (id: number) => fetchJson<BOMProject>(`/bom/projects/${id}`),
  createBOMProject: (data: any) =>
    fetchJson<BOMProject>("/bom/projects", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  generateDraftBOM: (data: { sourcing_request_id?: number; title?: string }) =>
    fetchJson<BOMProject>("/bom/projects/generate", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  addBOMItem: (projectId: number, item: any) =>
    fetchJson<BOMItem>(`/bom/projects/${projectId}/items`, {
      method: "POST",
      body: JSON.stringify(item)
    }),
  deleteBOMItem: (itemId: number) =>
    fetchJson<{ message: string }>(`/bom/items/${itemId}`, {
      method: "DELETE"
    }),
  getBOMCsvExportUrl: (projectId: number) => buildApiUrl(`/bom/projects/${projectId}/export-csv`),

  // Trade
  calculateTradeEstimate: (data: {
    origin_country: string;
    destination_country: string;
    product_description: string;
    declared_value: number;
    currency?: string;
    freight_insurance_estimate?: number;
    sourcing_request_id?: number;
  }) =>
    fetchJson<TradeEstimateResponse>("/trade/estimate", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // Agents
  runAgentWorkflow: (data: { prompt: string; sourcing_request_id?: number; force_demo_mode?: boolean }) =>
    fetchJson<AgentRunOut>("/agents/run", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getAgentRun: (id: number) => fetchJson<AgentRunOut>(`/agents/runs/${id}`),
  getAgentRunHistory: () => fetchJson<any[]>("/agents/history"),

  // Authentication
  login: (data: { email?: string; admin_id?: string; password: string; role?: string; remember_me?: boolean }) =>
    fetchJson<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  adminLogin: (data: { admin_id: string; password: string }) =>
    fetchJson<AuthResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  registerBuyer: (data: {
    full_name?: string;
    email: string;
    password: string;
    confirm_password?: string;
    company_name: string;
    country?: string;
    business_category?: string;
    sourcing_categories?: string[] | string;
    contact_phone?: string;
  }) =>
    fetchJson<AuthResponse>("/auth/register/buyer", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  registerSupplier: (data: {
    full_name?: string;
    email: string;
    password: string;
    confirm_password?: string;
    company_name: string;
    country?: string;
    products_sold?: string;
    product_categories?: string[] | string;
    manufacturing_capabilities?: string;
    contact_phone: string;
  }) =>
    fetchJson<AuthResponse>("/auth/register/supplier", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getCurrentUser: () => fetchJson<User>("/auth/me"),

  // Company Verification Documents
  uploadCompanyDocument: async (formData: FormData): Promise<CompanyDocument> => {
    let token: string | null = null;
    if (typeof window !== "undefined") {
      try {
        token = localStorage.getItem("nk_auth_token");
      } catch {}
    }
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const url = buildApiUrl("/auth/documents/upload");
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData
    });
    if (!res.ok) {
      let errorMsg = `Server error ${res.status}`;
      try {
        const errJson = await res.json();
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }
    return await res.json();
  },
  getCompanyDocuments: () => fetchJson<CompanyDocument[]>("/auth/documents"),
  deleteCompanyDocument: (id: number) =>
    fetchJson<{ success: boolean; message: string }>(`/auth/documents/${id}`, {
      method: "DELETE"
    }),
  submitCompanyDocuments: () =>
    fetchJson<CompanyVerificationStatus>("/auth/documents/submit", {
      method: "POST"
    }),
  getCompanyVerificationStatus: () =>
    fetchJson<CompanyVerificationStatus>("/auth/verification-status"),
  getDocumentDownloadUrl: (docId: number) => buildApiUrl(`/auth/documents/${docId}/download`),
  logout: async (tokenToRevoke?: string | null): Promise<{ success: boolean; message: string }> => {
    let token = tokenToRevoke;
    if (!token && typeof window !== "undefined") {
      try {
        token = localStorage.getItem("nk_auth_token");
      } catch {}
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Fast and resilient: AbortController with 1500ms timeout so logout never hangs on slow network
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
      const url = buildApiUrl("/auth/logout");
      const res = await fetch(url, {
        method: "POST",
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        return { success: false, message: `Server returned status ${res.status}` };
      }
      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      return { success: false, message: err?.message || "Network timeout" };
    }
  },
  forgotPassword: (email: string) =>
    fetchJson<{ message: string; is_simulated: boolean; dev_note: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }),

  // Quotation Listing & Supplier Submission
  getQuotations: (params?: { rfq_id?: number; supplier_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.rfq_id) q.append("rfq_id", params.rfq_id.toString());
    if (params?.supplier_id) q.append("supplier_id", params.supplier_id.toString());
    return fetchJson<Quotation[]>(`/quotations?${q.toString()}`);
  },

  // Administrator Operations
  getAdminMetrics: () => fetchJson<AdminMetrics>("/admin/metrics"),
  getAdminUsers: (role?: string) => {
    const q = role ? `?role=${role}` : "";
    return fetchJson<User[]>(`/admin/users${q}`);
  },
  updateUserStatus: (userId: number, isActive: boolean) =>
    fetchJson<User>(`/admin/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active: isActive })
    }),
  getAdminSuppliersReview: () => fetchJson<Supplier[]>("/admin/suppliers/review-queue"),
  verifySupplier: (supplierId: number, action: "APPROVE" | "REJECT", rejectionReason?: string) =>
    fetchJson<Supplier>(`/admin/suppliers/${supplierId}/verify`, {
      method: "PUT",
      body: JSON.stringify({ action, rejection_reason: rejectionReason })
    }),
  getAdminAuditLogs: (limit: number = 50) => fetchJson<AuditLogItem[]>(`/admin/audit-logs?limit=${limit}`),
  getAdminDocuments: (status?: string, role?: string) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (role) params.append("role", role);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetchJson<AdminDocumentItem[]>(`/admin/documents${qs}`);
  },
  reviewAdminDocument: (documentId: number, action: "APPROVE" | "REJECT", rejectionReason?: string) =>
    fetchJson<CompanyDocument>(`/admin/documents/${documentId}/review`, {
      method: "POST",
      body: JSON.stringify({ action, rejection_reason: rejectionReason })
    }),
  verifyAdminCompany: (userId: number, action: "APPROVE" | "REJECT", rejectionReason?: string) =>
    fetchJson<{ success: boolean; message: string; user_id: number; verification_status: string }>(`/admin/companies/${userId}/verify`, {
      method: "POST",
      body: JSON.stringify({ action, rejection_reason: rejectionReason })
    }),

  // Products Marketplace
  getProducts: (params?: {
    search?: string;
    category?: string;
    origin_country?: string;
    supplier_country?: string;
    min_price?: number;
    max_price?: number;
    max_moq?: number;
    max_lead_time?: number;
    manufacturing_capability?: string;
    sort_by?: string;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.category && params.category !== "All") q.append("category", params.category);
    if (params?.origin_country && params.origin_country !== "All") q.append("origin_country", params.origin_country);
    if (params?.supplier_country && params.supplier_country !== "All") q.append("supplier_country", params.supplier_country);
    if (params?.min_price !== undefined) q.append("min_price", params.min_price.toString());
    if (params?.max_price !== undefined) q.append("max_price", params.max_price.toString());
    if (params?.max_moq !== undefined) q.append("max_moq", params.max_moq.toString());
    if (params?.max_lead_time !== undefined) q.append("max_lead_time", params.max_lead_time.toString());
    if (params?.manufacturing_capability && params.manufacturing_capability !== "All") q.append("manufacturing_capability", params.manufacturing_capability);
    if (params?.sort_by) q.append("sort_by", params.sort_by);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.size) q.append("size", params.size.toString());
    return fetchJson<ProductListResponse>(`/products?${q.toString()}`);
  },
  getProduct: (id: number) => fetchJson<Product>(`/products/${id}`),
  downloadTradePdf: async (data: any) => {
    const res = await fetch(buildApiUrl("/trade/pdf"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to generate PDF report");
    return res.blob();
  },

  // Seller & Manufacturer Workspace APIs
  getSupplierMe: () => fetchJson<Supplier>("/supplier/me"),
  updateSupplierProfile: (data: any) =>
    fetchJson<Supplier>("/supplier/profile", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  requestSupplierVerification: (data: any) =>
    fetchJson<{ status: string; message: string }>("/supplier/profile/request-verification", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getSupplierDashboard: () => fetchJson<SupplierDashboardData>("/supplier/dashboard"),
  getSupplierProducts: (params?: {
    search?: string;
    category?: string;
    status?: string;
    stock_status?: string;
    page?: number;
    size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.category) q.append("category", params.category);
    if (params?.status) q.append("status", params.status);
    if (params?.stock_status) q.append("stock_status", params.stock_status);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.size) q.append("size", params.size.toString());
    return fetchJson<SupplierProductListResponse>(`/supplier/products?${q.toString()}`);
  },
  getSupplierProductDetail: (id: number) => fetchJson<Product>(`/supplier/products/${id}`),
  createSupplierProduct: (data: any) =>
    fetchJson<Product>("/supplier/products", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  updateSupplierProduct: (id: number, data: any) =>
    fetchJson<Product>(`/supplier/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  publishSupplierProduct: (id: number) =>
    fetchJson<Product>(`/supplier/products/${id}/publish`, {
      method: "POST"
    }),
  unpublishSupplierProduct: (id: number) =>
    fetchJson<Product>(`/supplier/products/${id}/unpublish`, {
      method: "POST"
    }),
  archiveSupplierProduct: (id: number) =>
    fetchJson<Product>(`/supplier/products/${id}/archive`, {
      method: "POST"
    }),
  deleteSupplierProduct: (id: number) =>
    fetchJson<{ message: string; id: number }>(`/supplier/products/${id}`, {
      method: "DELETE"
    }),
  uploadSupplierProductFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("nk_auth_token") : null;
    const res = await fetch(buildApiUrl("/supplier/products/upload"), {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || "Failed to upload file");
    }
    return res.json() as Promise<{
      url: string;
      filename: string;
      size_bytes: number;
      file_type: "IMAGE" | "DOCUMENT";
      content_type: string;
    }>;
  },
  getSupplierRFQs: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return fetchJson<SupplierRFQItem[]>(`/supplier/rfqs${q}`);
  },
  getSupplierRFQDetail: (id: number) => fetchJson<SupplierRFQDetail>(`/supplier/rfqs/${id}`),
  actionSupplierRFQ: (id: number, data: { action: string; reason?: string; question?: string }) =>
    fetchJson<{ status: string; action: string; message: string }>(`/supplier/rfqs/${id}/action`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  acceptSupplierRFQ: (id: number) =>
    fetchJson<{ status: string; action: string; message: string }>(`/supplier/rfqs/${id}/accept`, {
      method: "POST"
    }),
  declineSupplierRFQ: (id: number, reason?: string) =>
    fetchJson<{ status: string; action: string; message: string }>(`/supplier/rfqs/${id}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason })
    }),
  getSupplierQuotations: () => fetchJson<Quotation[]>("/supplier/quotations"),
  createSupplierQuotation: (data: any) =>
    fetchJson<Quotation>("/supplier/quotations", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getSupplierNegotiations: (rfqId?: number) => {
    const q = rfqId ? `?rfq_id=${rfqId}` : "";
    return fetchJson<NegotiationMessageItem[]>(`/supplier/negotiations${q}`);
  },
  postSupplierNegotiation: (data: any) =>
    fetchJson<NegotiationMessageItem>("/supplier/negotiations", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  // Order-Based Buyer-Seller Negotiations
  getOrderNegotiations: () => fetchJson<OrderNegotiationSummary[]>("/supplier/negotiations/orders"),
  getOrderNegotiationDetail: (orderId: number) =>
    fetchJson<OrderNegotiationDetailResponse>(`/supplier/negotiations/orders/${orderId}`),
  postOrderNegotiationMessage: (orderId: number, data: { message: string; action_type?: string; proposed_price?: number; proposed_quantity?: number; proposed_currency?: string; proposed_lead_time_days?: number; proposed_delivery_date?: string; proposed_payment_terms?: string }) =>
    fetchJson<NegotiationMessageItem>(`/supplier/negotiations/orders/${orderId}/messages`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  actionOrderProposal: (orderId: number, messageId: number, data: { action: string; reason?: string; counter_price?: number; counter_quantity?: number; counter_lead_time_days?: number; counter_delivery_date?: string; counter_terms?: string; message?: string }) =>
    fetchJson<{ success: boolean; action: string; order_code: string; new_total: number }>(`/supplier/negotiations/orders/${orderId}/proposals/${messageId}/action`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getSupplierOrders: () => fetchJson<Order[]>("/supplier/orders"),
  getSupplierOrderDetail: (orderId: number) => fetchJson<Order>(`/supplier/orders/${orderId}`),
  updateSupplierOrderStatus: (orderId: number, data: { new_status: string; production_notes?: string; notes?: string; tracking_number?: string; expected_delivery_date?: string }) =>
    fetchJson<Order>(`/supplier/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  // Dynamic 5-Graph Supplier Dashboard Analytics with Filters
  getSupplierDashboardAnalytics: (params?: { date_range?: string; country?: string; product?: string; buyer?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.date_range) q.append("date_range", params.date_range);
    if (params?.country && params.country !== "ALL") q.append("country", params.country);
    if (params?.product && params.product !== "ALL") q.append("product", params.product);
    if (params?.buyer && params.buyer !== "ALL") q.append("buyer", params.buyer);
    if (params?.status && params.status !== "ALL") q.append("status", params.status);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<SupplierDashboardAnalyticsResponse>(`/supplier/dashboard/analytics${queryStr}`);
  },
  // Discover Buyers Directory & Direct Pitch
  getDiscoverBuyers: (params?: { search?: string; country?: string; industry?: string; activity_level?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.country && params.country !== "ALL") q.append("country", params.country);
    if (params?.industry && params.industry !== "ALL") q.append("industry", params.industry);
    if (params?.activity_level && params.activity_level !== "ALL") q.append("activity_level", params.activity_level);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<DiscoverBuyerItem[]>(`/supplier/buyers${queryStr}`);
  },
  contactBuyer: (data: { buyer_id: number; catalog_item_id?: number; rfq_id?: number; subject: string; message: string }) =>
    fetchJson<{ success: boolean; message_id: number; buyer_company: string; subject: string; created_at: string }>("/supplier/buyers/contact", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  askSellerAIAssistant: (data: { role: string; prompt: string; rfq_id?: number; quotation_id?: number; product_id?: number }) =>
    fetchJson<SupplierAIAssistantResult>("/supplier/ai-assistant", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getSupplierAnalytics: () => fetchJson<SupplierAnalyticsData>("/supplier/analytics"),
  downloadSupplierAnalyticsCSV: async () => {
    let headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("nk_auth_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch (e) {}
    }
    let res: Response;
    try {
      res = await fetch(buildApiUrl("/supplier/analytics/export-csv"), { headers });
    } catch (e: any) {
      throw new Error(`Failed to reach backend for CSV export: ${e?.message || "Connection failed"}`);
    }
    if (!res.ok) throw new Error(`Failed to export analytics CSV: HTTP ${res.status} ${res.statusText}`);
    return res.blob();
  },
  getSupplierNotifications: () => fetchJson<NotificationItem[]>("/supplier/notifications"),
  markNotificationRead: (id: number) =>
    fetchJson<{ success: boolean; id: number }>(`/supplier/notifications/${id}/read`, {
      method: "PATCH"
    }),
  markAllNotificationsRead: () =>
    fetchJson<{ marked_read: number }>("/supplier/notifications/mark-all-read", {
      method: "POST"
    }),

  // Customer Insights & Inactive Customer Retention Analytics
  getCustomerInsights: (params?: {
    status?: string;
    country?: string;
    category?: string;
    search?: string;
    sort_by?: string;
    at_risk_threshold_days?: number;
    inactive_threshold_days?: number;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "ALL") q.append("status", params.status);
    if (params?.country && params.country !== "ALL") q.append("country", params.country);
    if (params?.category && params.category !== "ALL") q.append("category", params.category);
    if (params?.search) q.append("search", params.search);
    if (params?.sort_by) q.append("sort_by", params.sort_by);
    if (params?.at_risk_threshold_days) q.append("at_risk_threshold_days", params.at_risk_threshold_days.toString());
    if (params?.inactive_threshold_days) q.append("inactive_threshold_days", params.inactive_threshold_days.toString());
    if (params?.page) q.append("page", params.page.toString());
    if (params?.limit) q.append("limit", params.limit.toString());
    return fetchJson<CustomerInsightsResponse>(`/supplier/customers/insights?${q.toString()}`);
  },

  getCustomerAnalytics: (companyName: string, params?: { at_risk_threshold_days?: number; inactive_threshold_days?: number }) => {
    const q = new URLSearchParams();
    if (params?.at_risk_threshold_days) q.append("at_risk_threshold_days", params.at_risk_threshold_days.toString());
    if (params?.inactive_threshold_days) q.append("inactive_threshold_days", params.inactive_threshold_days.toString());
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<CustomerDetailAnalyticsResponse>(`/supplier/customers/${encodeURIComponent(companyName)}/analytics${queryStr}`);
  },

  createCustomerReminder: (companyName: string, notes?: string) =>
    fetchJson<{ success: boolean; message: string; notification_id: number; created_at: string }>(
      `/supplier/customers/${encodeURIComponent(companyName)}/reminder`,
      {
        method: "POST",
        body: JSON.stringify({ notes })
      }
    ),

  // Two-Way Component Intelligence APIs
  searchComponentIntelligence: (query: string, mode: string = "auto_detect") =>
    fetchJson<ComponentIntelligenceSearchResponse>(
      `/component-intelligence/search?query=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`
    ),
  getComponentSuppliers: (componentName: string, category?: string, hint?: string) => {
    const q = new URLSearchParams({ component_name: componentName });
    if (category) q.append("category", category);
    if (hint) q.append("hint", hint);
    return fetchJson<ComponentMatchSupplier[]>(`/component-intelligence/suppliers?${q.toString()}`);
  },
  exportToBOM: (data: ExportToBOMRequest) =>
    fetchJson<ExportToBOMResponse>("/component-intelligence/export-to-bom", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  createComponentSourcing: (data: CreateComponentSourcingRequest) =>
    fetchJson<CreateComponentSourcingResponse>("/component-intelligence/create-sourcing-rfq", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getSavedComponentSearches: () =>
    fetchJson<SavedComponentSearchItem[]>("/component-intelligence/saved-searches"),

  // Relevant Buyers & Relevant Suppliers Matching APIs
  getRelevantBuyers: (params?: {
    search?: string;
    category?: string;
    country?: string;
    min_quantity?: number;
    max_quantity?: number;
    rfq_status?: string;
    min_score?: number;
    sort_by?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.category) q.append("category", params.category);
    if (params?.country) q.append("country", params.country);
    if (params?.min_quantity !== undefined) q.append("min_quantity", params.min_quantity.toString());
    if (params?.max_quantity !== undefined) q.append("max_quantity", params.max_quantity.toString());
    if (params?.rfq_status) q.append("rfq_status", params.rfq_status);
    if (params?.min_score !== undefined) q.append("min_score", params.min_score.toString());
    if (params?.sort_by) q.append("sort_by", params.sort_by);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<RelevantBuyerMatch[]>(`/supplier/relevant-buyers${queryStr}`);
  },

  getRelevantSuppliers: (params?: {
    search?: string;
    category?: string;
    country?: string;
    max_price?: number;
    max_moq?: number;
    max_lead_time?: number;
    certification?: string;
    min_score?: number;
    sort_by?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.category) q.append("category", params.category);
    if (params?.country) q.append("country", params.country);
    if (params?.max_price !== undefined) q.append("max_price", params.max_price.toString());
    if (params?.max_moq !== undefined) q.append("max_moq", params.max_moq.toString());
    if (params?.max_lead_time !== undefined) q.append("max_lead_time", params.max_lead_time.toString());
    if (params?.certification) q.append("certification", params.certification);
    if (params?.min_score !== undefined) q.append("min_score", params.min_score.toString());
    if (params?.sort_by) q.append("sort_by", params.sort_by);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return fetchJson<RelevantSupplierMatch[]>(`/buyer/relevant-suppliers${queryStr}`);
  },

  getMatchingFilterOptions: () =>
    fetchJson<MatchingFilterOptions>("/buyer/filter-options"),

  // Buyer Workspace Core Module APIs
  getBuyerDashboardKPIs: () =>
    fetchJson<BuyerDashboardKPIs>("/buyer/dashboard-kpis"),

  getProductPriceComparison: (product?: string) => {
    const q = product ? `?product=${encodeURIComponent(product)}` : "";
    return fetchJson<ProductPriceComparisonResponse>(`/buyer/price-comparison${q}`);
  },

  getBuyerOrderNegotiations: () =>
    fetchJson<BuyerOrderNegotiationSummary[]>("/buyer/negotiations/orders"),

  getBuyerOrderNegotiation: (orderId: number) =>
    fetchJson<{ order: any; messages: any[] }>(`/buyer/negotiations/orders/${orderId}`),

  postBuyerOrderNegotiationMessage: (
    orderId: number,
    data: {
      message: string;
      action_type?: string;
      proposed_price?: number;
      proposed_quantity?: number;
      proposed_currency?: string;
      proposed_lead_time_days?: number;
      proposed_delivery_date?: string;
      proposed_payment_terms?: string;
      proposed_moq?: number;
    }
  ) =>
    fetchJson<any>(`/buyer/negotiations/orders/${orderId}/messages`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  actionBuyerOrderProposal: (
    orderId: number,
    messageId: number,
    data: {
      action: "ACCEPT" | "DECLINE" | "COUNTER";
      reason?: string;
      counter_price?: number;
      counter_quantity?: number;
      counter_lead_time_days?: number;
      counter_delivery_date?: string;
      counter_terms?: string;
      message?: string;
    }
  ) =>
    fetchJson<any>(`/buyer/negotiations/orders/${orderId}/proposals/${messageId}/action`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  contactSupplier: (data: {
    supplier_id: number;
    product_name?: string;
    quantity?: number;
    message: string;
    initial_price_offer?: number;
  }) =>
    fetchJson<any>("/buyer/suppliers/contact", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  createBuyerRFQ: (data: {
    title: string;
    category?: string;
    quantity: number;
    unit?: string;
    target_budget?: number;
    currency?: string;
    destination_country?: string;
    destination_city?: string;
    required_delivery_date?: string;
    manufacturing_process?: string;
    material_grade?: string;
    dimensions?: string;
    tolerances?: string;
    required_certifications?: string;
    deadline_days?: number;
    notes?: string;
    terms?: string;
    supplier_ids?: number[];
  }) =>
    fetchJson<RFQ>("/buyer/rfqs", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  getBuyerRFQs: () => fetchJson<BuyerRFQItem[]>("/buyer/rfqs"),
  getBuyerRFQDetail: (id: number) => fetchJson<BuyerRFQItem>(`/buyer/rfqs/${id}`),
  inviteSuppliersToRFQ: (rfqId: number, supplierIds: number[]) =>
    fetchJson<{ success: boolean; message: string }>(`/buyer/rfqs/${rfqId}/invite`, {
      method: "POST",
      body: JSON.stringify({ supplier_ids: supplierIds })
    }),
  acceptBuyerQuotation: (rfqId: number, quotationId: number) =>
    fetchJson<AcceptRFQQuotationResponse>(`/buyer/rfqs/${rfqId}/quotes/${quotationId}/accept`, {
      method: "POST"
    }),

  // Complaint Management System
  getComplaintReferences: () => fetchJson<ComplaintReferenceOptions>("/complaints/references"),
  raiseComplaint: (data: ComplaintCreateRequest) =>
    fetchJson<ComplaintSummary>("/complaints", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  getComplaints: (params?: { status?: string; category?: string; priority?: string; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== "ALL") sp.set("status", params.status);
    if (params?.category && params.category !== "ALL") sp.set("category", params.category);
    if (params?.priority && params.priority !== "ALL") sp.set("priority", params.priority);
    if (params?.search) sp.set("search", params.search);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return fetchJson<ComplaintSummary[]>(`/complaints${qs}`);
  },
  getComplaintDetail: (id: number) => fetchJson<ComplaintDetail>(`/complaints/${id}`),
  updateComplaintStatus: (id: number, data: { new_status: string; priority?: string; notes?: string; assigned_admin_name?: string; response_to_complainant?: string }) =>
    fetchJson<ComplaintDetail>(`/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data)
    }),
  sendComplaintMessage: (id: number, data: { message: string; is_internal?: boolean }) =>
    fetchJson<ComplaintMessageItem>(`/complaints/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
  uploadComplaintEvidence: async (complaintId: number, file: File): Promise<ComplaintDetail> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = typeof window !== "undefined" ? localStorage.getItem("nk_auth_token") : null;
    const res = await fetch(buildApiUrl(`/complaints/${complaintId}/evidence`), {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || "Failed to upload evidence");
    }
    return await res.json();
  },

  // Admin Sourcing Requests & Transaction Monitoring
  getAdminSourcingRequests: (params?: {
    status?: string;
    payment_status?: string;
    buyer_company?: string;
    supplier_company?: string;
    search?: string;
    date_range?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== "ALL") sp.set("status", params.status);
    if (params?.payment_status && params.payment_status !== "ALL") sp.set("payment_status", params.payment_status);
    if (params?.buyer_company && params.buyer_company !== "ALL") sp.set("buyer_company", params.buyer_company);
    if (params?.supplier_company && params.supplier_company !== "ALL") sp.set("supplier_company", params.supplier_company);
    if (params?.search) sp.set("search", params.search);
    if (params?.date_range && params.date_range !== "ALL") sp.set("date_range", params.date_range);
    const qs = sp.toString() ? `?${sp.toString()}` : "";
    return fetchJson<AdminSourcingTransactionItem[]>(`/admin/sourcing-requests${qs}`);
  },
  getAdminSourcingRequestDetail: (orderId: number) =>
    fetchJson<AdminSourcingTransactionItem>(`/admin/sourcing-requests/${orderId}`),
  cancelAdminTrade: (orderId: number, reason: string) =>
    fetchJson<AdminSourcingTransactionItem>(`/admin/sourcing-requests/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    }),
  getComplaintAdminOverview: () => fetchJson<ComplaintAdminOverview>("/complaints/admin/overview")
};

export interface BuyerRFQSupplierResponse {
  supplier_id: number;
  supplier_name: string;
  supplier_country: string;
  supplier_rating: number;
  supplier_moq: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "QUOTED" | string;
  status_label: "Pending" | "Accepted" | "Rejected" | "Quotation Received" | string;
  decline_reason?: string | null;
  responded_at?: string | null;
  quotation_id?: number | null;
  quotation_code?: string | null;
  unit_price?: number | null;
  total_amount?: number | null;
  currency?: string | null;
  moq?: number | null;
  lead_time_days?: number | null;
  validity_date?: string | null;
  quotation_status?: string | null;
}

export interface BuyerRFQItem {
  id: number;
  rfq_code: string;
  sourcing_request_id?: number | null;
  title: string;
  product_name: string;
  status: string;
  issue_date: string;
  deadline_date?: string | null;
  requested_quantity: number;
  unit: string;
  target_budget?: number | null;
  currency: string;
  destination_country?: string | null;
  destination_city?: string | null;
  required_delivery_date?: string | null;
  specifications: {
    category?: string;
    material_grade?: string;
    manufacturing_process?: string;
    dimensions?: string;
    tolerances?: string;
    required_certifications?: string;
    target_budget?: number;
    notes?: string;
  };
  terms?: string | null;
  notes?: string | null;
  supplier_responses: BuyerRFQSupplierResponse[];
  quotations_count: number;
  invited_suppliers_count: number;
  accepted_count: number;
  rejected_count: number;
  pending_count: number;
  created_at: string;
}

export interface AcceptRFQQuotationResponse {
  success: boolean;
  message: string;
  order_id: number;
  order_code: string;
  quotation_id: number;
  rfq_id: number;
}


// Export Additional Types
export interface RelevantBuyerMatch {
  id: string;
  buyer_id: number;
  buyer_name: string;
  buyer_company: string;
  buyer_country: string;
  buyer_industry?: string;
  buyer_email?: string;
  rfq_id?: number;
  rfq_code?: string;
  rfq_title: string;
  rfq_status: string;
  sourcing_request_id?: number;
  created_at: string;
  deadline_date?: string;
  matching_product_name: string;
  matching_category: string;
  supplier_catalog_item_id?: number;
  supplier_catalog_item_name?: string;
  requested_quantity: number;
  requested_unit: string;
  target_budget?: number;
  target_currency: string;
  specifications: {
    material_grade?: string;
    manufacturing_process?: string;
    dimensions?: string;
    tolerances?: string;
    required_certifications?: string;
    notes?: string;
  };
  match_score: number;
  match_level: string;
  match_reasons: string[];
  match_summary: string;
  score_breakdown: Record<string, number>;
  is_invited: boolean;
  invitation_status?: string;
}

export interface RelevantSupplierMatch {
  id: string;
  supplier_id: number;
  supplier_name: string;
  supplier_slug: string;
  supplier_country: string;
  supplier_city: string;
  supplier_email: string;
  supplier_rating: number;
  is_verified: boolean;
  verification_status: string;
  catalog_item_id: number;
  matching_product_name: string;
  part_number?: string;
  category: string;
  description?: string;
  specifications: string;
  material?: string;
  unit_price: number;
  currency: string;
  moq: number;
  lead_time_days: number;
  available_quantity: number;
  certifications: string[];
  image_url?: string;
  buyer_rfq_id?: number;
  buyer_rfq_code?: string;
  buyer_sourcing_title?: string;
  match_score: number;
  match_level: string;
  match_reasons: string[];
  match_summary: string;
  score_breakdown: Record<string, number>;
  in_stock: boolean;
  comparable_price?: number;
}

export interface MatchingFilterOptions {
  categories: string[];
  countries: string[];
  statuses: string[];
  certifications: string[];
  min_quantity: number;
  max_quantity: number;
}

export interface BuyerDashboardKPIs {
  total_rfqs: number;
  accepted_rfqs: number;
  pending_rfqs: number;
  quotations_received: number;
  active_orders: number;
  completed_orders: number;
  total_completed_purchase_value: number;
  total_committed_purchase_value: number;
  suppliers_engaged: number;
  rfqs_over_time: Array<{ month: string; count: number; spend?: number }>;
  orders_by_status: Array<{ status: string; count: number }>;
  purchasing_activity_over_time: Array<{ month: string; orders: number; completed: number }>;
  spending_over_time: Array<{ month: string; spend_usd: number }>;
  categories_sourced: Array<{ category: string; count: number }>;
  country_sourcing_analysis: Array<{
    country: string;
    supplier_count: number;
    quotations_count: number;
    completed_orders_count: number;
    active_orders_count: number;
    total_spend_usd: number;
    average_lead_time_days: number;
    primary_categories: string[];
  }>;
  ranked_countries: Array<{ country: string; spend: number; quotations: number; suppliers: number; orders: number }>;
}

export interface ProductPriceComparisonResponse {
  product_name: string;
  available_products: string[];
  countries: Array<{
    country: string;
    quotation_count: number;
    lowest_unit_price: number;
    average_unit_price: number;
    highest_unit_price: number;
    available_qty: number;
    lead_time_days: number;
  }>;
  companies: Array<{
    supplier_id: number;
    supplier_name: string;
    supplier_country: string;
    quoted_unit_price: number;
    currency: string;
    moq: number;
    available_quantity: number;
    lead_time_days: number;
    validity_date?: string;
    quotation_id: number;
    quotation_code: string;
    status: string;
    last_updated: string;
  }>;
  cheapest_country_insight: {
    cheapest_country?: string;
    lowest_unit_price?: number;
    currency: string;
    supplier_name?: string;
    supplier_id?: number;
    price_label: string;
    landed_cost_notice: string;
    savings_vs_average_pct: number;
    has_data: boolean;
    message?: string;
  };
}

export interface BuyerOrderNegotiationSummary {
  order_id: number;
  order_code: string;
  supplier_id: number;
  supplier_name: string;
  supplier_country: string;
  supplier_email: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  status: string;
  delivery_status: string;
  last_message?: string;
  last_activity?: string;
  unread_count: number;
  messages_count: number;
}

export interface ComplaintSummary {
  id: number;
  complaint_code: string;
  complainant_user_id: number;
  complainant_role: string;
  complainant_company_name: string;
  accused_company_name: string;
  category: string;
  subject: string;
  priority: string;
  status: string;
  related_order_id?: number | null;
  related_order_code?: string | null;
  related_rfq_id?: number | null;
  related_rfq_code?: string | null;
  assigned_admin_name?: string | null;
  has_admin_response: boolean;
  latest_admin_response?: string | null;
  messages_count: number;
  evidence_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ComplaintEvidenceItem {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  download_url: string;
  uploaded_by_role: string;
  created_at?: string;
}

export interface ComplaintMessageItem {
  id: number;
  sender_user_id: number;
  sender_role: string;
  sender_name: string;
  message: string;
  is_internal: boolean;
  created_at?: string;
}

export interface ComplaintHistoryItem {
  id: number;
  previous_status?: string | null;
  new_status: string;
  changed_by_name: string;
  changed_by_role: string;
  notes?: string | null;
  created_at?: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  description: string;
  internal_notes?: string | null;
  resolution_notes?: string | null;
  rejection_reason?: string | null;
  related_quotation_id?: number | null;
  related_quotation_code?: string | null;
  evidence: ComplaintEvidenceItem[];
  messages: ComplaintMessageItem[];
  history: ComplaintHistoryItem[];
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface ComplaintCreateRequest {
  accused_company_name: string;
  accused_supplier_id?: number | null;
  accused_buyer_id?: number | null;
  category: string;
  subject: string;
  description: string;
  priority?: string;
  related_order_id?: number | null;
  related_rfq_id?: number | null;
  related_quotation_id?: number | null;
}

export interface ComplaintReferenceOptions {
  target_companies: Array<{ id: number; key?: string; name: string; country?: string; type: string }>;
  orders: Array<{ id: number; order_code: string; total_amount: number; status: string; supplier_name?: string; buyer_company?: string }>;
  rfqs: Array<{ id: number; rfq_code: string; title: string; status: string }>;
  quotations: Array<any>;
}

export interface ComplaintAdminOverview {
  total_complaints: number;
  submitted_count: number;
  under_review_count: number;
  awaiting_info_count: number;
  resolved_count: number;
  rejected_count: number;
  closed_count: number;
  by_category: Record<string, number>;
  by_complainant_role: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface AdminSourcingTransactionItem {
  id: number;
  order_code: string;
  rfq_id?: number | null;
  rfq_code?: string | null;
  rfq_title?: string | null;
  sourcing_request_id?: number | null;
  buyer_id?: number | null;
  buyer_company_name: string;
  buyer_country?: string | null;
  buyer_name?: string | null;
  buyer_email?: string | null;
  supplier_id: number;
  supplier_name: string;
  supplier_country?: string | null;
  supplier_email?: string | null;
  supplier_verification_status?: string | null;
  product_name: string;
  product_description?: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  total_amount: number;
  payment_status: string;
  payment_terms?: string | null;
  order_status: string;
  delivery_status: string;
  created_at: string;
  updated_at: string;
  expected_delivery_date?: string | null;
  latest_status_update?: string | null;
  shipping_address?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  items: Array<{
    id: number;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  history: Array<{
    id: number;
    previous_status?: string | null;
    new_status: string;
    changed_by: string;
    notes?: string | null;
    created_at?: string | null;
  }>;
  quotation?: {
    id: number;
    quote_code: string;
    unit_price: number;
    total_amount: number;
    moq: number;
    lead_time_days: number;
    payment_terms?: string | null;
    incoterms?: string | null;
    warranty_info?: string | null;
    packaging_details?: string | null;
    validity_date?: string | null;
    acceptance_reason?: string | null;
  } | null;
  rfq?: {
    id: number;
    rfq_code: string;
    title: string;
    status: string;
    terms?: string | null;
    notes?: string | null;
    issue_date?: string | null;
    deadline_date?: string | null;
  } | null;
  negotiations: Array<{
    id: number;
    sender_role: string;
    sender_name: string;
    message: string;
    action_type: string;
    proposed_price?: number | null;
    proposed_quantity?: number | null;
    created_at?: string | null;
  }>;
  is_cancellable: boolean;
  cancellation_reason?: string | null;
}



