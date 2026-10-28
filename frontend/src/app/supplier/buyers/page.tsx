"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  Send,
  ShieldCheck,
  Globe,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X
} from "lucide-react";
import { api, DiscoverBuyerItem, Product } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function DiscoverBuyersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [buyers, setBuyers] = useState<DiscoverBuyerItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("ALL");
  const [industryFilter, setIndustryFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");

  // Contact Buyer Modal
  const [selectedBuyerForContact, setSelectedBuyerForContact] = useState<DiscoverBuyerItem | null>(null);
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<number | undefined>(undefined);
  const [selectedRfqId, setSelectedRfqId] = useState<number | undefined>(undefined);
  const [subject, setSubject] = useState("");
  const [pitchMessage, setPitchMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);

  const fetchBuyersAndCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [buyersRes, catalogRes] = await Promise.all([
        api.getDiscoverBuyers({
          search: searchTerm || undefined,
          country: countryFilter !== "ALL" ? countryFilter : undefined,
          industry: industryFilter !== "ALL" ? industryFilter : undefined,
          activity_level: activityFilter !== "ALL" ? activityFilter : undefined
        }),
        api.getSupplierProducts().catch(() => [])
      ]);
      setBuyers(buyersRes);
      setCatalogItems(catalogRes as Product[]);
    } catch (err: any) {
      setError(err.message || "Failed to load buyer discovery directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchBuyersAndCatalog();
  }, [isAuthenticated, authLoading, countryFilter, industryFilter, activityFilter, router]);

  // Debounced search trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBuyersAndCatalog();
  };

  const handleOpenContactModal = (buyer: DiscoverBuyerItem) => {
    setSelectedBuyerForContact(buyer);
    setSubject(`Introduction from ${user?.company_name || "Specialized Manufacturer"}: Precision Sourcing Capabilities`);
    setPitchMessage(
      `Hello ${buyer.contact_name},\n\nWe reviewed ${buyer.company_name}'s recent sourcing requirements in ${buyer.categories_of_interest.slice(0, 2).join(", ")}. We operate specialized ISO-certified manufacturing lines with direct export logistics to ${buyer.country}.\n\nWe would welcome the opportunity to submit a commercial proposal on your next procurement cycle.`
    );
    setSelectedCatalogItemId(catalogItems.length > 0 ? catalogItems[0].id : undefined);
    setSelectedRfqId(buyer.recent_rfqs.length > 0 ? buyer.recent_rfqs[0].id : undefined);
  };

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuyerForContact || !pitchMessage.trim()) return;

    setSendingContact(true);
    setError(null);
    try {
      const res = await api.contactBuyer({
        buyer_id: selectedBuyerForContact.id,
        catalog_item_id: selectedCatalogItemId,
        rfq_id: selectedRfqId,
        subject: subject.trim(),
        message: pitchMessage.trim()
      });
      setSuccess(`Direct pitch successfully transmitted to ${selectedBuyerForContact.company_name}! High-priority notification generated.`);
      setSelectedBuyerForContact(null);
    } catch (err: any) {
      setError(err.message || "Failed to contact buyer");
    } finally {
      setSendingContact(false);
    }
  };

  // Derive unique countries and industries for dropdowns
  const availableCountries = useMemo(() => {
    return Array.from(new Set(buyers.map((b) => b.country).filter(Boolean)));
  }, [buyers]);

  const availableIndustries = useMemo(() => {
    return Array.from(new Set(buyers.map((b) => b.industry).filter(Boolean)));
  }, [buyers]);

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
        badge="PROACTIVE BUYER DISCOVERY"
        title="Discover & Contact Enterprise Buyers"
        description="Explore verified procurement divisions and global manufacturing buyers registered on Namade Kadda. Review public sourcing activity categories and initiate direct business conversations."
        tip="Referencing an open buyer RFQ or featuring a specific catalog component increases response rates by over 40%."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Discover Buyers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global enterprise buyers seeking industrial components, machining capacity, and statutory compliance.
          </p>
        </div>

        <button
          onClick={fetchBuyersAndCatalog}
          className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
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

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by company name, contact, or industry keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0e1117] border border-[#202636] rounded text-xs text-slate-100 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1e2432] text-xs">
          {/* Country */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Country Corridor</label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Industry Sector</label>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 truncate"
            >
              <option value="ALL">All Industries</option>
              {availableIndustries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Activity Level */}
          <div>
            <label className="text-[10px] text-slate-400 font-mono block mb-1">Sourcing Activity</label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#0e1117] border border-[#202636] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Buyers</option>
              <option value="ACTIVE_RFQS">Active Open RFQs</option>
              <option value="HIGH_VOLUME">High Volume Sourcing (2+ Projects)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2 bg-[#141821] rounded-xl border border-[#212735]">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Loading buyer directory...</span>
          </div>
        ) : buyers.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-[#141821] rounded-xl border border-[#212735]">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No buyer companies found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No registered enterprise buyers matched your criteria. Try loosening your country or industry filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buyers.map((buyer) => (
              <div
                key={buyer.id}
                className="p-5 rounded-xl bg-[#141821] border border-[#212735] hover:border-[#2f394d] transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  {/* Top identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-950 border border-blue-800/60 flex items-center justify-center text-blue-300 font-mono font-bold text-sm shrink-0">
                        {buyer.company_name.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-100 text-sm">{buyer.company_name}</h3>
                          {buyer.is_verified && (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[9px] font-bold">
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{buyer.city ? `${buyer.city}, ` : ""}{buyer.country}</span>
                          <span className="text-slate-600">·</span>
                          <span>Member since {buyer.member_since}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Industry & Metrics */}
                  <div className="p-3 rounded-lg bg-[#0e1117] border border-[#1e2432] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">Industry Sector:</span>
                      <strong className="text-slate-200">{buyer.industry}</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1a202c] font-mono text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Sourcing Requests</span>
                        <span className="font-bold text-slate-200">{buyer.total_sourcing_requests} Projects</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Active RFQs</span>
                        <span className="font-bold text-emerald-400">{buyer.active_rfqs_count} Open</span>
                      </div>
                    </div>
                  </div>

                  {/* Categories of Interest */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Categories of Interest</span>
                    <div className="flex flex-wrap gap-1.5">
                      {buyer.categories_of_interest.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded bg-[#1c2331] text-slate-300 text-[11px] font-mono border border-[#2a3447]"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recent Public RFQs if any */}
                  {buyer.recent_rfqs && buyer.recent_rfqs.length > 0 && (
                    <div className="space-y-1 text-xs pt-1">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">Recent Sourcing Opportunities</span>
                      <div className="space-y-1">
                        {buyer.recent_rfqs.map((rfq) => (
                          <div
                            key={rfq.id}
                            className="p-2 rounded bg-[#0b0e14] border border-[#1a202c] flex items-center justify-between text-[11px]"
                          >
                            <span className="font-medium text-slate-300 truncate max-w-[200px]">{rfq.title}</span>
                            <span className="font-mono text-emerald-400 text-[10px] font-semibold">{rfq.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-[#1e2432] flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] font-mono">
                    Procurement: {buyer.contact_name}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenContactModal(buyer)}
                    className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Buyer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message / Pitch Buyer Modal */}
      {selectedBuyerForContact && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b3b]">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Initiate Inquiry with {selectedBuyerForContact.company_name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Attn: {selectedBuyerForContact.contact_name} · {selectedBuyerForContact.country}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBuyerForContact(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendContact} className="space-y-3.5 text-xs">
              {/* Optional Featured Catalog Product */}
              {catalogItems.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Feature Component from Your Catalog (Optional)
                  </label>
                  <select
                    value={selectedCatalogItemId || ""}
                    onChange={(e) => setSelectedCatalogItemId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None (General Corporate Introduction)</option>
                    {catalogItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (${item.unit_price}/unit · MOQ {item.moq})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional Reference RFQ */}
              {selectedBuyerForContact.recent_rfqs.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Reference Buyer's Active RFQ (Optional)
                  </label>
                  <select
                    value={selectedRfqId || ""}
                    onChange={(e) => setSelectedRfqId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">No RFQ Reference</option>
                    {selectedBuyerForContact.recent_rfqs.map((rfq) => (
                      <option key={rfq.id} value={rfq.id}>
                        {rfq.rfq_code}: {rfq.title} ({rfq.quantity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Message Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Introductory Message / Pitch</label>
                <textarea
                  rows={5}
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  Transmitting this message creates an authorized communication thread and generates an in-app notification for the buyer procurement lead.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232b3b]">
                <button
                  type="button"
                  onClick={() => setSelectedBuyerForContact(null)}
                  className="px-3 py-1.5 rounded bg-[#181e2b] text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingContact || !pitchMessage.trim()}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingContact ? "Transmitting..." : "Send Introduction"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
