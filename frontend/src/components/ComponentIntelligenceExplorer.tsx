"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Sparkles,
  Layers,
  Cpu,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  Building2,
  DollarSign,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
  Network,
  Package,
  Info,
  X,
  FileText,
  Calculator,
  SlidersHorizontal,
  Check
} from "lucide-react";
import {
  api,
  ComponentIntelligenceSearchResponse,
  ComponentItem,
  ProductUsage,
  ComponentMatchSupplier,
  DisambiguationOption
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface HistoryStep {
  query: string;
  mode: string;
  label: string;
}

export default function ComponentIntelligenceExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Search State
  const initialQ = searchParams?.get("q") || "Smartphone";
  const initialMode = searchParams?.get("mode") || "auto_detect";

  const [query, setQuery] = useState(initialQ);
  const [mode, setMode] = useState<string>(initialMode);
  const [data, setData] = useState<ComponentIntelligenceSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state: cards vs hierarchy
  const [viewMode, setViewMode] = useState<"cards" | "hierarchy">("cards");

  // Navigation History Trail for Two-Way Reverse Navigation
  const [historyTrail, setHistoryTrail] = useState<HistoryStep[]>([
    { query: initialQ, mode: initialMode, label: initialQ }
  ]);

  // Expandable cards state
  const [expandedComponents, setExpandedComponents] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedSuppliersComp, setSelectedSuppliersComp] = useState<ComponentItem | null>(null);
  const [selectedDetailComp, setSelectedDetailComp] = useState<ComponentItem | null>(null);
  const [rfqModalComp, setRfqModalComp] = useState<ComponentItem | null>(null);
  const [rfqQuantity, setRfqQuantity] = useState<number>(500);
  const [rfqSuccess, setRfqSuccess] = useState<string | null>(null);
  const [bomSuccess, setBomSuccess] = useState<string | null>(null);
  const [isExportingBOM, setIsExportingBOM] = useState(false);

  // Production Volume Sourcing Calculator State
  const [productionVolume, setProductionVolume] = useState<number>(1);
  const [scrapPercentage, setScrapPercentage] = useState<number>(0);

  const getBatchQty = (unitQty: number) => {
    const raw = (unitQty || 1) * productionVolume * (1 + scrapPercentage / 100);
    return Math.ceil(raw);
  };

  const getBatchCost = (comp: ComponentItem) => {
    const qty = getBatchQty(comp.quantity);
    const unitPrice = comp.estimated_cost_reference || 0;
    return qty * unitPrice;
  };

  // Execute Search
  const executeSearch = async (targetQuery: string, targetMode: string, addToHistory: boolean = true) => {
    if (!targetQuery.trim()) return;
    setLoading(true);
    setError(null);
    setBomSuccess(null);
    setRfqSuccess(null);

    try {
      const res = await api.searchComponentIntelligence(targetQuery.trim(), targetMode);
      setData(res);
      setQuery(targetQuery.trim());
      setMode(targetMode);

      // Sync URL parameters for state persistence on page refresh
      const url = new URL(window.location.href);
      url.searchParams.set("q", targetQuery.trim());
      url.searchParams.set("mode", targetMode);
      window.history.replaceState({}, "", url.toString());

      if (addToHistory) {
        setHistoryTrail((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.query.toLowerCase() === targetQuery.trim().toLowerCase()) {
            return prev;
          }
          return [...prev, { query: targetQuery.trim(), mode: targetMode, label: res.item_name || targetQuery.trim() }];
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to retrieve component intelligence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(initialQ, initialMode, false);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, mode, true);
  };

  const handleBackNavigation = () => {
    if (historyTrail.length <= 1) return;
    const newTrail = [...historyTrail];
    newTrail.pop(); // remove current
    const prev = newTrail[newTrail.length - 1];
    setHistoryTrail(newTrail);
    executeSearch(prev.query, prev.mode, false);
  };

  const handleReverseToComponent = (compName: string) => {
    executeSearch(compName, "find_products", true);
  };

  const handleReverseToProductBOM = (prodName: string) => {
    executeSearch(prodName, "find_components", true);
  };

  const toggleComponentExpand = (name: string) => {
    setExpandedComponents((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleExportToBOM = async () => {
    if (!data || !data.components || data.components.length === 0) return;
    setIsExportingBOM(true);
    setBomSuccess(null);
    try {
      const res = await api.exportToBOM({
        product_name: data.item_name,
        description: `BOM synthesized from Two-Way Component Intelligence for ${data.item_name}.`,
        components: data.components
      });
      setBomSuccess(`Successfully created BOM Project #${res.bom_project_id} with ${res.items_count} components!`);
    } catch (err: any) {
      setError(err?.message || "Failed to export components to BOM workspace");
    } finally {
      setIsExportingBOM(false);
    }
  };

  const handleCreateSourcingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqModalComp) return;
    try {
      const res = await api.createComponentSourcing({
        component_name: rfqModalComp.name,
        category: rfqModalComp.category,
        quantity: rfqQuantity,
        unit: rfqModalComp.unit || "pcs",
        specifications: rfqModalComp.specification_details,
        target_budget: (rfqModalComp.estimated_cost_reference || 20) * rfqQuantity,
        currency: rfqModalComp.cost_currency || "USD"
      });
      setRfqSuccess(`Created Sourcing Request ${res.request_code} for ${rfqModalComp.name}.`);
      setRfqModalComp(null);
    } catch (err: any) {
      setError(err?.message || "Failed to create sourcing request");
    }
  };

  const SUGGESTED_QUERIES = [
    { label: "Smartphone", mode: "find_components", type: "Product" },
    { label: "Semiconductor chip", mode: "find_products", type: "Component" },
    { label: "Lithium-ion battery", mode: "find_products", type: "Component" },
    { label: "Copper Sheets", mode: "find_products", type: "Raw Material" },
    { label: "Display module", mode: "find_products", type: "Component" },
    { label: "Printed circuit board (PCB)", mode: "find_products", type: "Component" },
    { label: "Electric Vehicle (EV)", mode: "find_components", type: "Product" },
    { label: "Industrial Drone", mode: "find_components", type: "Product" },
    { label: "Solar Inverter", mode: "find_components", type: "Product" }
  ];

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-xl bg-[#11141b] border border-[#212735] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Network className="w-5 h-5 text-emerald-400" />
                Two-Way Product & Component Intelligence
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
                BIDIRECTIONAL GRAPH
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Explore <span className="text-emerald-400 font-medium">Finished Product &rarr; Required Components (BOM)</span> or discover <span className="text-cyan-400 font-medium">Component &rarr; Products That Use It</span>.
            </p>
          </div>

          {/* Mode Selector Badges */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0b0d11] border border-[#1f242f]">
            <button
              type="button"
              onClick={() => setMode("auto_detect")}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                mode === "auto_detect"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Auto Detect
            </button>
            <button
              type="button"
              onClick={() => setMode("find_components")}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                mode === "find_components"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Find Components
            </button>
            <button
              type="button"
              onClick={() => setMode("find_products")}
              className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                mode === "find_products"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Find Products Using This
            </button>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a product, component, or raw material..."
              className="w-full bg-[#0b0d11] border border-[#232938] rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </form>

        {/* Suggested Queries */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
          <span className="text-[11px] text-slate-500 font-mono">Example Queries:</span>
          {SUGGESTED_QUERIES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => executeSearch(s.label, s.mode, true)}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#161a23] hover:bg-[#1e2330] text-slate-300 hover:text-emerald-300 border border-[#232a39] transition-colors flex items-center gap-1"
            >
              <span>{s.label}</span>
              <span className="text-[9px] text-slate-500">({s.type})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Way Reverse Navigation History & Breadcrumbs */}
      {historyTrail.length > 1 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#11141b] border border-[#212735] text-xs">
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="px-2.5 py-1 rounded bg-[#161a23] hover:bg-[#202736] text-slate-300 hover:text-white border border-[#262f40] flex items-center gap-1.5 font-medium transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Back to Previous</span>
            </button>

            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-400 shrink-0 font-mono">History Trail:</span>

            {historyTrail.map((h, idx) => {
              const isCurrent = idx === historyTrail.length - 1;
              return (
                <div key={idx} className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryTrail(historyTrail.slice(0, idx + 1));
                      executeSearch(h.query, h.mode, false);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      isCurrent
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold"
                        : "bg-[#141822] text-slate-400 hover:text-slate-200 border border-[#202636]"
                    }`}
                  >
                    {h.label}
                  </button>
                  {idx < historyTrail.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "cards" ? "hierarchy" : "cards")}
              className="px-2.5 py-1 rounded bg-[#161a23] hover:bg-[#202736] text-slate-300 hover:text-white border border-[#262f40] flex items-center gap-1.5 transition-colors text-[11px]"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{viewMode === "cards" ? "Hierarchy View" : "Cards View"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications / Success Toasts */}
      {bomSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{bomSuccess}</span>
          </div>
          <Link
            href="/bom"
            className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>Open Engineering BOM</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {rfqSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{rfqSuccess}</span>
          </div>
          <Link
            href="/sourcing"
            className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>View Sourcing Requests</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 rounded-xl bg-[#11141b] border border-[#212735] space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-[#1c2230] rounded"></div>
          <div className="h-4 w-2/3 bg-[#161a25] rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="h-32 bg-[#161a25] rounded-lg"></div>
            <div className="h-32 bg-[#161a25] rounded-lg"></div>
            <div className="h-32 bg-[#161a25] rounded-lg"></div>
            <div className="h-32 bg-[#161a25] rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Ambiguous Query Handling */}
      {!loading && data?.is_ambiguous && (
        <div className="p-6 rounded-xl bg-[#11141b] border border-amber-900/50 space-y-4 shadow-xl">
          <div className="flex items-center gap-2.5 text-amber-400 font-semibold text-sm">
            <Info className="w-5 h-5 text-amber-400" />
            <span>Ambiguous Query: Multiple Interpretations Found for &quot;{data.query}&quot;</span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            {data.overview}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {data.disambiguation_options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  executeSearch(
                    opt.query,
                    opt.type === "PRODUCT" ? "find_components" : "find_products",
                    true
                  )
                }
                className="p-4 rounded-lg bg-[#161a23] hover:bg-[#1f2533] border border-[#262f40] hover:border-emerald-500/50 text-left space-y-2 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101319] text-emerald-400 font-bold border border-emerald-900/40">
                    {opt.type}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                  {opt.label}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {opt.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Unknown Query State */}
      {!loading && !data?.is_ambiguous && data?.detected_type === "UNKNOWN" && (
        <div className="p-8 rounded-xl bg-[#11141b] border border-[#212735] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#181d28] border border-[#273042] flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">No Direct Bill of Materials Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We could not find verified component relationships for &quot;{data.query}&quot;. Try selecting one of the suggested products or components below.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {data.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => executeSearch(s, "auto_detect", true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#161a23] hover:bg-[#1f2635] text-emerald-400 border border-emerald-900/40 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Results Section: Mode A (Product -> Components) */}
      {!loading && !data?.is_ambiguous && data?.components && data.components.length > 0 && (
        <div className="space-y-5">
          {/* Product Summary Header Banner */}
          <div className="rounded-xl bg-[#11141b] border border-[#212735] p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase">
                    {data.item_category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-slate-400 border border-[#242c3d]">
                    {data.components.length} COMPONENTS IDENTIFIED
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-emerald-400 border border-emerald-900/50">
                    VERIFIED DATABASE RECORDS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 tracking-tight mt-1 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  {data.item_name} — Bill of Materials (BOM) Architecture
                </h3>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportToBOM}
                  disabled={isExportingBOM}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {isExportingBOM ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  <span>Export to BOM Workspace</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {data.overview}
            </p>

            <div className="p-3 rounded-lg bg-[#0b0d11] border border-[#1d222e] text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  All component costs shown are reference benchmarks. Click <strong>Find Suppliers</strong> to see real prices, stock and MOQ from verified manufacturers.
                </span>
              </div>
              <div className="font-mono text-emerald-400 font-semibold">
                Estimated Single-Unit BOM: ${data.components.reduce((acc, c) => acc + (c.estimated_cost_reference || 0) * (c.quantity || 1), 0).toFixed(2)} USD
              </div>
            </div>
          </div>

          {/* Configuration Switcher for Computing Systems (Desktop Tower vs Complete Desktop Setup) */}
          {data.configuration_types && data.configuration_types.length > 1 && (
            <div className="p-4 rounded-xl bg-[#0e1219] border border-[#232a3b] space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold uppercase">
                    Configuration Selector
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    Active Scope: <span className="text-emerald-300">{data.active_configuration || data.item_name}</span>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {data.item_name === "Desktop Tower" ? (
                    <span className="text-amber-400 font-medium">&bull; Tower Only: Monitor, keyboard, mouse &amp; speakers excluded</span>
                  ) : (
                    <span className="text-cyan-400 font-medium">&bull; Turnkey Setup: Includes 27&quot; Monitor, Peripherals &amp; Audio</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => executeSearch("Desktop Tower", "find_components", true)}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                    data.item_name === "Desktop Tower"
                      ? "bg-emerald-950/60 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/40"
                      : "bg-[#141822] hover:bg-[#1a202c] border-[#222838] text-slate-300"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Desktop Tower (Tower Only — 11 Components)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Core internal computing unit: CPU, Motherboard, RAM, SSD, PSU, Case, Cooler, Fans, GPU, Network &amp; Cables.
                    </p>
                  </div>
                  {data.item_name === "Desktop Tower" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => executeSearch("Desktop PC", "find_components", true)}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                    data.item_name === "Desktop PC"
                      ? "bg-emerald-950/60 border-emerald-500/80 text-white shadow-sm ring-1 ring-emerald-500/40"
                      : "bg-[#141822] hover:bg-[#1a202c] border-[#222838] text-slate-300"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Complete Desktop Setup (Turnkey Bundle — 14 Components)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Full workstation setup: Desktop Tower + 27&quot; QHD 165Hz Monitor, Mechanical Keyboard &amp; Mouse, and Speakers.
                    </p>
                  </div>
                  {data.item_name === "Desktop PC" && (
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Engineering Compatibility Verification Banner */}
          {data.compatibility_summary && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#101923] to-[#121620] border border-emerald-800/60 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                    System Architecture &amp; Component Compatibility Verification
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase tracking-wider shrink-0">
                  VERIFIED ARCHITECTURE
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {data.compatibility_summary}
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[10px] font-mono text-emerald-400">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">&check; Socket &amp; Interconnect Validated</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">&check; Thermal Budget Verified</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">&check; Power Headroom &gt;45% Confirmed</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">&check; Form Factor Physical Clearance Verified</span>
              </div>
            </div>
          )}

          {/* Production Volume Sourcing Calculator */}
          <div className="p-4 rounded-xl bg-[#0f131a] border border-[#222838] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Production Volume Sourcing Calculator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161a23] text-slate-400 border border-[#222938]">
                  DYNAMIC BATCH SOURCING
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                {/* Volume Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-medium">Production Volume:</span>
                  <div className="flex items-center gap-1">
                    {[1, 100, 500, 1000].map((vol) => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => setProductionVolume(vol)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                          productionVolume === vol
                            ? "bg-emerald-600 text-white font-bold shadow-xs"
                            : "bg-[#161a23] hover:bg-[#1e2330] text-slate-300 border border-[#232938]"
                        }`}
                      >
                        {vol === 1 ? "1 (Single)" : `${vol.toLocaleString()} units`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scrap Rate Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-medium">Scrap / Wastage:</span>
                  <div className="flex items-center gap-1">
                    {[0, 2, 5].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setScrapPercentage(rate)}
                        className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                          scrapPercentage === rate
                            ? "bg-cyan-600 text-white font-bold shadow-xs"
                            : "bg-[#161a23] hover:bg-[#1e2330] text-slate-300 border border-[#232938]"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Volume Sourcing Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#141822] border border-[#1e2433]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Single-Unit BOM Cost:</span>
                <span className="font-mono text-slate-200 font-bold text-sm">
                  ${data.components.reduce((acc, c) => acc + (c.estimated_cost_reference || 0) * (c.quantity || 1), 0).toFixed(2)} USD
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Reference baseline</span>
              </div>

              <div className="p-3 rounded-lg bg-[#141822] border border-[#1e2433]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Production Run:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {productionVolume.toLocaleString()} units
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {scrapPercentage > 0 ? `Includes +${scrapPercentage}% buffer` : "Zero scrap allowance"}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#141822] border border-[#1e2433]">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Sub-Assemblies:</span>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {data.components.reduce((acc, c) => acc + getBatchQty(c.quantity), 0).toLocaleString()} parts
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Across {data.components.length} BOM line items
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80">
                <span className="text-[10px] font-mono text-emerald-300 block uppercase font-semibold">Total Batch Sourcing Cost:</span>
                <span className="font-mono text-emerald-300 font-bold text-sm">
                  ${data.components.reduce((acc, c) => acc + getBatchCost(c), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
                <span className="text-[10px] text-emerald-400/70 block mt-0.5">
                  Est. batch procurement
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Component Hierarchy Tree View */}
          {viewMode === "hierarchy" ? (
            <div className="p-5 rounded-xl bg-[#11141b] border border-[#212735] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#1f242f]">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Network className="w-4 h-4 text-emerald-400" />
                  Hierarchical Product-Component Tree View
                </span>
                <span className="text-[10px] font-mono text-slate-500">CLICK ANY NODE TO EXPLORE REVERSE MAPPINGS</span>
              </div>

              {/* Root Node */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs font-bold text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    <span>{data.item_name} (Finished System)</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300">{data.components.length} Direct Sub-Assemblies</span>
                </div>

                {/* Child Nodes */}
                <div className="pl-6 border-l-2 border-[#202737] space-y-2.5">
                  {data.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#141822] border border-[#202737] hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                            &rarr; {comp.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0b0d11] text-slate-400 border border-[#232938]">
                            {comp.category}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400">
                            {comp.quantity} {comp.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{comp.typical_purpose}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReverseToComponent(comp.name)}
                          className="px-2.5 py-1 rounded bg-[#101319] hover:bg-[#1a202c] text-cyan-400 border border-cyan-900/40 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Products Using This</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSuppliersComp(comp)}
                          className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Building2 className="w-3 h-3" />
                          <span>Suppliers ({comp.supplier_matches.length})</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.components.map((comp, idx) => {
                const isExpanded = !!expandedComponents[comp.name];
                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-xl bg-[#11141b] border border-[#212735] hover:border-[#2f394c] transition-all flex flex-col justify-between space-y-4 shadow-lg group"
                  >
                    <div className="space-y-2.5">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161d2a] text-emerald-400 border border-emerald-900/40 font-semibold">
                              {comp.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Unit Qty: <strong className="text-slate-200">{comp.quantity} {comp.unit}</strong>
                              {productionVolume > 1 && (
                                <span className="text-emerald-400 ml-1.5 font-bold">
                                  &rarr; Batch: {getBatchQty(comp.quantity)} {comp.unit}
                                </span>
                              )}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mt-1">
                            {comp.name}
                          </h4>
                        </div>

                        {/* Verification Status Badge */}
                        <div className="shrink-0">
                          {comp.verification_status === "VERIFIED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                              <Layers className="w-3 h-3 text-cyan-400" />
                              CURATED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Purpose */}
                      <div className="text-xs text-slate-300">
                        <span className="text-slate-500 font-medium">Purpose: </span>
                        {comp.typical_purpose}
                      </div>

                      {/* Specs */}
                      {comp.specification_details && (
                        <div className="p-2.5 rounded bg-[#0b0d11] border border-[#1c2230] text-[11px] text-slate-400 font-mono">
                          <span className="text-slate-500 block mb-0.5 uppercase tracking-wide text-[9px]">Technical Specifications:</span>
                          <p className="line-clamp-2">{comp.specification_details}</p>
                        </div>
                      )}

                      {/* Subcomponents Accordion */}
                      {comp.subcomponents && comp.subcomponents.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleComponentExpand(comp.name)}
                            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono transition-colors"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            <span>{comp.subcomponents.length} Subcomponents / Silicon Blocks</span>
                          </button>
                          {isExpanded && (
                            <div className="mt-2 pl-3 border-l-2 border-[#1f2533] space-y-1">
                              {comp.subcomponents.map((sub, sidx) => (
                                <div key={sidx} className="text-[11px] text-slate-300 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>{sub}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Compatible Alternatives Badges */}
                      {comp.compatible_alternatives && comp.compatible_alternatives.length > 0 && (
                        <div className="pt-2 border-t border-[#1c2230] space-y-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase block font-semibold">
                            Compatible Alternatives:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {comp.compatible_alternatives.map((alt, aidx) => (
                              <button
                                key={aidx}
                                type="button"
                                onClick={() => handleReverseToComponent(alt)}
                                className="text-[10px] px-2 py-0.5 rounded bg-[#151a24] hover:bg-[#1d2433] text-slate-300 hover:text-emerald-300 border border-[#232b3b] transition-colors flex items-center gap-1"
                              >
                                <span>{alt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Compatibility Notes */}
                      {comp.compatibility_notes && (
                        <div className="p-2.5 rounded bg-[#0e1219] border border-emerald-900/40 text-[11px] text-slate-300 flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-[11px] leading-relaxed">{comp.compatibility_notes}</span>
                        </div>
                      )}

                      {/* Reference Benchmark & Batch Sourcing Cost */}
                      {comp.estimated_cost_reference && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1a202c]">
                          <span className="text-slate-400">Unit Benchmark:</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            ~${comp.estimated_cost_reference.toFixed(2)} {comp.cost_currency} / {comp.unit}
                          </span>
                        </div>
                      )}
                      {productionVolume > 1 && comp.estimated_cost_reference && (
                        <div className="flex items-center justify-between text-[11px] bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40">
                          <span className="text-emerald-400/90 font-medium font-mono text-[10px]">
                            Batch Total ({productionVolume.toLocaleString()} units):
                          </span>
                          <span className="font-mono text-emerald-300 font-bold">
                            ~${getBatchCost(comp).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {comp.cost_currency}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-[#1c2331] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{comp.supplier_matches.length} Verified Suppliers</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{comp.source}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedSuppliersComp(comp)}
                          className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Find Suppliers</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReverseToComponent(comp.name)}
                          className="px-2.5 py-1.5 rounded bg-[#161a23] hover:bg-[#1e2432] text-cyan-300 border border-[#273245] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span>Products Using This</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailComp(comp)}
                          className="text-slate-400 hover:text-slate-200 transition-colors underline decoration-slate-600 underline-offset-2"
                        >
                          View Specifications
                        </button>
                        <button
                          type="button"
                          onClick={() => setRfqModalComp(comp)}
                          className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
                        >
                          + Source / RFQ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Results Section: Mode B (Component -> Products That Use It) */}
      {!loading && !data?.is_ambiguous && data?.products && data.products.length > 0 && (
        <div className="space-y-5">
          {/* Component Summary Header Banner */}
          <div className="rounded-xl bg-[#11141b] border border-[#212735] p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold uppercase">
                    {data.item_category}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18202d] text-slate-400 border border-[#242c3d]">
                    USED IN {data.products.length} MANUFACTURED PRODUCTS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 tracking-tight mt-1 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  {data.item_name} &rarr; Finished Product Applications
                </h3>
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSuppliersComp({
                      name: data.item_name,
                      category: data.item_category,
                      typical_purpose: data.overview,
                      quantity: 1,
                      unit: "pcs",
                      verification_status: "VERIFIED",
                      source: "Namade Kadda Knowledge Base",
                      cost_currency: "USD",
                      subcomponents: [],
                      supplier_matches: data.products[0]?.supplier_matches || [],
                      has_matching_suppliers: (data.products[0]?.supplier_matches || []).length > 0
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Find Component Suppliers</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {data.overview}
            </p>
          </div>

          {/* Product Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.products.map((prod, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-[#11141b] border border-[#212735] hover:border-[#2f394c] transition-all flex flex-col justify-between space-y-4 shadow-lg group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161d2a] text-cyan-400 border border-cyan-900/40 font-semibold">
                        {prod.product_category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mt-1">
                        {prod.product_name}
                      </h4>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      VERIFIED USAGE
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-slate-500 font-medium">How Component is Used: </span>
                    {prod.how_component_is_used}
                  </div>

                  {/* Sibling Components */}
                  {prod.other_key_components && prod.other_key_components.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-mono text-slate-500 block uppercase">Other Major Components in {prod.product_name}:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {prod.other_key_components.map((other, oidx) => (
                          <button
                            key={oidx}
                            type="button"
                            onClick={() => executeSearch(other, "find_products", true)}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#0b0d11] hover:bg-[#1a202c] text-slate-300 hover:text-emerald-300 border border-[#232938] transition-colors"
                          >
                            {other}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-[#1c2331] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleReverseToProductBOM(prod.product_name)}
                    className="flex-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>View BOM &amp; Architecture</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {user?.role === "SUPPLIER" ? (
                    <Link
                      href="/supplier/products"
                      className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1e2432] text-slate-200 border border-[#273245] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>List Part</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSuppliersComp({
                          name: data.item_name,
                          category: data.item_category,
                          typical_purpose: prod.how_component_is_used,
                          quantity: 1,
                          unit: "pcs",
                          verification_status: "VERIFIED",
                          source: "Namade Kadda Knowledge Base",
                          cost_currency: "USD",
                          subcomponents: [],
                          supplier_matches: prod.supplier_matches,
                          has_matching_suppliers: prod.supplier_matches.length > 0
                        })
                      }
                      className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1e2432] text-slate-200 border border-[#273245] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Suppliers</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Real Supplier Matches from Database */}
      {selectedSuppliersComp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#11141b] border border-[#212735] rounded-xl shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242f]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Authentic Supplier Matches for {selectedSuppliersComp.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified manufacturers and stock records queried from the Namade Kadda database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSuppliersComp(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a202c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSuppliersComp.supplier_matches.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-3">
                <Building2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-slate-200 font-semibold text-sm">Persisted Supplier Records Currently Unavailable</p>
                <p className="text-slate-400 max-w-md mx-auto text-[11px] leading-relaxed">
                  No verified manufacturers in the database have active catalog items registered for this specific subcomponent.
                  Namade Kadda operates exclusively on authentic database records &mdash; no simulated or placeholder supplier data is generated.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const comp = selectedSuppliersComp;
                    setSelectedSuppliersComp(null);
                    setRfqModalComp(comp);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Issue Custom Sourcing Request (RFQ)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedSuppliersComp.supplier_matches.map((sup) => (
                  <div key={sup.supplier_id} className="p-4 rounded-lg bg-[#141822] border border-[#212735] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">{sup.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {sup.verification_status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {sup.city}, {sup.country} &bull; Rating: {sup.rating} / 5.0 &bull; Price: {sup.price_rating}
                        </p>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        <div>MOQ: {sup.moq} units</div>
                        <div>Lead Time: {sup.lead_time_days} days</div>
                      </div>
                    </div>

                    {/* Catalog Items from this supplier */}
                    {sup.matching_products && sup.matching_products.length > 0 && (
                      <div className="p-2.5 rounded bg-[#0b0d11] border border-[#1b212e] space-y-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Available Catalog Items:</span>
                        {sup.matching_products.map((cat) => (
                          <div key={cat.id} className="flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-slate-200">{cat.name}</span>
                              {cat.part_number && (
                                <span className="text-[10px] font-mono text-slate-500 ml-2">[{cat.part_number}]</span>
                              )}
                            </div>
                            <div className="font-mono text-emerald-400 font-semibold">
                              ${cat.unit_price.toFixed(2)} {cat.currency}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        href={`/suppliers`}
                        className="px-3 py-1 rounded bg-[#101319] hover:bg-[#1a202c] text-slate-300 text-xs border border-[#232938]"
                      >
                        View Supplier Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSuppliersComp(null);
                          setRfqModalComp(selectedSuppliersComp);
                        }}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Request Quotation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Component Engineering Specifications */}
      {selectedDetailComp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#11141b] border border-[#212735] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242f]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Technical Specification: {selectedDetailComp.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDetailComp(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a202c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Category &amp; Classification:</span>
                <span className="text-slate-200 font-semibold">{selectedDetailComp.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Functional Purpose:</span>
                <span className="text-slate-200">{selectedDetailComp.typical_purpose}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Detailed Specifications:</span>
                <p className="p-3 rounded bg-[#0b0d11] border border-[#1f2533] font-mono text-emerald-300 text-[11px] leading-relaxed">
                  {selectedDetailComp.specification_details || "Standard industrial tolerances & dimensions."}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-mono text-[10px]">Model Applicability:</span>
                <span className="text-slate-300">{selectedDetailComp.product_model_applicability || "Standard Grade"}</span>
              </div>
              {selectedDetailComp.subcomponents && selectedDetailComp.subcomponents.length > 0 && (
                <div>
                  <span className="text-slate-500 block uppercase font-mono text-[10px]">Constituent Subcomponents:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedDetailComp.subcomponents.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#161a23] text-slate-300 border border-[#232938] text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatible Alternatives */}
              {selectedDetailComp.compatible_alternatives && selectedDetailComp.compatible_alternatives.length > 0 && (
                <div>
                  <span className="text-slate-500 block uppercase font-mono text-[10px]">Compatible Engineering Alternatives:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedDetailComp.compatible_alternatives.map((alt, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#131b26] text-emerald-300 border border-emerald-900/60 text-[11px] font-mono">
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatibility Notes */}
              {selectedDetailComp.compatibility_notes && (
                <div>
                  <span className="text-slate-500 block uppercase font-mono text-[10px]">Compatibility &amp; Assembly Constraints:</span>
                  <p className="p-2.5 rounded bg-[#0b0d11] border border-[#1f2533] text-slate-300 text-[11px] leading-relaxed">
                    {selectedDetailComp.compatibility_notes}
                  </p>
                </div>
              )}

              {/* Sourcing Quantity & Batch Economics */}
              <div className="p-3 rounded-lg bg-[#0e1219] border border-[#1e2434] grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Unit Requirement:</span>
                  <span className="font-mono text-slate-200 font-bold">
                    {selectedDetailComp.quantity} {selectedDetailComp.unit} / finished unit
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">
                    Batch Volume ({productionVolume.toLocaleString()} units):
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {getBatchQty(selectedDetailComp.quantity).toLocaleString()} {selectedDetailComp.unit}
                  </span>
                </div>
                {selectedDetailComp.estimated_cost_reference && (
                  <>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Unit Benchmark:</span>
                      <span className="font-mono text-slate-200 font-bold">
                        ${selectedDetailComp.estimated_cost_reference.toFixed(2)} {selectedDetailComp.cost_currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Batch Est.:</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        ${getBatchCost(selectedDetailComp).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedDetailComp.cost_currency}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1f242f] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetailComp(null)}
                className="px-4 py-1.5 bg-[#161a23] hover:bg-[#1f2635] text-slate-200 rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Create Sourcing Request / RFQ Draft */}
      {rfqModalComp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#11141b] border border-[#212735] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f242f]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Create Sourcing Request: {rfqModalComp.name}
              </h3>
              <button
                type="button"
                onClick={() => setRfqModalComp(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a202c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSourcingSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Component Name:</label>
                <input
                  type="text"
                  readOnly
                  value={rfqModalComp.name}
                  className="w-full bg-[#0b0d11] border border-[#212735] rounded p-2 text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity Required ({rfqModalComp.unit}):</label>
                  <input
                    type="number"
                    min={1}
                    value={rfqQuantity}
                    onChange={(e) => setRfqQuantity(parseInt(e.target.value) || 100)}
                    className="w-full bg-[#0b0d11] border border-[#212735] rounded p-2 text-slate-100 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Target Budget (Est. USD):</label>
                  <input
                    type="text"
                    readOnly
                    value={`$${((rfqModalComp.estimated_cost_reference || 20) * rfqQuantity).toFixed(2)}`}
                    className="w-full bg-[#0b0d11] border border-[#212735] rounded p-2 text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Engineering Specifications Included:</label>
                <textarea
                  readOnly
                  rows={3}
                  value={rfqModalComp.specification_details || rfqModalComp.typical_purpose}
                  className="w-full bg-[#0b0d11] border border-[#212735] rounded p-2 text-slate-300 text-[11px] font-mono"
                />
              </div>

              <div className="pt-3 border-t border-[#1f242f] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRfqModalComp(null)}
                  className="px-3.5 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2635] text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
                >
                  Confirm &amp; Generate Sourcing Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
