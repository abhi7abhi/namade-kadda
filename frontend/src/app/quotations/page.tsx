"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageGuide from "@/components/PageGuide";
import Tooltip from "@/components/Tooltip";
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Sliders,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  PlusCircle,
  RefreshCw,
  Scale
} from "lucide-react";
import {
  api,
  RFQ,
  QuotationComparisonResponse,
  QuotationComparisonItem
} from "@/lib/api";

export default function QuotationsPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(null);
  const [comparison, setComparison] = useState<QuotationComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic Comparison Weights
  const [priceWeight, setPriceWeight] = useState(0.5);
  const [leadWeight, setLeadWeight] = useState(0.3);
  const [reliabilityWeight, setReliabilityWeight] = useState(0.2);

  // Acceptance Modal State
  const [acceptingQuote, setAcceptingQuote] = useState<QuotationComparisonItem | null>(null);
  const [acceptanceReason, setAcceptanceReason] = useState("Best total commercial value, fastest delivery timeline, and verified quality track record.");
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false);

  // New RFQ Modal State
  const [showNewRfqModal, setShowNewRfqModal] = useState(false);
  const [newRfqTitle, setNewRfqTitle] = useState("RFQ: Industrial Parts Production Batch");
  const [newRfqReqId, setNewRfqReqId] = useState(1);

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      const data = await api.getRFQs();
      setRfqs(data);
      if (data.length > 0 && !selectedRfqId) {
        setSelectedRfqId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
    try {
      localStorage.setItem("nk_visited_quotations", "true");
    } catch {
      // ignore
    }
  }, []);

  const runComparison = async () => {
    if (!selectedRfqId) return;
    setComparing(true);
    try {
      const res = await api.compareQuotations(selectedRfqId, {
        price_weight: priceWeight,
        lead_time_weight: leadWeight,
        reliability_weight: reliabilityWeight
      });
      setComparison(res);
    } catch (err: any) {
      setError(err.message || "Failed to compare quotations");
    } finally {
      setComparing(false);
    }
  };

  useEffect(() => {
    if (selectedRfqId) {
      runComparison();
    }
  }, [selectedRfqId, priceWeight, leadWeight, reliabilityWeight]);

  const handleAcceptQuotation = async () => {
    if (!acceptingQuote) return;
    setIsSubmittingAccept(true);
    setError(null);
    try {
      await api.acceptQuotation(acceptingQuote.quotation_id, acceptanceReason, true);
      setSuccessMessage(`Quotation ${acceptingQuote.quote_code} accepted! Purchase Order created successfully in PostgreSQL.`);
      setAcceptingQuote(null);
      runComparison();
    } catch (err: any) {
      setError(err.message || "Failed to accept quotation");
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createRFQ({
        sourcing_request_id: newRfqReqId,
        title: newRfqTitle,
        supplier_ids: [1, 2]
      });
      setShowNewRfqModal(false);
      setSuccessMessage(`RFQ ${created.rfq_code} created successfully!`);
      await fetchRfqs();
      setSelectedRfqId(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to create RFQ");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">RFQ & Quotation Evaluation Workspace</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              WEIGHTED SCORING ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Side-by-side offer matrix, transparent decision criteria, missing-specification detection, and PO issuance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRfqModal(true)}
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Create New RFQ
          </button>
        </div>
      </div>

      {/* Page Guide */}
      <PageGuide
        route="quotations"
        steps={[
          "Pick an active RFQ to view competing supplier quotation bids side by side.",
          "Adjust the Price, Lead Time, and Reliability sliders to customize weighted score normalization.",
          "Accept the preferred quotation with a business rationale to automatically issue a Purchase Order."
        ]}
        tip="Inspect the 'Missing Fields' column to quickly identify vendor bids lacking mill certificates or shipping estimates."
        demoNote="Quotation submissions and acceptances are simulated internal workflows; no emails or contracts are moved."
      />

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* RFQ Selector Bar */}
      <div className="p-4 rounded-lg bg-[#141821] border border-[#212735] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Select RFQ:</span>
          <select
            value={selectedRfqId || ""}
            onChange={(e) => setSelectedRfqId(Number(e.target.value))}
            className="bg-[#10131a] border border-[#232938] rounded px-3 py-1.5 text-xs text-slate-200 font-mono"
          >
            {rfqs.map((rfq) => (
              <option key={rfq.id} value={rfq.id}>
                {rfq.rfq_code} — {rfq.title} ({rfq.status})
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Status: <span className="text-emerald-400 font-bold">ISSUED</span> | Demo Mode Workflow
        </div>
      </div>

      {/* Weight Adjuster Panel */}
      <div className="p-4 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Adjust Evaluation Criteria Weights</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Transparent Formula: (Price × {Math.round(priceWeight * 100)}%) + (LeadTime × {Math.round(leadWeight * 100)}%) + (Reliability × {Math.round(reliabilityWeight * 100)}%)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                Price Competitiveness
                <Tooltip content="Normalized relative price scoring; lower unit cost scores higher." />
              </span>
              <span className="font-mono text-slate-200 font-bold">{(priceWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={priceWeight}
              onChange={(e) => setPriceWeight(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                Delivery Lead Time
                <Tooltip content="Factory manufacturing and door-to-port dispatch schedule; shorter timelines score higher." />
              </span>
              <span className="font-mono text-slate-200 font-bold">{(leadWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={leadWeight}
              onChange={(e) => setLeadWeight(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                Supplier Track Record
                <Tooltip content="ISO 9001 / AS9100 quality certifications, historical fulfillment rate, and on-time reliability." />
              </span>
              <span className="font-mono text-slate-200 font-bold">{(reliabilityWeight * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={reliabilityWeight}
              onChange={(e) => setReliabilityWeight(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Side-by-Side Quotation Comparison Table */}
      <div className="p-4 rounded-lg bg-[#141821] border border-[#212735]">
        <div className="flex items-center justify-between pb-3 border-b border-[#212735] mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Side-by-Side Quotation Matrix</h3>
            <p className="text-[11px] text-slate-400">
              {comparison?.transparency_explanation || "Comparative rankings and normalized composite scoring."}
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {comparison?.quotations.length || 0} OFFERS COMPARED
          </span>
        </div>

        {comparing ? (
          <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Recalculating weighted score matrix...</span>
          </div>
        ) : !comparison || comparison.quotations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#181d27] border border-[#273042] flex items-center justify-center mx-auto text-slate-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">No quotations received for this RFQ yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Suppliers receive specifications and upload commercial proposals. You can create a new RFQ or inspect existing proposals.
              </p>
            </div>
            <button
              onClick={() => setShowNewRfqModal(true)}
              className="px-3.5 py-1.5 rounded bg-[#18202d] hover:bg-[#20293a] border border-[#2d384e] text-emerald-400 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Issue New RFQ
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1f2533] text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2">Quote ID</th>
                  <th className="pb-2">Total Amount</th>
                  <th className="pb-2">Unit Price</th>
                  <th className="pb-2">Lead Time</th>
                  <th className="pb-2">Terms</th>
                  <th className="pb-2">
                    <span className="inline-flex items-center gap-1">
                      Missing Fields
                      <Tooltip content="Flags missing vendor deliverables such as material test reports (MTR), customs certificates, or shipping incoterms." />
                    </span>
                  </th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b202c]">
                {comparison.quotations.map((q) => (
                  <tr key={q.quotation_id} className="hover:bg-[#181d27] transition-colors">
                    <td className="py-3 font-mono font-bold">
                      {q.rank === 1 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 text-[10px]">
                          #1 TOP
                        </span>
                      ) : (
                        <span className="text-slate-400">#{q.rank}</span>
                      )}
                    </td>
                    <td className="py-3 font-medium text-slate-200">
                      <div>
                        <span>{q.supplier_name}</span>
                        <span className="block text-[10px] text-slate-500">{q.supplier_country}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-400">{q.quote_code}</td>
                    <td className="py-3 font-mono text-emerald-400 font-bold text-sm">
                      ${q.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      ${q.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {q.lead_time_days} days
                    </td>
                    <td className="py-3 text-slate-400">{q.payment_terms}</td>
                    <td className="py-3">
                      {q.missing_fields && q.missing_fields.length > 0 ? (
                        <span className="text-amber-400 text-[10px] font-mono">
                          {q.missing_fields.join(", ")}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-mono">Complete</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-200 font-bold">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-[#10131a] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(q.comparison_score, 100)}%` }}
                          />
                        </div>
                        <span>{q.comparison_score}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setAcceptingQuote(q)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded shadow-xs"
                      >
                        Accept & Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Acceptance & PO Generation Confirmation Dialog */}
      {acceptingQuote && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#141822] border border-[#273042] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base pb-2 border-b border-[#212735]">
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirm Quotation Acceptance</span>
            </div>

            <p className="text-xs text-slate-300">
              You are selecting <strong>{acceptingQuote.quote_code}</strong> from{" "}
              <strong>{acceptingQuote.supplier_name}</strong> for a contract value of{" "}
              <strong>${acceptingQuote.total_amount.toLocaleString()}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Provide Procurement Justification:
              </label>
              <textarea
                value={acceptanceReason}
                onChange={(e) => setAcceptanceReason(e.target.value)}
                rows={3}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px]">
              Note: This action records official quote acceptance in PostgreSQL and automatically creates Purchase Order PO-2026-XXX in the Orders ledger.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAcceptingQuote(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAcceptQuotation}
                disabled={isSubmittingAccept}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow-xs"
              >
                {isSubmittingAccept ? "Issuing Purchase Order..." : "Confirm & Generate Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New RFQ Modal */}
      {showNewRfqModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateRfq} className="bg-[#141822] border border-[#273042] rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 pb-2 border-b border-[#212735]">
              Issue New Request for Quotation (RFQ)
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">RFQ Title</label>
              <input
                type="text"
                value={newRfqTitle}
                onChange={(e) => setNewRfqTitle(e.target.value)}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Sourcing Request ID</label>
              <input
                type="number"
                value={newRfqReqId}
                onChange={(e) => setNewRfqReqId(Number(e.target.value))}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-xs text-slate-200"
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Invitations will be recorded for Apex Precision Engineering & Bharat ForgeTech Solutions.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRfqModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded"
              >
                Create RFQ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
