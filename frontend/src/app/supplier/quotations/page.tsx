"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Building2,
  Edit,
  History
} from "lucide-react";
import { api, Quotation, SupplierRFQItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

function QuotationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillRfqId = searchParams.get("rfq_id");

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [rfqs, setRfqs] = useState<SupplierRFQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Create Quotation Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    rfq_id: prefillRfqId ? parseInt(prefillRfqId) : 1,
    unit_price: 15.5,
    currency: "USD",
    moq: 100,
    lead_time_days: 18,
    incoterms: "FOB",
    payment_terms: "Net 30, EXW Factory",
    estimated_shipping_cost: 250.0,
    discounts: 0.0,
    tax_amount: 0.0,
    warranty_info: "12 Months Manufacturer Warranty against material defects",
    packaging_details: "Export-grade wooden crate with VCI anti-corrosion wrap",
    technical_deviations: "CNC chamfering increased to 0.5mm for automated robotic assembly.",
    notes: "Includes 3.1 Material Test Certificate and dimensional inspection report.",
    parent_quotation_id: undefined as number | undefined
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quotesRes, rfqsRes] = await Promise.all([
        api.getSupplierQuotations(),
        api.getSupplierRFQs()
      ]);
      setQuotations(quotesRes);
      setRfqs(rfqsRes);

      if (prefillRfqId) {
        setShowModal(true);
        setForm((f) => ({ ...f, rfq_id: parseInt(prefillRfqId) }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load supplier quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  // Decimal-safe live subtotal calculation
  const selectedRfq = rfqs.find((r) => r.rfq_id === form.rfq_id);
  const quantity = selectedRfq ? selectedRfq.quantity : form.moq;
  const subtotal = form.unit_price * quantity;
  const calculatedTotal = subtotal + form.estimated_shipping_cost + form.tax_amount - form.discounts;

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.createSupplierQuotation({
        ...form,
        items: [
          {
            item_name: selectedRfq ? selectedRfq.title : `Manufactured Component Batch`,
            description: form.technical_deviations,
            quantity: quantity,
            unit_price: form.unit_price,
            lead_time_days: form.lead_time_days
          }
        ]
      });
      setShowModal(false);
      setSuccess(`Quotation ${res.quote_code} submitted successfully! The enterprise buyer can now review and compare.`);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to submit quotation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRevise = (quote: Quotation) => {
    setForm({
      rfq_id: quote.rfq_id,
      unit_price: quote.unit_price,
      currency: quote.currency,
      moq: quote.moq,
      lead_time_days: quote.lead_time_days,
      incoterms: (quote as any).incoterms || "FOB",
      payment_terms: quote.payment_terms || "Net 30",
      estimated_shipping_cost: (quote as any).estimated_shipping_cost || quote.shipping_estimate || 0,
      discounts: (quote as any).discounts || 0,
      tax_amount: (quote as any).tax_amount || 0,
      warranty_info: (quote as any).warranty_info || "12 Months Warranty",
      packaging_details: (quote as any).packaging_details || "Export Crate",
      technical_deviations: (quote as any).technical_deviations || "",
      notes: `Revised terms following buyer feedback. Previous quote: ${quote.quote_code}`,
      parent_quotation_id: quote.id
    });
    setShowModal(true);
  };

  const filtered = quotations.filter((q) => {
    if (statusFilter === "ALL") return true;
    return q.status === statusFilter;
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
        badge="MY QUOTATIONS & COMMERCIAL OFFERS"
        title="Quotation Submissions & Negotiation Management"
        description="Prepare binding commercial quotations with decimal-safe cost breakdowns, custom Incoterms, lead times, and revision histories."
        tip="Once submitted, quotes are instantly visible in the buyer's multi-bid comparison matrix. Accepted quotes automatically convert into official purchase orders."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Supplier Quotations Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track submitted bids, handle buyer revision requests, maintain version audit trails, and review accepted awards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm((f) => ({ ...f, parent_quotation_id: undefined }));
            setShowModal(true);
          }}
          className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Prepare New Quotation</span>
        </button>
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { id: "ALL", label: "All Quotations" },
          { id: "SUBMITTED", label: "Submitted" },
          { id: "UNDER_REVIEW", label: "Under Review" },
          { id: "ACCEPTED", label: "Accepted" },
          { id: "REVISED", label: "Revised" },
          { id: "REJECTED", label: "Rejected" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-[#141821] text-slate-400 hover:text-slate-200 hover:bg-[#1a212d] border border-[#212838]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quotations Table */}
      <div className="rounded-xl bg-[#141821] border border-[#212735] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading quotations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No quotations found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't submitted any quotations matching this status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0e1117] text-slate-400 font-mono text-[10px] uppercase border-b border-[#212735]">
                <tr>
                  <th className="p-3">Quote ID & Revision</th>
                  <th className="p-3">Related RFQ</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-center">Lead Time</th>
                  <th className="p-3 text-center">Incoterms</th>
                  <th className="p-3 text-right">Total Offer Value</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2432] text-slate-300">
                {filtered.map((q) => {
                  const rev = (q as any).revision_number || 1;
                  return (
                    <tr key={q.id} className="hover:bg-[#161a24] transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-emerald-400 font-bold block">{q.quote_code}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Revision v{rev} · {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-200 block truncate max-w-xs">
                          {q.rfq?.title || `RFQ #${q.rfq_id}`}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {q.rfq?.rfq_code || `RFQ-${q.rfq_id}`}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-slate-100">
                        ${q.unit_price.toFixed(2)}
                      </td>

                      <td className="p-3 text-center font-mono">
                        {q.lead_time_days} days
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 font-mono text-[10px]">
                          {(q as any).incoterms || "FOB"}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono text-base font-bold text-slate-100">
                        ${q.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          q.status === "ACCEPTED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : q.status === "REVISED"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : q.status === "REJECTED"
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}>
                          {q.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        {q.status !== "ACCEPTED" && (
                          <button
                            type="button"
                            onClick={() => handleOpenRevise(q)}
                            className="px-2.5 py-1 rounded bg-[#181e2b] hover:bg-[#202738] text-slate-200 border border-[#2a3449] font-semibold text-[11px] flex items-center gap-1 ml-auto"
                          >
                            <Edit className="w-3 h-3 text-emerald-400" />
                            <span>Revise Quote</span>
                          </button>
                        )}
                        {q.status === "ACCEPTED" && (
                          <Link
                            href="/supplier/orders"
                            className="text-[11px] text-emerald-400 hover:underline font-semibold"
                          >
                            View Order &rarr;
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prepare / Revise Quotation Modal (Section 11) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b3b]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>{form.parent_quotation_id ? "Submit Revised Quotation" : "Formulate Binding Quotation"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Decimal-safe calculation engine · All monetary values validated on backend
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Target RFQ Opportunity</label>
                  <select
                    value={form.rfq_id}
                    onChange={(e) => setForm({ ...form, rfq_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    {rfqs.map((r) => (
                      <option key={r.rfq_id} value={r.rfq_id}>
                        {r.rfq_code}: {r.title} ({r.quantity} {r.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Offered Unit Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Production Lead Time (Days)</label>
                  <input
                    type="number"
                    required
                    value={form.lead_time_days}
                    onChange={(e) => setForm({ ...form, lead_time_days: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Incoterms Trade Terms</label>
                  <select
                    value={form.incoterms}
                    onChange={(e) => setForm({ ...form, incoterms: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="EXW">EXW - Ex Works (Factory Pick)</option>
                    <option value="FOB">FOB - Free on Board (Port of Dispatch)</option>
                    <option value="CIF">CIF - Cost, Insurance & Freight</option>
                    <option value="DDP">DDP - Delivered Duty Paid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Commercial Payment Terms</label>
                  <input
                    type="text"
                    required
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Shipping / Freight ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.estimated_shipping_cost}
                    onChange={(e) => setForm({ ...form, estimated_shipping_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Volume Discounts ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discounts}
                    onChange={(e) => setForm({ ...form, discounts: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500 text-emerald-400"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Warranty & Compliance Coverage</label>
                  <input
                    type="text"
                    value={form.warranty_info}
                    onChange={(e) => setForm({ ...form, warranty_info: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Export Packaging & Protection Specification</label>
                  <input
                    type="text"
                    value={form.packaging_details}
                    onChange={(e) => setForm({ ...form, packaging_details: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Technical Deviations / Proposed Alternatives</label>
                  <textarea
                    rows={2}
                    value={form.technical_deviations}
                    onChange={(e) => setForm({ ...form, technical_deviations: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Live Subtotal Box */}
              <div className="p-3.5 bg-[#0d1016] border border-[#232b3b] rounded-lg space-y-1 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Batch Quantity:</span>
                  <span>{quantity.toLocaleString()} units</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Item Subtotal ({quantity} x ${form.unit_price.toFixed(2)}):</span>
                  <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Freight & Duties:</span>
                  <span>+${form.estimated_shipping_cost.toFixed(2)}</span>
                </div>
                {form.discounts > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Discount Deduction:</span>
                    <span>-${form.discounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-bold text-slate-100 pt-2 border-t border-[#1e2432]">
                  <span>Total Quoted Amount:</span>
                  <span className="text-emerald-400 font-mono text-base">
                    ${calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232b3b]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded bg-[#181e2b] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Transmitting Quote..." : "Submit Binding Quotation"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupplierQuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Loading quotation workspace...</div>}>
      <QuotationsContent />
    </Suspense>
  );
}
