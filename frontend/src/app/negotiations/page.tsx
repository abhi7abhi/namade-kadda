"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Search,
  Package,
  Layers,
  Sparkles,
  Check,
  X,
  Sliders,
  ChevronRight,
  FileText,
  Calendar,
  Globe
} from "lucide-react";
import { api, BuyerOrderNegotiationSummary } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

function BuyerNegotiationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("order_id");

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<BuyerOrderNegotiationSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    initialOrderId ? parseInt(initialOrderId) : null
  );
  const [activeDetail, setActiveDetail] = useState<{ order: any; messages: any[] } | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Compose State
  const [replyText, setReplyText] = useState("");
  const [isProposalMode, setIsProposalMode] = useState(false);
  const [proposedPrice, setProposedPrice] = useState<number>(14.5);
  const [proposedQuantity, setProposedQuantity] = useState<number>(500);
  const [proposedLeadTime, setProposedLeadTime] = useState<number>(14);
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState("");
  const [proposedTerms, setProposedTerms] = useState("Net 30, DDP Destination");

  // Counteroffer Modal
  const [activeProposalForCounter, setActiveProposalForCounter] = useState<any | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(14.0);
  const [counterQty, setCounterQty] = useState<number>(500);
  const [counterLeadTime, setCounterLeadTime] = useState<number>(14);
  const [counterMessage, setCounterMessage] = useState("");

  const fetchConversations = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await api.getBuyerOrderNegotiations();
      setConversations(res);
      if (!selectedOrderId && res.length > 0) {
        setSelectedOrderId(res[0].order_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order negotiations");
    } finally {
      setLoadingList(false);
    }
  };

  const fetchThread = async (orderId: number) => {
    setLoadingThread(true);
    setError(null);
    try {
      const res = await api.getBuyerOrderNegotiation(orderId);
      setActiveDetail(res);
      if (res.order) {
        setProposedPrice(res.order.unit_price || 15.0);
        setProposedQuantity(res.order.quantity || 500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load negotiation thread");
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      fetchThread(selectedOrderId);
    }
  }, [selectedOrderId]);

  // Send standard message or formal proposal
  const handleSendMessage = async () => {
    if (!selectedOrderId || !replyText.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.postBuyerOrderNegotiationMessage(selectedOrderId, {
        message: replyText.trim(),
        action_type: isProposalMode ? "PROPOSAL" : "MESSAGE",
        proposed_price: isProposalMode ? proposedPrice : undefined,
        proposed_quantity: isProposalMode ? proposedQuantity : undefined,
        proposed_currency: activeDetail?.order?.currency || "USD",
        proposed_lead_time_days: isProposalMode ? proposedLeadTime : undefined,
        proposed_delivery_date: isProposalMode && proposedDeliveryDate ? proposedDeliveryDate : undefined,
        proposed_payment_terms: isProposalMode ? proposedTerms : undefined
      });
      setReplyText("");
      setIsProposalMode(false);
      setSuccess("Message and commercial proposal dispatched to supplier.");
      await fetchThread(selectedOrderId);
      await fetchConversations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Accept a supplier's proposal
  const handleAcceptProposal = async (msg: any) => {
    if (!selectedOrderId) return;
    setSending(true);
    setError(null);
    try {
      await api.actionBuyerOrderProposal(selectedOrderId, msg.id, {
        action: "ACCEPT"
      });
      setSuccess(`Proposal accepted! Order commercial terms updated in authoritative database.`);
      await fetchThread(selectedOrderId);
      await fetchConversations();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to accept proposal");
    } finally {
      setSending(false);
    }
  };

  // Decline a supplier's proposal
  const handleDeclineProposal = async (msg: any) => {
    if (!selectedOrderId) return;
    setSending(true);
    try {
      await api.actionBuyerOrderProposal(selectedOrderId, msg.id, {
        action: "DECLINE",
        reason: "Terms non-compliant with buyer procurement budget"
      });
      setSuccess("Proposal declined.");
      await fetchThread(selectedOrderId);
      await fetchConversations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to decline proposal");
    } finally {
      setSending(false);
    }
  };

  // Submit counteroffer
  const handleSubmitCounter = async () => {
    if (!selectedOrderId || !activeProposalForCounter) return;
    setSending(true);
    try {
      await api.actionBuyerOrderProposal(selectedOrderId, activeProposalForCounter.id, {
        action: "COUNTER",
        counter_price: counterPrice,
        counter_quantity: counterQty,
        counter_lead_time_days: counterLeadTime,
        message: counterMessage.trim() || `Counteroffer: Proposing $${counterPrice}/unit for ${counterQty} units.`
      });
      setSuccess("Counteroffer transmitted to supplier.");
      setActiveProposalForCounter(null);
      setCounterMessage("");
      await fetchThread(selectedOrderId);
      await fetchConversations();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to submit counteroffer");
    } finally {
      setSending(false);
    }
  };

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          c.supplier_name.toLowerCase().includes(s) ||
          c.product_name.toLowerCase().includes(s) ||
          c.order_code.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [conversations, statusFilter, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Order Negotiations & Commercial Terms</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold">
              TWO-WAY SYNCHRONIZED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Negotiate unit prices, production volumes, and delivery schedules directly with suppliers on confirmed purchase orders.
          </p>
        </div>
        <button
          onClick={() => {
            fetchConversations();
            if (selectedOrderId) fetchThread(selectedOrderId);
          }}
          disabled={loadingList}
          className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} /> Refresh Threads
        </button>
      </div>

      <PageGuide
        title="Negotiation Rules & Synchronized Commercial Terms"
        steps={[
          "1. Shared Authoritative Thread: Messages and proposals are stored in the database and visible immediately to both Buyer and Supplier.",
          "2. Binding Commercial Terms: Proposing a counter-price does NOT alter the order until explicitly accepted.",
          "3. Backend Audit: Accepting a commercial proposal updates order total amount and line items in real-time.",
          "4. In-App Notifications: Counteroffers and message alerts notify the counterpart in their respective workspace."
        ]}
        tip="Submit structured commercial proposals (unit price, quantity, lead time, payment terms) for auditable terms agreement."
      />

      {success && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => { if (selectedOrderId) fetchThread(selectedOrderId); }} className="underline hover:text-white font-medium ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Main Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-280px)] min-h-[580px]">
        {/* Left Pane: Conversation List */}
        <div className="lg:col-span-4 bg-[#121620] rounded-xl border border-[#232938] flex flex-col overflow-hidden">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-[#1f242f] space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders, suppliers, products..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#0c0e14] border border-[#232938] rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {["ALL", "ACTIVE", "AWAITING_BUYER", "AWAITING_SUPPLIER", "AGREED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap font-medium transition-colors ${
                    statusFilter === st
                      ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                      : "bg-[#161a23] text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1b202c]">
            {loadingList ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Loading negotiation channels...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No orders match your filter criteria.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedOrderId === c.order_id;
                return (
                  <button
                    key={c.order_id}
                    onClick={() => setSelectedOrderId(c.order_id)}
                    className={`w-full text-left p-3.5 transition-colors relative flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-[#161e2c] border-l-2 border-emerald-500"
                        : "hover:bg-[#151a24]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-emerald-400">{c.order_code}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.last_activity ? new Date(c.last_activity).toLocaleDateString() : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-200 truncate">{c.supplier_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-[#1c2433] text-slate-300 border border-[#2a364d]">
                        {c.supplier_country}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 truncate">{c.product_name}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{c.quantity.toLocaleString()} pcs • ${c.unit_price.toFixed(2)}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          c.status === "AWAITING_BUYER"
                            ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                            : c.status === "AGREED"
                            ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                            : "bg-[#18202d] text-slate-300 border border-[#26334a]"
                        }`}
                      >
                        {c.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Thread and Proposal Controls */}
        <div className="lg:col-span-8 bg-[#121620] rounded-xl border border-[#232938] flex flex-col overflow-hidden">
          {selectedOrderId && activeDetail ? (
            <>
              {/* Order Baseline Header */}
              <div className="p-4 border-b border-[#1f242f] bg-[#0f131a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-100">{activeDetail.order.product_name}</h2>
                    <span className="font-mono text-xs text-emerald-400 px-2 py-0.5 rounded bg-[#16212e] border border-emerald-900/60 font-bold">
                      {activeDetail.order.order_code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 font-mono">
                      Status: {activeDetail.order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Supplier: <strong className="text-slate-200">{activeDetail.order.supplier_name}</strong> ({activeDetail.order.supplier_country}) • Contact: {activeDetail.order.supplier_email}
                  </p>
                </div>

                <div className="text-right text-xs bg-[#151a24] px-3 py-1.5 rounded-lg border border-[#232b3c]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Contract Terms</span>
                  <span className="font-bold text-slate-200 font-mono text-sm">
                    ${activeDetail.order.unit_price.toFixed(2)} / unit • {activeDetail.order.quantity.toLocaleString()} pcs
                  </span>
                  <span className="text-[11px] text-emerald-400 block font-mono">
                    Total: ${activeDetail.order.total_amount.toLocaleString()} {activeDetail.order.currency}
                  </span>
                </div>
              </div>

              {/* Message History Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeDetail.messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No negotiation history recorded yet. Use the composer below to begin commercial alignment.
                  </div>
                ) : (
                  activeDetail.messages.map((m) => {
                    const isBuyer = m.sender_role === "BUYER";
                    const isProposal = m.action_type === "PROPOSAL" || m.action_type === "COUNTER";

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isBuyer ? "items-end" : "items-start"} max-w-2xl ${isBuyer ? "ml-auto" : "mr-auto"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isBuyer ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80" : "bg-blue-950/80 text-blue-400 border border-blue-800/80"
                          }`}>
                            {isBuyer ? "BUYER (YOU)" : "SUPPLIER"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{m.sender_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Message Box */}
                        <div
                          className={`p-3.5 rounded-xl border text-xs shadow-sm space-y-2.5 ${
                            isBuyer
                              ? "bg-[#182333] border-[#293b54] text-slate-100 rounded-tr-none"
                              : "bg-[#141923] border-[#222b3c] text-slate-200 rounded-tl-none"
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>

                          {/* Structured Commercial Terms Card */}
                          {isProposal && (
                            <div className="bg-[#0b0e14] p-3 rounded-lg border border-[#1e2636] space-y-2 text-xs">
                              <div className="flex items-center justify-between pb-1.5 border-b border-[#1b2230]">
                                <span className="font-mono text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> FORMAL COMMERCIAL PROPOSAL
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  m.status === "ACCEPTED"
                                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                    : m.status === "DECLINED"
                                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                                    : "bg-amber-950 text-amber-300 border border-amber-800"
                                }`}>
                                  {m.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                                {m.proposed_price !== null && (
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">PRICE</span>
                                    <span className="text-slate-100 font-bold">${m.proposed_price.toFixed(2)}</span>
                                  </div>
                                )}
                                {m.proposed_quantity && (
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">QUANTITY</span>
                                    <span className="text-slate-100 font-bold">{m.proposed_quantity.toLocaleString()} pcs</span>
                                  </div>
                                )}
                                {m.proposed_lead_time_days && (
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">LEAD TIME</span>
                                    <span className="text-slate-100 font-bold">{m.proposed_lead_time_days} days</span>
                                  </div>
                                )}
                                {m.proposed_payment_terms && (
                                  <div>
                                    <span className="text-[10px] text-slate-500 block">TERMS</span>
                                    <span className="text-slate-100 truncate block">{m.proposed_payment_terms}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action buttons if proposal received from Supplier and is OPEN */}
                              {!isBuyer && m.status === "OPEN" && (
                                <div className="flex items-center gap-2 pt-2 border-t border-[#1b2230]">
                                  <button
                                    onClick={() => handleAcceptProposal(m)}
                                    disabled={sending}
                                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                                  >
                                    <Check className="w-3 h-3" /> Accept & Update Order
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveProposalForCounter(m);
                                      setCounterPrice(m.proposed_price || 15.0);
                                      setCounterQty(m.proposed_quantity || 500);
                                    }}
                                    disabled={sending}
                                    className="px-3 py-1 rounded bg-[#1c2433] hover:bg-[#253044] text-slate-200 font-medium text-[11px] border border-[#2f3c54] transition-colors"
                                  >
                                    Counter-Offer
                                  </button>
                                  <button
                                    onClick={() => handleDeclineProposal(m)}
                                    disabled={sending}
                                    className="px-3 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-medium text-[11px] border border-rose-800/60 transition-colors"
                                  >
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <div className="p-3 bg-[#0d1017] border-t border-[#1f242f] space-y-2.5">
                {isProposalMode && (
                  <div className="p-3 bg-[#121620] rounded-lg border border-amber-900/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-[#1b2230]">
                      <span className="font-mono text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                        <Sliders className="w-3.5 h-3.5" /> ATTACH STRUCTURED COMMERCIAL PROPOSAL
                      </span>
                      <button
                        onClick={() => setIsProposalMode(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Target Unit Price ($)</label>
                        <input
                          type="number"
                          step="0.10"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-[#090b10] border border-[#232938] rounded text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Quantity (pcs)</label>
                        <input
                          type="number"
                          value={proposedQuantity}
                          onChange={(e) => setProposedQuantity(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-[#090b10] border border-[#232938] rounded text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Lead Time (days)</label>
                        <input
                          type="number"
                          value={proposedLeadTime}
                          onChange={(e) => setProposedLeadTime(parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-[#090b10] border border-[#232938] rounded text-slate-100 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Payment & Shipping Terms</label>
                        <input
                          type="text"
                          value={proposedTerms}
                          onChange={(e) => setProposedTerms(e.target.value)}
                          className="w-full px-2 py-1 bg-[#090b10] border border-[#232938] rounded text-slate-100 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a message or proposal to the supplier..."
                      className="w-full p-2.5 bg-[#080a0e] border border-[#232938] rounded-lg text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsProposalMode(!isProposalMode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                        isProposalMode
                          ? "bg-amber-950/80 text-amber-300 border-amber-800"
                          : "bg-[#161a23] hover:bg-[#1f2433] text-slate-300 border-[#232938]"
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" /> Proposal
                    </button>
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sending || !replyText.trim()}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500 flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium">Select a purchase order to open active commercial negotiations</p>
              <p className="text-slate-500 text-[11px] mt-1">Communicate directly with suppliers to adjust prices, quantities, and delivery milestones.</p>
            </div>
          )}
        </div>
      </div>

      {/* Counteroffer Modal */}
      {activeProposalForCounter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121620] w-full max-w-md rounded-xl border border-[#283144] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232938] pb-2.5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" /> Propose Commercial Counteroffer
              </h3>
              <button
                onClick={() => setActiveProposalForCounter(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Counter Price ($)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-[#090b10] border border-[#232938] rounded text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Target Quantity</label>
                  <input
                    type="number"
                    value={counterQty}
                    onChange={(e) => setCounterQty(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-[#090b10] border border-[#232938] rounded text-slate-100 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Target Lead Time (days)</label>
                <input
                  type="number"
                  value={counterLeadTime}
                  onChange={(e) => setCounterLeadTime(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-[#090b10] border border-[#232938] rounded text-slate-100 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Explanation to Supplier</label>
                <textarea
                  rows={3}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Explain why this counteroffer aligns with market benchmarks or volume commitments..."
                  className="w-full p-2.5 bg-[#090b10] border border-[#232938] rounded text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#232938]">
              <button
                onClick={() => setActiveProposalForCounter(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitCounter}
                disabled={sending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                Transmit Counteroffer <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuyerNegotiationsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-slate-500">Loading negotiations...</div>}>
      <BuyerNegotiationsContent />
    </Suspense>
  );
}
