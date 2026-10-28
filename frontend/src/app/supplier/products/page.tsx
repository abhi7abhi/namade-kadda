"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  Edit,
  Eye,
  Archive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Clock,
  Layers,
  Globe2,
  Trash2,
  FileCheck,
  Upload,
  FileText,
  Truck,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  FileDown
} from "lucide-react";
import { api, Product, SupplierProductListResponse } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function SupplierProductsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status metrics
  const [statusesCount, setStatusesCount] = useState<Record<string, number>>({
    ALL: 0,
    PUBLISHED: 0,
    DRAFT: 0,
    UNPUBLISHED: 0,
    ARCHIVED: 0
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedStockStatus, setSelectedStockStatus] = useState("ALL");

  // Modals State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const initialFormData = {
    name: "",
    sku: "",
    part_number: "",
    category: "CNC Machining",
    subcategory: "Flanges & Couplings",
    description: "",
    unit_price: 24.5,
    currency: "USD",
    moq: 50,
    unit_of_measurement: "pieces",
    lead_time_days: 14,
    production_capacity: "15,000 units / month",
    material: "Stainless Steel 304",
    material_grade: "SS 304 / DIN 1.4301",
    dimensions: "120 x 80 x 25 mm",
    weight: "0.85 kg",
    manufacturing_process: "5-Axis CNC Milling",
    technical_specifications: JSON.stringify(
      {
        "Tolerance": "±0.02 mm (ISO 2768-m)",
        "Surface Roughness": "Ra 0.8 µm",
        "Heat Treatment": "Solution Annealed",
        "Hardness": "180 HB"
      },
      null,
      2
    ),
    origin_country: "India",
    stock_status: "IN_STOCK",
    available_quantity: 2500,
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    datasheet_url: "",
    manufacturing_capability: "Precision CNC Milling",
    customization_options: "Laser engraved serialization, custom thread pitch, passivation",
    certifications: "ISO 9001:2015, IATF 16949, Mill Test Certificate 3.1",
    shipping_options: "Air Cargo, Ocean Freight, Express Courier",
    supported_destinations: "Global, United States, Germany, India, UAE, Japan",
    status: "PUBLISHED"
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierProducts({
        search: searchTerm.trim() || undefined,
        category: selectedCategory !== "ALL" ? selectedCategory : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        stock_status: selectedStockStatus !== "ALL" ? selectedStockStatus : undefined,
        page,
        size: pageSize
      });

      if (res && res.items) {
        setProducts(res.items);
        setTotal(res.total);
        setTotalPages(res.pages || 1);
        if (res.statuses_count) setStatusesCount(res.statuses_count);
        if (res.categories && res.categories.length > 0) setAvailableCategories(res.categories);
      } else if (Array.isArray(res)) {
        setProducts(res);
        setTotal(res.length);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load supplier product catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchProducts();
  }, [isAuthenticated, authLoading, searchTerm, selectedCategory, selectedStatus, selectedStockStatus, page, pageSize]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormErrors({});
    const randomCode = Date.now().toString().slice(-6);
    setFormData({
      ...initialFormData,
      name: "",
      sku: `SKU-${randomCode}`,
      part_number: `PN-${randomCode}`
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormErrors({});
    setFormData({
      name: p.name,
      sku: p.sku || p.part_number || `SKU-${p.id}`,
      part_number: p.part_number || p.sku || "",
      category: p.category || "CNC Machining",
      subcategory: p.subcategory || "",
      description: p.description || "",
      unit_price: p.unit_price,
      currency: p.currency || "USD",
      moq: p.moq || 50,
      unit_of_measurement: p.unit_of_measurement || "pieces",
      lead_time_days: p.lead_time_days || 14,
      production_capacity: p.production_capacity || "10,000 units / month",
      material: p.material || "",
      material_grade: p.material_grade || p.material || "",
      dimensions: p.dimensions || "",
      weight: p.weight || "",
      manufacturing_process: p.manufacturing_process || p.manufacturing_capability || "",
      technical_specifications: p.technical_specifications || p.specifications || "",
      origin_country: p.origin_country || "India",
      stock_status: p.stock_status || (p.in_stock ? "IN_STOCK" : "OUT_OF_STOCK"),
      available_quantity: p.available_quantity || 0,
      image_url: p.image_url || "",
      datasheet_url: p.datasheet_url || "",
      manufacturing_capability: p.manufacturing_capability || p.category,
      customization_options: p.customization_options || "",
      certifications: p.certifications || "ISO 9001:2015",
      shipping_options: p.shipping_options || "Air Cargo, Ocean Freight",
      supported_destinations: p.supported_destinations || "Global, United States, Germany, India, UAE, Japan",
      status: p.status || "PUBLISHED"
    });
    setShowFormModal(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Product name is required.";
    if (!formData.category.trim()) errs.category = "Category is required.";
    if (formData.unit_price <= 0) errs.unit_price = "Unit price must be greater than 0.";
    if (formData.moq < 1) errs.moq = "Minimum order quantity must be at least 1.";
    if (formData.lead_time_days < 1) errs.lead_time_days = "Production lead time must be at least 1 day.";
    if (formData.available_quantity < 0) errs.available_quantity = "Available quantity cannot be negative.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (submitStatus?: "DRAFT" | "PUBLISHED") => {
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      ...formData,
      status: submitStatus || formData.status
    };

    try {
      if (editingProduct) {
        await api.updateSupplierProduct(editingProduct.id, payload);
        setSuccess(`Product listing "${payload.name}" updated successfully.`);
      } else {
        await api.createSupplierProduct(payload);
        setSuccess(
          payload.status === "PUBLISHED"
            ? `Product "${payload.name}" published to the live marketplace.`
            : `Draft product "${payload.name}" saved successfully.`
        );
      }
      setShowFormModal(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to save product listing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product, newStatus: string) => {
    try {
      if (newStatus === "PUBLISHED") {
        await api.publishSupplierProduct(product.id);
        setSuccess(`Product "${product.name}" published to global marketplace.`);
      } else if (newStatus === "UNPUBLISHED") {
        await api.unpublishSupplierProduct(product.id);
        setSuccess(`Product "${product.name}" paused.`);
      } else if (newStatus === "ARCHIVED") {
        await api.archiveSupplierProduct(product.id);
        setSuccess(`Product "${product.name}" archived.`);
      }
      fetchProducts();
    } catch (err: any) {
      setError(err.message || `Failed to update status to ${newStatus}`);
    }
  };

  const handleArchive = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to archive product "${name}"?`)) return;
    try {
      await api.deleteSupplierProduct(id);
      setSuccess(`Product "${name}" has been archived.`);
      fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to archive product");
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setUploadingImage(true);
    try {
      const res = await api.uploadSupplierProductFile(file);
      setFormData((prev) => ({ ...prev, image_url: res.url }));
      setSuccess("Product image uploaded successfully.");
    } catch (err: any) {
      alert(err.message || "Image upload failed");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await api.uploadSupplierProductFile(file);
      setFormData((prev) => ({ ...prev, datasheet_url: res.url }));
      setSuccess("Technical datasheet uploaded successfully.");
    } catch (err: any) {
      alert(err.message || "Document upload failed");
    } finally {
      setUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageGuide
        badge="PRODUCT MANAGEMENT"
        title="Industrial Product Catalog & Inventory Governance"
        description="Publish your manufactured components directly into the shared global marketplace. Published items are instantly discoverable by verified enterprise buyers, AI Procurement Council, and algorithmic partner matching."
        tip="Ensure technical specifications, tolerance standards, and unit pricing are filled accurately to improve buyer RFQ conversion rates."
      />

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 tracking-tight">
              <Package className="w-6 h-6 text-emerald-400" />
              <span>Product Management</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono rounded bg-[#162130] text-emerald-400 border border-emerald-800/50 font-bold">
              {total} TOTAL ITEMS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your industrial catalog, adjust volume pricing, upload certified datasheets, and govern publication status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/products"
            className="px-3.5 py-2 rounded bg-[#171d27] hover:bg-[#202735] text-slate-200 border border-[#242c3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Buyer Storefront</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Status Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "All Items", key: "ALL", count: statusesCount.ALL || total, color: "border-slate-800 text-slate-300" },
          { label: "Published", key: "PUBLISHED", count: statusesCount.PUBLISHED || 0, color: "border-emerald-800/60 text-emerald-400" },
          { label: "Drafts", key: "DRAFT", count: statusesCount.DRAFT || 0, color: "border-blue-800/60 text-blue-400" },
          { label: "Unpublished", key: "UNPUBLISHED", count: statusesCount.UNPUBLISHED || 0, color: "border-amber-800/60 text-amber-400" },
          { label: "Archived", key: "ARCHIVED", count: statusesCount.ARCHIVED || 0, color: "border-slate-700/60 text-slate-400" }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setSelectedStatus(tab.key);
              setPage(1);
            }}
            className={`p-3 rounded-xl bg-[#141821] border transition-all text-left flex flex-col justify-between ${
              selectedStatus === tab.key ? `${tab.color} bg-[#19202c]` : "border-[#212735] hover:border-[#2d3548]"
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">{tab.label}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-slate-100">{tab.count}</span>
              {selectedStatus === tab.key && <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#141821] border border-[#212735] flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product name, SKU, part code, material, or specifications..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-[#0e1117] border border-[#202636] rounded-md text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-[#0e1117] border border-[#202636] rounded-md text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            <option value="CNC Machining">CNC Machining</option>
            <option value="Sheet Metal">Sheet Metal & Stamping</option>
            <option value="Machinery Components">Machinery Components</option>
            <option value="Hardware & Fasteners">Hardware & Fasteners</option>
            <option value="Industrial Castings">Industrial Castings</option>
            <option value="Hydraulics & Fluid Power">Hydraulics & Fluid Power</option>
            <option value="Electronics & Sensors">Electronics & Sensors</option>
            <option value="Die Casting">Die Casting & Extrusion</option>
            <option value="Raw Materials">Raw Materials</option>
          </select>

          {/* Availability Status Filter */}
          <select
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-[#0e1117] border border-[#202636] rounded-md text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="MADE_TO_ORDER">Made to Order</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          <button
            type="button"
            onClick={fetchProducts}
            className="p-2 rounded-md bg-[#0e1117] hover:bg-[#1a202c] border border-[#202636] text-slate-300"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-xl bg-[#141821] border border-[#212735] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs font-mono">Loading product inventory...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No product listings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== "ALL" || selectedStatus !== "ALL"
                ? "No products matched your active filters. Try resetting search filters."
                : "Get started by adding your first manufactured component to receive incoming buyer RFQs."}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-xs"
            >
              Add First Product Listing
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0e1117] text-slate-400 font-mono text-[10px] uppercase border-b border-[#212735]">
                <tr>
                  <th className="p-3.5">Product & Specs</th>
                  <th className="p-3.5">Category & Process</th>
                  <th className="p-3.5 text-right">Unit Price</th>
                  <th className="p-3.5 text-center">MOQ</th>
                  <th className="p-3.5 text-center">Lead Time</th>
                  <th className="p-3.5 text-center">Availability</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2432] text-slate-300">
                {products.map((p) => {
                  const status = p.status || "PUBLISHED";
                  const stockStatus = p.stock_status || (p.in_stock ? "IN_STOCK" : "OUT_OF_STOCK");

                  return (
                    <tr key={p.id} className="hover:bg-[#161a24] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover border border-[#242d3d] shrink-0 bg-[#0e1117]"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-100 block truncate max-w-xs text-sm">
                              {p.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                                {p.sku || p.part_number || `SKU-${p.id}`}
                              </span>
                              {p.subcategory && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  • {p.subcategory}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                              {p.material_grade || p.material || "Industrial Grade Alloy"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-[#1a212d] text-slate-300 font-mono text-[10px] border border-[#252f40] block w-fit">
                            {p.category}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {p.manufacturing_process || p.manufacturing_capability || "Custom Machining"}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        <span className="font-bold text-slate-100 text-sm">
                          ${p.unit_price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {p.currency} / {p.unit_of_measurement || "pc"}
                        </span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="text-slate-200 font-semibold">{p.moq}</span>
                        <span className="text-[10px] text-slate-500 block">{p.unit_of_measurement || "pcs"}</span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className="text-slate-200 font-semibold">{p.lead_time_days}</span>
                        <span className="text-[10px] text-slate-500 block">days</span>
                      </td>

                      <td className="p-3.5 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stockStatus === "IN_STOCK"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                            : stockStatus === "MADE_TO_ORDER"
                            ? "bg-blue-950/80 text-blue-300 border border-blue-800/50"
                            : "bg-red-950/80 text-red-400 border border-red-800/50"
                        }`}>
                          {stockStatus === "IN_STOCK" ? "In Stock" : stockStatus === "MADE_TO_ORDER" ? "Made to Order" : "Out of Stock"}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {p.available_quantity.toLocaleString()} {p.unit_of_measurement || "units"}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          status === "PUBLISHED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : status === "DRAFT"
                            ? "bg-blue-950 text-blue-300 border border-blue-800"
                            : status === "UNPUBLISHED"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-900 text-slate-400 border border-slate-800"
                        }`}>
                          {status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-md bg-[#181e2b] hover:bg-[#202738] text-slate-300 hover:text-white transition-colors"
                            title="View Full Product Specifications"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-md bg-[#181e2b] hover:bg-[#202738] text-slate-300 hover:text-white transition-colors"
                            title="Edit Product Listing"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {status === "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p, "UNPUBLISHED")}
                              className="px-2 py-1 rounded-md bg-[#181e2b] hover:bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-900/40 transition-colors"
                              title="Pause listing visibility"
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(p, "PUBLISHED")}
                              className="px-2 py-1 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-400 text-[10px] font-mono border border-emerald-800/50 transition-colors"
                              title="Publish listing live to marketplace"
                            >
                              Publish
                            </button>
                          )}

                          {status !== "ARCHIVED" && (
                            <button
                              type="button"
                              onClick={() => handleArchive(p.id, p.name)}
                              className="p-1.5 rounded-md bg-[#181e2b] hover:bg-red-950 text-slate-400 hover:text-red-300 transition-colors"
                              title="Archive listing"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {products.length > 0 && (
          <div className="p-4 bg-[#0e1117] border-t border-[#212735] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div>
              Showing {Math.min((page - 1) * pageSize + 1, total)} to{" "}
              {Math.min(page * pageSize, total)} of {total} products
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded bg-[#161a24] hover:bg-[#202738] disabled:opacity-40 disabled:hover:bg-[#161a24] border border-[#252e3f] text-slate-200 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="px-2 font-bold text-slate-200">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 rounded bg-[#161a24] hover:bg-[#202738] disabled:opacity-40 disabled:hover:bg-[#161a24] border border-[#252e3f] text-slate-200 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={handleDocFileChange}
        accept=".pdf,.doc,.docx,application/pdf"
        className="hidden"
      />

      {/* View Product Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141822] border border-[#232b3b] rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setViewingProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a202c]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <img
                src={viewingProduct.image_url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"}
                alt={viewingProduct.name}
                className="w-full sm:w-48 h-48 rounded-xl object-cover border border-[#283244] shrink-0 bg-[#0e1117]"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {viewingProduct.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1a2230] text-slate-300 border border-[#273245]">
                    {viewingProduct.status || "PUBLISHED"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100">{viewingProduct.name}</h2>
                <p className="text-xs text-slate-400 font-mono">
                  SKU: {viewingProduct.sku || viewingProduct.part_number || "N/A"} • Origin: {viewingProduct.origin_country}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {viewingProduct.description || "Precision engineered industrial component fabricated for enterprise manufacturing applications."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-[#0e1117] border border-[#212735] text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Unit Price</span>
                <span className="text-sm font-bold text-emerald-400">
                  ${viewingProduct.unit_price.toFixed(2)} {viewingProduct.currency}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Min Order (MOQ)</span>
                <span className="text-sm font-bold text-slate-200">
                  {viewingProduct.moq} {viewingProduct.unit_of_measurement || "pcs"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Lead Time</span>
                <span className="text-sm font-bold text-slate-200">
                  {viewingProduct.lead_time_days} days
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Availability</span>
                <span className="text-sm font-bold text-slate-200">
                  {viewingProduct.stock_status || (viewingProduct.in_stock ? "In Stock" : "Made to Order")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#212735] space-y-2">
                <h4 className="text-[11px] font-bold text-slate-200 uppercase font-mono tracking-wider">
                  Material & Manufacturing
                </h4>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p><strong className="text-slate-400 font-normal">Material:</strong> {viewingProduct.material_grade || viewingProduct.material || "Stainless Steel 304"}</p>
                  <p><strong className="text-slate-400 font-normal">Process:</strong> {viewingProduct.manufacturing_process || viewingProduct.manufacturing_capability || "5-Axis CNC Milling"}</p>
                  <p><strong className="text-slate-400 font-normal">Dimensions:</strong> {viewingProduct.dimensions || "Standard Metric"}</p>
                  <p><strong className="text-slate-400 font-normal">Weight:</strong> {viewingProduct.weight || "N/A"}</p>
                  <p><strong className="text-slate-400 font-normal">Supply Capacity:</strong> {viewingProduct.production_capacity || "10,000 units/mo"}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#212735] space-y-2">
                <h4 className="text-[11px] font-bold text-slate-200 uppercase font-mono tracking-wider">
                  Logistics & Compliance
                </h4>
                <div className="space-y-1 text-slate-300 text-[11px]">
                  <p><strong className="text-slate-400 font-normal">Certifications:</strong> {viewingProduct.certifications || "ISO 9001:2015"}</p>
                  <p><strong className="text-slate-400 font-normal">Shipping:</strong> {viewingProduct.shipping_options || "Air Cargo, Ocean Freight"}</p>
                  <p><strong className="text-slate-400 font-normal">Destinations:</strong> {viewingProduct.supported_destinations || "Global"}</p>
                  <p><strong className="text-slate-400 font-normal">Customization:</strong> {viewingProduct.customization_options || "Available on request"}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications Block */}
            {viewingProduct.technical_specifications && (
              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#212735] space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-200 uppercase font-mono tracking-wider">
                  Technical Specifications & Tolerances
                </h4>
                <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed bg-[#0a0d12] p-2.5 rounded border border-[#1b2230]">
                  {viewingProduct.technical_specifications}
                </pre>
              </div>
            )}

            {/* Datasheet Link */}
            {viewingProduct.datasheet_url && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs">
                <div className="flex items-center gap-2 text-blue-300">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Technical Datasheet Document Available</span>
                </div>
                <a
                  href={viewingProduct.datasheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-blue-900/50 hover:bg-blue-800 text-blue-200 font-semibold flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-[#232b3b]">
              <Link
                href={`/products?search=${encodeURIComponent(viewingProduct.name)}`}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
              >
                View on Public Storefront <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    handleOpenEditModal(p);
                  }}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Edit Product
                </button>
                <button
                  type="button"
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-1.5 rounded-md bg-[#181e2b] text-slate-300 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141822] border border-[#232b3b] rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#232b3b]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingProduct ? `Edit Product: ${editingProduct.name}` : "Add New Manufacturing Product"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4 text-xs"
            >
              {/* SECTION 1: Product Identifiers */}
              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#202636] space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  1. Identification & Nomenclature
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">
                      Product Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. 5-Axis CNC Machined Stainless Steel Flange"
                      className={`w-full px-3 py-2 bg-[#121620] border rounded text-slate-100 font-medium focus:outline-none ${
                        formErrors.name ? "border-red-500" : "border-[#222938] focus:border-emerald-500"
                      }`}
                    />
                    {formErrors.name && <p className="text-[10px] text-red-400 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">SKU / Product Code</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value, part_number: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="CNC Machining">CNC Machining</option>
                      <option value="Sheet Metal">Sheet Metal & Stamping</option>
                      <option value="Machinery Components">Machinery Components</option>
                      <option value="Hardware & Fasteners">Hardware & Fasteners</option>
                      <option value="Industrial Castings">Industrial Castings</option>
                      <option value="Hydraulics & Fluid Power">Hydraulics & Fluid Power</option>
                      <option value="Electronics & Sensors">Electronics & Sensors</option>
                      <option value="Die Casting">Die Casting & Extrusion</option>
                      <option value="Raw Materials">Raw Materials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Subcategory</label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="e.g. Flanges, Bushings, Housings"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Manufacturing Country</label>
                    <input
                      type="text"
                      value={formData.origin_country}
                      onChange={(e) => setFormData({ ...formData, origin_country: e.target.value })}
                      placeholder="e.g. India, Germany, Taiwan"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Pricing, MOQ, Capacity & Availability */}
              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#202636] space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  2. Commercial Terms, MOQ & Availability
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Unit Price <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.unit_price}
                      onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Min Order Quantity (MOQ) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.moq}
                      onChange={(e) => setFormData({ ...formData, moq: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Unit of Measure</label>
                    <select
                      value={formData.unit_of_measurement}
                      onChange={(e) => setFormData({ ...formData, unit_of_measurement: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="pieces">pieces (pcs)</option>
                      <option value="sets">sets</option>
                      <option value="kg">kg</option>
                      <option value="meters">meters</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Lead Time (Days) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.lead_time_days}
                      onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Availability Status</label>
                    <select
                      value={formData.stock_status}
                      onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="IN_STOCK">In Stock</option>
                      <option value="MADE_TO_ORDER">Made to Order</option>
                      <option value="OUT_OF_STOCK">Out of Stock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Current Stock / Batch</label>
                    <input
                      type="number"
                      value={formData.available_quantity}
                      onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Monthly Capacity</label>
                    <input
                      type="text"
                      value={formData.production_capacity}
                      onChange={(e) => setFormData({ ...formData, production_capacity: e.target.value })}
                      placeholder="e.g. 20,000 units / mo"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Engineering Specs, Material, Tolerances */}
              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#202636] space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  3. Technical Specifications & Materials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Material & Grade</label>
                    <input
                      type="text"
                      value={formData.material_grade}
                      onChange={(e) => setFormData({ ...formData, material_grade: e.target.value, material: e.target.value })}
                      placeholder="e.g. Stainless Steel 316L"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Manufacturing Process</label>
                    <input
                      type="text"
                      value={formData.manufacturing_process}
                      onChange={(e) => setFormData({ ...formData, manufacturing_process: e.target.value, manufacturing_capability: e.target.value })}
                      placeholder="e.g. 5-Axis CNC Milling, Laser Cutting"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Dimensions (L x W x H)</label>
                    <input
                      type="text"
                      value={formData.dimensions}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      placeholder="e.g. 150 x 80 x 25 mm"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Unit Weight</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g. 0.85 kg"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-medium mb-1">Certifications & Standards</label>
                    <input
                      type="text"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="e.g. ISO 9001:2015, IATF 16949, RoHS, REACH"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-300 font-medium mb-1">Detailed Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Full description of component function, applications, and mechanical properties..."
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-300 font-medium mb-1">
                      Technical Specifications & Tolerances (JSON or Key-Value)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.technical_specifications}
                      onChange={(e) => setFormData({ ...formData, technical_specifications: e.target.value })}
                      placeholder='{\n  "Tolerance": "±0.02 mm",\n  "Surface Finish": "Ra 0.8 µm",\n  "Hardness": "180 HB"\n}'
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Logistics & Files */}
              <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#202636] space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase font-mono tracking-wider">
                  4. Shipping, Images & Datasheets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Shipping Terms</label>
                    <input
                      type="text"
                      value={formData.shipping_options}
                      onChange={(e) => setFormData({ ...formData, shipping_options: e.target.value })}
                      placeholder="Air Cargo, Ocean Freight, Courier"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Supported Destination Countries</label>
                    <input
                      type="text"
                      value={formData.supported_destinations}
                      onChange={(e) => setFormData({ ...formData, supported_destinations: e.target.value })}
                      placeholder="Global, United States, Germany, India, UAE"
                      className="w-full px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Image Upload / URL */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Product Image</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        placeholder="https://... or upload file"
                        className="flex-1 px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-3 py-2 bg-[#1b2230] hover:bg-[#253044] text-slate-200 border border-[#273245] rounded flex items-center gap-1.5 shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{uploadingImage ? "Uploading..." : "Upload"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Datasheet Upload / URL */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Technical Datasheet (PDF/Doc)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.datasheet_url}
                        onChange={(e) => setFormData({ ...formData, datasheet_url: e.target.value })}
                        placeholder="PDF datasheet URL or upload document"
                        className="flex-1 px-3 py-2 bg-[#121620] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => docInputRef.current?.click()}
                        disabled={uploadingDoc}
                        className="px-3 py-2 bg-[#1b2230] hover:bg-[#253044] text-slate-200 border border-[#273245] rounded flex items-center gap-1.5 shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>{uploadingDoc ? "Uploading..." : "Upload"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#232b3b]">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Authorized listing for {user?.company_name || "Supplier Company"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-4 py-2 rounded-md bg-[#181e2b] text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSubmit("DRAFT")}
                    className="px-4 py-2 rounded-md bg-[#1b2333] hover:bg-[#232e42] text-blue-300 border border-blue-900/40 font-semibold"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-xs"
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      {submitting
                        ? "Saving..."
                        : editingProduct
                        ? "Update Product"
                        : "Publish to Marketplace"}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}