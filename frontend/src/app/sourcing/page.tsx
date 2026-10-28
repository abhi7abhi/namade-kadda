"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Edit3,
  Bot
} from "lucide-react";
import {
  api,
  SourcingRequest,
  SourcingExtractionResult
} from "@/lib/api";
import PageGuide from "@/components/PageGuide";
import Tooltip from "@/components/Tooltip";

function SourcingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<SourcingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Natural Language Input State
  const initialQuery = searchParams.get("query") || "";
  const [rawInput, setRawInput] = useState(
    initialQuery || "Source 500 stainless-steel mounting brackets, grade 304, thickness 4 mm, manufactured in India, delivered within four weeks."
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<SourcingExtractionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState<Partial<SourcingRequest>>({});

  const fetchRequests = () => {
    setLoading(true);
    api.getSourcingRequests()
      .then((res) => setRequests(res.items))
      .catch((err) => setError(err.message || "Failed to load sourcing requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    try {
      localStorage.setItem("nk_visited_sourcing", "true");
    } catch (e) {
      // Ignore
    }
    fetchRequests();
  }, []);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim()) return;
    setIsExtracting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.parseRequirement(rawInput);
      setExtractedResult(res);
      // Pre-fill editable form with extracted parameters
      setFormData({
        raw_input: rawInput,
        title: res.title,
        category: res.category || "Sheet Metal Fabrication",
        quantity: res.quantity || 500,
        unit: res.unit || "pieces",
        target_budget: res.target_budget || 7500,
        currency: res.currency || "USD",
        destination_country: res.destination_country || "India",
        destination_city: res.destination_city || "Bangalore",
        required_delivery_date: res.required_delivery_date || "Within 4 weeks",
        manufacturing_process: res.manufacturing_process || "Sheet Metal / Laser Cutting",
        material_grade: res.material_grade || "Stainless Steel 304",
        dimensions: res.dimensions || "250mm x 150mm x 4mm",
        tolerances: res.tolerances || "ISO 2768-m (±0.3mm)",
        required_certifications: res.required_certifications || "ISO 9001:2015, Mill Test Cert 3.1",
        notes: res.notes || "High precision bracket requirement"
      });
    } catch (err: any) {
      setError(err.message || "Failed to extract specifications");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveConfirmedRequest = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const saved = await api.createSourcingRequest({
        ...formData,
        raw_input: rawInput,
        status: "CONFIRMED"
      });
      setSuccessMessage(`Sourcing Request ${saved.request_code} successfully persisted in PostgreSQL!`);
      setExtractedResult(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.message || "Failed to save sourcing request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Natural Language Sourcing Engine</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              POSTGRESQL PERSISTENCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transform conversational procurement requirements into structured engineering specifications with zero hallucinations.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Per-Page Guide Panel */}
      <PageGuide
        routeKey="sourcing"
        steps={[
          "Type your sourcing requirement in plain English (e.g. 'Source 500 stainless-steel brackets, grade 304, thickness 4 mm, delivered in 4 weeks').",
          "The engine extracts technical specifications—review, correct, and confirm any highlighted missing parameters.",
          "Save to persist the structured request to PostgreSQL, generating a unique SR-2026-XXX reference code for RFQ issuance."
        ]}
        tip="Click any of the 3 example requirements below the prompt label to instantly test parameter extraction."
        demoNote="Uses rule-based heuristics offline; delegates to connected cloud LLM when configured in .env."
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

      {/* Prominent Natural Language Input Box */}
      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Describe your industrial manufacturing requirement in plain text:</span>
          </label>
          <span className="text-[10px] font-mono text-slate-500">
            Rule-Based Demo Parser + LLM Gateway
          </span>
        </div>

        {/* 3 Clickable Example Requirements */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Click a sample requirement to populate:</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setRawInput("Source 500 stainless-steel mounting brackets, grade 304, thickness 4 mm, manufactured in India, delivered within four weeks.")
              }
              className="p-2 rounded bg-[#101319] hover:bg-[#181d28] text-slate-300 border border-[#232938] text-left text-[11px] transition-colors leading-relaxed group"
            >
              <strong className="block text-emerald-400 text-[10px] uppercase font-mono mb-0.5 group-hover:underline">Sample 1: SS 304 Brackets</strong>
              500 stainless mounting brackets, grade 304, thk 4mm, delivered in 4 weeks.
            </button>
            <button
              type="button"
              onClick={() =>
                setRawInput("Source 1000 CNC machined SS 316 flange adapters, tolerance ±0.05 mm, delivered to Bangalore in 3 weeks.")
              }
              className="p-2 rounded bg-[#101319] hover:bg-[#181d28] text-slate-300 border border-[#232938] text-left text-[11px] transition-colors leading-relaxed group"
            >
              <strong className="block text-emerald-400 text-[10px] uppercase font-mono mb-0.5 group-hover:underline">Sample 2: CNC Flange Adapters</strong>
              1000 CNC machined SS 316 flange adapters, tolerance ±0.05mm, in 3 weeks.
            </button>
            <button
              type="button"
              onClick={() =>
                setRawInput("Source 200 aluminum die-cast housings, alloy A380, shot blasted finish, delivered to Germany within 6 weeks.")
              }
              className="p-2 rounded bg-[#101319] hover:bg-[#181d28] text-slate-300 border border-[#232938] text-left text-[11px] transition-colors leading-relaxed group"
            >
              <strong className="block text-emerald-400 text-[10px] uppercase font-mono mb-0.5 group-hover:underline">Sample 3: Die-Cast Housings</strong>
              200 aluminum die-cast housings, alloy A380, shot blasted finish, in 6 weeks.
            </button>
          </div>
        </div>

        <form onSubmit={handleParse} className="space-y-3">
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={3}
            placeholder="e.g. Source 500 stainless-steel mounting brackets, grade 304, thickness 4 mm, manufactured in India, delivered within four weeks..."
            className="w-full bg-[#10131a] border border-[#232938] rounded-md p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isExtracting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow-xs transition-colors"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Specifications...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Extract Structured Specs</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Structured Review & Correction Panel */}
      {extractedResult && (
        <div className="p-5 rounded-lg bg-[#141821] border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#212735]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Review & Correct Extracted Specifications</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                Confidence: {(extractedResult.confidence_score * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10131a] text-slate-400 border border-[#232938]">
                Mode: {extractedResult.mode}
              </span>
            </div>
          </div>

          {/* Missing Fields Warning Banner */}
          {extractedResult.missing_fields.length > 0 && (
            <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Missing specifications detected: <strong>{extractedResult.missing_fields.join(", ")}</strong>. Please review or confirm defaults below before saving.
              </span>
            </div>
          )}

          {/* Editable Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Part / Project Title</label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Material & Grade</label>
              <input
                type="text"
                value={formData.material_grade || ""}
                onChange={(e) => setFormData({ ...formData, material_grade: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Manufacturing Process</label>
              <input
                type="text"
                value={formData.manufacturing_process || ""}
                onChange={(e) => setFormData({ ...formData, manufacturing_process: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Quantity & Unit</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.quantity || 0}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-2/3 bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
                <input
                  type="text"
                  value={formData.unit || "pieces"}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-1/3 bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Dimensions</label>
              <input
                type="text"
                value={formData.dimensions || ""}
                onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Tolerances</label>
              <input
                type="text"
                value={formData.tolerances || ""}
                onChange={(e) => setFormData({ ...formData, tolerances: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Target Budget (USD)</label>
              <input
                type="number"
                value={formData.target_budget || 0}
                onChange={(e) => setFormData({ ...formData, target_budget: Number(e.target.value) })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Destination Country</label>
              <input
                type="text"
                value={formData.destination_country || ""}
                onChange={(e) => setFormData({ ...formData, destination_country: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Required Delivery Date</label>
              <input
                type="text"
                value={formData.required_delivery_date || ""}
                onChange={(e) => setFormData({ ...formData, required_delivery_date: e.target.value })}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#212735] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setExtractedResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveConfirmedRequest}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Persist Sourcing Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Sourcing Requests Table */}
      <div className="p-4 rounded-lg bg-[#141821] border border-[#212735]">
        <div className="flex items-center justify-between pb-3 border-b border-[#212735] mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Stored Sourcing Requests</h3>
          <span className="text-[10px] font-mono text-slate-500">
            {requests.length} RECORDS FOUND
          </span>
        </div>

        {loading ? (
          <div className="space-y-2 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-[#10131a] rounded animate-pulse" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No sourcing requests found in database. Use the natural language form above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1f2533] text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-2">Request Code</th>
                  <th className="pb-2">Title</th>
                  <th className="pb-2">Material / Process</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Destination</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b202c]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#181d27] transition-colors">
                    <td className="py-2.5 font-mono text-emerald-400 font-medium">{req.request_code}</td>
                    <td className="py-2.5 font-medium text-slate-200 max-w-xs truncate">{req.title}</td>
                    <td className="py-2.5 text-slate-400">
                      {req.material_grade || req.manufacturing_process || "Fabrication"}
                    </td>
                    <td className="py-2.5 text-slate-300 font-mono">
                      {req.quantity ? `${req.quantity} ${req.unit}` : "N/A"}
                    </td>
                    <td className="py-2.5 text-slate-400">{req.destination_country || "India"}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => router.push(`/quotations?requestId=${req.id}`)}
                        className="px-2 py-1 text-[11px] text-slate-300 hover:text-emerald-400 font-medium inline-flex items-center gap-1"
                      >
                        RFQ & Quotes <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SourcingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-mono">Loading Sourcing Workspace...</div>}>
      <SourcingContent />
    </Suspense>
  );
}
