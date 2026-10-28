"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Building2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Bot,
  ExternalLink,
  Bell,
  FileText,
  Mail,
  Phone,
  Eye,
  Info,
  ShieldCheck,
  Send,
  PieChart as PieIcon,
  BarChart2,
  Activity
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import {
  api,
  CustomerInsightsResponse,
  CustomerRecord,
  CustomerDetailAnalyticsResponse,
  CustomerProductItem
} from "@/lib/api";

const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

export default function CustomerRetentionWorkspace({ initialCompany }: { initialCompany?: string }) {
  const [mounted, setMounted] = useState(false);

  // Filters & State
  const [data, setData] = useState<CustomerInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("last_purchase_desc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Thresholds configuration
  const [atRiskDays, setAtRiskDays] = useState<number>(45);
  const [inactiveDays, setInactiveDays] = useState<number>(90);
  const [showConfig, setShowConfig] = useState(false);

  // Selected company detail view
  const [selectedCompany, setSelectedCompany] = useState<string | null>(initialCompany || null);
  const [detailData, setDetailData] = useState<CustomerDetailAnalyticsResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Detail view toggles
  const [graph1Mode, setGraph1Mode] = useState<"count" | "spend">("spend");
  const [graph2Sort, setGraph2Sort] = useState<"quantity" | "frequency">("quantity");
  const [selectedProductFilter, setSelectedProductFilter] = useState<string | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderNotes, setReminderNotes] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch overview list
  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCustomerInsights({
        status: selectedStatus,
        country: selectedCountry,
        category: selectedCategory,
        search: searchQuery,
        sort_by: sortBy,
        at_risk_threshold_days: atRiskDays,
        inactive_threshold_days: inactiveDays,
        page: currentPage,
        limit: 12
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load customer retention intelligence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchOverview();
    }
  }, [mounted, selectedStatus, selectedCountry, selectedCategory, sortBy, currentPage, atRiskDays, inactiveDays]);

  // Fetch company detail
  const fetchCompanyDetail = async (companyName: string) => {
    setDetailLoading(true);
    setDetailError(null);
    setSelectedProductFilter(null);
    try {
      const res = await api.getCustomerAnalytics(companyName, {
        at_risk_threshold_days: atRiskDays,
        inactive_threshold_days: inactiveDays
      });
      setDetailData(res);
      setSelectedCompany(companyName);
    } catch (err: any) {
      setDetailError(err?.message || `Failed to load detailed analytics for ${companyName}`);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && selectedCompany) {
      fetchCompanyDetail(selectedCompany);
    }
  }, [mounted, selectedCompany, atRiskDays, inactiveDays]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOverview();
  };

  // Schedule follow-up reminder
  const handleCreateReminder = async () => {
    if (!selectedCompany) return;
    setReminderLoading(true);
    try {
      const res = await api.createCustomerReminder(selectedCompany, reminderNotes);
      setReminderSuccess(res.message);
      setReminderNotes("");
      setTimeout(() => {
        setReminderModalOpen(false);
        setReminderSuccess(null);
      }, 2000);
    } catch (err: any) {
      alert(err?.message || "Failed to schedule reminder");
    } finally {
      setReminderLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-400 text-xs font-mono">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 mr-2" />
        Initializing Customer Retention Intelligence Engine...
      </div>
    );
  }

  // =========================================================================
  // Render Company Detail Analytics View
  // =========================================================================
  if (selectedCompany) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#131720] border border-[#202736]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCompany(null);
                setDetailData(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#222c40] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#2d3a50]"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
              <span>Back to Customer List</span>
            </button>
            <div className="h-4 w-[1px] bg-[#2a3448] hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{selectedCompany}</h2>
                {detailData?.customer_summary && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                      detailData.customer_summary.status === "REGULAR"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        : detailData.customer_summary.status === "AT_RISK"
                        ? "bg-amber-950/80 text-amber-300 border-amber-800"
                        : detailData.customer_summary.status === "INACTIVE"
                        ? "bg-rose-950/80 text-rose-300 border-rose-800"
                        : "bg-slate-900 text-slate-400 border-slate-700"
                    }`}
                  >
                    {detailData.customer_summary.status_label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{detailData?.customer_summary.country || "Global"}</span>
                <span>·</span>
                <span>{detailData?.customer_summary.business_category}</span>
                {detailData?.customer_summary.contact_name && (
                  <>
                    <span>·</span>
                    <span className="text-slate-300">Contact: {detailData.customer_summary.contact_name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setReminderModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-700/60 transition-colors shadow-xs"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Schedule Follow-up</span>
            </button>
            <button
              onClick={() => setCompanyModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#222c3e] text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-[#2b374d] transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Company Info</span>
            </button>
          </div>
        </div>

        {detailLoading && (
          <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
            <p>Aggregating historical order ledgers, line items, and purchasing frequencies for {selectedCompany}...</p>
          </div>
        )}

        {detailError && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs flex items-center justify-between">
            <span>{detailError}</span>
            <button
              onClick={() => fetchCompanyDetail(selectedCompany)}
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-900 text-xs font-bold"
            >
              Retry
            </button>
          </div>
        )}

        {detailData && (
          <>
            {/* Section A: Customer Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Completed Orders</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-white">{detailData.customer_summary.total_completed_orders}</span>
                  {detailData.customer_summary.cancelled_orders_count > 0 && (
                    <span className="text-[10px] font-mono text-amber-400">({detailData.customer_summary.cancelled_orders_count} cancelled)</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Products Purchased</span>
                <span className="text-xl font-bold text-emerald-400">{detailData.customer_summary.distinct_products_count} distinct</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Historical Value</span>
                <span className="text-xl font-bold text-white">${detailData.customer_summary.total_historical_spend.toLocaleString()}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Last Purchase Date</span>
                <span className="text-xs font-bold text-slate-200 block truncate">
                  {detailData.customer_summary.last_purchase_date
                    ? new Date(detailData.customer_summary.last_purchase_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "Never"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Days Inactive</span>
                <span
                  className={`text-xl font-bold ${
                    detailData.customer_summary.days_since_last_purchase && detailData.customer_summary.days_since_last_purchase > 90
                      ? "text-rose-400"
                      : detailData.customer_summary.days_since_last_purchase && detailData.customer_summary.days_since_last_purchase > 45
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {detailData.customer_summary.days_since_last_purchase !== null
                    ? `${detailData.customer_summary.days_since_last_purchase}d`
                    : "N/A"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Avg Buying Cadence</span>
                <span className="text-sm font-bold text-cyan-400 block truncate">
                  {detailData.customer_summary.avg_interval_days
                    ? `~${detailData.customer_summary.avg_interval_days} days`
                    : "Single order"}
                </span>
              </div>
            </div>

            {/* Explanation Alert Banner */}
            <div className="p-3.5 rounded-xl bg-[#111722] border border-[#1d273a] flex items-start gap-2.5 text-xs text-slate-300">
              <Info className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-200">Analytical Recency Assessment:</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {detailData.customer_summary.status_explanation}
                </p>
              </div>
            </div>

            {/* Section D: AI Seller Assistant Insights (Distinguishing Facts from AI Suggestions) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Fact Card */}
              <div className="p-4 rounded-xl bg-[#0f141d] border border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1b2537] pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Database-Verified Historical Facts
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40 font-semibold">
                    100% Deterministic
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {detailData.ai_recommendations.facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI Recommendation Card */}
              <div className="p-4 rounded-xl bg-[#0f141d] border border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between border-b border-[#1b2537] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      AI Seller Assistant Retention Strategy
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                    Strategic Proposals
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {detailData.ai_recommendations.suggestions.map((sug, idx) => (
                    <li key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Section B: Products Previously Purchased Table */}
            <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#1d2433] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>Products Previously Purchased</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any product row to inspect individual orders or verify catalog specs.
                  </p>
                </div>
                {selectedProductFilter && (
                  <button
                    onClick={() => setSelectedProductFilter(null)}
                    className="px-2.5 py-1 rounded bg-[#1a2130] text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-[#2b374c]"
                  >
                    <span>Clear Filter ({selectedProductFilter})</span>
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {detailData.products_purchased.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No previous product purchases recorded for this company.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1f2636] text-[10px] font-mono uppercase text-slate-400 bg-[#0e1219]">
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Orders</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total Historical Spend</th>
                        <th className="py-2.5 px-3">Last Purchased</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a202d]">
                      {detailData.products_purchased.map((prod) => {
                        const isSelected = selectedProductFilter === prod.product_name;
                        return (
                          <tr
                            key={prod.product_name}
                            onClick={() => setSelectedProductFilter(isSelected ? null : prod.product_name)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-emerald-950/30" : "hover:bg-[#141a24]"
                            }`}
                          >
                            <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>{prod.product_name}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161c28] text-slate-300 border border-[#232c3e]">
                                {prod.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-slate-100">
                              {prod.total_quantity.toLocaleString()} pcs
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-300">
                              {prod.order_count}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-400">
                              {prod.unit_price_range}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                              ${prod.total_value.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-slate-400 text-[11px]">
                              {prod.last_purchased_date
                                ? new Date(prod.last_purchased_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : "N/A"}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold underline">
                                {isSelected ? "Collapse" : "View Orders"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order breakdown drawer if a product is clicked */}
              {selectedProductFilter && (
                <div className="p-3.5 rounded-lg bg-[#0e1219] border border-[#242e40] space-y-2 mt-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Orders Breakdown for: {selectedProductFilter}
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {detailData.products_purchased
                      .find((p) => p.product_name === selectedProductFilter)
                      ?.orders_breakdown.map((ob, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-[#141a24] border border-[#1f2738] text-[11px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-slate-200">{ob.order_code}</span>
                            <span className="text-slate-400">{ob.date}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {ob.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 font-mono">
                            <span>{ob.quantity} units @ ${ob.unit_price.toFixed(2)}</span>
                            <span className="font-bold text-emerald-400">${ob.total_price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section C: 5 Interactive Graphs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f2636] pb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span>Interactive Purchasing Telemetry Graphs</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rendered strictly from verified completed orders for {selectedCompany}.
                  </p>
                </div>
              </div>

              {detailData.graphs.availability.insufficient_data_reason && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{detailData.graphs.availability.insufficient_data_reason}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Graph 1: Purchase activity over time */}
                <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Graph 1: Purchase Activity Over Time
                      </h4>
                      <p className="text-[10px] text-slate-400">Order velocity & monthly transaction volume</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#161c28] p-0.5 rounded-lg border border-[#242e40]">
                      <button
                        onClick={() => setGraph1Mode("spend")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          graph1Mode === "spend" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Spend ($)
                      </button>
                      <button
                        onClick={() => setGraph1Mode("count")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          graph1Mode === "count" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Order Count
                      </button>
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    {detailData.graphs.activity_over_time.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                        No historical activity data available.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={detailData.graphs.activity_over_time}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2838" />
                          <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0e1219", borderColor: "#242e40", fontSize: 11 }}
                            formatter={(val: any) =>
                              graph1Mode === "spend" ? [`$${Number(val).toLocaleString()} USD`, "Spend"] : [val, "Orders"]
                            }
                          />
                          <Bar
                            dataKey={graph1Mode === "spend" ? "spend" : "order_count"}
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Graph 2: Products purchased */}
                <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Graph 2: Products Previously Purchased
                      </h4>
                      <p className="text-[10px] text-slate-400">Distribution by component specification</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#161c28] p-0.5 rounded-lg border border-[#242e40]">
                      <button
                        onClick={() => setGraph2Sort("quantity")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          graph2Sort === "quantity" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        By Quantity
                      </button>
                      <button
                        onClick={() => setGraph2Sort("frequency")}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          graph2Sort === "frequency" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        By Frequency
                      </button>
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    {detailData.graphs.products_breakdown.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                        No product breakdown data available.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={detailData.graphs.products_breakdown.slice().sort((a, b) =>
                            graph2Sort === "quantity" ? b.quantity - a.quantity : b.order_count - a.order_count
                          )}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2838" />
                          <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis dataKey="short_name" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={120} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0e1219", borderColor: "#242e40", fontSize: 11 }}
                            formatter={(val: any, name: any) => [
                              graph2Sort === "quantity" ? `${val} units` : `${val} orders`,
                              graph2Sort === "quantity" ? "Total Quantity" : "Orders Count"
                            ]}
                          />
                          <Bar
                            dataKey={graph2Sort === "quantity" ? "quantity" : "order_count"}
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Graph 3: Category distribution */}
                <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Graph 3: Product Category Distribution
                    </h4>
                    <p className="text-[10px] text-slate-400">Share of historical spend by product group</p>
                  </div>

                  <div className="h-56 w-full flex items-center">
                    {detailData.graphs.category_distribution.length === 0 ? (
                      <div className="h-full w-full flex items-center justify-center text-slate-500 text-xs">
                        No category distribution data available.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={detailData.graphs.category_distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="total_value"
                            nameKey="category"
                          >
                            {detailData.graphs.category_distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0e1219", borderColor: "#242e40", fontSize: 11 }}
                            formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()} USD`, name]}
                          />
                          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Graph 4: Purchase frequency & cadence gap */}
                <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Graph 4: Purchase Frequency & Cumulative Orders
                    </h4>
                    <p className="text-[10px] text-slate-400">Trend line highlighting cadence gap and order continuity</p>
                  </div>

                  <div className="h-56 w-full">
                    {detailData.graphs.purchase_frequency.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                        No purchase frequency data available.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detailData.graphs.purchase_frequency}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2838" />
                          <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0e1219", borderColor: "#242e40", fontSize: 11 }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line
                            type="monotone"
                            dataKey="purchases_count"
                            name="Purchases in Month"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="cumulative_orders"
                            name="Cumulative Orders"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Graph 5: Historical spending over time */}
                <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3 lg:col-span-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Graph 5: Historical Spend Trajectory ($ USD)
                    </h4>
                    <p className="text-[10px] text-slate-400">Cumulative commercial value generated over customer relationship</p>
                  </div>

                  <div className="h-60 w-full">
                    {detailData.graphs.historical_spending.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                        No spending data available.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={detailData.graphs.historical_spending}>
                          <defs>
                            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2838" />
                          <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0e1219", borderColor: "#242e40", fontSize: 11 }}
                            formatter={(val: any) => [`$${Number(val).toLocaleString()} USD`, "Spend"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumulative_spend"
                            name="Cumulative Spend"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#spendGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section E: Order History Table */}
            <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1d2433] pb-2">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Chronological Purchase Order Ledger</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">{detailData.order_history.length} records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1f2636] text-[10px] font-mono uppercase text-slate-400 bg-[#0e1219]">
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">Order Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Items Included</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-3">Tracking / Destination</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a202d]">
                    {detailData.order_history.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#141a24]">
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                          {ord.order_code}
                        </td>
                        <td className="py-3 px-3 text-slate-300">{ord.created_at_formatted}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                              ord.status === "DELIVERED"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                                : ord.status === "CANCELLED"
                                ? "bg-rose-950/80 text-rose-300 border-rose-800"
                                : "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="text-[11px]">
                              {it.quantity}x {it.item_name}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                          ${ord.total_amount.toLocaleString()} {ord.currency}
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[10px] font-mono">
                          {ord.tracking_number || "FOB Factory"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions Footer Bar */}
            <div className="p-4 rounded-xl bg-[#111722] border border-[#20293b] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Suggested Next Actions:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/supplier/products"
                  className="px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#20293a] text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-[#2a364d]"
                >
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Check Catalog Stock</span>
                </Link>
                <button
                  onClick={() => setReminderModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-700/60"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Set Follow-up Reminder</span>
                </button>
                <Link
                  href={`/supplier/quotations`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Prepare Quotation</span>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Modal: Follow-up Reminder */}
        {reminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#11141c] border border-[#232c3f] p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1f2738] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span>Schedule Customer Follow-up</span>
                </h3>
                <button onClick={() => setReminderModalOpen(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Target Organization:</span>
                  <p className="font-bold text-white mt-0.5">{selectedCompany}</p>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Follow-up Objective & Strategy Notes:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Call procurement contact regarding upcoming Q2 batch delivery and volume discount..."
                    value={reminderNotes}
                    onChange={(e) => setReminderNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#0e1117] border border-[#212a3b] text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {reminderSuccess && (
                  <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{reminderSuccess}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f2738]">
                <button
                  type="button"
                  onClick={() => setReminderModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#18202d] text-slate-300 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={reminderLoading}
                  onClick={handleCreateReminder}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {reminderLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                  <span>Save In-App Reminder</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Company Details */}
        {companyModalOpen && detailData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl bg-[#11141c] border border-[#232c3f] p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1f2738] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Company Profile & Contact Data</span>
                </h3>
                <button onClick={() => setCompanyModalOpen(false)} className="text-slate-400 hover:text-white">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0e1219] border border-[#20293b]">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Legal Entity:</span>
                    <p className="font-bold text-white mt-0.5">{selectedCompany}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Country / Jurisdiction:</span>
                    <p className="font-bold text-white mt-0.5">{detailData.customer_summary.country}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Industry Sector:</span>
                    <p className="text-slate-300 mt-0.5">{detailData.customer_summary.business_category}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Status Category:</span>
                    <p className="text-emerald-400 font-bold mt-0.5">{detailData.customer_summary.status_label}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0e1219] border border-[#20293b] space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Authorized Procurement Contact
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">{detailData.customer_summary.contact_name}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      Tier-1 Buyer
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>{detailData.customer_summary.contact_email || "Not disclosed"}</span>
                  </div>
                  {detailData.customer_summary.contact_phone && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{detailData.customer_summary.contact_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#1f2738]">
                <button
                  onClick={() => setCompanyModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#18202d] text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // Render Main Customers List & Intelligence Overview
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Customers</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{data?.summary.total_customers || 0}</span>
            <span className="text-[10px] text-slate-400">organizations</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-emerald-900/40 space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Regular Customers</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-300">{data?.summary.regular_count || 0}</span>
            <span className="text-[10px] font-mono text-emerald-500">Active</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-amber-900/40 space-y-1">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">At-Risk Customers</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-300">{data?.summary.at_risk_count || 0}</span>
            <span className="text-[10px] font-mono text-amber-500">Cadence gap</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-rose-900/40 space-y-1">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider block">Inactive Customers</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-300">{data?.summary.inactive_count || 0}</span>
            <span className="text-[10px] font-mono text-rose-500">&gt;{inactiveDays}d dormant</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2737] space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Historical Customer Revenue</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-white">${data?.summary.total_historical_revenue.toLocaleString() || 0}</span>
            <span className="text-[10px] text-slate-400">USD</span>
          </div>
        </div>
      </div>

      {/* Threshold Configuration Toggle Bar */}
      <div className="p-3.5 rounded-xl bg-[#111620] border border-[#1f2737] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Customer Classification Rules:</span>
          <span className="text-slate-400 hidden sm:inline">
            At-Risk (&gt;{atRiskDays}d or 1.4x interval) · Inactive (&gt;{inactiveDays}d or 2.2x interval)
          </span>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <span>{showConfig ? "Hide Rule Configuration" : "Customize Thresholds"}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showConfig ? "rotate-90" : ""}`} />
        </button>
      </div>

      {/* Collapsible Threshold Sliders */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-[#0f131a] border border-[#212938] space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="font-semibold text-amber-300">At-Risk Threshold (Days Inactive):</span>
                <span className="font-mono font-bold text-white">{atRiskDays} days</span>
              </div>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={atRiskDays}
                onChange={(e) => setAtRiskDays(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Customers with no completed orders for this period (or exceeding 1.4x their buying interval) are flagged as At-Risk.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="font-semibold text-rose-300">Inactive Threshold (Days Inactive):</span>
                <span className="font-mono font-bold text-white">{inactiveDays} days</span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                step="10"
                value={inactiveDays}
                onChange={(e) => setInactiveDays(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Customers dormant past this period (or exceeding 2.2x their historical buying cycle) are classified as Inactive.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#1b212d]">
            <button
              onClick={() => {
                setAtRiskDays(45);
                setInactiveDays(90);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Reset to Factory Defaults (45d / 90d)
            </button>
          </div>
        </div>
      )}

      {/* Analytical Disclaimer */}
      <div className="p-3 rounded-lg bg-[#0e1219] border border-[#1b2230] text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
        <span>{data?.disclaimer}</span>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="p-4 rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
        {/* Row 1: Search and Category Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by company, product, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0e1117] border border-[#212938] rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 bg-[#0e1117] border border-[#212938] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="last_purchase_desc">Most Recently Purchased</option>
              <option value="last_purchase_asc">Longest Inactivity Gap</option>
              <option value="total_spend_desc">Highest Historical Spend</option>
              <option value="orders_count_desc">Most Completed Orders</option>
              <option value="frequency_desc">Shortest Buying Cycle</option>
            </select>
          </div>
        </div>

        {/* Row 2: Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1d2433]">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Status Filter:</span>
          {[
            { id: "ALL", label: "All Customers" },
            { id: "NON_REGULAR", label: `Non-Regular (${(data?.summary.at_risk_count || 0) + (data?.summary.inactive_count || 0)})` },
            { id: "INACTIVE", label: `Inactive (${data?.summary.inactive_count || 0})` },
            { id: "AT_RISK", label: `At-Risk (${data?.summary.at_risk_count || 0})` },
            { id: "REGULAR", label: `Regular (${data?.summary.regular_count || 0})` },
            { id: "PROSPECT", label: `Prospects (${data?.summary.prospect_count || 0})` }
          ].map((pill) => {
            const isActive = selectedStatus === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => {
                  setSelectedStatus(pill.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-[#161c27] text-slate-300 hover:bg-[#1f2636] border border-[#232b3a]"
                }`}
              >
                {pill.label}
              </button>
            );
          })}

          {/* Country filter */}
          {data?.available_countries && data.available_countries.length > 0 && (
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setCurrentPage(1);
              }}
              className="ml-auto px-2 py-1 bg-[#0e1117] border border-[#212938] rounded text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Countries</option>
              {data.available_countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Companies Table / Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-mono space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400 mx-auto" />
          <p>Scanning supplier purchase order ledgers and computing inactivity recency...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center rounded-xl bg-rose-950/30 border border-rose-900/50 space-y-3">
          <p className="text-xs text-rose-300">{error}</p>
          <button
            onClick={fetchOverview}
            className="px-4 py-1.5 rounded-lg bg-rose-900 text-white text-xs font-bold"
          >
            Retry Analysis
          </button>
        </div>
      ) : !data || data.customers.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#11151e] border border-[#1f2636] space-y-3">
          <Users className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-200">No Customers Match Current Filter</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting your search query, adjusting country filters, or expanding the status criteria.
          </p>
          <button
            onClick={() => {
              setSelectedStatus("ALL");
              setSelectedCountry("ALL");
              setSelectedCategory("ALL");
              setSearchQuery("");
            }}
            className="px-4 py-1.5 rounded-lg bg-[#18202d] text-emerald-400 text-xs font-semibold border border-[#2a374c]"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-[#1f2636] bg-[#11151e]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1f2636] text-[10px] font-mono uppercase text-slate-400 bg-[#0e1219]">
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-3">Country</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Orders</th>
                  <th className="py-3 px-3">Last Purchase</th>
                  <th className="py-3 px-3">Purchase Cadence</th>
                  <th className="py-3 px-3">Top Product</th>
                  <th className="py-3 px-3 text-right">Total Spend</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a202d]">
                {data.customers.map((c) => {
                  return (
                    <tr
                      key={c.company_name}
                      onClick={() => fetchCompanyDetail(c.company_name)}
                      className="hover:bg-[#141a24] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{c.company_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{c.business_category}</span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 font-medium">
                        {c.country}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                            c.status === "REGULAR"
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                              : c.status === "AT_RISK"
                              ? "bg-amber-950/80 text-amber-300 border-amber-800"
                              : c.status === "INACTIVE"
                              ? "bg-rose-950/80 text-rose-300 border-rose-800"
                              : "bg-slate-900 text-slate-400 border-slate-700"
                          }`}
                        >
                          {c.status_label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                        {c.total_completed_orders}
                      </td>

                      <td className="py-3.5 px-3">
                        {c.days_since_last_purchase !== null ? (
                          <div>
                            <span
                              className={`font-mono font-bold text-xs ${
                                c.days_since_last_purchase > 90
                                  ? "text-rose-400"
                                  : c.days_since_last_purchase > 45
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {c.days_since_last_purchase}d ago
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {c.last_purchase_date
                                ? new Date(c.last_purchase_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                : "N/A"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Never</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 text-[11px] font-mono">
                        {c.purchase_frequency_label}
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 max-w-[160px] truncate text-[11px]">
                        {c.most_frequent_product || "None"}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                        ${c.total_historical_spend.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchCompanyDetail(c.company_name);
                          }}
                          className="px-3 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-800/60 flex items-center gap-1 mx-auto transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Insights</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>
                Showing page {data.pagination.page} of {data.pagination.total_pages} ({data.pagination.total_count} total companies)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={data.pagination.page <= 1}
                  onClick={() => setCurrentPage(data.pagination.page - 1)}
                  className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#202737] disabled:opacity-40 text-slate-300 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={data.pagination.page >= data.pagination.total_pages}
                  onClick={() => setCurrentPage(data.pagination.page + 1)}
                  className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#202737] disabled:opacity-40 text-slate-300 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
