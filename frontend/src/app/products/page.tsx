"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Globe2,
  Building2,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  Sparkles,
  Info,
  X,
  FileText,
  DollarSign,
  Truck,
  FileSpreadsheet
} from "lucide-react";
import { api, Product, ProductListResponse } from "@/lib/api";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [originCountry, setOriginCountry] = useState(searchParams.get("origin") || "All");
  const [supplierCountry, setSupplierCountry] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [maxMoq, setMaxMoq] = useState<number | undefined>(undefined);
  const [maxLeadTime, setMaxLeadTime] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState("price_asc");

  // Dynamic filter options from API
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);

  // Selected product modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts({
        search: search.trim() || undefined,
        category: category !== "All" ? category : undefined,
        origin_country: originCountry !== "All" ? originCountry : undefined,
        supplier_country: supplierCountry !== "All" ? supplierCountry : undefined,
        max_price: maxPrice < 500 ? maxPrice : undefined,
        max_moq: maxMoq,
        max_lead_time: maxLeadTime,
        sort_by: sortBy,
        size: 24
      });
      setProducts(res.items || []);
      setTotal(res.total || 0);
      if (res.available_categories && res.available_categories.length > 0) {
        setAvailableCategories(res.available_categories);
      }
      if (res.available_countries && res.available_countries.length > 0) {
        setAvailableCountries(res.available_countries);
      }
    } catch (err: any) {
      console.error("Failed to load products:", err);
      setError(err.message || "Failed to load product catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, originCountry, supplierCountry, maxPrice, maxMoq, maxLeadTime, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const getCountryFlag = (country: string) => {
    const map: Record<string, string> = {
      India: "🇮🇳",
      Germany: "🇩🇪",
      China: "🇨🇳",
      Japan: "🇯🇵",
      "United States": "🇺🇸",
      USA: "🇺🇸",
      Taiwan: "🇹🇼"
    };
    return map[country] || "🌐";
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col">
      {/* Top Header & Breadcrumb */}
      <div className="bg-[#11141b] border-b border-[#1f242f] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-emerald-400">Products Marketplace</span>
            </div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#18212e] border border-[#26354a] text-slate-300 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE DATABASE CATALOG • DEMO DATASET</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                Global Industrial Product Catalog
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
                Browse products from verified suppliers across India, Germany, China, Japan, and the United States. Compare indicative prices, origin countries, and MOQs before initiating RFQs.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/sourcing"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" /> Start Custom Sourcing
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Search & Fast-Filter Bar */}
        <div className="p-4 rounded-xl bg-[#11141b] border border-[#1f242f] shadow-xs space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title, alloy grade (SS 304, Al 6061), part number, or material..."
                className="w-full pl-10 pr-4 py-2 bg-[#0b0d11] border border-[#232a38] rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                className="md:hidden px-3.5 py-2 rounded-lg bg-[#181d26] border border-[#262f3f] text-slate-300 text-xs font-medium flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>
            </div>
          </form>

          {/* Filter Pills / Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[#1a1f2b] text-xs">
            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0b0d11] border border-[#212735] rounded text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="All">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Country of Origin Filter */}
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Origin Country</label>
              <select
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0b0d11] border border-[#212735] rounded text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="All">All Countries</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>{getCountryFlag(c)} {c}</option>
                ))}
              </select>
            </div>

            {/* Max MOQ Filter */}
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Max MOQ</label>
              <select
                value={maxMoq || "All"}
                onChange={(e) => setMaxMoq(e.target.value === "All" ? undefined : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#0b0d11] border border-[#212735] rounded text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="All">Any MOQ</option>
                <option value="25">Up to 25 pcs</option>
                <option value="50">Up to 50 pcs</option>
                <option value="100">Up to 100 pcs</option>
                <option value="200">Up to 200 pcs</option>
              </select>
            </div>

            {/* Max Lead Time */}
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Max Lead Time</label>
              <select
                value={maxLeadTime || "All"}
                onChange={(e) => setMaxLeadTime(e.target.value === "All" ? undefined : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-[#0b0d11] border border-[#212735] rounded text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="All">Any Lead Time</option>
                <option value="12">&le; 12 days</option>
                <option value="15">&le; 15 days</option>
                <option value="21">&le; 21 days</option>
                <option value="30">&le; 30 days</option>
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span>MAX PRICE</span>
                <span className="text-emerald-400 font-bold">${maxPrice >= 500 ? "500+" : maxPrice}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-[#1e2533] rounded cursor-pointer"
              />
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0b0d11] border border-[#212735] rounded text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden font-medium"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="lead_time_asc">Lead Time: Fastest</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Showing <span className="text-emerald-400 font-bold">{products.length}</span> of <span className="text-slate-200 font-bold">{total}</span> industrial products
          </div>
          {(category !== "All" || originCountry !== "All" || search || maxPrice < 500) && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setOriginCountry("All");
                setSupplierCountry("All");
                setMaxPrice(500);
                setMaxMoq(undefined);
                setMaxLeadTime(undefined);
              }}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              Clear Filters <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="rounded-xl bg-[#11141b] border border-[#1f242f] p-4 space-y-3 animate-pulse">
                <div className="h-32 bg-[#181d26] rounded-lg" />
                <div className="h-4 bg-[#181d26] rounded w-3/4" />
                <div className="h-3 bg-[#181d26] rounded w-1/2" />
                <div className="h-6 bg-[#181d26] rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-xl bg-red-950/20 border border-red-800/40 text-center space-y-3">
            <p className="text-sm font-semibold text-red-400">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-red-900/40 hover:bg-red-800/50 text-red-200 rounded text-xs font-semibold"
            >
              Retry Loading Catalog
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 rounded-xl bg-[#11141b] border border-[#1f242f] text-center space-y-3">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No matching products found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try broadening your category or origin filter, or submit a custom sourcing requirement to match global suppliers.
            </p>
            <Link
              href="/sourcing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
            >
              Create Sourcing Request <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl bg-[#12151d] border border-[#212735] hover:border-emerald-500/50 hover:bg-[#151924] transition-all flex flex-col justify-between overflow-hidden group shadow-xs"
              >
                {/* Image & Badges */}
                <div className="relative h-40 bg-[#0d0f15] border-b border-[#1b212c] overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Layers className="w-10 h-10" />
                    </div>
                  )}
                  {/* Origin Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-200">
                    <span>{getCountryFlag(product.origin_country)}</span>
                    <span>{product.origin_country}</span>
                  </div>
                  {/* Category Pill */}
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono font-semibold">
                    {product.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {product.name}
                    </h3>
                    {product.part_number && (
                      <span className="text-[10px] font-mono text-slate-500 block">
                        PART: {product.part_number}
                      </span>
                    )}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Supplier & Specs Summary */}
                  <div className="pt-2 border-t border-[#1b212d] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{product.supplier?.name || "Verified Supplier"}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                        {product.supplier?.city ? `${product.supplier.city}` : product.origin_country}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-[#0d0f15] p-2 rounded border border-[#1a1f2b]">
                      <div>
                        <span className="text-slate-500 block">MOQ:</span>
                        <span className="text-slate-200 font-semibold">{product.moq} pcs</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">LEAD TIME:</span>
                        <span className="text-slate-200 font-semibold">{product.lead_time_days} days</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 block">INDICATIVE PRICE</span>
                        <div className="text-base font-extrabold text-emerald-400 font-mono">
                          ${product.unit_price.toFixed(2)} <span className="text-xs text-slate-400">{product.currency}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase bg-[#181d26] px-1.5 py-0.5 rounded border border-[#232a38]">
                        Demo Quote
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-3 bg-[#0f1218] border-t border-[#1a1f2b] grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="py-1.5 px-2 rounded bg-[#181e2b] hover:bg-[#202738] text-slate-200 border border-[#252f42] text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    View Details
                  </button>
                  <Link
                    href={`/sourcing?query=${encodeURIComponent(`Source ${product.moq}x ${product.name} (${product.material || product.category})`)}&qty=${product.moq}&dest=India&supplierId=${product.supplier_id || product.supplier?.id || ""}&supplierName=${encodeURIComponent(product.supplier?.name || "")}`}
                    className="py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-xs"
                  >
                    Request Quote &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#12161f] border border-[#262f3f] rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a202c]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-semibold">
                  {selectedProduct.category}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1c2230] text-slate-300 text-[10px] font-mono">
                  {getCountryFlag(selectedProduct.origin_country)} Origin: {selectedProduct.origin_country}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">{selectedProduct.name}</h2>
              {selectedProduct.part_number && (
                <p className="text-xs font-mono text-slate-400">Catalogue Part Number: {selectedProduct.part_number}</p>
              )}
            </div>

            {/* Price & Primary Details */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0b0d11] border border-[#1e2533]">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Unit Price (Indicative)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  ${selectedProduct.unit_price.toFixed(2)} {selectedProduct.currency}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Min. Order Qty</span>
                <span className="text-lg font-bold text-slate-200 font-mono">{selectedProduct.moq} pcs</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Est. Production Lead</span>
                <span className="text-lg font-bold text-slate-200 font-mono">{selectedProduct.lead_time_days} days</span>
              </div>
            </div>

            {/* Description & Technical Specs */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">Description</h4>
              <p className="text-xs text-slate-400 leading-relaxed bg-[#161a24] p-3 rounded-lg border border-[#212735]">
                {selectedProduct.description}
              </p>
            </div>

            {selectedProduct.specifications && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">Engineering Specifications</h4>
                <div className="text-xs font-mono text-slate-300 bg-[#0b0d11] p-3 rounded-lg border border-[#1e2533] space-y-1">
                  {selectedProduct.specifications.split("|").map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{spec.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplier Information Card */}
            {selectedProduct.supplier && (
              <div className="p-3.5 rounded-xl bg-[#151922] border border-[#222938] space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Supplier & Location</span>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{selectedProduct.supplier.name}</h5>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {selectedProduct.supplier.city}, {selectedProduct.supplier.country}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                    {selectedProduct.supplier.verification_status}
                  </span>
                </div>
              </div>
            )}

            {/* Datasheet Link if uploaded */}
            {selectedProduct.datasheet_url && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs">
                <div className="flex items-center gap-2 text-blue-300">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Technical Datasheet & Certification Document</span>
                </div>
                <a
                  href={selectedProduct.datasheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-semibold"
                >
                  Download Datasheet
                </a>
              </div>
            )}

            {/* Trade & Sourcing Direct Actions */}
            <div className="pt-2 border-t border-[#1e2432] flex flex-col sm:flex-row gap-3">
              <Link
                href={`/trade?origin=${encodeURIComponent(selectedProduct.origin_country)}&desc=${encodeURIComponent(selectedProduct.name)}&val=${selectedProduct.unit_price * selectedProduct.moq}`}
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#181f2c] hover:bg-[#20293a] text-slate-200 border border-[#29354b] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Truck className="w-4 h-4 text-emerald-400" /> Calculate Import Landed Cost & PDF
              </Link>
              <Link
                href={`/sourcing?query=${encodeURIComponent(`Source ${selectedProduct.moq}x ${selectedProduct.name} (${selectedProduct.material || selectedProduct.category})`)}&qty=${selectedProduct.moq}&dest=India&supplierId=${selectedProduct.supplier_id || selectedProduct.supplier?.id || ""}&supplierName=${encodeURIComponent(selectedProduct.supplier?.name || "")}`}
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" /> Issue RFQ to Supplier
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0d11] p-8 text-center text-slate-400">
        Loading Products Marketplace...
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
