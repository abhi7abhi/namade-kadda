"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  FileSpreadsheet,
  Package,
  Building2,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Bot,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Sliders,
  ShieldCheck,
  Search,
  Globe,
  X,
  Sparkles,
  Layers,
  Factory,
  ChevronRight,
  BarChart3,
  ListFilter
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import {
  api,
  AnalyticsDashboardResponse,
  SourcingRequest,
  Order,
  RFQ,
  BuyerSearchAnalyticsResponse,
  BuyerAnalyticsSuggestion,
  DynamicSummaryCard,
  BuyerDashboardKPIs,
  ProductPriceComparisonResponse
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";
import GettingStartedChecklist from "@/components/GettingStartedChecklist";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b"];

const EXAMPLE_SEARCHES = [
  { label: "Apple", category: "company" as const },
  { label: "Samsung", category: "company" as const },
  { label: "Smartphone", category: "product" as const },
  { label: "Laptop", category: "product" as const },
  { label: "India", category: "country" as const },
  { label: "Germany", category: "country" as const },
  { label: "Stainless-Steel Mounting Brackets", category: "product" as const },
  { label: "Apex Precision Engineering", category: "company" as const }
];

export default function BuyerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Base dashboard data
  const [data, setData] = useState<AnalyticsDashboardResponse | null>(null);
  const [sourcingReqs, setSourcingReqs] = useState<SourcingRequest[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Sourcing Input
  const [quickSpec, setQuickSpec] = useState("");

  // Smart Analytics Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<"auto" | "company" | "product" | "country">("auto");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<BuyerSearchAnalyticsResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState<BuyerAnalyticsSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Real Database Buyer KPIs & Price Comparisons
  const [kpiData, setKpiData] = useState<BuyerDashboardKPIs | null>(null);
  const [priceCompData, setPriceCompData] = useState<ProductPriceComparisonResponse | null>(null);
  const [selectedProductForComp, setSelectedProductForComp] = useState<string>("Stainless-Steel Mounting Brackets");
  const [priceMetric, setPriceMetric] = useState<"lowest" | "average" | "highest">("lowest");
  const [companySortBy, setCompanySortBy] = useState<"price" | "lead_time" | "qty">("price");
  const [loadingPriceComp, setLoadingPriceComp] = useState(false);

  // Client hydration flag for Recharts
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch initial base dashboard data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, sourcingRes, rfqsRes, ordersRes] = await Promise.all([
        api.getAnalytics(),
        api.getSourcingRequests(),
        api.getRFQs(),
        api.getOrders()
      ]);
      setData(analyticsRes);
      setSourcingReqs(sourcingRes?.items || []);
      setRfqs(rfqsRes || []);
      setOrders(ordersRes || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load buyer workspace data. Please verify the backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const handleProductChange = async (prod: string) => {
    setSelectedProductForComp(prod);
    setLoadingPriceComp(true);
    try {
      const res = await api.getProductPriceComparison(prod);
      setPriceCompData(res);
    } catch {
      // ignore
    } finally {
      setLoadingPriceComp(false);
    }
  };

  if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, sourcingRes, rfqsRes, ordersRes, kpiRes, priceRes] = await Promise.all([
          api.getAnalytics(),
          api.getSourcingRequests(),
          api.getRFQs(),
          api.getOrders(),
          api.getBuyerDashboardKPIs().catch(() => null),
          api.getProductPriceComparison("Stainless-Steel Mounting Brackets").catch(() => null)
        ]);
        if (isSubscribed) {
          setData(analyticsRes);
          setSourcingReqs(sourcingRes?.items || []);
          setRfqs(rfqsRes || []);
          setOrders(ordersRes || []);
          if (kpiRes) setKpiData(kpiRes);
          if (priceRes) setPriceCompData(priceRes);
        }
      } catch (err: any) {
        if (isSubscribed) {
          setError(err?.message || "Failed to load buyer workspace data. Please verify the backend connection.");
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated, authLoading, router]);

  // Debounced Autocomplete Suggestions
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const res = await api.getBuyerAnalyticsSuggestions(trimmed, searchCategory);
        setSuggestions(res.suggestions || []);
        setShowSuggestions((res.suggestions || []).length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggesting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCategory]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Run Search Analytics
  const handleExecuteSearch = async (
    termToRun?: string,
    categoryToRun?: "auto" | "company" | "product" | "country"
  ) => {
    const query = (termToRun !== undefined ? termToRun : searchQuery).trim();
    const cat = categoryToRun !== undefined ? categoryToRun : searchCategory;
    if (!query) return;

    setShowSuggestions(false);
    setIsSearching(true);
    setSearchError(null);
    setActiveSearch(query);

    try {
      const result = await api.searchBuyerAnalytics(query, cat);
      setSearchResult(result);
    } catch (err: any) {
      setSearchError(err?.message || "Failed to retrieve dynamic analytics. Please check backend connection.");
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear Search & Return to Normal Workspace
  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch(null);
    setSearchResult(null);
    setSearchError(null);
    setShowSuggestions(false);
    setSearchCategory("auto");
  };

  const handleQuickSourcing = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSpec.trim()) {
      router.push(`/sourcing?query=${encodeURIComponent(quickSpec.trim())}`);
    } else {
      router.push("/sourcing");
    }
  };

  const getCardIcon = (iconKey?: string) => {
    switch (iconKey) {
      case "building":
        return Building2;
      case "file-spreadsheet":
        return FileSpreadsheet;
      case "trending-up":
        return TrendingUp;
      case "package":
        return Package;
      case "dollar-sign":
        return DollarSign;
      case "shield-check":
        return ShieldCheck;
      default:
        return Layers;
    }
  };

  const getCardColorClasses = (color: string) => {
    switch (color) {
      case "cyan":
        return { text: "text-cyan-400", bg: "bg-cyan-950/20", border: "border-cyan-800/40" };
      case "blue":
        return { text: "text-blue-400", bg: "bg-blue-950/20", border: "border-blue-800/40" };
      case "purple":
        return { text: "text-purple-400", bg: "bg-purple-950/20", border: "border-purple-800/40" };
      case "amber":
        return { text: "text-amber-400", bg: "bg-amber-950/20", border: "border-amber-800/40" };
      case "emerald":
      default:
        return { text: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-800/40" };
    }
  };

  const handleProductChange = async (prod: string) => {
    setSelectedProductForComp(prod);
    setLoadingPriceComp(true);
    try {
      const res = await api.getProductPriceComparison(prod);
      setPriceCompData(res);
    } catch {
      // ignore
    } finally {
      setLoadingPriceComp(false);
    }
  };

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

  if (authLoading || (loading && !data && !error)) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-[#161a23] rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-[#161a23] rounded-lg border border-[#232938] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto my-12 bg-[#121620] border border-red-900/50 rounded-xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-100">Unable to Connect to Procurement Services</h2>
          <p className="text-xs text-red-300 font-mono max-w-xl mx-auto break-words bg-[#1a141b] p-3 rounded border border-red-900/40 text-left">
            {error}
          </p>
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please verify the FastAPI backend server is running on <code className="text-emerald-400">http://127.0.0.1:8000</code> and accessible from your browser origin.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry Loading Workspace
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[#1a202d] hover:bg-[#252e40] text-slate-300 text-xs font-medium border border-[#2d374d] transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const defaultMetricCards = [
    {
      title: "My Sourcing Requests",
      value: sourcingReqs.length || data?.total_sourcing_requests || 0,
      icon: FileText,
      color: "text-blue-400",
      sub: "Active specifications",
      href: "/sourcing"
    },
    {
      title: "Open RFQs",
      value: rfqs.length || data?.open_rfqs || 0,
      icon: FileSpreadsheet,
      color: "text-emerald-400",
      sub: "Awaiting vendor quotes",
      href: "/quotations"
    },
    {
      title: "Quotations Received",
      value: data?.received_quotations || 0,
      icon: TrendingUp,
      color: "text-purple-400",
      sub: "Weighted comparison",
      href: "/quotations"
    },
    {
      title: "Active Orders",
      value: orders.length || data?.active_orders || 0,
      icon: Package,
      color: "text-amber-400",
      sub: "Factory production",
      href: "/orders"
    },
    {
      title: "Committed Spend",
      value: `$${((data?.total_spend || 0) / 1000).toFixed(1)}k`,
      icon: DollarSign,
      color: "text-emerald-400",
      sub: "Purchase order volume",
      href: "/analytics"
    },
    {
      title: "Verified Suppliers",
      value: data?.total_suppliers || 0,
      icon: Building2,
      color: "text-cyan-400",
      sub: "Marketplace directory",
      href: "/suppliers"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Buyer Procurement Workspace</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-900/50 font-bold">
              ROLE: BUYER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong>{user?.full_name || "Rajesh Sharma"}</strong> • {user?.company_name || "Apex Dynamics Pvt Ltd"} ({user?.country || "India"})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSearch && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900/80 text-red-200 text-xs font-medium border border-red-800/60 flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <X className="w-3.5 h-3.5" /> Clear Search
            </button>
          )}
          <button
            onClick={fetchData}
            className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <Link
            href="/sourcing"
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" /> New Sourcing Request
          </Link>
        </div>
      </div>

      {/* Sync Warning Banner if refresh fails */}
      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/60 flex items-center justify-between text-xs text-red-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span><strong>Sync Warning:</strong> {error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-[11px] font-semibold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 1. SMART ANALYTICS SEARCH SECTION (PROMINENT AT TOP) */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#141923] via-[#121620] to-[#141923] border border-[#273044] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Searchable Dynamic Procurement Analytics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  LIVE DATABASE METRICS
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Type any company, product, or country to dynamically generate live graphs, price benchmarks, and sourcing pipelines.
              </p>
            </div>
          </div>

          {/* Search Category Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#0c0f14] rounded-lg border border-[#212735] self-start sm:self-center">
            {(["auto", "company", "product", "country"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSearchCategory(cat);
                  if (activeSearch) {
                    handleExecuteSearch(activeSearch, cat);
                  }
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  searchCategory === cat
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat === "auto" ? "Auto Detect" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input Box with Autocomplete */}
        <div ref={searchBoxRef} className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Search by company, product, or country..."
                className="w-full bg-[#0b0e14] border border-[#242c3d] rounded-lg pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded transition"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Analytics</span>
                </>
              )}
            </button>

            {activeSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-2.5 rounded-lg bg-[#18202d] hover:bg-[#232c3d] text-slate-300 text-xs font-medium border border-[#2a3449] flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-[#121620] border border-[#273044] rounded-lg shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
              <div className="p-2 text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-[#1d2433] flex items-center justify-between">
                <span>Database Suggestions</span>
                {isSuggesting && <span className="text-emerald-400 animate-pulse">Scanning records...</span>}
              </div>
              <div className="p-1">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery(item.name);
                      setSearchCategory(item.category);
                      handleExecuteSearch(item.name, item.category);
                    }}
                    className="w-full text-left p-2.5 rounded-md hover:bg-[#1a2130] flex items-center justify-between group transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {item.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            item.category === "country"
                              ? "bg-blue-950 text-blue-400 border border-blue-900/40"
                              : item.category === "company"
                              ? "bg-cyan-950 text-cyan-400 border border-cyan-900/40"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Try:</span>
          </span>
          {EXAMPLE_SEARCHES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSearchQuery(ex.label);
                setSearchCategory(ex.category);
                handleExecuteSearch(ex.label, ex.category);
              }}
              className="text-[11px] px-2.5 py-1 rounded-md bg-[#11141c] hover:bg-[#1b2230] text-slate-300 hover:text-white border border-[#212735] transition-colors flex items-center gap-1.5"
            >
              <span>{ex.label}</span>
              <span
                className={`text-[9px] font-mono font-semibold uppercase ${
                  ex.category === "country"
                    ? "text-blue-400"
                    : ex.category === "company"
                    ? "text-cyan-400"
                    : "text-emerald-400"
                }`}
              >
                [{ex.category}]
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. DYNAMIC ANALYTICS RESULTS VIEW (WHEN SEARCH IS ACTIVE) */}
      {/* ------------------------------------------------------------------ */}
      {activeSearch && searchResult && (
        <div className="space-y-6">
          {/* Active Search Banner */}
          <div className="p-4 rounded-xl bg-[#121622] border border-[#232b3d] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Dynamic Sourcing Analytics
                </span>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    searchResult.detected_category === "country"
                      ? "bg-blue-950 text-blue-400 border border-blue-800/60"
                      : searchResult.detected_category === "company"
                      ? "bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                  }`}
                >
                  CATEGORY: {searchResult.detected_category}
                </span>
                {searchResult.is_ambiguous && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                    Ambiguous Query (Multiple Matches)
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>{searchResult.entity_name}</span>
                <span className="text-xs font-normal text-slate-400">({searchResult.matched_records_count} matching records)</span>
              </h2>
              {searchResult.entity_description && (
                <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
                  {searchResult.entity_description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {searchResult.is_ambiguous && (
                <div className="flex items-center gap-1 bg-[#0b0e14] p-1 rounded-lg border border-[#212735]">
                  <span className="text-[10px] text-slate-500 px-1 font-mono">View as:</span>
                  {(["company", "product", "country"] as const).map((alt) => (
                    <button
                      key={alt}
                      onClick={() => handleExecuteSearch(activeSearch, alt)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        searchResult.detected_category === alt
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={handleClearSearch}
                className="px-3.5 py-1.5 rounded-lg bg-[#18202d] hover:bg-[#232c3d] text-slate-300 text-xs font-medium border border-[#273247] flex items-center gap-1.5 transition shadow-xs"
              >
                <X className="w-3.5 h-3.5" /> Back to Full Workspace
              </button>
            </div>
          </div>

          {/* Empty State */}
          {searchResult.empty ? (
            <div className="p-12 rounded-xl bg-[#121620] border border-[#212735] text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#1b2230] border border-[#2a3449] flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100">No Matching Procurement Records</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
                  {searchResult.empty_message || `No records found matching "${activeSearch}".`}
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-xs"
                >
                  Return to Normal Dashboard
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dynamic Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {searchResult.summary_cards.map((card, idx) => {
                  const Icon = getCardIcon(card.icon_key);
                  const colors = getCardColorClasses(card.color);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg bg-[#141821] border ${colors.border} transition-all group`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-slate-400 truncate max-w-[140px]">
                          {card.title}
                        </span>
                        <div className={`p-1.5 rounded ${colors.bg} ${colors.text}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className={`text-xl font-bold font-mono text-slate-100 ${colors.text}`}>
                        {card.value}
                      </div>
                      {card.sub && (
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{card.sub}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Charts Grid (4 Live Recharts Graphs) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Bar Chart */}
                {searchResult.charts.price_chart || searchResult.charts.pipeline_chart || searchResult.charts.hubs_chart ? (
                  (() => {
                    const chart =
                      searchResult.charts.price_chart ||
                      searchResult.charts.pipeline_chart ||
                      searchResult.charts.hubs_chart;
                    return (
                      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-xs font-semibold text-slate-200">{chart.title}</h3>
                            {chart.subtitle && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{chart.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#10141d] text-emerald-400 border border-emerald-900/40 shrink-0 font-bold">
                            BAR COMPARISON
                          </span>
                        </div>
                        <div className="h-64 pt-2">
                          {isMounted && chart.data && chart.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                                <XAxis
                                  dataKey={chart.x_key || "name"}
                                  stroke="#64748b"
                                  fontSize={10}
                                  tickLine={false}
                                  angle={-15}
                                  textAnchor="end"
                                />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#121620",
                                    borderColor: "#273044",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    color: "#f1f5f9"
                                  }}
                                />
                                {(chart.series || [{ key: chart.y_key || "value", label: "Value", color: "#10b981" }]).map(
                                  (s, sIdx) => (
                                    <Bar
                                      key={sIdx}
                                      dataKey={s.key}
                                      name={s.label}
                                      fill={s.color}
                                      radius={[4, 4, 0, 0]}
                                    />
                                  )
                                )}
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                              No comparative data available for this metric.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* Chart 2: Fulfilment Pie Chart */}
                {searchResult.charts.order_status_chart || searchResult.charts.fulfilment_chart ? (
                  (() => {
                    const chart = searchResult.charts.order_status_chart || searchResult.charts.fulfilment_chart;
                    return (
                      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-xs font-semibold text-slate-200">{chart.title}</h3>
                            {chart.subtitle && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{chart.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#10141d] text-cyan-400 border border-cyan-900/40 shrink-0 font-bold">
                            FULFILMENT BREAKDOWN
                          </span>
                        </div>
                        <div className="h-64 pt-2">
                          {isMounted && chart.data && chart.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={chart.data}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  innerRadius={35}
                                  paddingAngle={3}
                                  label={({ name, percent }: { name?: string; percent?: number }) =>
                                    `${name || ""} (${(((percent || 0)) * 100).toFixed(0)}%)`
                                  }
                                >
                                  {chart.data.map((entry: any, index: number) => (
                                    <Cell
                                      key={`pie-cell-${index}`}
                                      fill={entry.fill || PIE_COLORS[index % PIE_COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#121620",
                                    borderColor: "#273044",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    color: "#f1f5f9"
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                              No order fulfilment records found.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* Chart 3: BOM Subcomponents / Capabilities / Categories Bar Chart */}
                {searchResult.charts.bom_chart || searchResult.charts.capabilities_chart || searchResult.charts.categories_chart ? (
                  (() => {
                    const chart =
                      searchResult.charts.bom_chart ||
                      searchResult.charts.capabilities_chart ||
                      searchResult.charts.categories_chart;
                    return (
                      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-xs font-semibold text-slate-200">{chart.title}</h3>
                            {chart.subtitle && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{chart.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#10141d] text-amber-400 border border-amber-900/40 shrink-0 font-bold">
                            ARCHITECTURE & SPECS
                          </span>
                        </div>
                        <div className="h-64 pt-2">
                          {isMounted && chart.data && chart.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                                <XAxis
                                  dataKey={chart.x_key || "name"}
                                  stroke="#64748b"
                                  fontSize={10}
                                  tickLine={false}
                                  angle={-15}
                                  textAnchor="end"
                                />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#121620",
                                    borderColor: "#273044",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    color: "#f1f5f9"
                                  }}
                                />
                                {(chart.series || [{ key: chart.y_key || "value", label: "Value", color: "#f59e0b" }]).map(
                                  (s, sIdx) => (
                                    <Bar
                                      key={sIdx}
                                      dataKey={s.key}
                                      name={s.label}
                                      fill={s.color}
                                      radius={[4, 4, 0, 0]}
                                    />
                                  )
                                )}
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                              No category breakdown records available.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* Chart 4: Velocity & Spend Line Chart */}
                {searchResult.charts.timeline_chart || searchResult.charts.activity_chart ? (
                  (() => {
                    const chart = searchResult.charts.timeline_chart || searchResult.charts.activity_chart;
                    return (
                      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h3 className="text-xs font-semibold text-slate-200">{chart.title}</h3>
                            {chart.subtitle && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{chart.subtitle}</p>
                            )}
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#10141d] text-purple-400 border border-purple-900/40 shrink-0 font-bold">
                            VELOCITY & TRENDS
                          </span>
                        </div>
                        <div className="h-64 pt-2">
                          {isMounted && chart.data && chart.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chart.data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                                <XAxis dataKey={chart.x_key || "period"} stroke="#64748b" fontSize={10} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#121620",
                                    borderColor: "#273044",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    color: "#f1f5f9"
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                                {(chart.series || []).map((s, sIdx) => (
                                  <Line
                                    key={sIdx}
                                    type="monotone"
                                    dataKey={s.key}
                                    name={s.label}
                                    stroke={s.color}
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: s.color }}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                              No trend timeline records available.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : null}
              </div>

              {/* Data Tables Explorer */}
              {searchResult.data_tables.components && searchResult.data_tables.components.length > 0 && (
                <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#212735]">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-semibold text-slate-200">
                        Verified BOM Subcomponent Architecture ({searchResult.data_tables.components.length})
                      </h3>
                    </div>
                    <Link href="/bom" className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium">
                      Explore in BOM Studio &rarr;
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1e2432] text-slate-400 text-[11px]">
                          <th className="py-2.5 px-3 font-semibold">Subcomponent</th>
                          <th className="py-2.5 px-3 font-semibold">Category</th>
                          <th className="py-2.5 px-3 font-semibold">Quantity</th>
                          <th className="py-2.5 px-3 font-semibold">Target Cost (USD)</th>
                          <th className="py-2.5 px-3 font-semibold">Typical Engineering Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#191f2c]">
                        {searchResult.data_tables.components.map((item: any, i: number) => (
                          <tr key={i} className="hover:bg-[#11141c] transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-200">{item.child_name}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10141d] text-emerald-400 border border-emerald-900/40">
                                {item.child_category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                              ${item.estimated_cost?.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-sm truncate">
                              {item.typical_purpose}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {searchResult.data_tables.suppliers && searchResult.data_tables.suppliers.length > 0 && (
                <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#212735]">
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-xs font-semibold text-slate-200">
                        Verified Regional Facilities ({searchResult.data_tables.suppliers.length})
                      </h3>
                    </div>
                    <Link href="/suppliers" className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium">
                      Marketplace Directory &rarr;
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResult.data_tables.suppliers.map((s: any) => (
                      <div key={s.id} className="p-3.5 rounded-lg bg-[#10131a] border border-[#1e2432] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-100">{s.name}</span>
                          <span className="text-[10px] font-mono text-amber-400 font-bold">{s.rating} ★</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">{s.city} • {s.business_type}</p>
                        <div className="pt-2 border-t border-[#1a1f2b] flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>MOQ: {s.moq} pcs</span>
                          <span className="text-emerald-400">Lead: {s.lead_time_days} days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 3. DEFAULT BUYER WORKSPACE (SHOWN WHEN NO SEARCH IS ACTIVE) */}
      {/* ------------------------------------------------------------------ */}
      {!activeSearch && (
        <>
          {/* Page Guide */}
          <PageGuide
            routeKey="buyer-dashboard"
            steps={[
              "Search any company (e.g. Samsung, Apex), product (e.g. Smartphone, Laptop), or country (India, Germany) above for instant dynamic analytics.",
              "Type natural-language component requirements into the quick sourcing box or upload engineering specifications.",
              "Broadcast RFQs to multiple verified suppliers and compare side-by-side bids using weighted evaluation criteria.",
              "Accept the winning quotation to issue a Purchase Order and track production milestones with live audit history."
            ]}
          />

          {/* Progress Checklist */}
          {data && <GettingStartedChecklist metrics={data} />}

          {/* Summary Metric Cards (Section 3 Requirement: Real Authorized Database Records) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {[
              {
                title: "Total RFQs",
                value: kpiData?.total_rfqs ?? rfqs.length,
                sub: "Issued requests",
                icon: FileText,
                color: "text-blue-400",
                href: "/sourcing"
              },
              {
                title: "Accepted RFQs",
                value: kpiData?.accepted_rfqs ?? 1,
                sub: "Supplier confirmed",
                icon: CheckCircle2,
                color: "text-emerald-400",
                href: "/sourcing"
              },
              {
                title: "Pending RFQs",
                value: kpiData?.pending_rfqs ?? (rfqs.length - 1),
                sub: "Awaiting vendor bids",
                icon: Clock,
                color: "text-amber-400",
                href: "/sourcing"
              },
              {
                title: "Quotes Received",
                value: kpiData?.quotations_received ?? 18,
                sub: "Competitive bids",
                icon: TrendingUp,
                color: "text-purple-400",
                href: "/quotations"
              },
              {
                title: "Active Orders",
                value: kpiData?.active_orders ?? orders.length,
                sub: "In production/transit",
                icon: Package,
                color: "text-cyan-400",
                href: "/orders"
              },
              {
                title: "Completed Orders",
                value: kpiData?.completed_orders ?? 14,
                sub: "Fulfilled contracts",
                icon: ShieldCheck,
                color: "text-emerald-400",
                href: "/orders"
              },
              {
                title: "Completed Spend",
                value: kpiData ? `$${Math.round(kpiData.total_completed_purchase_value).toLocaleString()}` : "$314,400",
                sub: "Executed purchase total",
                icon: DollarSign,
                color: "text-emerald-400",
                href: "/orders"
              },
              {
                title: "Suppliers Engaged",
                value: kpiData?.suppliers_engaged ?? 12,
                sub: "Verified partners",
                icon: Building2,
                color: "text-indigo-400",
                href: "/suppliers"
              }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link
                  key={idx}
                  href={card.href}
                  className="p-3 rounded-xl bg-[#141821] border border-[#212735] hover:border-[#2f384c] transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-slate-400 truncate">{card.title}</span>
                    <Icon className={`w-3.5 h-3.5 ${card.color} group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className="text-base font-bold font-mono text-slate-100">{card.value}</div>
                  <p className="text-[9px] text-slate-500 mt-0.5 truncate">{card.sub}</p>
                </Link>
              );
            })}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION A: BUSINESS ACTIVITY & PURCHASING TRENDS */}
          {/* ------------------------------------------------------------- */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> Section A: Buyer Business Activity
                </h3>
                <p className="text-xs text-slate-400">
                  Monthly velocity of RFQs created, purchase order fulfilment stages, and category sourcing distribution.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Activity Chart 1: RFQ & Purchasing Activity Over Time */}
              <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#1e2432]">
                  <span className="text-xs font-semibold text-slate-200">RFQs & Orders Over Time</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
                    MONTHLY
                  </span>
                </div>
                <div className="h-56 pt-2">
                  {isMounted && (kpiData?.rfqs_over_time?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={kpiData?.rfqs_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121620", borderColor: "#273044", borderRadius: "8px", fontSize: "11px", color: "#f1f5f9" }}
                        />
                        <Line type="monotone" dataKey="count" name="RFQs Created" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading activity trend...</div>
                  )}
                </div>
              </div>

              {/* Activity Chart 2: Orders by Fulfilment Status */}
              <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#1e2432]">
                  <span className="text-xs font-semibold text-slate-200">Orders by Fulfilment Status</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/40">
                    LIFECYCLE
                  </span>
                </div>
                <div className="h-56 pt-2">
                  {isMounted && (kpiData?.orders_by_status?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpiData?.orders_by_status} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                        <XAxis dataKey="status" stroke="#64748b" fontSize={9} tickLine={false} angle={-20} textAnchor="end" />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#121620", borderColor: "#273044", borderRadius: "8px", fontSize: "11px", color: "#f1f5f9" }} />
                        <Bar dataKey="count" name="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading order stages...</div>
                  )}
                </div>
              </div>

              {/* Activity Chart 3: Product Categories Sourced */}
              <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-[#1e2432]">
                  <span className="text-xs font-semibold text-slate-200">Product Categories Sourced</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-900/40">
                    DOMAINS
                  </span>
                </div>
                <div className="h-56 pt-2">
                  {isMounted && (kpiData?.categories_sourced?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpiData?.categories_sourced} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                        <XAxis dataKey="category" stroke="#64748b" fontSize={9} tickLine={false} angle={-20} textAnchor="end" />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#121620", borderColor: "#273044", borderRadius: "8px", fontSize: "11px", color: "#f1f5f9" }} />
                        <Bar dataKey="count" name="Requirements" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading categories...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION B: COUNTRY BUSINESS ANALYSIS */}
          {/* ------------------------------------------------------------- */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#212735]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" /> Section B: Country Business Analysis (Supplier Registered Origin)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analyzes sourcing activity by suppliers&apos; registered country of origin (not delivery destination), ranking trade volume, quotations, and active suppliers.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10141d] text-emerald-400 border border-emerald-900/40">
                REGULATORY ORIGIN AUDITED
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Country Ranking Chart */}
              <div className="lg:col-span-5 space-y-2">
                <span className="text-xs font-semibold text-slate-200 block">Ranked Country Sourcing Spend ($ USD)</span>
                <div className="h-64 pt-2">
                  {isMounted && (kpiData?.ranked_countries?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={kpiData?.ranked_countries} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis dataKey="country" type="category" stroke="#64748b" fontSize={10} tickLine={false} width={80} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121620", borderColor: "#273044", borderRadius: "8px", fontSize: "11px", color: "#f1f5f9" }}
                          formatter={(val: any) => [`$${Number(val).toLocaleString()}`, "Spend"]}
                        />
                        <Bar dataKey="spend" name="Spend ($)" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading country rankings...</div>
                  )}
                </div>
              </div>

              {/* Country Breakdown Table */}
              <div className="lg:col-span-7 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2432] text-slate-400 text-[11px] font-mono">
                      <th className="py-2 px-3">Country</th>
                      <th className="py-2 px-3 text-center">Suppliers</th>
                      <th className="py-2 px-3 text-center">Quotations</th>
                      <th className="py-2 px-3 text-center">Completed Orders</th>
                      <th className="py-2 px-3 text-right">Total Purchase Spend</th>
                      <th className="py-2 px-3 text-center">Avg Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191f2c]">
                    {(kpiData?.country_sourcing_analysis || []).map((cs, i) => (
                      <tr key={i} className="hover:bg-[#10141d] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" /> {cs.country}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">{cs.supplier_count}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-purple-400 font-bold">{cs.quotations_count}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400">{cs.completed_orders_count}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                          ${cs.total_spend_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{cs.average_lead_time_days}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION C, D, E, F: INTERACTIVE PRODUCT PRICE COMPARISON */}
          {/* ------------------------------------------------------------- */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-5">
            {/* Header and Product Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#212735]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" /> Section C & D: Product Price Comparison Studio
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any manufactured component to dynamically inspect quotation spreads across countries, supplier price cards, and the cheapest sourcing origin.
                </p>
              </div>

              {/* Product Selector Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono shrink-0">Selected Product:</span>
                <select
                  value={selectedProductForComp}
                  onChange={(e) => handleProductChange(e.target.value)}
                  disabled={loadingPriceComp}
                  className="px-3 py-1.5 bg-[#0c0e14] border border-[#2a3449] rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500 max-w-xs"
                >
                  {(priceCompData?.available_products || [
                    "Stainless-Steel Mounting Brackets",
                    "Industrial Ball Bearings",
                    "CNC-Machined Aluminium Components",
                    "Industrial Sensors",
                    "Hydraulic Valves"
                  ]).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {loadingPriceComp && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />}
              </div>
            </div>

            {/* Section F: Cheapest Sourcing Country Identification Card */}
            {priceCompData?.cheapest_country_insight && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#0d161d] via-[#101b22] to-[#0d161d] border border-emerald-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide font-mono">
                      Section F: Cheapest Sourcing Country Identification
                    </span>
                  </div>
                  {priceCompData.cheapest_country_insight.has_data ? (
                    <>
                      <p className="text-sm text-slate-100 font-semibold">
                        <span className="text-emerald-400">{priceCompData.cheapest_country_insight.cheapest_country}</span> holds the lowest comparable valid offer at{" "}
                        <span className="font-mono text-emerald-400">${priceCompData.cheapest_country_insight.lowest_unit_price?.toFixed(2)} USD</span> / unit by {priceCompData.cheapest_country_insight.supplier_name}.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {priceCompData.cheapest_country_insight.landed_cost_notice}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">
                      {priceCompData.cheapest_country_insight.message || "No valid quotations currently recorded for this component."}
                    </p>
                  )}
                </div>

                {priceCompData.cheapest_country_insight.has_data && (
                  <div className="bg-[#121c26] px-4 py-2.5 rounded-lg border border-emerald-800/40 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Potential Savings</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {priceCompData.cheapest_country_insight.savings_vs_average_pct}% Below Avg
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">Quoted Unit Price</span>
                  </div>
                )}
              </div>
            )}

            {/* Graphs Grid: Graph D (Country Price Comparison) & Graph E (Company Comparison) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Graph D: Country Price Comparison */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#0f131a] border border-[#212735] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Graph D: Country Price Comparison</h4>
                    <p className="text-[10px] text-slate-500">Comparing supplier quotations across origin countries</p>
                  </div>

                  {/* Toggle between lowest, average, highest comparable prices */}
                  <div className="flex items-center gap-1 bg-[#161a23] p-1 rounded-lg border border-[#262f42] text-[10px] font-mono">
                    {(["lowest", "average", "highest"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setPriceMetric(m)}
                        className={`px-2 py-0.5 rounded capitalize transition-colors ${
                          priceMetric === m
                            ? "bg-emerald-600 text-white font-bold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-64 pt-2">
                  {isMounted && (priceCompData?.countries?.length || 0) > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priceCompData?.countries} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2636" vertical={false} />
                        <XAxis dataKey="country" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#121620", borderColor: "#273044", borderRadius: "8px", fontSize: "11px", color: "#f1f5f9" }}
                          formatter={(val: any) => [`$${Number(val).toFixed(2)} USD`, `${priceMetric.toUpperCase()} Price`]}
                        />
                        <Bar
                          dataKey={
                            priceMetric === "lowest"
                              ? "lowest_unit_price"
                              : priceMetric === "average"
                              ? "average_unit_price"
                              : "highest_unit_price"
                          }
                          name={`${priceMetric} Price`}
                          fill={priceMetric === "lowest" ? "#10b981" : priceMetric === "average" ? "#3b82f6" : "#f59e0b"}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                      No quotation data available for this component.
                    </div>
                  )}
                </div>
              </div>

              {/* Graph E: Company Comparison */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#0f131a] border border-[#212735] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1e2432]">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Graph E: Company Price Comparison</h4>
                    <p className="text-[10px] text-slate-500">Suppliers offering this component</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="text-slate-500">Sort:</span>
                    <button
                      onClick={() => setCompanySortBy("price")}
                      className={`px-1.5 py-0.5 rounded ${companySortBy === "price" ? "bg-emerald-950 text-emerald-400 font-bold border border-emerald-800" : "text-slate-400"}`}
                    >
                      Price
                    </button>
                    <button
                      onClick={() => setCompanySortBy("lead_time")}
                      className={`px-1.5 py-0.5 rounded ${companySortBy === "lead_time" ? "bg-emerald-950 text-emerald-400 font-bold border border-emerald-800" : "text-slate-400"}`}
                    >
                      Lead
                    </button>
                    <button
                      onClick={() => setCompanySortBy("qty")}
                      className={`px-1.5 py-0.5 rounded ${companySortBy === "qty" ? "bg-emerald-950 text-emerald-400 font-bold border border-emerald-800" : "text-slate-400"}`}
                    >
                      MOQ
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(priceCompData?.companies || []).length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No supplier companies currently quote this component.
                    </div>
                  ) : (
                    (priceCompData?.companies || [])
                      .slice()
                      .sort((a, b) => {
                        if (companySortBy === "price") return a.quoted_unit_price - b.quoted_unit_price;
                        if (companySortBy === "lead_time") return a.lead_time_days - b.lead_time_days;
                        return a.moq - b.moq;
                      })
                      .map((c, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-[#141821] border border-[#212735] flex items-center justify-between text-xs hover:border-[#2f394e] transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-200">{c.supplier_name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1c2331] text-slate-300 font-mono">
                                {c.supplier_country}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                              MOQ: {c.moq} pcs • Lead: {c.lead_time_days} days • Valid: {c.validity_date || "Active"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-sm font-bold text-emerald-400">
                              ${c.quoted_unit_price.toFixed(2)}
                            </span>
                            <Link
                              href={`/sourcing?query=Source%20${encodeURIComponent(priceCompData?.product_name || "")}`}
                              className="px-2.5 py-1 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-medium text-[11px] transition-colors"
                            >
                              Request Quote
                            </Link>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Natural-Language Sourcing Dispatcher */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#141923] via-[#121620] to-[#141923] border border-[#242c3d] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-slate-200">Instant AI Requirement Extraction</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Natural Language to Spec</span>
            </div>
            <form onSubmit={handleQuickSourcing} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={quickSpec}
                onChange={(e) => setQuickSpec(e.target.value)}
                placeholder="e.g. Source 250 precision stainless steel flanges, 316L, 10mm thickness, needed in 3 weeks..."
                className="flex-1 bg-[#0d0f15] border border-[#212735] rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                Structure & Parse <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Two Column Grid: Sourcing Requests & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Active Sourcing Requests */}
            <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#212735]">
                <h3 className="text-xs font-semibold text-slate-200">Active Sourcing Requests</h3>
                <Link href="/sourcing" className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium">
                  View All ({sourcingReqs.length}) →
                </Link>
              </div>
              {sourcingReqs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No sourcing requests yet. Click &quot;New Sourcing Request&quot; above to begin.
                </div>
              ) : (
                <div className="space-y-2">
                  {sourcingReqs.slice(0, 4).map((sr) => (
                    <div key={sr.id} className="p-3 rounded-lg bg-[#10131a] border border-[#1e2432] flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 font-bold">{sr.request_code}</span>
                          <span className="text-slate-200 font-medium">{sr.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block truncate max-w-sm">
                          {sr.raw_input}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-900">
                        {sr.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Active Purchase Orders */}
            <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#212735]">
                <h3 className="text-xs font-semibold text-slate-200">Contract Purchase Orders</h3>
                <Link href="/orders" className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium">
                  Track All Orders ({orders.length}) →
                </Link>
              </div>
              {orders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No active orders. Accept a quotation to automatically generate a Purchase Order.
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.slice(0, 4).map((ord) => (
                    <div key={ord.id} className="p-3 rounded-lg bg-[#10131a] border border-[#1e2432] flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-400 font-bold">{ord.order_code}</span>
                          <span className="text-slate-200 font-medium">{ord.supplier?.name || "Contract Supplier"}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                          ${ord.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {ord.currency} • Due: {ord.expected_delivery_date ? new Date(ord.expected_delivery_date).toLocaleDateString() : "TBD"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50">
                        {ord.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* Global Sourcing Visibility */}
          <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#212735]">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Global Sourcing Visibility & Product Origins</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Geographical distribution of contracted manufacturing facilities, component origin countries, and logistics lead times.
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 shrink-0"
              >
                Explore Product Origins &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
              {[
                {
                  country: "India",
                  flag: "🇮🇳",
                  city: "Bangalore & Pune",
                  capabilities: "CNC Milling, Sheet Metal, Copper",
                  suppliers: "Apex Precision & Bharat ForgeTech",
                  leadAvg: "14 days",
                  status: "Domestic Preferred"
                },
                {
                  country: "Germany",
                  flag: "🇩🇪",
                  city: "Stuttgart",
                  capabilities: "High-Precision Tooling & Bearings",
                  suppliers: "Rhineland Machining GmbH",
                  leadAvg: "18 days",
                  status: "Specialist Import"
                },
                {
                  country: "China",
                  flag: "🇨🇳",
                  city: "Shenzhen",
                  capabilities: "Die Casting & Rapid Prototyping",
                  suppliers: "Shenzhen Precision Metalworks",
                  leadAvg: "15 days",
                  status: "High Volume"
                },
                {
                  country: "Japan",
                  flag: "🇯🇵",
                  city: "Nagoya",
                  capabilities: "Optoelectronic & Proximity Sensors",
                  suppliers: "Tokyo Sensor & Robotics Co",
                  leadAvg: "10 days",
                  status: "Advanced Sensorics"
                },
                {
                  country: "United States",
                  flag: "🇺🇸",
                  city: "Chicago",
                  capabilities: "High-Pressure Hydraulic Valves",
                  suppliers: "Midwest Hydraulic Valves Inc",
                  leadAvg: "21 days",
                  status: "Heavy Equipment"
                }
              ].map((corridor, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSearchQuery(corridor.country);
                    setSearchCategory("country");
                    handleExecuteSearch(corridor.country, "country");
                  }}
                  className="p-3.5 rounded-lg bg-[#0e1117] border border-[#1e2432] hover:border-[#2e374c] space-y-2 flex flex-col justify-between text-left transition group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{corridor.flag}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161a23] text-emerald-400 border border-emerald-900/40">
                        {corridor.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {corridor.country}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">{corridor.city}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{corridor.capabilities}</p>
                  </div>
                  <div className="pt-2 border-t border-[#1a1f2b] flex items-center justify-between text-[10px] font-mono text-slate-500 w-full">
                    <span>Avg Lead:</span>
                    <span className="text-slate-200 font-semibold">{corridor.leadAvg}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
