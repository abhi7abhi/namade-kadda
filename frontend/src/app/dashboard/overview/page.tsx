"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  FileSpreadsheet,
  Package,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Bot,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { api, AnalyticsDashboardResponse } from "@/lib/api";
import PageGuide from "@/components/PageGuide";
import GettingStartedChecklist from "@/components/GettingStartedChecklist";

export default function OverviewPage() {
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = () => {
    setLoading(true);
    setError(null);
    api.getAnalytics()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard metrics"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#161a23] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-[#161a23] rounded-lg border border-[#232938] animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-[#161a23] rounded-lg border border-[#232938] animate-pulse" />
          <div className="h-72 bg-[#161a23] rounded-lg border border-[#232938] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-lg bg-red-950/20 border border-red-900/40 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-200">Unable to Connect to Backend Database</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{error || "Ensure FastAPI is running on port 8000."}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-[#202736] hover:bg-[#283245] text-slate-200 text-xs font-semibold rounded inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reconnect
        </button>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Sourcing Requests",
      value: data.total_sourcing_requests,
      icon: FileText,
      color: "text-blue-400",
      sub: "Natural language specs",
      href: "/sourcing"
    },
    {
      title: "Open RFQs",
      value: data.open_rfqs,
      icon: FileSpreadsheet,
      color: "text-emerald-400",
      sub: "Supplier broadcasts",
      href: "/quotations"
    },
    {
      title: "Quotations Received",
      value: data.received_quotations,
      icon: TrendingUp,
      color: "text-purple-400",
      sub: "Bids under evaluation",
      href: "/quotations"
    },
    {
      title: "Active Orders",
      value: data.active_orders,
      icon: Package,
      color: "text-amber-400",
      sub: "Contract fulfillment",
      href: "/orders"
    },
    {
      title: "Estimated Spend",
      value: `$${(data.total_spend / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: "text-emerald-400",
      sub: "Committed PO value",
      href: "/analytics"
    },
    {
      title: "Verified Suppliers",
      value: data.total_suppliers,
      icon: Building2,
      color: "text-cyan-400",
      sub: "Audited machine shops",
      href: "/suppliers"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Industrial Procurement Command Center</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              REAL-TIME DATABASE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across industrial sourcing requests, supplier RFQs, quotations, and purchase orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetrics}
            className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href="/agents"
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" /> AI Workspace
          </Link>
        </div>
      </div>

      {/* Per-Page Guide Panel */}
      <PageGuide
        routeKey="overview"
        steps={[
          "Inspect real-time figures across sourcing requests, open RFQs, supplier quotations, and active purchase orders.",
          "Track pending decision queues and urgent approval actions generated by your procurement pipeline.",
          "Launch the 6-agent AI Procurement Workspace or jump straight into discovering verified suppliers."
        ]}
        tip="Click any metric card to jump directly to its ledger, or launch the guided tour any time from the Help Center."
        demoNote="Seeded demo records are displayed until new sourcing requests, quotations, and orders are entered."
      />

      {/* Progress Checklist */}
      <GettingStartedChecklist metrics={data} />

      {/* 6 Metric Cards */}
      <div data-tour="dashboard-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="p-4 rounded-lg bg-[#141821] border border-[#212735] hover:border-[#2f384c] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color} group-hover:scale-110 transition-transform`} />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100">{card.value}</div>
              <p className="text-[10px] text-slate-500 mt-1 truncate">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFQ Status Distribution Chart */}
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">RFQ Status Distribution</h3>
            <span className="text-[10px] font-mono text-slate-500">DATABASE BACKED</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.rfqs_by_status}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#161b24", borderColor: "#2a3243", borderRadius: "6px", fontSize: "11px" }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Chart */}
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">Purchase Order Fulfillment Milestones</h3>
            <span className="text-[10px] font-mono text-slate-500">LIFECYCLE AUDIT</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.orders_by_status}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#161b24", borderColor: "#2a3243", borderRadius: "6px", fontSize: "11px" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
