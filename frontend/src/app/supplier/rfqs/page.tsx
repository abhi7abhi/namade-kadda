"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  MapPin,
  Calendar,
  Building2,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Send,
  XCircle,
  Check,
  Eye,
  X
} from "lucide-react";
import { api, SupplierRFQItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function SupplierRFQsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [rfqs, setRfqs] = useState<SupplierRFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Action states
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const fetchRFQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierRFQs(activeTab === "ALL" ? undefined : activeTab);
      setRfqs(res);
    } catch (err: any) {
      setError(err.message || "Failed to load incoming RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchRFQs();
  }, [isAuthenticated, authLoading, activeTab, router]);

  const handleQuickAccept = async (rfqId: number, rfqCode: string) => {
    setActionInProgress(rfqId);
    setError(null);
    setSuccess(null);
    try {
      await api.acceptSupplierRFQ(rfqId);
      setSuccess(`Accepted ${rfqCode}! Intent to quote recorded and buyer notified.`);
      fetchRFQs();
    } catch (err: any) {
      setError(err.message || "Failed to accept RFQ");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleQuickDecline = async (rfqId: number, rfqCode: string) => {
    const reason = window.prompt("Optional: Enter reason for declining this RFQ", "Operational capacity fully booked for requested delivery window.");
    if (reason === null) return;

    setActionInProgress(rfqId);
    setError(null);
    setSuccess(null);
    try {
      await api.declineSupplierRFQ(rfqId, reason);
      setSuccess(`Declined ${rfqCode}. Sourcing team notified.`);
      fetchRFQs();
    } catch (err: any) {
      setError(err.message || "Failed to decline RFQ");
    } finally {
      setActionInProgress(null);
    }
  };

  const filtered = rfqs.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.rfq_code.toLowerCase().includes(term) ||
      r.title.toLowerCase().includes(term) ||
      r.buyer_company.toLowerCase().includes(term) ||
      r.material.toLowerCase().includes(term)
    );
  });

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
        badge="MOST IMPORTANT SELLER WORKFLOW"
        title="Incoming Requests for Quotation (RFQs)"
        description="Review buyer sourcing requirements matching your manufacturing capability envelope. Formulate binding quotations, negotiate terms, or ask technical clarifications."
        tip="Quotes submitted with itemized tooling and statutory ISO compliance documentation score 28% higher in buyer multi-bid comparison algorithms."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Incoming RFQs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Buyer requirements routed to your enterprise based on capability matching, process type, and export corridors.
          </p>
        </div>

        <button
          onClick={fetchRFQs}
          className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
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

      {/* Tabs & Search */}
      <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All RFQs" },
            { id: "NEW", label: "New Requests" },
            { id: "ACCEPTED", label: "Accepted" },
            { id: "QUOTED", label: "Quotation Submitted" },
            { id: "DECLINED", label: "Declined" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-[#0e1117] text-slate-400 hover:text-slate-200 hover:bg-[#181d27] border border-[#212838]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search RFQs, buyer, material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* RFQ List Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-[#141821] rounded-xl border border-[#212735]">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading incoming RFQ records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#141821] rounded-xl border border-[#212735]">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No matching RFQs in this category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Eligible buyer requests matching your active manufacturing capabilities will appear here in real time.
            </p>
          </div>
        ) : (
          filtered.map((rfq) => (
            <div
              key={rfq.rfq_id}
              className="p-5 rounded-xl bg-[#141821] border border-[#212735] hover:border-emerald-500/40 transition-all space-y-4 shadow-sm"
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2432]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-emerald-400">{rfq.rfq_code}</span>
                  <span className="px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 font-mono text-[10px] font-semibold">
                    {rfq.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    rfq.invitation_status === "QUOTED"
                      ? "bg-purple-950 text-purple-300 border border-purple-800"
                      : rfq.invitation_status === "DECLINED"
                      ? "bg-red-950 text-red-300 border border-red-800"
                      : rfq.invitation_status === "ACCEPTED"
                      ? "bg-blue-950 text-blue-300 border border-blue-800"
                      : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  }`}>
                    {rfq.invitation_status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Issued: {rfq.request_date}</span>
                  <span className="text-amber-400 font-bold">Deadline: {rfq.deadline_date}</span>
                </div>
              </div>

              {/* Requirement Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="md:col-span-2 space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-100">{rfq.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Buyer: <strong className="text-slate-200">{rfq.buyer_company}</strong></span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                    Material: <span className="text-slate-200 font-medium">{rfq.material}</span> · Specs: <span className="text-slate-300">{rfq.specifications}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-mono text-slate-400">Target Budget & Volume</p>
                  <p className="font-mono font-bold text-slate-200 text-sm">
                    {rfq.target_budget ? `$${rfq.target_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Buyer Flexible"}
                  </p>
                  <p className="text-slate-400 text-[11px] font-mono">
                    Order Quantity: <strong className="text-emerald-400">{rfq.quantity.toLocaleString()} {rfq.unit}</strong>
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-mono text-slate-400">Fulfilment Destination</p>
                  <p className="text-slate-200 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{rfq.destination_city}, {rfq.destination_country}</span>
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Required Delivery: <span className="text-slate-300">{rfq.required_delivery_date}</span>
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-[#1e2432] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>Mandatory Certs: <strong className="text-slate-300">{rfq.requested_certifications}</strong></span>
                  {rfq.quote_code && (
                    <span className="text-purple-400 font-mono font-semibold">
                      · Your Submitted Quote: {rfq.quote_code}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Accept / Decline if not yet quoted or accepted */}
                  {rfq.invitation_status === "INVITED" && (
                    <>
                      <button
                        type="button"
                        disabled={actionInProgress === rfq.rfq_id}
                        onClick={() => handleQuickAccept(rfq.rfq_id, rfq.rfq_code)}
                        className="px-2.5 py-1.5 rounded bg-[#171d27] hover:bg-emerald-950 text-slate-300 hover:text-emerald-400 border border-[#242c3d] font-semibold flex items-center gap-1 text-xs transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Accept</span>
                      </button>

                      <button
                        type="button"
                        disabled={actionInProgress === rfq.rfq_id}
                        onClick={() => handleQuickDecline(rfq.rfq_id, rfq.rfq_code)}
                        className="px-2.5 py-1.5 rounded bg-[#171d27] hover:bg-red-950 text-slate-300 hover:text-red-400 border border-[#242c3d] font-semibold flex items-center gap-1 text-xs transition-colors"
                      >
                        <X className="w-3 h-3 text-red-400" />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  <Link
                    href={`/supplier/rfqs/${rfq.rfq_id}`}
                    className="px-3.5 py-1.5 rounded bg-[#181e2b] hover:bg-[#202738] text-slate-200 border border-[#293347] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>Inspect Specs</span>
                  </Link>

                  <Link
                    href={`/supplier/quotations?rfq_id=${rfq.rfq_id}`}
                    className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{rfq.has_submitted_quote ? "Revise Quote" : "Prepare Quotation"} &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
