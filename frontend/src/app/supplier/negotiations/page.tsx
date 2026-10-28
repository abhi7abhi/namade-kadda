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
  Bot,
  ArrowRight,
  ShieldCheck,
  Scale,
  Search,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Check,
  X,
  Sliders,
  ChevronRight,
  FileText
} from "lucide-react";
import {
  api,
  OrderNegotiationSummary,
  OrderNegotiationDetailResponse,
  NegotiationMessageItem
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

function SupplierNegotiationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("order_id");

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<OrderNegotiationSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(
    initialOrderId ? parseInt(initialOrderId) : null
  );
  const [activeDetail, setActiveDetail] = useState<OrderNegotiationDetailResponse | null>(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Compose State
  const [replyText, setReplyText] = useState("");
  const [isProposalMode, setIsProposalMode] = useState(false);
  const [proposedPrice, setProposedPrice] = useState<number>(18.5);
  const [proposedQuantity, setProposedQuantity] = useState<number>(500);
  const [proposedLeadTime, setProposedLeadTime] = useState<number>(14);
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState("");
  const [proposedTerms, setProposedTerms] = useState("Net 30, CIF Destination");

  // Counteroffer Modal
  const [activeProposalForCounter, setActiveProposalForCounter] = useState<NegotiationMessageItem | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(19.0);
  const [counterQty, setCounterQty] = useState<number>(500);
  const [counterLeadTime, setCounterLeadTime] = useState<number>(15);
  const [counterMessage, setCounterMessage] = useState("");

  // AI Strategy Helper
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // 1. Fetch conversations list
  const fetchConversations = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await api.getOrderNegotiations();
      setConversations(res);

      if (!selectedOrderId && res.length > 0) {
        setSelectedOrderId(res[0].order_id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order negotiation threads");
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Fetch specific order negotiation thread
  const fetchThread = async (orderId: number) => {
    setLoadingThread(true);
    try {
      const detail = await api.getOrderNegotiationDetail(orderId);
      setActiveDetail(detail);

      // Pre-populate proposal defaults from order
      if (detail.order) {
        setProposedPrice(detail.order.unit_price || 15.0);
        setProposedQuantity(detail.order.quantity || 500);
        if (detail.order.expected_delivery_date) {
          setProposedDeliveryDate(detail.order.expected_delivery_date.split("T")[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load thread details");
    } finally {
      setLoadingThread(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchConversations();
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchThread(selectedOrderId);
    }
  }, [selectedOrderId]);

  // Send message or formal proposal
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || (!replyText.trim() && !isProposalMode)) return;

    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {
        message: replyText.trim() || `Transmitted formal proposal: $${proposedPrice}/unit for ${proposedQuantity} units.`,
        action_type: isProposalMode ? "PROPOSAL" : "MESSAGE"
      };

      if (isProposalMode) {
        payload.proposed_price = proposedPrice;
        payload.proposed_quantity = proposedQuantity;
        payload.proposed_lead_time_days = proposedLeadTime;
        payload.proposed_payment_terms = proposedTerms;
        if (proposedDeliveryDate) {
          payload.proposed_delivery_date = new Date(proposedDeliveryDate).toISOString();
        }
      }

      await api.postOrderNegotiationMessage(selectedOrderId, payload);
      setReplyText("");
      setIsProposalMode(false);
      setSuccess("Message transmitted directly to enterprise procurement team.");
      fetchThread(selectedOrderId);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || "Failed to send negotiation message");
    } finally {
      setSending(false);
    }
  };

  // Accept incoming proposal
  const handleAcceptProposal = async (msgId: number) => {
    if (!selectedOrderId) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.actionOrderProposal(selectedOrderId, msgId, {
        action: "ACCEPT",
        message: "Commercial proposal accepted. Order commercial terms have been officially updated."
      });
      setSuccess(`Proposal accepted! Order total updated to $${res.new_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
      fetchThread(selectedOrderId);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || "Failed to accept proposal");
    } finally {
      setSending(false);
    }
  };

  // Decline proposal
  const handleDeclineProposal = async (msgId: number) => {
    if (!selectedOrderId) return;
    const reason = window.prompt("Optional: Enter reason for declining terms", "Current raw material cost structure cannot accommodate this price point.");
    if (reason === null) return;

    setSending(true);
    setError(null);
    try {
      await api.actionOrderProposal(selectedOrderId, msgId, {
        action: "DECLINE",
        reason: reason || "Terms declined"
      });
      setSuccess("Proposal declined.");
      fetchThread(selectedOrderId);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || "Failed to decline proposal");
    } finally {
      setSending(false);
    }
  };

  // Counter proposal
  const handleCounterProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !activeProposalForCounter) return;

    setSending(true);
    setError(null);
    try {
      await api.actionOrderProposal(selectedOrderId, activeProposalForCounter.id, {
        action: "COUNTER",
        counter_price: counterPrice,
        counter_quantity: counterQty,
        counter_lead_time_days: counterLeadTime,
        message: counterMessage.trim() || `Counteroffer: $${counterPrice}/unit for ${counterQty} units with ${counterLeadTime} days lead time.`
      });
      setActiveProposalForCounter(null);
      setSuccess("Counterproposal submitted.");
      fetchThread(selectedOrderId);
      fetchConversations();
    } catch (err: any) {
      setError(err.message || "Failed to submit counterproposal");
    } finally {
      setSending(false);
    }
  };

  // AI Strategy Recommendation
  const handleConsultAiStrategy = async () => {
    if (!activeDetail?.order) return;
    setLoadingAi(true);
    try {
      const res = await api.askSellerAIAssistant({
        role: "NEGOTIATION_STRATEGY",
        prompt: `Provide tactical negotiation advice for order ${activeDetail.order.order_code}. Current price: $${activeDetail.order.unit_price}/unit for ${activeDetail.order.quantity} units to ${activeDetail.order.buyer_company}. Recommend counteroffer pricing band and payment terms.`
      });
      setAiSuggestion(res.reply);
    } catch (err: any) {
      setAiSuggestion("Standard negotiation advice: maintain 15-20% gross margin buffer and leverage prompt payment discount (2% 10 Net 30).");
    } finally {
      setLoadingAi(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const term = searchTerm.toLowerCase();
    return conversations.filter(
      (c) =>
        c.order_code.toLowerCase().includes(term) ||
        c.buyer_company.toLowerCase().includes(term) ||
        c.product_name.toLowerCase().includes(term)
    );
  }, [conversations, searchTerm]);

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
        badge="ORDER-BASED NEGOTIATIONS"
        title="Direct Buyer-Seller Negotiations & Proposals"
        description="Exchange direct messages with enterprise buyer procurement officers on active purchase orders. Submit binding commercial counteroffers with automated contractual synchronization upon acceptance."
        tip="Proposals accepted in this channel automatically update the legally binding PO contract value and shop-floor milestone schedule."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            <span>Negotiation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated order-linked negotiation channel. Exchange commercial proposals and counteroffers.
          </p>
        </div>

        <button
          onClick={() => {
            fetchConversations();
            if (selectedOrderId) fetchThread(selectedOrderId);
          }}
          className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Refresh Channels</span>
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

      {/* Main Split Grid: Threads List on Left, Active Chat on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[650px]">
        {/* Left: Orders Conversation Selector */}
        <div className="lg:col-span-4 bg-[#141821] border border-[#212735] rounded-xl p-4 flex flex-col space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by PO code or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[600px]">
            {loadingList ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading order threads...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No active order channels found.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedOrderId === conv.order_id;
                return (
                  <div
                    key={conv.order_id}
                    onClick={() => setSelectedOrderId(conv.order_id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#18202d] border-emerald-500/70 shadow-sm"
                        : "bg-[#0e1117] border-[#1e2432] hover:border-[#2f394d]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">{conv.order_code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        conv.status === "AGREED"
                          ? "bg-emerald-950 text-emerald-300"
                          : conv.status.includes("COUNTEROFFER")
                          ? "bg-amber-950 text-amber-300"
                          : "bg-blue-950 text-blue-300"
                      }`}>
                        {conv.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-200 font-semibold mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{conv.buyer_company}</span>
                    </div>

                    <p className="text-slate-400 text-[11px] truncate mt-0.5">
                      {conv.product_name} · <span className="font-mono text-slate-300">${conv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 mt-2 border-t border-[#1a202c]">
                      <span className="truncate max-w-[170px] italic">"{conv.last_message}"</span>
                      {conv.unread_count > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Order Negotiation Chat & Proposals */}
        <div className="lg:col-span-8 bg-[#141821] border border-[#212735] rounded-xl flex flex-col overflow-hidden">
          {activeDetail?.order ? (
            <>
              {/* Order Context Header */}
              <div className="p-4 bg-[#0e1117] border-b border-[#212735] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-emerald-400">{activeDetail.order.order_code}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-mono font-bold">
                      {activeDetail.order.status}
                    </span>
                    <span className="text-slate-400 text-xs">· {activeDetail.order.buyer_company} ({activeDetail.order.buyer_country})</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Item: <strong className="text-slate-100">{activeDetail.order.product_name}</strong> · Contract Total: <strong className="font-mono text-emerald-400">${activeDetail.order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeDetail.order.currency}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleConsultAiStrategy}
                    className="px-2.5 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-amber-300 border border-amber-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Negotiation Advisor</span>
                  </button>

                  <Link
                    href={`/supplier/orders`}
                    className="px-2.5 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-300 border border-[#252e3e] text-xs font-semibold"
                  >
                    Order Details &rarr;
                  </Link>
                </div>
              </div>

              {/* AI Strategy Advisory Banner */}
              {aiSuggestion && (
                <div className="p-3.5 bg-amber-950/40 border-b border-amber-800/40 text-xs text-amber-200 flex items-start justify-between gap-3 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold font-mono text-[11px] uppercase tracking-wider block text-amber-300">
                        AI Negotiation Advisor Recommendation
                      </span>
                      <p className="leading-relaxed">{aiSuggestion}</p>
                    </div>
                  </div>
                  <button onClick={() => setAiSuggestion(null)} className="text-amber-400 hover:text-white">✕</button>
                </div>
              )}

              {/* Messages & Proposals Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#11141c] min-h-[350px] max-h-[440px]">
                {loadingThread ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : (!activeDetail.messages || activeDetail.messages.length === 0) ? (
                  <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                    <p>No messages exchanged yet for this order.</p>
                    <p className="text-[11px] text-slate-600">
                      Type below to send a message or make a formal pricing/lead-time proposal.
                    </p>
                  </div>
                ) : (
                  activeDetail.messages.map((m) => {
                    const isMe = m.sender_role === "SUPPLIER";
                    const isProposal = m.action_type === "PROPOSAL" || m.action_type === "COUNTER" || m.proposed_price !== null;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-slate-400">
                          <span className="font-semibold text-slate-300">{m.sender_name}</span>
                          <span>·</span>
                          <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Proposal Card vs Standard Message Bubble */}
                        {isProposal ? (
                          <div className={`p-4 rounded-xl border max-w-md w-full space-y-2.5 ${
                            isMe
                              ? "bg-emerald-950/50 border-emerald-700/60 text-slate-100"
                              : "bg-blue-950/50 border-blue-700/60 text-slate-100"
                          }`}>
                            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                                <Scale className="w-3.5 h-3.5" /> Structured Commercial Proposal
                              </span>
                              <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                                m.status === "ACCEPTED" || m.status === "AGREED"
                                  ? "bg-emerald-600 text-white"
                                  : m.status === "DECLINED"
                                  ? "bg-red-800 text-white"
                                  : "bg-amber-600 text-white"
                              }`}>
                                {m.status}
                              </span>
                            </div>

                            <p className="text-xs leading-relaxed">{m.message}</p>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
                              <div className="p-2 rounded bg-black/40 border border-white/10 space-y-0.5">
                                <span className="text-[10px] text-slate-400 block">Proposed Price</span>
                                <span className="text-sm font-bold text-emerald-400">
                                  ${m.proposed_price ? Number(m.proposed_price).toFixed(2) : "N/A"}/unit
                                </span>
                              </div>

                              <div className="p-2 rounded bg-black/40 border border-white/10 space-y-0.5">
                                <span className="text-[10px] text-slate-400 block">Proposed Volume</span>
                                <span className="text-sm font-bold text-slate-200">
                                  {m.proposed_quantity ? m.proposed_quantity.toLocaleString() : activeDetail.order.quantity} units
                                </span>
                              </div>

                              {m.proposed_lead_time_days && (
                                <div className="p-2 rounded bg-black/40 border border-white/10 space-y-0.5">
                                  <span className="text-[10px] text-slate-400 block">Lead Time</span>
                                  <span className="text-xs text-slate-300 font-semibold">{m.proposed_lead_time_days} Days</span>
                                </div>
                              )}

                              {m.proposed_payment_terms && (
                                <div className="p-2 rounded bg-black/40 border border-white/10 space-y-0.5">
                                  <span className="text-[10px] text-slate-400 block">Payment Terms</span>
                                  <span className="text-xs text-slate-300 truncate block">{m.proposed_payment_terms}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions on Incoming Proposals */}
                            {!isMe && (m.status === "OPEN" || m.status === "COUNTEROFFER") && (
                              <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeclineProposal(m.id)}
                                  className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold"
                                >
                                  Decline
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveProposalForCounter(m);
                                    setCounterPrice(m.proposed_price ? Number(m.proposed_price) : 18.0);
                                    setCounterQty(m.proposed_quantity || 500);
                                  }}
                                  className="px-3 py-1 rounded bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800 text-xs font-semibold"
                                >
                                  Counter
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleAcceptProposal(m.id)}
                                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accept Terms</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`p-3 rounded-xl text-xs max-w-md ${
                            isMe
                              ? "bg-emerald-950/40 border border-emerald-800/40 text-slate-200 rounded-tr-none"
                              : "bg-[#181e2b] border border-[#232b3b] text-slate-200 rounded-tl-none"
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compose Box */}
              <div className="p-4 bg-[#0e1117] border-t border-[#212735] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsProposalMode(false)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                        !isProposalMode
                          ? "bg-[#1e2432] text-slate-100 border border-[#2b3548]"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Plain Message
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsProposalMode(true)}
                      className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isProposalMode
                          ? "bg-amber-950/80 text-amber-300 border border-amber-800/70"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Formal Proposal / Counteroffer</span>
                    </button>
                  </div>
                </div>

                {/* Structured Proposal Fields Toggle */}
                {isProposalMode && (
                  <div className="p-3 rounded-lg bg-[#141822] border border-amber-900/40 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Proposed Unit Price ($)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={proposedPrice}
                          onChange={(e) => setProposedPrice(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Proposed Quantity</label>
                        <input
                          type="number"
                          value={proposedQuantity}
                          onChange={(e) => setProposedQuantity(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Lead Time (Days)</label>
                        <input
                          type="number"
                          value={proposedLeadTime}
                          onChange={(e) => setProposedLeadTime(parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-mono block mb-1">Payment Terms</label>
                        <input
                          type="text"
                          value={proposedTerms}
                          onChange={(e) => setProposedTerms(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-[#1e2432]">
                      <span>Projected Order Total:</span>
                      <strong className="text-emerald-400 text-xs">
                        ${(proposedPrice * proposedQuantity).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                      </strong>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={isProposalMode ? "Add a justification or explanation for the proposed terms..." : "Type your message to the buyer procurement team..."}
                    className="flex-1 px-3 py-2 bg-[#0e1117] border border-[#212735] rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!replyText.trim() && !isProposalMode)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors self-end"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? "Sending..." : "Transmit"}</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-600" />
              <p className="font-semibold text-slate-400">Select an order on the left to start negotiating</p>
              <p className="text-slate-600 text-center max-w-sm">
                Each order has an isolated, legally compliant discussion thread with the designated procurement manager.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Counteroffer Modal */}
      {activeProposalForCounter && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b3b]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Submit Counteroffer Terms</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveProposalForCounter(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCounterProposal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Counter Unit Price ($)</label>
                <input
                  type="number"
                  step="0.05"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Counter Quantity</label>
                <input
                  type="number"
                  value={counterQty}
                  onChange={(e) => setCounterQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Lead Time (Days)</label>
                <input
                  type="number"
                  value={counterLeadTime}
                  onChange={(e) => setCounterLeadTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Message to Buyer</label>
                <textarea
                  rows={3}
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Explain why this counteroffer delivers optimum value..."
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232b3b]">
                <button
                  type="button"
                  onClick={() => setActiveProposalForCounter(null)}
                  className="px-3 py-1.5 rounded bg-[#181e2b] text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs disabled:opacity-50"
                >
                  {sending ? "Submitting..." : "Send Counteroffer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupplierNegotiationsPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Loading negotiation channel...</span>
      </div>
    }>
      <SupplierNegotiationsContent />
    </Suspense>
  );
}
