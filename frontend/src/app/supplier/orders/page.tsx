"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  ClipboardList,
  Eye,
  MessageSquare,
  AlertTriangle,
  X,
  History,
  CheckCircle,
  ArrowUpRight
} from "lucide-react";
import { api, Order } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function SupplierOrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("NEWEST");

  // Detail Modal Drawer
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Update Status Modal
  const [activeOrderForUpdate, setActiveOrderForUpdate] = useState<Order | null>(null);
  const [nextStatus, setNextStatus] = useState("IN_PRODUCTION");
  const [productionNotes, setProductionNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierOrders();
      setOrders(res);
      // If modal is open, refresh selected order detail
      if (selectedOrderDetail) {
        const refreshed = res.find((o) => o.id === selectedOrderDetail.id);
        if (refreshed) setSelectedOrderDetail(refreshed);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load supplier purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, authLoading, router]);

  const handleOpenStatusModal = (o: Order) => {
    setActiveOrderForUpdate(o);
    // Suggest logical next status
    if (o.status === "CONFIRMED") setNextStatus("IN_PRODUCTION");
    else if (o.status === "PREPARING" || o.status === "IN_PRODUCTION") setNextStatus("READY_FOR_DISPATCH");
    else if (o.status === "READY_FOR_DISPATCH" || o.status === "READY_TO_SHIP") setNextStatus("DISPATCHED");
    else if (o.status === "DISPATCHED" || o.status === "SHIPPED") setNextStatus("IN_TRANSIT");
    else if (o.status === "IN_TRANSIT") setNextStatus("OUT_FOR_DELIVERY");
    else if (o.status === "OUT_FOR_DELIVERY") setNextStatus("DELIVERED");
    else setNextStatus(o.status);

    setTrackingNumber(o.tracking_number || `EXP-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`);
    setExpectedDate(o.expected_delivery_date ? o.expected_delivery_date.split("T")[0] : "");
    setProductionNotes("");
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderForUpdate) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      await api.updateSupplierOrderStatus(activeOrderForUpdate.id, {
        new_status: nextStatus,
        production_notes: productionNotes.trim() || undefined,
        notes: productionNotes.trim() || undefined,
        tracking_number: trackingNumber.trim() || undefined,
        expected_delivery_date: expectedDate ? new Date(expectedDate).toISOString() : undefined
      });
      setSuccess(`Order ${activeOrderForUpdate.order_code} advanced to ${nextStatus}. Synchronized with buyer timeline.`);
      setActiveOrderForUpdate(null);
      fetchOrders();
    } catch (err: any) {
      setError(err.message || "Failed to update order milestone");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-950/80 text-blue-300 border-blue-800/60";
      case "PREPARING":
      case "IN_PRODUCTION":
        return "bg-amber-950/80 text-amber-300 border-amber-800/60";
      case "READY_FOR_DISPATCH":
      case "READY_TO_SHIP":
        return "bg-purple-950/80 text-purple-300 border-purple-800/60";
      case "DISPATCHED":
      case "SHIPPED":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800/60";
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-800/60";
      case "DELIVERED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/60";
      case "DELIVERY_EXCEPTION":
        return "bg-red-950/80 text-red-300 border-red-800/60";
      case "CANCELLED":
        return "bg-rose-950/80 text-rose-300 border-rose-800/60";
      default:
        return "bg-slate-900 text-slate-300 border-[#2a3447]";
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => {
      const matchStatus =
        statusFilter === "ALL" ||
        o.status === statusFilter ||
        (statusFilter === "IN_PRODUCTION" && (o.status === "IN_PRODUCTION" || o.status === "PREPARING")) ||
        (statusFilter === "DISPATCHED" && (o.status === "DISPATCHED" || o.status === "SHIPPED"));

      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        o.order_code.toLowerCase().includes(term) ||
        (o.buyer_company_name && o.buyer_company_name.toLowerCase().includes(term)) ||
        (o.tracking_number && o.tracking_number.toLowerCase().includes(term)) ||
        o.items.some((it) => it.item_name.toLowerCase().includes(term));

      return matchStatus && matchSearch;
    });

    if (sortBy === "NEWEST") {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "OLDEST") {
      result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "VALUE_DESC") {
      result.sort((a, b) => b.total_amount - a.total_amount);
    }

    return result;
  }, [orders, statusFilter, searchTerm, sortBy]);

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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageGuide
        badge="ORDER & FULFILLMENT"
        title="Purchase Orders & Shop-Floor Fulfillment"
        description="Advance binding purchase order milestones from production through dispatch and delivery. Status updates immediately reflect on the buyer's tracking timeline."
        tip="Entering carrier dispatch tracking references enables automated delivery ETA tracking for international customs clearance."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <span>Order & Fulfillment</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contractual purchase orders awarded to your enterprise. Audit fulfillment progress and update delivery milestones.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Orders", count: orders.length },
            { id: "CONFIRMED", label: "Confirmed", count: orders.filter((o) => o.status === "CONFIRMED").length },
            { id: "IN_PRODUCTION", label: "In Production", count: orders.filter((o) => o.status === "IN_PRODUCTION" || o.status === "PREPARING").length },
            { id: "READY_FOR_DISPATCH", label: "Ready for Dispatch", count: orders.filter((o) => o.status === "READY_FOR_DISPATCH" || o.status === "READY_TO_SHIP").length },
            { id: "DISPATCHED", label: "Dispatched", count: orders.filter((o) => o.status === "DISPATCHED" || o.status === "SHIPPED").length },
            { id: "IN_TRANSIT", label: "In Transit", count: orders.filter((o) => o.status === "IN_TRANSIT" || o.status === "OUT_FOR_DELIVERY").length },
            { id: "DELIVERED", label: "Delivered", count: orders.filter((o) => o.status === "DELIVERED").length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-[#0e1117] text-slate-400 hover:text-slate-200 hover:bg-[#181d27] border border-[#212838]"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${statusFilter === tab.id ? "bg-emerald-800 text-white" : "bg-[#1b2230] text-slate-400"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#1e2432]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order code, buyer, item, or tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="VALUE_DESC">Highest Total Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-[#141821] rounded-xl border border-[#212735]">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading purchase orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#141821] rounded-xl border border-[#212735]">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No matching purchase orders</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No orders found matching the filter criteria. Adjust your search or clear filters to view all orders.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const stages = [
              "CONFIRMED",
              "IN_PRODUCTION",
              "READY_FOR_DISPATCH",
              "DISPATCHED",
              "IN_TRANSIT",
              "DELIVERED"
            ];
            const currentIdx = stages.findIndex((s) => {
              if (order.status === "PREPARING" && s === "IN_PRODUCTION") return true;
              if (order.status === "READY_TO_SHIP" && s === "READY_FOR_DISPATCH") return true;
              if (order.status === "SHIPPED" && s === "DISPATCHED") return true;
              if (order.status === "OUT_FOR_DELIVERY" && s === "IN_TRANSIT") return true;
              return s === order.status;
            });

            return (
              <div
                key={order.id}
                className="p-5 rounded-xl bg-[#141821] border border-[#212735] hover:border-[#2f394d] transition-all space-y-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2432]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-base font-bold text-emerald-400">{order.order_code}</span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${getStatusBadge(order.status)}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    {order.tracking_number && (
                      <span className="px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 font-mono text-[10px] border border-[#2a3447]">
                        Tracking: {order.tracking_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">PO Total:</span>
                    <span className="text-base font-bold font-mono text-slate-100">
                      ${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {order.currency}
                    </span>
                  </div>
                </div>

                {/* Fulfilment Stepper */}
                <div className="pt-1 pb-2">
                  <div className="grid grid-cols-6 gap-1.5 text-center text-[10px] font-mono">
                    {stages.map((stage, idx) => {
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={stage} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isComplete ? "bg-emerald-500" : "bg-[#1c2230]"
                            } ${isCurrent ? "animate-pulse ring-2 ring-emerald-400/30" : ""}`}
                          />
                          <span className={isCurrent ? "text-emerald-400 font-bold" : isComplete ? "text-slate-300" : "text-slate-600"}>
                            {stage.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Details & Destination Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
                  {/* Buyer Organization */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Buyer Organization</span>
                    <div className="flex items-center gap-1.5 text-slate-100 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{order.buyer_company_name || "Enterprise Client"}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1 pt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{order.buyer_country || "Global"}</span>
                      {order.buyer_name && <span className="text-slate-500">· {order.buyer_name}</span>}
                    </p>
                    <p className="text-slate-500 text-[10px] pt-1 truncate">
                      Dest: {order.shipping_address || "Standard Industrial Port Hub"}
                    </p>
                  </div>

                  {/* Production Items */}
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Order Line Items</span>
                    <div className="space-y-1.5">
                      {(order.items && order.items.length > 0 ? order.items : [
                        { id: 1, item_name: "Custom CNC Machined Component Batch", quantity: 500, unit_price: order.total_amount / 500, total_price: order.total_amount }
                      ]).map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-slate-300 bg-[#0e1117] p-2 rounded border border-[#1e2432]">
                          <span className="font-medium truncate max-w-sm">{it.item_name}</span>
                          <span className="font-mono text-emerald-400 font-semibold text-right">
                            {it.quantity.toLocaleString()} units · ${(it.unit_price || 0).toFixed(2)}/ea
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="pt-3 border-t border-[#1e2432] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
                    <span>Issued: {new Date(order.created_at).toLocaleDateString()}</span>
                    <span>Expected Delivery: <strong className="text-slate-200">
                      {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "Scheduled"}
                    </strong></span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/supplier/negotiations?order_id=${order.id}`}
                      className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#212937] text-slate-200 border border-[#252e3e] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>Negotiate</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetail(order)}
                      className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#212937] text-slate-200 border border-[#252e3e] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Details</span>
                    </button>

                    {order.status === "CANCELLED" ? (
                      <span className="px-3 py-1.5 rounded bg-rose-950/50 text-rose-300 border border-rose-800/50 text-xs font-mono font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Trade Cancelled</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(order)}
                        className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Update Delivery Status</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Modal Drawer */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#232b3b]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-emerald-400">{selectedOrderDetail.order_code}</span>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getStatusBadge(selectedOrderDetail.status)}`}>
                    {selectedOrderDetail.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order Placed: {new Date(selectedOrderDetail.created_at).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1f2637]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Buyer & Commercial Overview */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded bg-[#0e1117] border border-[#1e2432] space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Buyer Details</span>
                <p className="font-semibold text-slate-100 text-sm">{selectedOrderDetail.buyer_company_name || "Enterprise Buyer"}</p>
                <p className="text-slate-300">Contact: {selectedOrderDetail.buyer_name || "Procurement Manager"}</p>
                <p className="text-slate-400 font-mono text-[11px]">{selectedOrderDetail.buyer_email || "buyer@procurement.com"}</p>
                <p className="text-slate-400 pt-1">
                  <strong className="text-slate-300">Country:</strong> {selectedOrderDetail.buyer_country || "Global"}
                </p>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Shipping:</strong> {selectedOrderDetail.shipping_address || "Standard Port/Hub"}
                </p>
              </div>

              <div className="p-3.5 rounded bg-[#0e1117] border border-[#1e2432] space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Commercial Terms</span>
                <p className="text-base font-bold font-mono text-emerald-400">
                  ${selectedOrderDetail.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selectedOrderDetail.currency}
                </p>
                <p className="text-slate-300">
                  Carrier Tracking: <strong className="font-mono text-slate-100">{selectedOrderDetail.tracking_number || "Awaiting Dispatch"}</strong>
                </p>
                <p className="text-slate-400">
                  Expected Delivery: <strong className="text-slate-200">
                    {selectedOrderDetail.expected_delivery_date ? new Date(selectedOrderDetail.expected_delivery_date).toLocaleDateString() : "Scheduled"}
                  </strong>
                </p>
                {selectedOrderDetail.notes && (
                  <p className="text-slate-400 text-[11px] pt-1 italic border-t border-[#1a202c]">
                    Notes: {selectedOrderDetail.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold font-mono text-slate-300 uppercase block">Line Item Breakdown</span>
              <div className="overflow-x-auto rounded border border-[#1e2432]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1117] text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Item Name</th>
                      <th className="p-2.5 text-right">Quantity</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2432] bg-[#141822]">
                    {(selectedOrderDetail.items && selectedOrderDetail.items.length > 0 ? selectedOrderDetail.items : [
                      { id: 1, item_name: "Standard Component Batch", quantity: 500, unit_price: selectedOrderDetail.total_amount / 500, total_price: selectedOrderDetail.total_amount }
                    ]).map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium text-slate-200">{it.item_name}</td>
                        <td className="p-2.5 text-right font-mono text-slate-300">{it.quantity.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono text-slate-300">${(it.unit_price || 0).toFixed(2)}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400 font-semibold">${(it.total_price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fulfilment Timeline & History */}
            <div className="space-y-2 pt-2 border-t border-[#1e2432]">
              <span className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-400" /> Fulfilment Timeline & Audit History
              </span>

              {(!selectedOrderDetail.history || selectedOrderDetail.history.length === 0) ? (
                <p className="text-xs text-slate-500 italic p-3 bg-[#0e1117] rounded">
                  Initial confirmation recorded. Further status updates will appear here.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrderDetail.history.map((h, i) => (
                    <div key={h.id || i} className="p-2.5 rounded bg-[#0e1117] border border-[#1e2432] text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-emerald-400">{h.new_status.replace(/_/g, " ")}</span>
                        <span className="text-slate-500 font-mono text-[10px]">{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{h.notes || "Status milestone updated."}</p>
                      <p className="text-slate-500 text-[10px]">Logged by: {h.changed_by}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#232b3b]">
              <Link
                href={`/supplier/negotiations?order_id=${selectedOrderDetail.id}`}
                className="px-3.5 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#252e3e] text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Message Buyer</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-3.5 py-1.5 rounded bg-[#181e2b] text-xs text-slate-300 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const o = selectedOrderDetail;
                    setSelectedOrderDetail(null);
                    handleOpenStatusModal(o);
                  }}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Update Delivery Status</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Order Status Modal */}
      {activeOrderForUpdate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b3b]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Update Delivery Status ({activeOrderForUpdate.order_code})</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveOrderForUpdate(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">New Delivery Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="CONFIRMED">CONFIRMED (Order acknowledged, scheduled)</option>
                  <option value="PREPARING">PREPARING (Raw material allocation & prep)</option>
                  <option value="IN_PRODUCTION">IN_PRODUCTION (Shop-floor machining started)</option>
                  <option value="READY_FOR_DISPATCH">READY_FOR_DISPATCH (Inspected, crated & labeled)</option>
                  <option value="DISPATCHED">DISPATCHED (Handed over to carrier)</option>
                  <option value="IN_TRANSIT">IN_TRANSIT (Hub transit / customs clearance)</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Final delivery route)</option>
                  <option value="DELIVERED">DELIVERED (Confirmed received by buyer)</option>
                  <option value="DELIVERY_EXCEPTION">DELIVERY_EXCEPTION (Port hold or inspection delay)</option>
                  <option value="CANCELLED">CANCELLED (Mutual cancellation)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Carrier Tracking Number</label>
                  <button
                    type="button"
                    onClick={() => setTrackingNumber(`EXP-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`)}
                    className="text-[10px] text-emerald-400 hover:underline font-mono"
                  >
                    Generate Tracking ID
                  </button>
                </div>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. DHL-EXP-8891024 / MAERSK-SEA-9182"
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Updated Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Milestone Notes & Instructions</label>
                <textarea
                  rows={3}
                  value={productionNotes}
                  onChange={(e) => setProductionNotes(e.target.value)}
                  placeholder="e.g. Precision CNC batch passed CMM inspection. Crated in anti-corrosion VCI packaging."
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded text-blue-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <span>
                  Updating this milestone writes to the immutable order audit trail and immediately sends an in-app notification to <strong>{activeOrderForUpdate.buyer_company_name || "the buyer"}</strong>.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232b3b]">
                <button
                  type="button"
                  onClick={() => setActiveOrderForUpdate(null)}
                  className="px-3 py-1.5 rounded bg-[#181e2b] text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isUpdating ? "Synchronizing..." : "Confirm & Broadcast Status"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
