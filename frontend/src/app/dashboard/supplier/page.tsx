"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Truck,
  ShieldCheck,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  ExternalLink,
  MessageSquare,
  Users,
  Filter,
  Globe,
  PieChart as PieChartIcon,
  RotateCcw
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import {
  api,
  SupplierDashboardAnalyticsResponse
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function SupplierDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<SupplierDashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Filters
  const [dateRange, setDateRange] = useState("ALL_TIME");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [buyerFilter, setBuyerFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Graph Toggles
  const [countryMetric, setCountryMetric] = useState<"spend" | "count">("spend");
  const [timeMetric, setTimeMetric] = useState<"revenue" | "orders" | "units">("revenue");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierDashboardAnalytics({
        date_range: dateRange,
        country: countryFilter !== "ALL" ? countryFilter : undefined,
        product: productFilter !== "ALL" ? productFilter : undefined,
        buyer: buyerFilter !== "ALL" ? buyerFilter : undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined
      });
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load seller analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchAnalytics();
  }, [isAuthenticated, authLoading, dateRange, countryFilter, productFilter, buyerFilter, statusFilter, router]);

  const handleResetFilters = () => {
    setDateRange("ALL_TIME");
    setCountryFilter("ALL");
    setProductFilter("ALL");
    setBuyerFilter("ALL");
    setStatusFilter("ALL");
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-slate-400 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Redirecting to authentication...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total_completed_orders: 0,
    active_orders: 0,
    total_sales_revenue: 0,
    unique_buyers: 0,
    active_products: 0,
    pending_rfqs: 0,
    quotations_awaiting_decision: 0,
    orders_awaiting_fulfilment: 0
  };

  const graphs = data?.graphs;
  const filters = data?.filters;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageGuide
        badge="SUPPLIER OPERATIONS & COMMERCIAL ANALYTICS"
        title="Supplier Business Operations & Analytics Hub"
        description="Comprehensive real-database business analytics across global buyer orders, fulfilment distribution, revenue trends, and client performance."
        tip="Use the dynamic multi-filter bar to isolate export performance by country, product line, or buyer enterprise."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold uppercase tracking-wider">
              VERIFIED SUPPLIER ENTERPRISE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mt-1">
            <LayoutDashboard className="w-6 h-6 text-emerald-400" />
            <span>Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supplier operations, sales trends, top buyer markets, best-selling products, and repeat buyers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/supplier/buyers"
            className="px-3.5 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Discover Buyers</span>
          </Link>

          <Link
            href="/supplier/rfqs"
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Incoming RFQs</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Dynamic Multi-Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Dynamic Analytics Filters
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1 font-mono transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Date Range */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Time Horizon</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL_TIME">All Time</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
              <option value="YTD">Year to Date (YTD)</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Buyer Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Countries</option>
              {(filters?.available_countries || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Product Component</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Products</option>
              {(filters?.available_products || []).map((p) => (
                <option key={p} value={p}>{p.slice(0, 25)}</option>
              ))}
            </select>
          </div>

          {/* Buyer */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Buyer Enterprise</label>
            <select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Clients</option>
              {(filters?.available_buyers || []).map((b) => (
                <option key={b} value={b}>{b.slice(0, 22)}</option>
              ))}
            </select>
          </div>

          {/* Order Status */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Fulfilment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              {(filters?.available_statuses || []).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 8 Real Database KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed Orders */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Completed Orders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {kpis.total_completed_orders}
          </p>
          <span className="text-[11px] text-emerald-400 font-mono block">Fulfilled & Received</span>
        </div>

        {/* Active Orders */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active In-Progress Orders</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {kpis.active_orders}
          </p>
          <span className="text-[11px] text-blue-400 font-mono block">Production to Transit</span>
        </div>

        {/* Total Sales Revenue */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            ${kpis.total_sales_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 font-mono block">From Contractual POs</span>
        </div>

        {/* Unique Buyers Served */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Unique Buyers Served</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {kpis.unique_buyers}
          </p>
          <span className="text-[11px] text-purple-400 font-mono block">Enterprise Clients</span>
        </div>

        {/* Listed Catalog Products */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Products Listed</span>
            <Package className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {kpis.active_products}
          </p>
          <span className="text-[11px] text-cyan-400 font-mono block">Published in Catalog</span>
        </div>

        {/* Pending RFQs */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pending RFQs Awaiting Quote</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400">
            {kpis.pending_rfqs}
          </p>
          <span className="text-[11px] text-amber-400/80 font-mono block">Open Opportunities</span>
        </div>

        {/* Quotations Awaiting Decision */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Quotations Under Review</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {kpis.quotations_awaiting_decision}
          </p>
          <span className="text-[11px] text-indigo-400 font-mono block">Awaiting Buyer Decision</span>
        </div>

        {/* Orders Awaiting Fulfilment */}
        <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Awaiting Fulfilment Action</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-rose-400">
            {kpis.orders_awaiting_fulfilment}
          </p>
          <span className="text-[11px] text-rose-400/80 font-mono block">Confirmed / Preparing</span>
        </div>
      </div>

      {/* 5 Real DB Graphs Grid */}
      <div className="space-y-6">
        {/* Row 1: Graph 1 (Country) & Graph 2 (Best Selling) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graph 1: Business by Country */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Graph 1: Business by Buyer Country</h3>
              </div>

              <div className="flex items-center gap-1 bg-[#0e1117] p-1 rounded border border-[#202636]">
                <button
                  type="button"
                  onClick={() => setCountryMetric("spend")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                    countryMetric === "spend" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Spend ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCountryMetric("count")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                    countryMetric === "count" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>

            <div className="h-64">
              {(!graphs?.business_by_country || graphs.business_by_country.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No country records match selected filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphs.business_by_country} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f242f" />
                    <XAxis
                      dataKey="country"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => countryMetric === "spend" ? `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}` : val}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1117", borderColor: "#202636", fontSize: "11px", borderRadius: "8px" }}
                      formatter={(val: any) => [
                        countryMetric === "spend" ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${val} orders`,
                        countryMetric === "spend" ? "Total PO Spend" : "Orders Count"
                      ]}
                    />
                    <Bar
                      dataKey={countryMetric === "spend" ? "total_spend" : "order_count"}
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Graph 2: Best-Selling Products */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Graph 2: Best-Selling Products</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Ranked by Sales Revenue</span>
            </div>

            <div className="h-64">
              {(!graphs?.best_selling_products || graphs.best_selling_products.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No product sales match selected filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={graphs.best_selling_products.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f242f" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      width={100}
                      tickFormatter={(val) => val.length > 14 ? `${val.slice(0, 14)}...` : val}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1117", borderColor: "#202636", fontSize: "11px", borderRadius: "8px" }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Graph 3 (Regular Buyers) & Graph 4 (Sales Trend Over Time) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graph 3: Regular Buyers / Top Clients */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">Graph 3: Regular Buyers & Top Clients</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Total Commercial Spend</span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {(!graphs?.regular_buyers || graphs.regular_buyers.length === 0) ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  No buyer organizations match current filters.
                </div>
              ) : (
                graphs.regular_buyers.map((buyer, idx) => {
                  const maxSpend = graphs.regular_buyers[0].total_spend || 1;
                  const pct = Math.min(100, Math.round((buyer.total_spend / maxSpend) * 100));

                  return (
                    <div key={buyer.company_name} className="p-3 rounded-lg bg-[#0e1117] border border-[#1e2432] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-950 text-purple-300 font-mono text-[10px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-200">{buyer.company_name}</span>
                          <span className="text-slate-400 text-[10px]">({buyer.country})</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ${buyer.total_spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#1b2230] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Total POs: {buyer.total_orders}</span>
                        <span>Completed Deliveries: {buyer.completed_orders}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Graph 4: Sales Over Time */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100">Graph 4: Sales Over Time Trend</h3>
              </div>

              <div className="flex items-center gap-1 bg-[#0e1117] p-1 rounded border border-[#202636]">
                <button
                  type="button"
                  onClick={() => setTimeMetric("revenue")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                    timeMetric === "revenue" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Revenue ($)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeMetric("orders")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                    timeMetric === "orders" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => setTimeMetric("units")}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                    timeMetric === "units" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Units
                </button>
              </div>
            </div>

            <div className="h-64">
              {(!graphs?.sales_over_time || graphs.sales_over_time.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No timeline data available for selected filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphs.sales_over_time} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f242f" />
                    <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => timeMetric === "revenue" ? `$${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}` : val}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1117", borderColor: "#202636", fontSize: "11px", borderRadius: "8px" }}
                      formatter={(val: any) => [
                        timeMetric === "revenue" ? `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : val,
                        timeMetric === "revenue" ? "Sales Revenue" : timeMetric === "orders" ? "Order Count" : "Units Sold"
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={timeMetric === "revenue" ? "revenue" : timeMetric === "orders" ? "order_count" : "units_sold"}
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Graph 5 (Order & Fulfilment Status Distribution) */}
        <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Graph 5: Order & Fulfilment Status Distribution</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Total Live Pipeline</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Chart */}
            <div className="h-56">
              {(!graphs?.order_status_distribution || graphs.order_status_distribution.length === 0) ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No orders match current status filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graphs.order_status_distribution} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f242f" />
                    <XAxis
                      dataKey="status"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      angle={-15}
                      textAnchor="end"
                      tickFormatter={(val) => val.replace(/_/g, " ")}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0e1117", borderColor: "#202636", fontSize: "11px", borderRadius: "8px" }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val} orders (${item.payload.percentage}%)`,
                        "Distribution"
                      ]}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Breakdown Legend & Counts */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(graphs?.order_status_distribution || []).map((s) => (
                <div key={s.status} className="p-2.5 rounded bg-[#0e1117] border border-[#1e2432] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-[11px] truncate">{s.status.replace(/_/g, " ")}</span>
                    <span className="font-mono text-emerald-400 font-bold">{s.count}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Share:</span>
                    <span>{s.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
