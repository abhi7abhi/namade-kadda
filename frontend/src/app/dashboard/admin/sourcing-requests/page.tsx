"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Package,
  Calendar,
  DollarSign,
  AlertTriangle,
  X,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  MessageSquare,
  Lock,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  XCircle,
  ExternalLink,
  MapPin,
  TrendingDown
} from "lucide-react";
import { api, AdminSourcingTransactionItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  CONFIRMED: { label: "Confirmed", bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-800/40" },
  PREPARING: { label: "Preparing", bg: "bg-indigo-950/40", text: "text-indigo-400", border: "border-indigo-800/40" },
  IN_PRODUCTION: { label: "In Production", bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-800/40" },
  READY_FOR_DISPATCH: { label: "Ready to Dispatch", bg: "bg-cyan-950/40", text: "text-cyan-400", border: "border-cyan-800/40" },
  READY_TO_SHIP: { label: "Ready to Ship", bg: "bg-cyan-950/40", text: "text-cyan-400", border: "border-cyan-800/40" },
  DISPATCHED: { label: "Dispatched", bg: "bg-sky-950/40", text: "text-sky-400", border: "border-sky-800/40" },
  SHIPPED: { label: "Shipped", bg: "bg-teal-950/40", text: "text-teal-400", border: "border-teal-800/40" },
  IN_TRANSIT: { label: "In Transit", bg: "bg-purple-950/40", text: "text-purple-400", border: "border-purple-800/40" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", bg: "bg-orange-950/40", text: "text-orange-400", border: "border-orange-800/40" },
  DELIVERED: { label: "Delivered", bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/40" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-800/40" }
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  "SETTLED / PAID": { label: "Settled / Paid", bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/40" },
  "ESCROW SECURED": { label: "Escrow Secured", bg: "bg-teal-950/40", text: "text-teal-400", border: "border-teal-800/40" },
  "ESCROW / AUTHORIZED": { label: "Escrow Authorized", bg: "bg-cyan-950/40", text: "text-cyan-400", border: "border-cyan-800/40" },
  "NET 30 / UNPAID": { label: "Net 30 Pending", bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-800/40" },
  "CANCELLED / REFUNDED": { label: "Cancelled / Refunded", bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-800/40" },
  "PENDING": { label: "Payment Pending", bg: "bg-slate-800/50", text: "text-slate-400", border: "border-slate-700/50" }
};

export default function AdminSourcingRequestsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<AdminSourcingTransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [buyerFilter, setBuyerFilter] = useState("ALL");
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [dateRangeFilter, setDateRangeFilter] = useState("ALL");

  // Selected Transaction for Details Drawer
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [activeDetail, setActiveDetail] = useState<AdminSourcingTransactionItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancellation Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Fetch Sourcing Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminSourcingRequests({
        status: statusFilter,
        payment_status: paymentFilter,
        buyer_company: buyerFilter,
        supplier_company: supplierFilter,
        date_range: dateRangeFilter,
        search: searchQuery
      });
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sourcing requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== "ADMIN") {
        router.push("/login");
        return;
      }
      fetchTransactions();
    }
  }, [user, isAuthenticated, authLoading, statusFilter, paymentFilter, buyerFilter, supplierFilter, dateRangeFilter]);

  // Load detail whenever selectedTransactionId changes
  useEffect(() => {
    if (selectedTransactionId) {
      setDetailLoading(true);
      api.getAdminSourcingRequestDetail(selectedTransactionId)
        .then((res) => {
          setActiveDetail(res);
        })
        .catch((err) => {
          setError(err.message || "Failed to load transaction details");
        })
        .finally(() => {
          setDetailLoading(false);
        });
    } else {
      setActiveDetail(null);
    }
  }, [selectedTransactionId]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setBuyerFilter("ALL");
    setSupplierFilter("ALL");
    setDateRangeFilter("ALL");
  };

  // Dynamic filter options from transactions
  const uniqueBuyers = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { if (t.buyer_company_name) s.add(t.buyer_company_name); });
    return Array.from(s).sort();
  }, [transactions]);

  const uniqueSuppliers = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach(t => { if (t.supplier_name) s.add(t.supplier_name); });
    return Array.from(s).sort();
  }, [transactions]);

  // Telemetry counts
  const telemetry = useMemo(() => {
    const total = transactions.length;
    const gmv = transactions.reduce((acc, t) => acc + (t.total_amount || 0), 0);
    const active = transactions.filter(t => ["CONFIRMED", "PREPARING", "IN_PRODUCTION", "READY_FOR_DISPATCH", "READY_TO_SHIP"].includes(t.order_status)).length;
    const inTransit = transactions.filter(t => ["DISPATCHED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(t.order_status)).length;
    const delivered = transactions.filter(t => t.order_status === "DELIVERED").length;
    const cancelled = transactions.filter(t => t.order_status === "CANCELLED").length;
    return { total, gmv, active, inTransit, delivered, cancelled };
  }, [transactions]);

  // Handle Cancel Trade Confirmation Submit
  const handleConfirmCancelTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetail) return;
    if (!cancellationReason.trim()) {
      setCancelError("Please enter a specific reason for administrative trade cancellation.");
      return;
    }
    if (cancellationReason.trim().length < 8) {
      setCancelError("Cancellation reason must be at least 8 characters long for audit records.");
      return;
    }

    setIsCancelling(true);
    setCancelError(null);
    try {
      const updated = await api.cancelAdminTrade(activeDetail.id, cancellationReason.trim());
      setSuccessMsg(`Trade ${updated.order_code} has been successfully cancelled by Platform Administration.`);
      setActiveDetail(updated);
      setIsCancelModalOpen(false);
      setCancellationReason("");
      // Refresh list
      await fetchTransactions();
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel trade. Check order status or permissions.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PageGuide
        routeKey="admin-sourcing"
        title="Admin Sourcing Requests"
        description="Monitor, audit, and administer B2B sourcing transactions and contract execution between enterprise buyers and verified suppliers."
        tip="Use filters to monitor trades by order status, payment status, or company. Pre-dispatch trades can be cancelled with mandatory audit reasons."
        badge="Admin Workspace"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#1f242f] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold font-mono text-slate-100">Sourcing Requests</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time audit, execution telemetry, and administrative management of B2B transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchTransactions();
              if (selectedTransactionId) {
                api.getAdminSourcingRequestDetail(selectedTransactionId).then(setActiveDetail).catch(() => {});
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white bg-[#161a23] hover:bg-[#1f242f] border border-[#232938] rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs font-mono text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-[#11141b] border border-[#1f242f] rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Transactions</span>
          <p className="text-lg font-bold font-mono text-slate-100">{telemetry.total}</p>
          <span className="text-[10px] font-mono text-slate-500">${(telemetry.gmv).toLocaleString()} GMV</span>
        </div>
        <div className="p-3.5 bg-[#11141b] border border-[#1f242f] rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-amber-400">In Production</span>
          <p className="text-lg font-bold font-mono text-amber-300">{telemetry.active}</p>
          <span className="text-[10px] font-mono text-slate-500">Active contracts</span>
        </div>
        <div className="p-3.5 bg-[#11141b] border border-[#1f242f] rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-sky-400">In Transit</span>
          <p className="text-lg font-bold font-mono text-sky-300">{telemetry.inTransit}</p>
          <span className="text-[10px] font-mono text-slate-500">Dispatched shipments</span>
        </div>
        <div className="p-3.5 bg-[#11141b] border border-[#1f242f] rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Delivered</span>
          <p className="text-lg font-bold font-mono text-emerald-300">{telemetry.delivered}</p>
          <span className="text-[10px] font-mono text-slate-500">Fulfilled orders</span>
        </div>
        <div className="p-3.5 bg-[#11141b] border border-[#1f242f] rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-rose-400">Cancelled</span>
          <p className="text-lg font-bold font-mono text-rose-300">{telemetry.cancelled}</p>
          <span className="text-[10px] font-mono text-slate-500">Terminated trades</span>
        </div>
        <div className="p-3.5 bg-[#11141b] border border-[#1f242f] rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-teal-400">Escrow Security</span>
          <p className="text-lg font-bold font-mono text-teal-300">100%</p>
          <span className="text-[10px] font-mono text-slate-500">Protected trades</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#11141b] border border-[#1f242f] rounded-xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Order ID (PO-...), RFQ ID, Product Name, Buyer Company, or Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-medium transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-2 bg-[#161a23] hover:bg-[#1f242f] text-slate-400 hover:text-slate-200 border border-[#232938] rounded-lg text-xs font-mono transition-colors"
          >
            Reset
          </button>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 border-t border-[#1f242f]">
          {/* Order Status */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="READY_TO_SHIP">Ready to Ship</option>
              <option value="SHIPPED">Shipped</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="SETTLED">Settled / Paid</option>
              <option value="ESCROW">Escrow Secured</option>
              <option value="NET 30">Net 30 Pending</option>
              <option value="REFUNDED">Cancelled / Refunded</option>
            </select>
          </div>

          {/* Buyer Company */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Buyer Company</label>
            <select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Buyers ({uniqueBuyers.length})</option>
              {uniqueBuyers.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Supplier Company */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Supplier Company</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Suppliers ({uniqueSuppliers.length})</option>
              {uniqueSuppliers.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Date Range</label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500/60"
            >
              <option value="ALL">All Time</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sourcing Requests List / Table */}
      <div className="bg-[#11141b] border border-[#1f242f] rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-xs font-mono text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-emerald-400" />
            Loading sourcing requests and transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-16 text-center text-xs font-mono text-slate-500 space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No Sourcing Transactions Found</p>
            <p className="max-w-md mx-auto text-slate-500 text-[11px]">
              No transactions match the specified filter or search query. Reset filters to view all sourcing requests.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f242f] bg-[#161a23]/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Related RFQ</th>
                  <th className="py-3 px-4">Buyer Company</th>
                  <th className="py-3 px-4">Supplier Company</th>
                  <th className="py-3 px-4">Product & Spec</th>
                  <th className="py-3 px-4 text-right">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Delivery Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f242f] text-xs font-mono">
                {transactions.map((tr) => {
                  const statusMeta = STATUS_CONFIG[tr.order_status] || {
                    label: tr.order_status,
                    bg: "bg-slate-800",
                    text: "text-slate-300",
                    border: "border-slate-700"
                  };
                  const payMeta = PAYMENT_STATUS_CONFIG[tr.payment_status] || PAYMENT_STATUS_CONFIG["PENDING"];

                  return (
                    <tr
                      key={tr.id}
                      className="hover:bg-[#161a23]/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTransactionId(tr.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-500/80" />
                        <span>{tr.order_code}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tr.rfq_code ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-[#1a202c] border border-slate-700/60 text-slate-300 font-mono">
                            {tr.rfq_code}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Direct PO</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[130px]" title={tr.buyer_company_name}>
                            {tr.buyer_company_name}
                          </span>
                        </div>
                        {tr.buyer_country && (
                          <span className="text-[10px] text-slate-500 pl-5">{tr.buyer_country}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
                          <span className="truncate max-w-[130px]" title={tr.supplier_name}>
                            {tr.supplier_name}
                          </span>
                        </div>
                        {tr.supplier_country && (
                          <span className="text-[10px] text-slate-500 pl-5">{tr.supplier_country}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 font-medium truncate max-w-[160px]" title={tr.product_name}>
                          {tr.product_name}
                        </p>
                        {tr.product_description && tr.product_description !== tr.product_name && (
                          <p className="text-[10px] text-slate-500 truncate max-w-[160px]">
                            {tr.product_description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        {tr.quantity.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        ${tr.unit_price.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                        ${tr.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-[10px] text-slate-500 ml-1">{tr.currency}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${payMeta.bg} ${payMeta.text} ${payMeta.border}`}>
                          {payMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {tr.expected_delivery_date
                          ? new Date(tr.expected_delivery_date).toLocaleDateString()
                          : "Standard Lead"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransactionId(tr.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2e3748] rounded transition-colors inline-flex items-center gap-1"
                        >
                          Details
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TRANSACTION DETAILS SLIDE-OVER DRAWER (SECTION 1B & 1C) */}
      {selectedTransactionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-end overflow-hidden">
          <div className="bg-[#11141b] border-l border-[#1f242f] w-full max-w-2xl h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#1f242f] bg-[#161a23] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
                    <span>{activeDetail?.order_code || "Transaction Detail"}</span>
                    {activeDetail && (
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${
                        (STATUS_CONFIG[activeDetail.order_status] || STATUS_CONFIG.CONFIRMED).bg
                      } ${
                        (STATUS_CONFIG[activeDetail.order_status] || STATUS_CONFIG.CONFIRMED).text
                      } ${
                        (STATUS_CONFIG[activeDetail.order_status] || STATUS_CONFIG.CONFIRMED).border
                      }`}>
                        {activeDetail.order_status}
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] font-mono text-slate-400">
                    Sourcing Contract & Operational Audit Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTransactionId(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-[#1f242f]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            {detailLoading || !activeDetail ? (
              <div className="p-16 text-center text-xs font-mono text-slate-500 flex-1 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin mb-3 text-emerald-400" />
                Loading complete transaction audit records...
              </div>
            ) : (
              <div className="p-6 space-y-6 flex-1 text-xs font-mono">
                {/* Status & GMV Overview Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#161a23]/70 border border-[#232938] rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Total Value</span>
                    <span className="text-sm font-bold text-slate-100">
                      ${activeDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeDetail.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Payment Status</span>
                    <span className="text-xs font-medium text-emerald-400">
                      {activeDetail.payment_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Created Date</span>
                    <span className="text-slate-300">
                      {activeDetail.created_at ? new Date(activeDetail.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Expected Delivery</span>
                    <span className="text-slate-300">
                      {activeDetail.expected_delivery_date
                        ? new Date(activeDetail.expected_delivery_date).toLocaleDateString()
                        : "Standard"}
                    </span>
                  </div>
                </div>

                {/* Buyer & Supplier Company Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Buyer Card */}
                  <div className="p-4 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold border-b border-[#232938] pb-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>Purchasing Buyer Entity</span>
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <p className="font-bold text-sm text-slate-100">{activeDetail.buyer_company_name}</p>
                      <p className="text-slate-400">Country: {activeDetail.buyer_country || "India"}</p>
                      <p className="text-slate-400">Contact: {activeDetail.buyer_name || "Enterprise Procurement"}</p>
                      <p className="text-slate-500 text-[11px] truncate">Email: {activeDetail.buyer_email || "buyer@namadekadda.com"}</p>
                    </div>
                  </div>

                  {/* Supplier Card */}
                  <div className="p-4 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold border-b border-[#232938] pb-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>Manufacturing Supplier</span>
                    </div>
                    <div className="space-y-1 text-slate-300">
                      <p className="font-bold text-sm text-slate-100">{activeDetail.supplier_name}</p>
                      <p className="text-slate-400">Country: {activeDetail.supplier_country || "India"}</p>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{activeDetail.supplier_verification_status || "VERIFIED SELLER"}</span>
                      </div>
                      {activeDetail.supplier_email && (
                        <p className="text-slate-500 text-[11px] truncate">Email: {activeDetail.supplier_email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contracted Products & Line Items */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-400" />
                    Contracted Line Items ({activeDetail.items.length})
                  </h3>
                  <div className="border border-[#232938] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#161a23] text-slate-400 border-b border-[#232938]">
                        <tr>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#232938] bg-[#11141b]">
                        {activeDetail.items.map((it) => (
                          <tr key={it.id}>
                            <td className="py-2.5 px-3 font-medium text-slate-200">{it.item_name}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300">{it.quantity.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300">${it.unit_price.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                              ${it.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accepted Quotation & RFQ Specification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Accepted Quotation Terms */}
                  <div className="p-3.5 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-[#232938] pb-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                      Accepted Quotation Details
                    </h4>
                    {activeDetail.quotation ? (
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <p><span className="text-slate-400">Quote ID:</span> <strong className="text-cyan-300">{activeDetail.quotation.quote_code}</strong></p>
                        <p><span className="text-slate-400">Payment Terms:</span> {activeDetail.quotation.payment_terms || "Net 30, EXW Factory"}</p>
                        <p><span className="text-slate-400">Incoterms:</span> {activeDetail.quotation.incoterms || "FOB"}</p>
                        <p><span className="text-slate-400">Lead Time:</span> {activeDetail.quotation.lead_time_days} days</p>
                        <p><span className="text-slate-400">Warranty:</span> {activeDetail.quotation.warranty_info || "12 Months Standard"}</p>
                        <p><span className="text-slate-400">Packaging:</span> {activeDetail.quotation.packaging_details || "Export Crating"}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px]">Direct purchase order issued without formal quote docket.</p>
                    )}
                  </div>

                  {/* Relevant RFQ Details */}
                  <div className="p-3.5 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-[#232938] pb-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Related RFQ Sourcing Requisition
                    </h4>
                    {activeDetail.rfq ? (
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <p><span className="text-slate-400">RFQ Code:</span> <strong className="text-amber-300">{activeDetail.rfq.rfq_code}</strong></p>
                        <p><span className="text-slate-400">Requisition Title:</span> {activeDetail.rfq.title}</p>
                        <p><span className="text-slate-400">Status:</span> <span className="text-emerald-400">{activeDetail.rfq.status}</span></p>
                        {activeDetail.rfq.issue_date && (
                          <p><span className="text-slate-400">Issued On:</span> {new Date(activeDetail.rfq.issue_date).toLocaleDateString()}</p>
                        )}
                        {activeDetail.rfq.notes && (
                          <p className="text-slate-400 text-[10px] mt-1 line-clamp-2">Specs: {activeDetail.rfq.notes}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px]">No external RFQ docket linked to this direct transaction.</p>
                    )}
                  </div>
                </div>

                {/* Negotiation History */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    Negotiation History ({activeDetail.negotiations.length} records)
                  </h3>
                  {activeDetail.negotiations.length > 0 ? (
                    <div className="p-3 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2.5 max-h-48 overflow-y-auto">
                      {activeDetail.negotiations.map((neg) => {
                        const isBuyer = neg.sender_role === "BUYER";
                        return (
                          <div key={neg.id} className="p-2.5 bg-[#11141b] border border-[#1f242f] rounded-lg text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-bold ${isBuyer ? "text-blue-400" : "text-emerald-400"}`}>
                                {neg.sender_name} ({neg.sender_role})
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {neg.created_at ? new Date(neg.created_at).toLocaleString() : ""}
                              </span>
                            </div>
                            <p className="text-slate-300">{neg.message}</p>
                            {neg.proposed_price && (
                              <p className="text-[10px] text-amber-300">
                                Proposed Price: ${neg.proposed_price} {neg.proposed_quantity ? `· Qty: ${neg.proposed_quantity}` : ""}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-[#161a23]/30 border border-[#232938] rounded-xl text-slate-500 text-center text-[11px]">
                      No pre-order contract negotiations recorded for this transaction.
                    </div>
                  )}
                </div>

                {/* Delivery Address & Fulfilment Details */}
                <div className="p-3.5 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-[#232938] pb-1">
                    <Truck className="w-3.5 h-3.5 text-teal-400" />
                    Fulfillment & Logistics Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Shipping Destination:</span>
                      <p className="text-slate-200 font-medium">
                        {activeDetail.shipping_address || "Industrial Tech Park, Whitefield, Bangalore, India 560066"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">Tracking Number:</span>
                      <p className="font-mono text-emerald-400">
                        {activeDetail.tracking_number || "Awaiting dispatch assignment"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery Status History Audit Trail */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Delivery & Status Audit Trail ({activeDetail.history.length})
                  </h3>
                  <div className="p-3 bg-[#161a23]/40 border border-[#232938] rounded-xl space-y-2 max-h-48 overflow-y-auto">
                    {activeDetail.history.length > 0 ? (
                      activeDetail.history.map((h) => (
                        <div key={h.id} className="text-[11px] text-slate-300 flex items-start gap-2 border-b border-[#1f242f] pb-2 last:border-0 last:pb-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-200">
                                {h.previous_status ? `${h.previous_status} → ` : ""}{h.new_status}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {h.created_at ? new Date(h.created_at).toLocaleString() : ""}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">By: {h.changed_by}</p>
                            {h.notes && <p className="text-[11px] text-slate-300 mt-0.5">{h.notes}</p>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center text-[11px]">Initial order confirmation record.</p>
                    )}
                  </div>
                </div>

                {/* SECTION 1C: CANCEL TRADE ACTION */}
                <div className="pt-4 border-t border-[#1f242f]">
                  {activeDetail.is_cancellable ? (
                    <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Administrative Trade Cancellation</span>
                          </div>
                          <p className="text-slate-400 text-[11px]">
                            Platform Administrators may terminate this sourcing transaction prior to shipment dispatch.
                            Cancelling this trade will immediately notify the buyer and supplier, mark the order as Cancelled,
                            and record this action in the permanent platform audit log.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCancelError(null);
                            setCancellationReason("");
                            setIsCancelModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-mono font-bold transition-colors shrink-0 flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel Trade
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-[#161a23] border border-[#232938] rounded-xl text-slate-400 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Direct Cancellation Not Permitted</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {activeDetail.order_status === "CANCELLED"
                          ? `This trade was cancelled. ${activeDetail.cancellation_reason ? `Audit note: "${activeDetail.cancellation_reason}"` : ""}`
                          : activeDetail.order_status === "DELIVERED"
                          ? "This trade has been fulfilled and delivered. Direct trade cancellation is disabled; dispute or refund handling must be managed under Platform Complaint Management."
                          : "This trade is already dispatched or in transit. Physical shipment cannot be cancelled directly; please manage post-dispatch claims under Complaint Management."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CANCEL TRADE (SECTION 1C) */}
      {isCancelModalOpen && activeDetail && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-[#11141b] border border-rose-900/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            <div className="px-6 py-4 border-b border-rose-950/60 bg-rose-950/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-mono">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Confirm Trade Cancellation: {activeDetail.order_code}
                </h3>
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancelTrade} className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-slate-300 text-[11px] space-y-1">
                <p className="font-bold text-rose-300">Are you sure you want to terminate this sourcing trade?</p>
                <p className="text-slate-400">
                  Transaction <strong>{activeDetail.order_code}</strong> between <strong>{activeDetail.buyer_company_name}</strong> and <strong>{activeDetail.supplier_name}</strong> for ${activeDetail.total_amount.toLocaleString()} will be terminated immediately.
                </p>
              </div>

              {cancelError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-lg text-rose-300 text-[11px]">
                  {cancelError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Cancellation Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide an explicit administrative reason (e.g., Mutual contract termination agreement, Non-compliance with material grade tolerances, Duplicate purchase order issued)..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500">
                  This note will be permanently recorded in the Platform Audit Trail and shown to both counterparties.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1f242f]">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-[#161a23] hover:bg-[#1f242f] text-slate-300 border border-[#232938] rounded-lg font-mono text-xs transition-colors"
                >
                  Dismiss / Keep Trade
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || !cancellationReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/40 disabled:text-rose-400/50 text-white rounded-lg font-mono text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                >
                  {isCancelling ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Terminating...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Confirm Trade Cancellation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
