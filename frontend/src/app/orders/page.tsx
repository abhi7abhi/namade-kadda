"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PageGuide from "@/components/PageGuide";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Building2,
  FileText,
  Search,
  Filter,
  Globe,
  MessageSquare,
  Sliders,
  X,
  ExternalLink,
  ChevronRight,
  Calendar,
  DollarSign
} from "lucide-react";
import { api, Order } from "@/lib/api";

const DELIVERY_STAGES = [
  { key: "CONFIRMED", label: "Order Confirmed" },
  { key: "PREPARING", label: "Preparing Order" },
  { key: "IN_PRODUCTION", label: "In Production" },
  { key: "READY_FOR_DISPATCH", label: "Ready for Dispatch" },
  { key: "READY_TO_SHIP", label: "Ready to Ship" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" }
];

export default function DeliveryStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders();
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      } else if (selectedOrder) {
        const updated = data.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const countries = useMemo(() => {
    const list = Array.from(new Set(orders.map((o) => o.supplier?.country || "India"))).filter(Boolean);
    return list;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE") {
          if (o.status === "DELIVERED" || o.status === "CANCELLED") return false;
        } else if (statusFilter === "DELIVERED") {
          if (o.status !== "DELIVERED") return false;
        } else if (o.status !== statusFilter) {
          return false;
        }
      }
      if (countryFilter !== "ALL" && o.supplier?.country !== countryFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const pName = (o.items[0]?.item_name || "").toLowerCase();
        const suppName = (o.supplier?.name || "").toLowerCase();
        const code = (o.order_code || "").toLowerCase();
        return pName.includes(q) || suppName.includes(q) || code.includes(q);
      }
      return true;
    });
  }, [orders, statusFilter, countryFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      case "IN_PRODUCTION":
      case "PREPARING":
        return "bg-amber-950/80 text-amber-300 border-amber-800/80";
      case "SHIPPED":
      case "DISPATCHED":
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return "bg-blue-950/80 text-blue-300 border-blue-800/80";
      case "DELIVERY_EXCEPTION":
      case "CANCELLED":
        return "bg-rose-950/80 text-rose-300 border-rose-800/80";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const currentStageIndex = (status: string) => {
    const norm = status.toUpperCase();
    if (norm === "DELIVERED") return 7;
    if (norm === "OUT_FOR_DELIVERY") return 6;
    if (norm === "IN_TRANSIT" || norm === "SHIPPED") return 5;
    if (norm === "DISPATCHED" || norm === "READY_TO_SHIP") return 4;
    if (norm === "READY_FOR_DISPATCH") return 3;
    if (norm === "IN_PRODUCTION") return 2;
    if (norm === "PREPARING") return 1;
    return 0; // CONFIRMED
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Delivery Status — Track Buyer Orders</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
              AUTHORITATIVE LIVE DB
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track contractual fulfilment, factory production stages, dispatch carrier milestones, and delivery status synchronized with supplier workspace.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Status
        </button>
      </div>

      <PageGuide
        title="Delivery Status Tracking Guide"
        steps={[
          "1. Authoritative DB Synchronization: Only confirmed orders resulting from accepted quotations appear here.",
          "2. Real-Time Status Updates: When a supplier updates fulfilment milestones (In Production, Dispatched, Delivered), you see it instantly upon refresh.",
          "3. Order Details Drawer: Click 'View Details' on any purchase order to inspect line items, tracking numbers, and complete timestamped audit history.",
          "4. Direct Negotiation: Use the 'Message Supplier' button to discuss delivery timelines or commercial adjustments."
        ]}
        tip="Tracking numbers (SIM-TRK-XXXX) and carrier names represent simulated dispatch telemetry for testing."
      />

      {successMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchOrders} className="underline hover:text-white font-medium ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#121620] p-4 rounded-xl border border-[#232938] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID (PO-2026-xxx), supplier company, or product..."
              className="w-full pl-9 pr-4 py-2 bg-[#0c0e14] border border-[#232938] rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1a1f2c]">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Order Statuses</option>
              <option value="ACTIVE">Active (In Production / Transit)</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PRODUCTION">In Production</option>
              <option value="SHIPPED">Shipped / Dispatched</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Supplier Origin Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Supplier Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <span className="text-xs text-slate-400 font-mono py-1.5">
              Found <strong className="text-slate-100">{filteredOrders.length}</strong> purchase orders
            </span>
          </div>

          <div className="flex items-end justify-end">
            <Link
              href="/negotiations"
              className="px-3 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#232d3e] text-slate-300 text-xs font-medium border border-[#2b374c] flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Open Negotiations Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Orders List & Tracking View */}
      {loading ? (
        <div className="py-16 text-center bg-[#121620] rounded-xl border border-[#232938]">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Fetching authoritative purchase order records...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-[#121620] rounded-xl border border-[#232938] px-4">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No confirmed purchase orders found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Confirmed orders appear automatically when you accept supplier quotations in Incoming RFQs.
          </p>
          <Link
            href="/buyer/rfqs"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            Go to Incoming RFQs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Order Cards / Table */}
          <div className="lg:col-span-7 space-y-3">
            {filteredOrders.map((o) => {
              const isSelected = selectedOrder?.id === o.id;
              const prodName = o.items[0]?.item_name || "Precision Engineered Components";
              const qty = o.items.reduce((acc, it) => acc + it.quantity, 0) || 500;
              const latestHistory = o.history && o.history.length > 0 ? o.history[o.history.length - 1] : null;

              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className={`bg-[#121620] rounded-xl border p-4.5 cursor-pointer transition-all shadow-sm space-y-3 ${
                    isSelected
                      ? "border-emerald-500/80 bg-[#151c28]"
                      : "border-[#232938] hover:border-[#384259]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-[#0e1622] px-2 py-0.5 rounded border border-emerald-900/60">
                        {o.order_code}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${getStatusColor(o.status)}`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{prodName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300 font-medium">{o.supplier?.name || "Verified Supplier"}</span>
                        <span>•</span>
                        <Globe className="w-3 h-3 text-slate-500" />
                        <span>{o.supplier?.country || "India"}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-slate-100">
                        ${Number(o.total_amount).toLocaleString()} {o.currency}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {qty.toLocaleString()} units
                      </span>
                    </div>
                  </div>

                  {/* Delivery destination & Expected Date */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0c0e14] p-2.5 rounded-lg border border-[#1b202c]">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Destination</span>
                      <span className="text-slate-300 truncate block">
                        {o.shipping_address || "Bangalore, India"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Expected Delivery</span>
                      <span className="text-slate-300 font-mono block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {o.expected_delivery_date ? new Date(o.expected_delivery_date).toLocaleDateString() : "Estimated within 21 days"}
                      </span>
                    </div>
                  </div>

                  {/* Latest Update Note */}
                  {latestHistory && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#1b202c]">
                      <span className="truncate max-w-[340px]" title={latestHistory.notes || ""}>
                        Latest: {latestHistory.notes || `Advanced to ${latestHistory.new_status}`}
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono shrink-0">
                        {new Date(latestHistory.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      {isSelected ? "Viewing Timeline & Inspection Details →" : "Click to view full delivery details"}
                    </span>
                    <Link
                      href={`/negotiations?order_id=${o.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded bg-[#182333] hover:bg-[#202f45] text-slate-200 text-[11px] font-medium border border-[#2e405d] flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" /> Negotiate / Message
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Pane: Delivery Details & Lifecycle Stepper */}
          <div className="lg:col-span-5">
            {selectedOrder ? (
              <div className="bg-[#121620] rounded-xl border border-[#232938] p-5 space-y-5 sticky top-4 shadow-xl">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#1f242f]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-400">{selectedOrder.order_code}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100 mt-1">
                      {selectedOrder.items[0]?.item_name || "Precision Engineered Components"}
                    </h3>
                  </div>

                  <Link
                    href={`/negotiations?order_id=${selectedOrder.id}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Message Supplier
                  </Link>
                </div>

                {/* Fulfilment Progression Stepper */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Delivery Status Progression</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Step {currentStageIndex(selectedOrder.status) + 1} of 8
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {["CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "DELIVERED"].map((st, idx) => {
                      const activeIdx = currentStageIndex(selectedOrder.status);
                      const stepIndices = [0, 2, 4, 7];
                      const isReached = activeIdx >= stepIndices[idx];
                      const isCurrent = (idx === 0 && activeIdx < 2) || (idx === 1 && activeIdx >= 2 && activeIdx < 4) || (idx === 2 && activeIdx >= 4 && activeIdx < 7) || (idx === 3 && activeIdx >= 7);

                      return (
                        <div key={st} className="space-y-1 text-center">
                          <div
                            className={`h-1.5 rounded-full ${
                              isReached ? "bg-emerald-500" : "bg-[#1f2636]"
                            }`}
                          />
                          <span className={`text-[9px] font-mono block ${
                            isCurrent ? "text-emerald-400 font-bold" : isReached ? "text-slate-300" : "text-slate-500"
                          }`}>
                            {st.replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery & Tracking Details Card */}
                <div className="bg-[#0c0e14] p-3.5 rounded-lg border border-[#1b202c] space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#181d28]">
                    <span className="text-slate-400">Supplier:</span>
                    <span className="text-slate-200 font-semibold">{selectedOrder.supplier?.name} ({selectedOrder.supplier?.country})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181d28]">
                    <span className="text-slate-400">Contract Total:</span>
                    <span className="text-emerald-400 font-mono font-bold">${Number(selectedOrder.total_amount).toLocaleString()} {selectedOrder.currency}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181d28]">
                    <span className="text-slate-400">Delivery Address:</span>
                    <span className="text-slate-200 text-right max-w-[220px]">{selectedOrder.shipping_address || "Standard Industrial Delivery Address"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181d28]">
                    <span className="text-slate-400">Expected Delivery:</span>
                    <span className="text-slate-200 font-mono">
                      {selectedOrder.expected_delivery_date ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString() : "Estimated within 21 days"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#181d28]">
                    <span className="text-slate-400">Dispatch Tracking:</span>
                    <span className="text-slate-200 font-mono flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-400" />
                      {selectedOrder.tracking_number || "Awaiting Carrier Pickup"}
                    </span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="py-1">
                      <span className="text-slate-400 block mb-0.5">Supplier Delivery Notes:</span>
                      <p className="text-slate-300 italic">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Line Items Breakdown */}
                <div>
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase mb-2">Contract Line Items</h4>
                  <div className="space-y-1.5 bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c] text-xs">
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center py-1 border-b border-[#181d28] last:border-b-0">
                        <div>
                          <span className="text-slate-200 font-medium block">{it.item_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{it.quantity.toLocaleString()} pcs @ ${it.unit_price.toFixed(2)}/unit</span>
                        </div>
                        <span className="font-mono text-slate-200 font-bold">${it.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit & Status History Stepper */}
                <div>
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase mb-2">Milestone & Status History</h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {selectedOrder.history && selectedOrder.history.length > 0 ? (
                      selectedOrder.history.map((h, idx) => (
                        <div key={idx} className="bg-[#0b0e14] p-2.5 rounded-lg border border-[#1a2130] text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-emerald-400">{h.new_status}</span>
                            <span className="text-slate-500 text-[10px] font-mono">
                              {new Date(h.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-slate-300">{h.notes || `Advanced from ${h.previous_status || 'initial'}`}</p>
                          <span className="text-[10px] text-slate-500 block">Verified by: {h.changed_by}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">Initial order confirmation logged.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-slate-500 bg-[#121620] rounded-xl border border-[#232938]">
                Select an order from the list to inspect delivery status and tracking timeline.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
