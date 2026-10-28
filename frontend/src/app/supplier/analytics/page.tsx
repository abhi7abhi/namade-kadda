"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  ShieldCheck,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  FileSpreadsheet,
  Info,
  Globe,
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  Percent,
  Search,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { api, SupplierAnalyticsData } from "@/lib/api";

export default function SupplierAnalyticsPage() {
  const [data, setData] = useState<SupplierAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState("ALL_TIME");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [productSearch, setProductSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load seller analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await api.downloadSupplierAnalyticsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `namade_kadda_supplier_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (e: any) {
      alert("Failed to export analytics CSV: " + (e?.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  // Filtered Product Performance
  const filteredProducts = useMemo(() => {
    if (!data?.product_performance) return [];
    return data.product_performance.filter((item) => {
      const matchesCategory =
        categoryFilter === "ALL" ||
        item.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesSearch =
        !productSearch ||
        item.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(productSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [data, categoryFilter, productSearch]);

  // Total Country Revenue
  const totalCountryRevenue = useMemo(() => {
    if (!data?.revenue_by_country) return 0;
    return Object.values(data.revenue_by_country).reduce((sum, v) => sum + v, 0);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0b0d11] text-zinc-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/50 rounded-lg text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Seller Analytics & Commercial Telemetry
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time commercial performance metrics, RFQ conversion rates, sales execution telemetry and trade distribution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {exportSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> CSV Exported Successfully
            </span>
          )}

          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Generating CSV..." : "Export Analytics CSV"}
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs transition"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-zinc-400 font-medium">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filters:</span>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL_TIME">All Time (Historical)</option>
              <option value="LAST_30">Last 30 Days</option>
              <option value="LAST_90">Last 90 Days</option>
              <option value="LAST_180">Last 6 Months</option>
              <option value="YTD">Year to Date (2026)</option>
            </select>
          </div>

          {/* Country Filter */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Destination Countries</option>
              <option value="United States">United States</option>
              <option value="Germany">Germany</option>
              <option value="India">India</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Product Categories</option>
              <option value="CNC Machining">CNC Machining</option>
              <option value="Sheet Metal">Sheet Metal Fabrication</option>
              <option value="Die Casting">Die Casting</option>
              <option value="Fasteners">Industrial Fasteners</option>
              <option value="Electronics">Electrical Enclosures</option>
            </select>
          </div>

          {(dateRange !== "ALL_TIME" || countryFilter !== "ALL" || categoryFilter !== "ALL") && (
            <button
              onClick={() => {
                setDateRange("ALL_TIME");
                setCountryFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="text-xs text-zinc-400 hover:text-white underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && !data && (
        <div className="p-12 text-center bg-[#11141b] border border-zinc-800 rounded-xl">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Loading commercial telemetry and sales analytics...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-950/40 border border-red-800/60 rounded-xl text-center mb-6">
          <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-200">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-4 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-xs"
          >
            Retry Loading
          </button>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Section 1: Financial Telemetry & Distinct State Demarcation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Commercial Value Demarcation
              </h2>
              <span className="text-[11px] text-zinc-500">
                Audited against database records
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Quoted */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">1. Total Quoted Value</span>
                  <div className="p-1.5 bg-blue-950/50 border border-blue-800/40 rounded text-blue-400">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  ${data.total_quoted_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                  Sum of active & pending supplier quotations submitted
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-400 bg-blue-950/30 px-2 py-1 rounded border border-blue-900/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Active quotes awaiting buyer acceptance
                </div>
              </div>

              {/* Accepted Order Value */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">2. Accepted Order Value</span>
                  <div className="p-1.5 bg-emerald-950/50 border border-emerald-800/40 rounded text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-2">
                  ${data.accepted_order_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                  Legally binding Purchase Orders issued by buyers
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Includes active production contracts
                </div>
              </div>

              {/* Delivered Sales Value */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-medium">3. Actual Sales / Delivered</span>
                  <div className="p-1.5 bg-purple-950/50 border border-purple-800/40 rounded text-purple-400">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-300 mt-2">
                  ${data.delivered_sales_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                  Fulfilled orders marked as DELIVERED by recipient
                </p>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-purple-400 bg-purple-950/30 px-2 py-1 rounded border border-purple-900/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  Completed fulfilment milestone
                </div>
              </div>

              {/* Payments Received (Demarcated Boundary) */}
              <div className="bg-[#11141b] border border-amber-900/40 rounded-xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-amber-300 font-medium">4. Payments Received</span>
                  <div className="p-1.5 bg-amber-950/60 border border-amber-700/50 rounded text-amber-400">
                    <Info className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-400 mt-2">
                  $0.00
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0.5 bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[10px] rounded font-medium">
                    Payment data not configured
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">
                  Off-platform settlement mode: Payment gateway integrations (Escrow / Wire) pending enterprise configuration.
                </p>
              </div>
            </div>
          </div>

          {/* Operational Efficiency & Conversion KPIs */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Operational & Conversion Efficiency (Metrics 5–8 & 11)
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {/* Metric 5: Incoming RFQs */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-zinc-400">5. Incoming RFQs</span>
                <div className="text-xl font-bold text-white mt-1">
                  {data.incoming_rfqs_count}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-zinc-400">
                  <span className="text-emerald-400 font-medium">{data.rfq_status_counts?.QUOTED || 0} Quoted</span>
                  <span>•</span>
                  <span>{data.rfq_status_counts?.NEW || 0} New</span>
                  <span>•</span>
                  <span>{data.rfq_status_counts?.DECLINED || 0} Declined</span>
                </div>
              </div>

              {/* Metric 6: Quotation Acceptance Rate */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-zinc-400">6. Acceptance Rate</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {data.quotation_acceptance_rate}%
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
                  <Percent className="w-3 h-3 text-emerald-400" />
                  <span>PO conversion ratio</span>
                </div>
              </div>

              {/* Metric 7: Response Time */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-zinc-400">7. Avg Quote Response</span>
                <div className="text-xl font-bold text-white mt-1">
                  {data.average_response_time_hours} hrs
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-400">
                  <Clock className="w-3 h-3" />
                  <span>Target: &lt; 24 hrs</span>
                </div>
              </div>

              {/* Metric 8: On-Time Delivery */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-zinc-400">8. On-Time Delivery</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {data.on_time_delivery_rate}%
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SLA compliance score</span>
                </div>
              </div>

              {/* Metric 11: Pending Fulfilment */}
              <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-3.5 col-span-2 md:col-span-1">
                <span className="text-[11px] text-zinc-400">11. Pending Fulfilment</span>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {data.pending_fulfilment_count} Active Orders
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400/90">
                  <Package className="w-3 h-3" />
                  <span>Orders in production/dispatch</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visual Telemetry Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Recharts BarChart */}
            <div className="lg:col-span-2 bg-[#11141b] border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                    Monthly Commercial Performance Trend (USD)
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Comparing Quoted Pipeline vs Accepted POs vs Delivered Milestones
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> Quoted
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Accepted
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> Delivered
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.sales_trend}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2430" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161a23",
                        borderColor: "#27272a",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#fff"
                      }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                    />
                    <Bar dataKey="quoted_value" fill="#3b82f6" name="Quoted" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="accepted_value" fill="#10b981" name="Accepted" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="delivered_value" fill="#a855f7" name="Delivered" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Metric 10: Revenue by Country Breakdown */}
            <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    10. Revenue by Country
                  </h3>
                  <span className="text-[11px] text-zinc-500">
                    Total: ${totalCountryRevenue.toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-4">
                  Export destination volume across verified buyer territories.
                </p>

                <div className="space-y-3.5">
                  {Object.entries(data.revenue_by_country || {}).map(([country, amount]) => {
                    const pct =
                      totalCountryRevenue > 0
                        ? Math.round((amount / totalCountryRevenue) * 100)
                        : 0;
                    return (
                      <div key={country} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {country}
                          </span>
                          <span className="text-zinc-400 font-mono">
                            ${amount.toLocaleString()} <span className="text-zinc-500 text-[10px]">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>International Port Distribution</span>
                <span className="text-emerald-400 font-medium">5 Target Markets</span>
              </div>
            </div>
          </div>

          {/* Section 3: Metric 9 Product Performance Table */}
          <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  9. Product Performance & Sourcing Funnel
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Catalogue engagement, RFQ inquiries and sales conversion rates per SKU
                </p>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 bg-zinc-900/50">
                    <th className="py-2.5 px-3 font-medium">Product / Component</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium text-right">Views</th>
                    <th className="py-2.5 px-3 font-medium text-right">RFQs Received</th>
                    <th className="py-2.5 px-3 font-medium text-right">Quotes Sent</th>
                    <th className="py-2.5 px-3 font-medium text-right">Orders Converted</th>
                    <th className="py-2.5 px-3 font-medium text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No product metrics match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30 transition">
                        <td className="py-3 px-3 font-medium text-zinc-200">
                          {p.product_name}
                        </td>
                        <td className="py-3 px-3 text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] text-zinc-300">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-300">
                          {p.views.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-blue-400">
                          {p.rfqs_received}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-amber-400">
                          {p.quotes_sent}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                          {p.orders_converted}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                            {p.conversion_rate}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
