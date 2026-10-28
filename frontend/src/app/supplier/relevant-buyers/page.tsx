"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  Package,
  Layers,
  FileText,
  FileSpreadsheet,
  Send,
  ShieldCheck,
  Globe,
  ChevronRight,
  ExternalLink,
  Sliders,
  DollarSign,
  Clock,
  Award,
  X,
  ArrowRight,
  Info
} from "lucide-react";
import { api, RelevantBuyerMatch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function RelevantBuyersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [matches, setMatches] = useState<RelevantBuyerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [minScoreFilter, setMinScoreFilter] = useState<number | undefined>(undefined);
  const [minQuantity, setMinQuantity] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState("ISSUED");
  const [sortBy, setSortBy] = useState("best_match");

  // Filter option lists
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  // Modals & Details
  const [selectedBuyerForProfile, setSelectedBuyerForProfile] = useState<RelevantBuyerMatch | null>(null);
  const [selectedMatchForSpecs, setSelectedMatchForSpecs] = useState<RelevantBuyerMatch | null>(null);
  const [contactModalMatch, setContactModalMatch] = useState<RelevantBuyerMatch | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRelevantBuyers({
        search: searchTerm || undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        country: countryFilter !== "ALL" ? countryFilter : undefined,
        min_score: minScoreFilter,
        min_quantity: minQuantity,
        rfq_status: statusFilter,
        sort_by: sortBy
      });
      setMatches(data);

      // Extract unique categories & countries
      const cats = Array.from(new Set(data.map((m) => m.matching_category))).filter(Boolean);
      const cnts = Array.from(new Set(data.map((m) => m.buyer_country))).filter(Boolean);
      if (cats.length) setCategories(cats);
      if (cnts.length) setCountries(cnts);
    } catch (err: any) {
      setError(err.message || "Failed to load relevant buyer recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchMatches();
  }, [categoryFilter, countryFilter, minScoreFilter, minQuantity, statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches();
  };

  const handleSendMessage = async () => {
    if (!contactModalMatch || !messageText.trim()) return;
    setIsSendingMessage(true);
    try {
      await api.contactBuyer({
        buyer_id: contactModalMatch.buyer_id,
        catalog_item_id: contactModalMatch.supplier_catalog_item_id,
        rfq_id: contactModalMatch.rfq_id,
        subject: `Partnership Inquiry: Matching ${contactModalMatch.matching_product_name}`,
        message: messageText.trim()
      });
      setSuccess(`Direct proposal sent to ${contactModalMatch.buyer_company}!`);
      setContactModalMatch(null);
      setMessageText("");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to deliver message to buyer");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getScoreBadge = (score: number, level: string) => {
    if (score >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          {score}% • EXCEPTIONAL MATCH
        </span>
      );
    }
    if (score >= 65) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800/80 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          {score}% • STRONG MATCH
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {score}% • MODERATE MATCH
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 shadow-sm">
        {score}% • PARTIAL MATCH
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Relevant Buyers</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> EXPLAINABLE AI MATCH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recommends verified enterprise buyers whose purchasing needs, RFQs, and specifications align with your listed products.
          </p>
        </div>
        <button
          onClick={fetchMatches}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Matches
        </button>
      </div>

      <PageGuide
        title="How Relevant Buyers Matching Works"
        steps={[
          "1. Product Match (40 pts): Compares your published catalog items with active buyer RFQs and sourcing titles.",
          "2. Category & Process Alignment (25 pts): Validates technical manufacturing process and classification synergy.",
          "3. Specification Compatibility (20 pts): Checks material grades, tolerances, dimensions, and eliminates conflicts.",
          "4. Quantity & Capacity Fit (10 pts): Matches requested volumes against your minimum order quantity and batch stock.",
          "5. Quality & Compliance (5 pts): Verifies ISO 9001 and trade standards between both corporate parties."
        ]}
        tip="Click on any matching card to inspect the exact dimensional scoring breakdown or initiate direct buyer communication."
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
          <button onClick={fetchMatches} className="underline hover:text-white font-medium ml-2">
            Retry
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#121620] p-4 rounded-xl border border-[#232938] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by buyer company, product name, country, or material grade..."
              className="w-full pl-9 pr-4 py-2 bg-[#0c0e14] border border-[#232938] rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" /> Filter Results
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 border-t border-[#1a1f2c]">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Buyer Country</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Min Match Score</label>
            <select
              value={minScoreFilter || ""}
              onChange={(e) => setMinScoreFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Any Match Score</option>
              <option value="80">80%+ Exceptional</option>
              <option value="65">65%+ Strong</option>
              <option value="50">50%+ Moderate</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Requested Volume</label>
            <select
              value={minQuantity || ""}
              onChange={(e) => setMinQuantity(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Any Quantity</option>
              <option value="100">100+ units</option>
              <option value="500">500+ units</option>
              <option value="1000">1,000+ units</option>
              <option value="5000">5,000+ units</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">RFQ Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ISSUED">Open RFQs (Issued)</option>
              <option value="ALL">All RFQ States</option>
              <option value="DRAFT">Draft Requirements</option>
              <option value="CLOSED">Historical (Closed)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="best_match">Highest Match Score</option>
              <option value="newest">Newest Sourcing Request</option>
              <option value="quantity_desc">Highest Requested Quantity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Match Cards List */}
      {loading ? (
        <div className="py-16 text-center bg-[#121620] rounded-xl border border-[#232938]">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Analyzing product catalogs and calculating buyer compatibility...</p>
          <p className="text-xs text-slate-500 mt-1">Evaluating materials, specifications, and volume thresholds across database.</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center bg-[#121620] rounded-xl border border-[#232938] px-4">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No matching buyer requirements found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria, clearing score thresholds, or publish additional product listings in Products & Inventory to unlock more matches.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("ALL");
              setCountryFilter("ALL");
              setMinScoreFilter(undefined);
              setMinQuantity(undefined);
              setStatusFilter("ISSUED");
            }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-200 text-xs font-medium border border-[#2e374d] transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing <strong className="text-slate-200 font-semibold">{matches.length}</strong> compatible buyer opportunities</span>
            <span className="font-mono text-[11px] text-slate-500">Sorted by: {sortBy === "best_match" ? "Relevance Score" : sortBy}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {matches.map((m) => (
              <div
                key={m.id}
                className="bg-[#121620] rounded-xl border border-[#232938] hover:border-[#384259] p-5 transition-all shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b202c]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a2130] border border-[#2a344a] flex items-center justify-center shrink-0 text-emerald-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-100">{m.buyer_company}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#18202e] text-slate-300 border border-[#2a344a] flex items-center gap-1 font-medium">
                          <Globe className="w-3 h-3 text-slate-400" /> {m.buyer_country}
                        </span>
                        {m.is_invited && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 font-mono font-bold">
                            INVITED TO QUOTE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {m.buyer_industry || "Industrial Manufacturing"} • Contact: {m.buyer_name}
                      </p>
                    </div>
                  </div>

                  <div>{getScoreBadge(m.match_score, m.match_level)}</div>
                </div>

                {/* Match Summary Callout */}
                <div className="bg-[#0e121a] p-3 rounded-lg border border-[#1d2332] flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="text-slate-200 font-medium">{m.match_summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.match_reasons.slice(0, 3).map((r, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#161c28] text-slate-300 border border-[#283144] font-mono"
                        >
                          ✓ {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sourcing requirement details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c]">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">REQUESTED PRODUCT</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate" title={m.rfq_title}>
                      {m.rfq_title}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
                      Matches: {m.matching_product_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">VOLUME & UNIT</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {m.requested_quantity.toLocaleString()} {m.requested_unit}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Category: {m.matching_category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">SPECIFICATIONS</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate" title={m.specifications.material_grade || "Industrial Specification"}>
                      {m.specifications.material_grade || "Standard Material"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                      {m.specifications.required_certifications || "ISO 9001:2015"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">RFQ TIMELINE</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {m.rfq_code || "Active RFQ"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {m.deadline_date ? `Deadline: ${new Date(m.deadline_date).toLocaleDateString()}` : "Active Opportunity"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBuyerForProfile(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#242d40] text-slate-300 text-xs font-medium border border-[#2b354c] flex items-center gap-1.5 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" /> View Buyer Profile
                    </button>
                    <button
                      onClick={() => setSelectedMatchForSpecs(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#242d40] text-slate-300 text-xs font-medium border border-[#2b354c] flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" /> View Requirements & Specs
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setContactModalMatch(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#182620] hover:bg-[#22352c] text-emerald-300 text-xs font-medium border border-emerald-900/60 flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message Buyer
                    </button>
                    {m.rfq_id && (
                      <>
                        <Link
                          href={`/supplier/quotations?rfq_id=${m.rfq_id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#162238] hover:bg-[#1e2f4e] text-blue-300 text-xs font-medium border border-blue-900/60 flex items-center gap-1.5 transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> Prepare Quotation
                        </Link>
                        <Link
                          href={`/supplier/rfqs/${m.rfq_id}`}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          Respond to RFQ <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buyer Profile Drawer */}
      {selectedBuyerForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121620] w-full max-w-lg rounded-xl border border-[#283144] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#232938] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedBuyerForProfile.buyer_company}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedBuyerForProfile.buyer_country} • {selectedBuyerForProfile.buyer_industry || "Industrial Equipment"}
                </p>
              </div>
              <button
                onClick={() => setSelectedBuyerForProfile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2130]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Contact:</span>
                  <span className="text-slate-200 font-medium">{selectedBuyerForProfile.buyer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Official Channel:</span>
                  <span className="text-slate-200 font-mono">{selectedBuyerForProfile.buyer_email || "Direct Marketplace In-App"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operating Country:</span>
                  <span className="text-slate-200">{selectedBuyerForProfile.buyer_country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active RFQ Reference:</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedBuyerForProfile.rfq_code}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">Match Compatibility Breakdown</h4>
                <div className="space-y-1.5 bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c]">
                  {Object.entries(selectedBuyerForProfile.score_breakdown).map(([k, val]) => (
                    <div key={k} className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 capitalize">{k.replace(/_/g, " ")}:</span>
                      <span className="text-emerald-400 font-mono font-bold">{val} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#232938]">
              <button
                onClick={() => setSelectedBuyerForProfile(null)}
                className="px-4 py-2 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const m = selectedBuyerForProfile;
                  setSelectedBuyerForProfile(null);
                  setContactModalMatch(m);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message Buyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specifications Drawer */}
      {selectedMatchForSpecs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121620] w-full max-w-lg rounded-xl border border-[#283144] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#232938] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedMatchForSpecs.rfq_title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specification Profile • {selectedMatchForSpecs.buyer_company}
                </p>
              </div>
              <button
                onClick={() => setSelectedMatchForSpecs(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2130]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#0c0e14] p-4 rounded-lg border border-[#1b202c]">
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Material Grade:</span>
                <span className="text-slate-200 font-semibold">{selectedMatchForSpecs.specifications.material_grade || "As specified"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Manufacturing Process:</span>
                <span className="text-slate-200">{selectedMatchForSpecs.specifications.manufacturing_process || "Precision CNC / Sheet Metal"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Dimensions:</span>
                <span className="text-slate-200 font-mono">{selectedMatchForSpecs.specifications.dimensions || "Per engineering drawing"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Tolerances:</span>
                <span className="text-slate-200 font-mono">{selectedMatchForSpecs.specifications.tolerances || "ISO 2768-m (±0.3mm)"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Required Certifications:</span>
                <span className="text-emerald-400 font-semibold">{selectedMatchForSpecs.specifications.required_certifications || "ISO 9001:2015"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Requested Volume:</span>
                <span className="text-slate-200 font-bold">{selectedMatchForSpecs.requested_quantity.toLocaleString()} {selectedMatchForSpecs.requested_unit}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#232938]">
              <button
                onClick={() => setSelectedMatchForSpecs(null)}
                className="px-4 py-2 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              {selectedMatchForSpecs.rfq_id && (
                <Link
                  href={`/supplier/rfqs/${selectedMatchForSpecs.rfq_id}`}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  Prepare Formal Quote <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {contactModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121620] w-full max-w-lg rounded-xl border border-[#283144] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#232938] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Message {contactModalMatch.buyer_company}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct commercial introduction for {contactModalMatch.rfq_title}
                </p>
              </div>
              <button
                onClick={() => setContactModalMatch(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2130]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c]">
                <span className="text-slate-400 block mb-1">Target Product Line:</span>
                <span className="text-emerald-400 font-semibold">{contactModalMatch.matching_product_name}</span>
                <span className="text-slate-500 block mt-1">
                  Requested {contactModalMatch.requested_quantity} {contactModalMatch.requested_unit} for {contactModalMatch.buyer_country}
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Introduction or Technical Clarification</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Hello ${contactModalMatch.buyer_name}, we verified your sourcing requirement for ${contactModalMatch.matching_product_name}. Our factory has ready capacity and holds active certifications to fulfill your delivery schedule...`}
                  className="w-full p-3 bg-[#0c0e14] border border-[#232938] rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#232938]">
              <button
                onClick={() => setContactModalMatch(null)}
                className="px-4 py-2 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageText.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> {isSendingMessage ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
