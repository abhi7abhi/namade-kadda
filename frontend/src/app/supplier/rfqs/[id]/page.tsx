"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  XCircle,
  FileSpreadsheet,
  ArrowLeft,
  DollarSign,
  Layers,
  Send,
  ShieldCheck,
  Clock
} from "lucide-react";
import { api, SupplierRFQDetail } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

function SupplierRFQDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const rfqId = parseInt(id);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [detail, setDetail] = useState<SupplierRFQDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("Operational capacity fully booked for requested delivery window.");
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierRFQDetail(rfqId);
      setDetail(res);
    } catch (err: any) {
      setError(err.message || "Failed to load RFQ opportunity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (rfqId) fetchDetail();
  }, [rfqId, isAuthenticated, authLoading, router]);

  const handleAction = async (action: "ACCEPT" | "DECLINE" | "CLARIFICATION") => {
    setSubmittingAction(true);
    setError(null);
    try {
      await api.actionSupplierRFQ(rfqId, {
        action,
        reason: action === "DECLINE" ? declineReason : undefined,
        question: action === "CLARIFICATION" ? clarificationQuestion : undefined
      });
      setShowDeclineModal(false);
      setShowClarificationModal(false);
      setClarificationQuestion("");
      setSuccess(`Action "${action}" recorded successfully.`);
      fetchDetail();
    } catch (err: any) {
      setError(err.message || "Failed to submit action");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading RFQ specifications...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
        <p className="text-sm font-bold text-slate-200">RFQ Opportunity Not Found or Access Denied</p>
        <Link href="/supplier/rfqs" className="text-xs text-emerald-400 hover:underline">
          &larr; Back to Incoming RFQs
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back button and title */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/supplier/rfqs" className="hover:text-emerald-400 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to RFQs
        </Link>
        <span>/</span>
        <span className="text-emerald-400 font-bold">{detail.rfq_code}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-emerald-400 font-bold">{detail.rfq_code}</span>
            <span className="px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 font-mono text-[10px]">
              {detail.category}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold">
              {detail.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1">{detail.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Issued by <strong className="text-slate-200">{detail.buyer_company}</strong> · Deadline: <strong className="text-amber-400">{detail.deadline_date}</strong>
          </p>
        </div>

        {/* Action Buttons (Section 10 Requirements) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleAction("ACCEPT")}
            disabled={submittingAction || detail.status === "ACCEPTED"}
            className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-emerald-950 text-slate-200 hover:text-emerald-400 border border-[#242c3d] text-xs font-semibold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accept Opportunity</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClarificationModal(true)}
            className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Ask Clarification</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeclineModal(true)}
            className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-red-950 text-slate-300 hover:text-red-400 border border-[#242c3d] text-xs font-semibold flex items-center gap-1"
          >
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Decline</span>
          </button>

          <Link
            href={`/supplier/quotations?rfq_id=${detail.rfq_id}`}
            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{detail.seller_quote ? "Revise Quote" : "Prepare Quotation"} &rarr;</span>
          </Link>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Requirement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-5">
          {/* Technical Specifications */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <h2 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Technical & Manufacturing Specifications
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Manufacturing Process</span>
                <span className="font-semibold text-slate-200 text-sm mt-0.5 block">{detail.manufacturing_process}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Specified Material Grade</span>
                <span className="font-semibold text-slate-200 text-sm mt-0.5 block">{detail.material_grade}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Dimensions</span>
                <span className="font-mono text-slate-300 mt-0.5 block">{detail.dimensions || "Per technical drawing"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Tolerances & Surface Finish</span>
                <span className="font-mono text-slate-300 mt-0.5 block">{detail.tolerances || "+/- 0.05 mm"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e2432] space-y-1">
              <span className="text-slate-400 text-[11px] block">Mandatory Quality Certifications</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold block">
                {detail.required_certifications || "ISO 9001:2015"}
              </span>
            </div>

            {detail.notes && (
              <div className="pt-3 border-t border-[#1e2432] space-y-1">
                <span className="text-slate-400 text-[11px] block">Buyer Project Notes</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0e1117] p-3 rounded border border-[#1e2432]">
                  {detail.notes}
                </p>
              </div>
            )}
          </div>

          {/* Clarification History */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-3">
            <h2 className="text-xs font-bold font-mono text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> Technical Clarifications Thread
            </h2>

            {detail.clarifications.length === 0 ? (
              <p className="text-xs text-slate-400">
                No technical questions submitted yet. Click "Ask Clarification" to request buyer tolerance or packaging guidance.
              </p>
            ) : (
              <div className="space-y-2">
                {detail.clarifications.map((c) => (
                  <div key={c.id} className="p-3 rounded bg-[#0e1117] border border-[#1e2432] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                      <span>{c.submitted_at}</span>
                      <span className="text-amber-400 font-bold">{c.status}</span>
                    </div>
                    <p className="text-slate-200">{c.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Commercial & Logistics */}
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4 text-xs">
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
              Commercial Order Parameters
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded bg-[#0e1117] border border-[#1e2432] space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Order Volume</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {detail.quantity.toLocaleString()} {detail.unit}
                </span>
              </div>

              <div className="p-3 rounded bg-[#0e1117] border border-[#1e2432] space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Target Budget</span>
                <span className="text-sm font-bold font-mono text-slate-100">
                  {detail.target_budget ? `$${detail.target_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "Buyer Flexible"}
                </span>
              </div>

              <div className="p-3 rounded bg-[#0e1117] border border-[#1e2432] space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Destination Port & Hub</span>
                <span className="text-xs font-semibold text-slate-200 block">
                  {detail.destination_city}, {detail.destination_country}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Required by: {detail.required_delivery_date || "Within 45 days"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e2432]">
              <span className="text-[10px] text-slate-400 font-mono block">Commercial Terms</span>
              <p className="text-[11px] text-slate-300 mt-0.5">{detail.terms}</p>
            </div>
          </div>

          {/* Existing Submitted Quote Status */}
          {detail.seller_quote && (
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-purple-300 uppercase">Your Active Quotation</span>
                <span className="text-purple-400 font-bold font-mono">{detail.seller_quote.status}</span>
              </div>
              <p className="text-sm font-bold font-mono text-slate-100">
                ${detail.seller_quote.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-300">
                Unit Rate: ${detail.seller_quote.unit_price.toFixed(2)} · Ref: {detail.seller_quote.quote_code}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>Decline RFQ Opportunity</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Please state why this request is outside your operational envelope to notify the buyer and calibrate future AI matching accuracy.
            </p>

            <div className="space-y-2 text-xs">
              <label className="text-slate-300 font-medium block">Standard Reason Template</label>
              <select
                onChange={(e) => {
                  if (e.target.value) setDeclineReason(e.target.value);
                }}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-xs text-slate-200 font-mono"
              >
                <option value="Operational capacity fully booked for requested delivery window.">Capacity fully booked for requested delivery window</option>
                <option value="Cannot meet specified tight tolerance (+/- 0.02 mm) or surface finish requirements.">Cannot meet specified tolerance (+/- 0.02 mm) or finish</option>
                <option value="Target budget is below minimum alloy material cost baseline.">Target budget below raw material cost baseline</option>
                <option value="Destination corridor outside active export freight capabilities.">Destination outside active freight corridors</option>
                <option value="Specified raw material grade unavailable in required batch volume.">Raw material grade unavailable in requested volume</option>
              </select>

              <label className="text-slate-300 font-medium block pt-1">Detailed Explanation to Buyer</label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-xs text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="px-3 py-1.5 rounded bg-[#181e2b] text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("DECLINE")}
                disabled={submittingAction}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
              >
                {submittingAction ? "Submitting..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {showClarificationModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Ask Buyer for Technical Clarification</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your inquiry will be logged in the procurement audit trail and transmitted to the enterprise buyer.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Please confirm if thread pitch is metric M12x1.5 or imperial UNC 1/2-13..."
              value={clarificationQuestion}
              onChange={(e) => setClarificationQuestion(e.target.value)}
              className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-xs text-slate-100"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClarificationModal(false)}
                className="px-3 py-1.5 rounded bg-[#181e2b] text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction("CLARIFICATION")}
                disabled={submittingAction || !clarificationQuestion.trim()}
                className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupplierRFQDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-zinc-400">Loading RFQ workspace details...</div>}>
      <SupplierRFQDetailContent {...props} />
    </Suspense>
  );
}
