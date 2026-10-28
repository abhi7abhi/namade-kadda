"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  Package,
  Layers,
  FileText,
  Send,
  ShieldCheck,
  Globe,
  Clock,
  Star,
  DollarSign,
  ArrowRight,
  Info,
  X,
  PlusCircle
} from "lucide-react";
import { api, RelevantSupplierMatch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function RelevantSuppliersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [matches, setMatches] = useState<RelevantSupplierMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [maxMoq, setMaxMoq] = useState<number | undefined>(undefined);
  const [maxLeadTime, setMaxLeadTime] = useState<number | undefined>(undefined);
  const [certFilter, setCertFilter] = useState("ALL");
  const [minScoreFilter, setMinScoreFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("best_match");

  // Options
  const [categories, setCategories] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  // Modals
  const [selectedSupplierForProfile, setSelectedSupplierForProfile] = useState<RelevantSupplierMatch | null>(null);
  const [selectedMatchForSpecs, setSelectedMatchForSpecs] = useState<RelevantSupplierMatch | null>(null);
  const [contactModalMatch, setContactModalMatch] = useState<RelevantSupplierMatch | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRelevantSuppliers({
        search: searchTerm || undefined,
        category: categoryFilter !== "ALL" ? categoryFilter : undefined,
        country: countryFilter !== "ALL" ? countryFilter : undefined,
        max_price: maxPrice,
        max_moq: maxMoq,
        max_lead_time: maxLeadTime,
        certification: certFilter !== "ALL" ? certFilter : undefined,
        min_score: minScoreFilter,
        sort_by: sortBy
      });
      setMatches(data);

      const cats = Array.from(new Set(data.map((m) => m.category))).filter(Boolean);
      const cnts = Array.from(new Set(data.map((m) => m.supplier_country))).filter(Boolean);
      if (cats.length) setCategories(cats);
      if (cnts.length) setCountries(cnts);
    } catch (err: any) {
      setError(err.message || "Failed to load relevant supplier recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [categoryFilter, countryFilter, maxPrice, maxMoq, maxLeadTime, certFilter, minScoreFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMatches();
  };

  const handleSendMessage = async () => {
    if (!contactModalMatch || !messageText.trim()) return;
    setIsSendingMessage(true);
    try {
      await api.contactSupplier({
        supplier_id: contactModalMatch.supplier_id,
        product_name: contactModalMatch.matching_product_name,
        message: messageText.trim()
      });
      setSuccess(`Inquiry delivered directly to ${contactModalMatch.supplier_name}!`);
      setContactModalMatch(null);
      setMessageText("");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send message to supplier");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Relevant Suppliers</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> EXPLAINABLE AI MATCH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover verified industrial manufacturers whose published inventory, materials, and production capacity match your purchasing requirements.
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
        title="Understanding Supplier Match Scores"
        steps={[
          "1. Product Match (40 pts): Direct component compatibility based on part names, categories, and technical synonyms.",
          "2. Category & Process (25 pts): Verifies supplier's production machinery (5-axis CNC, stamping, cleanroom).",
          "3. Specification Match (20 pts): Evaluates compatible alloy formulations (e.g. SS 304/316, 6061-T6, 100Cr6) without conflicts.",
          "4. Volume & Capacity (10 pts): Confirms supplier minimum order quantities (MOQ) and batch capacity.",
          "5. Quality Accreditations (5 pts): Verifies active ISO 9001, AS9100D, or RoHS credentials."
        ]}
        tip="Adjust the minimum match threshold or filter by certification to isolate top-tier precision fabricators."
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
              placeholder="Search by supplier name, product, country, or material grade..."
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

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 pt-2 border-t border-[#1a1f2c]">
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
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Country</label>
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
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Min Score</label>
            <select
              value={minScoreFilter || ""}
              onChange={(e) => setMinScoreFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Any Score</option>
              <option value="80">80%+ Exceptional</option>
              <option value="65">65%+ Strong</option>
              <option value="50">50%+ Moderate</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Max Price</label>
            <select
              value={maxPrice || ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Any Price</option>
              <option value="25">Under $25</option>
              <option value="50">Under $50</option>
              <option value="100">Under $100</option>
              <option value="250">Under $250</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Max MOQ</label>
            <select
              value={maxMoq || ""}
              onChange={(e) => setMaxMoq(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Any MOQ</option>
              <option value="50">Up to 50 pcs</option>
              <option value="100">Up to 100 pcs</option>
              <option value="500">Up to 500 pcs</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Max Lead Time</label>
            <select
              value={maxLeadTime || ""}
              onChange={(e) => setMaxLeadTime(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">Any Timeline</option>
              <option value="10">Within 10 Days</option>
              <option value="15">Within 15 Days</option>
              <option value="21">Within 3 Weeks</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Certifications</label>
            <select
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-[#0c0e14] border border-[#232938] rounded text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Certs</option>
              <option value="ISO 9001">ISO 9001</option>
              <option value="IATF 16949">IATF 16949</option>
              <option value="AS9100D">AS9100D</option>
              <option value="RoHS">RoHS</option>
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
              <option value="price_asc">Lowest Quoted Price</option>
              <option value="lead_time_asc">Shortest Lead Time</option>
              <option value="stock_desc">Highest Stock Available</option>
            </select>
          </div>
        </div>
      </div>

      {/* Match Cards */}
      {loading ? (
        <div className="py-16 text-center bg-[#121620] rounded-xl border border-[#232938]">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-300 font-medium">Matching your active sourcing requirements with verified suppliers...</p>
          <p className="text-xs text-slate-500 mt-1">Cross-referencing technical specifications, manufacturing tolerances, and delivery lead times.</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-16 text-center bg-[#121620] rounded-xl border border-[#232938] px-4">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No compatible suppliers found for current criteria</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Try broadening your search filters, adjusting maximum MOQ, or submit a new sourcing requirement in Incoming RFQs to generate new matching candidates.
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setCategoryFilter("ALL");
              setCountryFilter("ALL");
              setMaxPrice(undefined);
              setMaxMoq(undefined);
              setMaxLeadTime(undefined);
              setMinScoreFilter(undefined);
            }}
            className="mt-4 px-4 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-200 text-xs font-medium border border-[#2e374d] transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Showing <strong className="text-slate-200 font-semibold">{matches.length}</strong> compatible supplier products</span>
            <span className="font-mono text-[11px] text-slate-500">Sorted by: {sortBy === "best_match" ? "Relevance Score" : sortBy}</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {matches.map((m) => (
              <div
                key={m.id}
                className="bg-[#121620] rounded-xl border border-[#232938] hover:border-[#384259] p-5 transition-all shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1b202c]">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1a2130] border border-[#2a344a] flex items-center justify-center shrink-0 text-emerald-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-100">{m.supplier_name}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#18202e] text-slate-300 border border-[#2a344a] flex items-center gap-1 font-medium">
                          <Globe className="w-3 h-3 text-slate-400" /> {m.supplier_country}
                        </span>
                        {m.is_verified && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 font-mono font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        )}
                        <span className="text-[11px] text-amber-400 flex items-center gap-0.5 font-mono">
                          <Star className="w-3 h-3 fill-amber-400" /> {m.supplier_rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {m.supplier_city}, {m.supplier_country} • Contact: {m.supplier_email}
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

                {/* Product details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c]">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">OFFERED PRODUCT</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate" title={m.matching_product_name}>
                      {m.matching_product_name}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
                      Part: {m.part_number || `P-${m.catalog_item_id}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">COMMERCIAL PRICING</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      ${m.unit_price.toFixed(2)} {m.currency} / unit
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      MOQ: {m.moq.toLocaleString()} pcs
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">LEAD TIME & INVENTORY</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block">
                      {m.lead_time_days} days factory turnaround
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Stock: {m.available_quantity.toLocaleString()} pcs ready
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block">MATCHING BUYER REQUIREMENT</span>
                    <span className="font-semibold text-slate-200 mt-0.5 block truncate" title={m.buyer_sourcing_title || "Active RFQ"}>
                      {m.buyer_sourcing_title || "Direct Sourcing Match"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                      {m.buyer_rfq_code || "Open RFQ Match"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSupplierForProfile(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#242d40] text-slate-300 text-xs font-medium border border-[#2b354c] flex items-center gap-1.5 transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" /> View Supplier Profile
                    </button>
                    <button
                      onClick={() => setSelectedMatchForSpecs(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#242d40] text-slate-300 text-xs font-medium border border-[#2b354c] flex items-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" /> View Matching Products & Specs
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setContactModalMatch(m)}
                      className="px-3 py-1.5 rounded-lg bg-[#182620] hover:bg-[#22352c] text-emerald-300 text-xs font-medium border border-emerald-900/60 flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message Supplier
                    </button>
                    <Link
                      href={`/sourcing?query=Source%20${encodeURIComponent(m.matching_product_name)}&supplier_id=${m.supplier_id}`}
                      className="px-3 py-1.5 rounded-lg bg-[#162238] hover:bg-[#1e2f4e] text-blue-300 text-xs font-medium border border-blue-900/60 flex items-center gap-1.5 transition-colors"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Request Quotation
                    </Link>
                    <Link
                      href={`/sourcing?query=Source%20${encodeURIComponent(m.matching_product_name)}`}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      Create RFQ <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Profile Modal */}
      {selectedSupplierForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121620] w-full max-w-lg rounded-xl border border-[#283144] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#232938] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedSupplierForProfile.supplier_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedSupplierForProfile.supplier_city}, {selectedSupplierForProfile.supplier_country} • Verified Supplier
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierForProfile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2130]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Quality Rating:</span>
                  <span className="text-amber-400 font-bold">{selectedSupplierForProfile.supplier_rating} / 5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accreditations:</span>
                  <span className="text-slate-200">{selectedSupplierForProfile.certifications.join(", ") || "ISO 9001:2015"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200 font-mono">{selectedSupplierForProfile.supplier_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Standard Delivery Lead Time:</span>
                  <span className="text-slate-200">{selectedSupplierForProfile.lead_time_days} days</span>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">Score Breakdown</h4>
                <div className="space-y-1.5 bg-[#0c0e14] p-3 rounded-lg border border-[#1b202c]">
                  {Object.entries(selectedSupplierForProfile.score_breakdown).map(([k, val]) => (
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
                onClick={() => setSelectedSupplierForProfile(null)}
                className="px-4 py-2 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const m = selectedSupplierForProfile;
                  setSelectedSupplierForProfile(null);
                  setContactModalMatch(m);
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message Supplier
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
                <h3 className="text-base font-bold text-slate-100">{selectedMatchForSpecs.matching_product_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Technical Specifications • {selectedMatchForSpecs.supplier_name}
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
                <span className="text-slate-400">Category:</span>
                <span className="text-slate-200 font-semibold">{selectedMatchForSpecs.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Material Specification:</span>
                <span className="text-slate-200 font-medium">{selectedMatchForSpecs.material || "Industrial Grade Material"}</span>
              </div>
              <div className="py-1 border-b border-[#181d28]">
                <span className="text-slate-400 block mb-1">Specifications & Tolerances:</span>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px] bg-[#11151e] p-2 rounded border border-[#202737]">
                  {selectedMatchForSpecs.specifications || "Full engineering drawing tolerances adhered to per ISO standard."}
                </p>
              </div>
              <div className="flex justify-between py-1 border-b border-[#181d28]">
                <span className="text-slate-400">Minimum Order Quantity:</span>
                <span className="text-slate-200 font-bold">{selectedMatchForSpecs.moq.toLocaleString()} pcs</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Batch Inventory Coverage:</span>
                <span className="text-emerald-400 font-bold">{selectedMatchForSpecs.available_quantity.toLocaleString()} pcs</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#232938]">
              <button
                onClick={() => setSelectedMatchForSpecs(null)}
                className="px-4 py-2 rounded-lg bg-[#1a2130] hover:bg-[#232938] text-slate-300 text-xs font-medium"
              >
                Close
              </button>
              <Link
                href={`/sourcing?query=Source%20${encodeURIComponent(selectedMatchForSpecs.matching_product_name)}`}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                Create RFQ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Contact Supplier Modal */}
      {contactModalMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#121620] w-full max-w-lg rounded-xl border border-[#283144] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#232938] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Message {contactModalMatch.supplier_name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct inquiry for {contactModalMatch.matching_product_name}
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
                <span className="text-slate-400 block mb-1">Target Component:</span>
                <span className="text-emerald-400 font-semibold">{contactModalMatch.matching_product_name}</span>
                <span className="text-slate-500 block mt-1">
                  Quoted at ${contactModalMatch.unit_price.toFixed(2)} {contactModalMatch.currency} • MOQ {contactModalMatch.moq} pcs • {contactModalMatch.supplier_country}
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Inquiry / Commercial Terms Message</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Hello ${contactModalMatch.supplier_name}, we are interested in your ${contactModalMatch.matching_product_name}. Can you confirm lead times for a batch order of ${contactModalMatch.moq * 5} units delivered to our facility?`}
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
