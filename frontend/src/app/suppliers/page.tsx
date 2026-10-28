"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Clock,
  Layers,
  Award,
  Star,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  X,
  Phone,
  Mail,
  RefreshCw,
  PlusCircle,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send
} from "lucide-react";
import Link from "next/link";
import { api, Supplier } from "@/lib/api";
import PageGuide from "@/components/PageGuide";
import Tooltip from "@/components/Tooltip";

function SuppliersContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [maxMoq, setMaxMoq] = useState<number | undefined>(undefined);
  const [maxLeadTime, setMaxLeadTime] = useState<number | undefined>(undefined);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Contact / Conversation state
  const [contactSupplierModal, setContactSupplierModal] = useState<Supplier | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactProduct, setContactProduct] = useState("");
  const [contactQty, setContactQty] = useState<number>(500);
  const [contactOffer, setContactOffer] = useState<number | undefined>(undefined);
  const [isSendingContact, setIsSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  const fetchSuppliers = () => {
    setLoading(true);
    setError(null);
    api.getSuppliers({
      search: search.trim() || undefined,
      country: country || undefined,
      category: category || undefined,
      max_moq: maxMoq,
      max_lead_time: maxLeadTime,
      page: 1,
      size: 24
    })
      .then((res) => {
        setSuppliers(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message || "Failed to load suppliers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    try {
      localStorage.setItem("nk_visited_suppliers", "true");
    } catch (e) {
      // Ignore
    }
    fetchSuppliers();
  }, [country, category, maxMoq, maxLeadTime]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSuppliers();
  };

  const handleOpenContact = (supplier: Supplier) => {
    setContactSupplierModal(supplier);
    setContactProduct(supplier.catalog_items[0]?.name || "");
    setContactMessage(`Hello ${supplier.name},\n\nWe are interested in sourcing industrial components matching your manufacturing capabilities. Please share your current production availability and pricing.`);
    setContactQty(supplier.moq || 500);
    setContactOffer(supplier.catalog_items[0]?.unit_price || undefined);
    setContactSuccess(null);
    setContactError(null);
  };

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSupplierModal || !contactMessage.trim()) return;

    setIsSendingContact(true);
    setContactError(null);
    setContactSuccess(null);
    try {
      const res = await api.contactSupplier({
        supplier_id: contactSupplierModal.id,
        product_name: contactProduct || undefined,
        quantity: contactQty,
        initial_price_offer: contactOffer,
        message: contactMessage.trim()
      });
      setContactSuccess(res.message || `Message sent to ${contactSupplierModal.name}. Conversation initialized in Negotiations.`);
    } catch (err: any) {
      setContactError(err.message || "Failed to deliver message to supplier");
    } finally {
      setIsSendingContact(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Industrial Supplier Directory</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              {total} SUPPLIERS STORED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verified manufacturing shops, CNC fabricators, and certified engineering suppliers across India and global hubs.
          </p>
        </div>
        <button
          onClick={fetchSuppliers}
          className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Per-Page Guide Panel */}
      <PageGuide
        routeKey="suppliers"
        steps={[
          "Filter verified suppliers by country, manufacturing process, maximum MOQ, and lead time.",
          "Click any supplier card to inspect verified machinery capabilities, materials, and sample parts.",
          "Select matching suppliers to invite them to your RFQ for competitive quotation bidding."
        ]}
        tip="Combine process category and country filters to find specialized regional manufacturing clusters (e.g. Pune for stamping, Bangalore for CNC)."
        demoNote="Supplier profiles, ratings, and certifications are synthetic demonstration records for student evaluation."
      />

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by supplier name, material, process, city or keywords..."
              className="w-full bg-[#10131a] border border-[#232938] rounded-md pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {/* Country Filter */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="bg-[#10131a] border border-[#232938] rounded px-3 py-1.5 text-slate-300 text-xs"
          >
            <option value="">All Countries</option>
            <option value="India">India</option>
            <option value="Germany">Germany</option>
            <option value="Taiwan">Taiwan</option>
            <option value="China">China</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#10131a] border border-[#232938] rounded px-3 py-1.5 text-slate-300 text-xs"
          >
            <option value="">All Process Categories</option>
            <option value="CNC Machining">CNC Machining</option>
            <option value="Sheet Metal">Sheet Metal & Stamping</option>
            <option value="Castings">Industrial Castings</option>
            <option value="Tooling">High Precision Tooling</option>
            <option value="Die Casting">Die Casting & Extrusion</option>
          </select>

          {/* Max MOQ */}
          <select
            value={maxMoq || ""}
            onChange={(e) => setMaxMoq(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-[#10131a] border border-[#232938] rounded px-3 py-1.5 text-slate-300 text-xs"
          >
            <option value="">Any Minimum Order (MOQ)</option>
            <option value="50">MOQ ≤ 50 units</option>
            <option value="100">MOQ ≤ 100 units</option>
            <option value="200">MOQ ≤ 200 units</option>
          </select>

          {/* Max Lead Time */}
          <select
            value={maxLeadTime || ""}
            onChange={(e) => setMaxLeadTime(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-[#10131a] border border-[#232938] rounded px-3 py-1.5 text-slate-300 text-xs"
          >
            <option value="">Any Lead Time</option>
            <option value="14">Fast turnaround (≤ 14 days)</option>
            <option value="21">Standard (≤ 21 days)</option>
            <option value="30">Extended (≤ 30 days)</option>
          </select>
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-[#141821] rounded-lg border border-[#212735] animate-pulse" />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-slate-300">No matching suppliers found</h3>
            <p className="text-xs text-slate-500 mt-1">Try relaxing filters or search terms.</p>
          </div>
          <button
            onClick={() => {
              setSearch("");
              setCountry("");
              setCategory("");
              setMaxMoq(undefined);
              setMaxLeadTime(undefined);
            }}
            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="p-4 rounded-lg bg-[#141821] border border-[#212735] hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Name, Country, Rating */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {supplier.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{supplier.city}, {supplier.country}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1b2230] border border-[#273145] text-amber-300 text-[11px] font-mono">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{supplier.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {supplier.description || "Industrial manufacturer & precision component fabricator."}
                </p>

                {/* Badges / Capabilities */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {supplier.capabilities.slice(0, 2).map((cap) => (
                    <span
                      key={cap.id}
                      className="px-2 py-0.5 rounded bg-[#10141c] text-slate-300 border border-[#232938] text-[10px] font-mono"
                    >
                      {cap.category}
                    </span>
                  ))}
                  {supplier.capabilities.length > 2 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                      +{supplier.capabilities.length - 2} more
                    </span>
                  )}
                </div>

                {/* Metrics: MOQ, Lead Time, Price */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-[#1e2330] text-[11px] font-mono text-slate-400 my-2">
                  <div>
                    <span className="flex items-center gap-1 text-[9px] text-slate-500 uppercase">
                      <span>MOQ</span>
                      <Tooltip content="Minimum Order Quantity required to initiate a production batch." title="MOQ" />
                    </span>
                    <span className="text-slate-200 font-bold">{supplier.moq} pcs</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">Lead Time</span>
                    <span className="text-slate-200 font-bold">{supplier.lead_time_days} days</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">Pricing</span>
                    <span className="text-emerald-400 font-bold">{supplier.price_rating}</span>
                  </div>
                </div>
              </div>

              {/* Footer: Status Label & Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-[#1b202c]">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {supplier.verification_status || "VERIFIED"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenContact(supplier)}
                    className="px-2.5 py-1 text-xs text-slate-200 hover:text-white bg-[#182333] hover:bg-[#22334a] rounded border border-[#2b3b55] flex items-center gap-1 font-medium transition-colors"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-400" /> Contact
                  </button>
                  <button
                    onClick={() => setSelectedSupplier(supplier)}
                    className="px-2.5 py-1 text-xs text-slate-300 hover:text-emerald-400 flex items-center gap-1 font-medium transition-colors"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#141822] border border-[#273042] rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-start justify-between pb-3 border-b border-[#212735]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100">{selectedSupplier.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold">
                    {selectedSupplier.verification_status || "VERIFIED"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.country}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verified Profile Notice */}
            <div className="p-2.5 rounded bg-[#101924] border border-emerald-900/40 text-xs text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Verified Manufacturing Supplier. Operating credentials, production capacities, and compliance documents are on file.
              </span>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">Overview</h4>
              <p className="text-xs text-slate-400">{selectedSupplier.description}</p>
            </div>

            {/* Manufacturing Capabilities */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">Processes & Materials</h4>
              <div className="space-y-2">
                {selectedSupplier.capabilities.map((cap) => (
                  <div key={cap.id} className="p-2.5 rounded bg-[#10131a] border border-[#212735] text-xs">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{cap.category}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">{cap.certifications}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Processes: {cap.process_type}</p>
                    {cap.materials && <p className="text-[11px] text-slate-500">Materials: {cap.materials}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Catalog Items */}
            {selectedSupplier.catalog_items.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">Catalog Parts Available</h4>
                <div className="space-y-1.5">
                  {selectedSupplier.catalog_items.map((item) => (
                    <div key={item.id} className="p-2 rounded bg-[#10131a] border border-[#1f2533] flex justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-200">{item.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">Part #{item.part_number}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">${item.unit_price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Details & Direct Actions */}
            <div className="pt-3 border-t border-[#212735] flex items-center justify-between text-xs text-slate-400">
              <div className="space-y-1">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {selectedSupplier.contact_email}
                </p>
                {selectedSupplier.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {selectedSupplier.phone}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const supp = selectedSupplier;
                    setSelectedSupplier(null);
                    handleOpenContact(supp);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Start Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Supplier / Start Conversation Modal */}
      {contactSupplierModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSendContact}
            className="bg-[#121620] border border-[#273042] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#212735]">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Contact {contactSupplierModal.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send a direct sourcing inquiry or message. This conversation is persisted and accessible in Negotiations Hub.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setContactSupplierModal(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {contactSuccess ? (
              <div className="py-4 space-y-3">
                <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{contactSuccess}</span>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setContactSupplierModal(null)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#181d28] text-slate-300 text-xs font-medium"
                  >
                    Done
                  </button>
                  <Link
                    href="/negotiations"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    Open Negotiations Hub <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {contactError && (
                  <div className="p-3 rounded bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{contactError}</span>
                  </div>
                )}

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Product / Component of Interest</label>
                  <input
                    type="text"
                    placeholder="e.g. Stainless Steel Bushings"
                    value={contactProduct}
                    onChange={(e) => setContactProduct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0f16] border border-[#212735] text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Target Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={contactQty}
                      onChange={(e) => setContactQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0c0f16] border border-[#212735] text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Initial Target Price ($/unit, opt.)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={contactOffer || ""}
                      onChange={(e) => setContactOffer(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 rounded-lg bg-[#0c0f16] border border-[#212735] text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Message to Supplier *</label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0c0f16] border border-[#212735] text-slate-200 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end items-center gap-2 pt-3 border-t border-[#212735]">
                  <button
                    type="button"
                    onClick={() => setContactSupplierModal(null)}
                    className="px-4 py-2 rounded-lg bg-[#181d28] hover:bg-[#202737] text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingContact || !contactMessage.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    {isSendingContact ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Send Message
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading supplier directory...</div>}>
      <SuppliersContent />
    </Suspense>
  );
}
