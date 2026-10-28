"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageGuide from "@/components/PageGuide";
import Tooltip from "@/components/Tooltip";
import {
  Globe2,
  FileCheck,
  AlertTriangle,
  HelpCircle,
  Calculator,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Building2,
  Download,
  FileText,
  Truck,
  DollarSign
} from "lucide-react";
import { api, TradeEstimateResponse } from "@/lib/api";

function TradeContent() {
  const searchParams = useSearchParams();

  const [originCountry, setOriginCountry] = useState(searchParams.get("origin") || "Germany");
  const [destinationCountry, setDestinationCountry] = useState("India");
  const [description, setDescription] = useState(searchParams.get("desc") || "Industrial ball bearings high precision ABEC-5");
  const [declaredValue, setDeclaredValue] = useState(Number(searchParams.get("val")) || 7500);
  const [quantity, setQuantity] = useState(200);
  const [supplierName, setSupplierName] = useState("Rhineland Machining GmbH");
  const [currency, setCurrency] = useState("USD");
  const [freightEstimate, setFreightEstimate] = useState(450);

  const [estimate, setEstimate] = useState<TradeEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.calculateTradeEstimate({
        origin_country: originCountry,
        destination_country: destinationCountry,
        product_description: description,
        declared_value: declaredValue,
        currency,
        freight_insurance_estimate: freightEstimate
      });
      setEstimate(res);
    } catch (err: any) {
      setError(err.message || "Failed to calculate trade assessment");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setError(null);
    setDownloadSuccess(false);
    try {
      const blob = await api.downloadTradePdf({
        origin_country: originCountry,
        destination_country: destinationCountry,
        product_description: description,
        declared_value: declaredValue,
        quantity: quantity,
        unit_price: declaredValue > 0 && quantity > 0 ? declaredValue / quantity : undefined,
        currency,
        freight_insurance_estimate: freightEstimate,
        supplier_name: supplierName
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Namade_Kadda_Trade_Report_${originCountry}_to_${destinationCountry}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to generate Trade Cost PDF report.");
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    handleCalculate();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Trade & Customs Compliance Workspace</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-950/80 text-amber-300 border border-amber-800/40 font-bold">
              ESTIMATIVE ADVISORY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Preliminary HS classification analysis, illustrative customs tariffs, import taxes, and downloadable PDF reports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={pdfLoading || !estimate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            {pdfLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Generate Trade Cost PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Trade Cost PDF report downloaded successfully! Check your browser downloads.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Page Guide */}
      <PageGuide
        route="trade"
        steps={[
          "Enter goods origin, destination country, product description, and declared commercial value.",
          "Review the candidate HS classification, CIF assessable base, customs duty, IGST, and SWS.",
          "Click 'Generate Trade Cost PDF' to export an itemized legal report for internal review or customs broker consultation."
        ]}
        tip="For Indian imports, assessable CIF includes declared value plus freight and transit insurance."
        demoNote="ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION. Official rates require a licensed customs broker."
      />

      {/* Mandatory Statutory Notice */}
      <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">LEGAL & REGULATORY NOTICE:</p>
          <p className="text-amber-300/90 leading-relaxed">
            ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION. For Indian and international imports, applicable Basic Customs Duty (BCD), IGST, Social Welfare Surcharge (SWS), anti-dumping levies, valuation rules, and port handling fees depend strictly on the finalized Bill of Entry and official classification by customs authorities at the port of entry. Independent consultation with a licensed Customs Broker (CHA) is strictly required.
          </p>
        </div>
      </div>

      {/* Input Form & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs (1 col) */}
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Preliminary Assessment Inputs</span>
          </h3>

          <form onSubmit={handleCalculate} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Origin Country</label>
              <select
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              >
                <option value="Germany">Germany (Stuttgart / Hamburg)</option>
                <option value="China">China (Shenzhen / Ningbo)</option>
                <option value="Japan">Japan (Nagoya / Tokyo)</option>
                <option value="United States">United States (Chicago / Long Beach)</option>
                <option value="India">India (Bangalore / Pune)</option>
                <option value="Taiwan">Taiwan (Taichung)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Destination Country</label>
              <select
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              >
                <option value="India">India (Nhava Sheva / Bangalore ICD)</option>
                <option value="Germany">Germany (Hamburg / Frankfurt)</option>
                <option value="United States">United States (Long Beach / Newark)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Supplier Company Name</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier name"
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Product Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Quantity (Units)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Declared Value ({currency})</label>
                <input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Number(e.target.value))}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Freight & Insurance</label>
                <input
                  type="number"
                  value={freightEstimate}
                  onChange={(e) => setFreightEstimate(Number(e.target.value))}
                  className="w-full bg-[#10131a] border border-[#232938] rounded p-2 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Unit Cost Basis</label>
                <div className="p-2 bg-[#0b0d11] border border-[#232938] rounded font-mono text-emerald-400 text-xs">
                  ${quantity > 0 ? (declaredValue / quantity).toFixed(2) : "0.00"} / unit
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Computing...</span>
                  </>
                ) : (
                  <>
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Update Calculation</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading || !estimate}
                className="px-3 py-2 bg-[#1b2230] hover:bg-[#232c3f] border border-[#2b364d] text-slate-200 font-semibold rounded flex items-center justify-center gap-1.5"
                title="Download PDF Report"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF</span>
              </button>
            </div>
          </form>
        </div>

        {/* Results & Document Checklist (2 cols) */}
        {estimate ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Tariff Breakdown Card */}
            <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#212735] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      Candidate HS Code:
                      <Tooltip content="Harmonized System 6-to-8 digit code governing international customs classification and applicable tariff rates." />
                    </span>
                    <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      {estimate.hs_code_candidate}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Source Basis: {estimate.source_basis}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center justify-end gap-1">
                    Total Landed Estimate
                    <Tooltip content="Comprehensive landed financial estimate including base goods, freight, insurance, and statutory import levies." />
                  </span>
                  <span className="text-xl font-mono text-emerald-400 font-extrabold">
                    ${estimate.total_landed_estimate.toLocaleString(undefined, { minimumFractionDigits: 2 })} {estimate.currency}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-400">
                    Est. Landed: ${quantity > 0 ? (estimate.total_landed_estimate / quantity).toFixed(2) : "0.00"} / unit
                  </span>
                </div>
              </div>

              {/* Formula & Financial Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[#10131a] border border-[#1e2330]">
                  <span className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                    CIF Value
                    <Tooltip content="Cost, Insurance, and Freight; total assessable value upon arrival at port of entry." />
                  </span>
                  <span className="text-slate-200 font-bold">${estimate.cif_value.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded bg-[#10131a] border border-[#1e2330]">
                  <span className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                    <span>Duty ({estimate.estimated_duty_rate_percent}%)</span>
                    <Tooltip content="Basic Customs Duty (BCD) assessed on CIF value according to destination tariff schedule." />
                  </span>
                  <span className="text-slate-200 font-bold">${estimate.duty_estimate.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded bg-[#10131a] border border-[#1e2330]">
                  <span className="text-[10px] text-slate-500 uppercase flex items-center justify-between">
                    <span>IGST ({estimate.estimated_tax_rate_percent}%)</span>
                    <Tooltip content="Integrated Goods and Services Tax applicable on imports into India, calculated on CIF + BCD + SWS." />
                  </span>
                  <span className="text-slate-200 font-bold">${estimate.tax_estimate.toFixed(2)}</span>
                </div>
                <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <span className="text-[10px] text-emerald-400 uppercase flex items-center justify-between">
                    Total Landed
                    <Tooltip content="Total landed cost = CIF + Customs Duty + IGST + SWS surcharge." />
                  </span>
                  <span className="font-bold">${estimate.total_landed_estimate.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Bar for PDF Report */}
              <div className="p-3 bg-[#0d0f15] border border-[#1d2331] rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Downloadable Trade Cost PDF Report</span>
                    <span className="text-[10px] text-slate-500">Includes legal statutory disclaimers, duty tables, and document checklist.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>

              {/* Document Checklist */}
              <div>
                <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mandatory Trade Filing Checklist</span>
                </h4>
                <div className="space-y-2">
                  {estimate.compliance_checklist.map((doc, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#10131a] border border-[#1f2533] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{doc.document_name}</span>
                        <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-[#0d1016]">
                          {doc.mandatory ? "Mandatory" : "Optional"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{doc.purpose}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Authority: {doc.issuing_authority}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function TradePage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading Trade & Customs Compliance Workspace...</div>}>
      <TradeContent />
    </Suspense>
  );
}
