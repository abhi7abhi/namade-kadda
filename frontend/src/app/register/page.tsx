"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Globe2,
  Layers,
  Sparkles,
  Plus,
  X,
  ShieldAlert,
  Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type RegistrationRole = "BUYER" | "SUPPLIER";

const SUGGESTED_BUYER_CATEGORIES = [
  "Smartphones & Mobile Devices",
  "Semiconductor Chips & ICs",
  "Building Materials & Hardware",
  "Steel, Aluminum & Metal Products",
  "Electronic Components & PCBs",
  "Industrial Machinery & Equipment",
  "Paints, Coatings & Sealants",
  "Raw Materials, Polymers & Resins",
  "Automotive & EV Components",
  "Precision CNC Machined Parts"
];

const SUGGESTED_SUPPLIER_CATEGORIES = [
  "Semiconductor Chips & Wafers",
  "Smartphone & Display Components",
  "Paints, Coatings & Surface Finishes",
  "Building Materials & Structural Hardware",
  "Steel, Aluminium & Specialty Alloys",
  "Industrial Machinery & Tooling",
  "Electronic Components & Harnesses",
  "Batteries & Power Systems",
  "5-Axis CNC Machining & Stamping",
  "Injection Molding & Die Casting"
];

const COUNTRIES = [
  "India",
  "Germany",
  "United States",
  "Japan",
  "United Arab Emirates",
  "Singapore",
  "United Kingdom",
  "South Korea",
  "Taiwan",
  "France",
  "Italy",
  "Canada"
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerBuyer, registerSupplier } = useAuth();

  const [role, setRole] = useState<RegistrationRole>("BUYER");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common Fields
  const [companyName, setCompanyName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("India");
  const [contactPhone, setContactPhone] = useState("+91 80 2839 4411");

  // Buyer Specific
  const [buyerCategories, setBuyerCategories] = useState<string[]>([
    "Smartphones & Mobile Devices",
    "Semiconductor Chips & ICs"
  ]);
  const [customBuyerCategory, setCustomBuyerCategory] = useState("");
  const [buyerSearchFilter, setBuyerSearchFilter] = useState("");

  // Supplier Specific
  const [productsSold, setProductsSold] = useState("Precision CNC Milling, Turbine Flanges, Stamped Brackets");
  const [supplierCategories, setSupplierCategories] = useState<string[]>([
    "5-Axis CNC Machining & Stamping",
    "Steel, Aluminium & Specialty Alloys"
  ]);
  const [manufacturingCapabilities, setManufacturingCapabilities] = useState("5-Axis Milling, Wire EDM, Laser Cutting");
  const [customSupplierCategory, setCustomSupplierCategory] = useState("");
  const [supplierSearchFilter, setSupplierSearchFilter] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "SUPPLIER") {
      setRole("SUPPLIER");
    } else if (roleParam === "BUYER") {
      setRole("BUYER");
    }
  }, [searchParams]);

  const toggleBuyerCategory = (cat: string) => {
    if (buyerCategories.includes(cat)) {
      setBuyerCategories(buyerCategories.filter((c) => c !== cat));
    } else {
      setBuyerCategories([...buyerCategories, cat]);
    }
  };

  const addCustomBuyerCategory = () => {
    const trimmed = customBuyerCategory.trim();
    if (trimmed && !buyerCategories.includes(trimmed)) {
      setBuyerCategories([...buyerCategories, trimmed]);
      setCustomBuyerCategory("");
    }
  };

  const toggleSupplierCategory = (cat: string) => {
    if (supplierCategories.includes(cat)) {
      setSupplierCategories(supplierCategories.filter((c) => c !== cat));
    } else {
      setSupplierCategories([...supplierCategories, cat]);
    }
  };

  const addCustomSupplierCategory = () => {
    const trimmed = customSupplierCategory.trim();
    if (trimmed && !supplierCategories.includes(trimmed)) {
      setSupplierCategories([...supplierCategories, trimmed]);
      setCustomSupplierCategory("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!businessEmail.trim()) {
      setError("Business email address is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters in length.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords are identical.");
      return;
    }

    if (role === "BUYER" && buyerCategories.length === 0) {
      setError("Please select or add at least one product/sourcing category.");
      return;
    }

    if (role === "SUPPLIER") {
      if (!productsSold.trim()) {
        setError("Please enter the products sold or manufactured by your company.");
        return;
      }
      if (supplierCategories.length === 0) {
        setError("Please select or add at least one product category.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (role === "BUYER") {
        const res = await registerBuyer({
          company_name: companyName.trim(),
          email: businessEmail.trim(),
          password,
          confirm_password: confirmPassword,
          full_name: fullName.trim() || companyName.trim(),
          country,
          business_category: buyerCategories[0] || "Industrial Sourcing",
          sourcing_categories: buyerCategories,
          contact_phone: contactPhone.trim()
        });

        // Redirect to Buyer Document Upload page
        router.push(res.redirect_url || "/register/buyer/documents");
      } else {
        const res = await registerSupplier({
          company_name: companyName.trim(),
          email: businessEmail.trim(),
          password,
          confirm_password: confirmPassword,
          full_name: fullName.trim() || companyName.trim(),
          country,
          products_sold: productsSold.trim(),
          product_categories: supplierCategories,
          manufacturing_capabilities: manufacturingCapabilities.trim(),
          contact_phone: contactPhone.trim()
        });

        // Redirect to Supplier Document Upload page
        router.push(res.redirect_url || "/register/supplier/documents");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete company registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBuyerSuggestions = SUGGESTED_BUYER_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(buyerSearchFilter.toLowerCase())
  );

  const filteredSupplierSuggestions = SUGGESTED_SUPPLIER_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(supplierSearchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-xs font-mono text-sm">
              NK
            </div>
            <span className="font-bold text-slate-100 tracking-wider font-mono text-base">
              NAMADE KADDA
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Register Your Enterprise Account
          </h1>
          <p className="text-xs text-slate-400">
            Join the verified B2B sourcing network. Account creation is followed by mandatory business document verification.
          </p>
        </div>

        {/* Role Selection Switcher */}
        <div className="p-1 rounded-xl bg-[#141822] border border-[#232938] grid grid-cols-2 gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setRole("BUYER");
              setError(null);
            }}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              role === "BUYER"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a202d]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Industrial Buyer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("SUPPLIER");
              setError(null);
            }}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              role === "SUPPLIER"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#1a202d]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Supplier / Seller</span>
          </button>
        </div>

        {/* Administrator Disabled Notice */}
        <div className="p-3 rounded-lg bg-[#0e1117] border border-[#1f242f] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Need Administrator governance access?</span>
          </div>
          <span className="font-mono text-xs text-red-400/90 font-semibold">
            Internal Provisioning Only
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-[#121620] border border-[#1f2533] p-6 rounded-2xl shadow-xl space-y-5">
          <div className="border-b border-[#232938] pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Step 1: {role === "BUYER" ? "Buyer Organization Details" : "Supplier Facility Registration"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Step 2: Document Verification
            </span>
          </div>

          {/* Row 1: Company Name & Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Legal Company Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={role === "BUYER" ? "e.g. AeroSpace Dynamics Ltd" : "e.g. Apex Precision Engineering"}
                  required
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contact Person Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Row 2: Business Email & Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Business Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Country of Operation <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 appearance-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-[#121620] text-slate-100">
                      {c}
                    </option>
                  ))}
                </select>
                <Globe2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Passwords with Confirmation Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password <span className="text-red-400">*</span> (min 6 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <span className="text-[10px] text-red-400 mt-1 block">
                  Passwords do not match
                </span>
              )}
            </div>
          </div>

          {/* Supplier Specific Field: Products Sold or Supplied */}
          {role === "SUPPLIER" && (
            <div className="space-y-4 pt-2 border-t border-[#1e2432]">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Products Sold / Manufactured <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={productsSold}
                  onChange={(e) => setProductsSold(e.target.value)}
                  rows={2}
                  placeholder="e.g. Precision CNC milled engine housings, semiconductor test sockets, sheet metal chassis"
                  required
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Manufacturing Capabilities & Machinery
                </label>
                <input
                  type="text"
                  value={manufacturingCapabilities}
                  onChange={(e) => setManufacturingCapabilities(e.target.value)}
                  placeholder="e.g. 5-Axis CNC Milling, Wire EDM, Laser Cutting, ISO Class 7 Cleanroom"
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Multi-Select Product/Sourcing Categories */}
          <div className="space-y-2.5 pt-2 border-t border-[#1e2432]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                {role === "BUYER" ? "Sourcing & Procurement Categories" : "Supplier Product Categories"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500">
                {role === "BUYER" ? `${buyerCategories.length} selected` : `${supplierCategories.length} selected`}
              </span>
            </div>

            {/* Selected Categories Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-[#0c0f16] border border-[#212735]">
              {(role === "BUYER" ? buyerCategories : supplierCategories).length === 0 ? (
                <span className="text-xs text-slate-500 italic py-0.5">
                  No categories selected yet. Pick from suggestions below or add a custom category.
                </span>
              ) : (
                (role === "BUYER" ? buyerCategories : supplierCategories).map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-xs font-medium"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => (role === "BUYER" ? toggleBuyerCategory(cat) : toggleSupplierCategory(cat))}
                      className="text-emerald-400 hover:text-emerald-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Custom Category Input (Add Another Category) */}
            <div className="flex gap-2">
              <input
                type="text"
                value={role === "BUYER" ? customBuyerCategory : customSupplierCategory}
                onChange={(e) =>
                  role === "BUYER"
                    ? setCustomBuyerCategory(e.target.value)
                    : setCustomSupplierCategory(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (role === "BUYER") addCustomBuyerCategory();
                    else addCustomSupplierCategory();
                  }
                }}
                placeholder="Type custom product category and click Add..."
                className="flex-1 bg-[#0c0f16] border border-[#232938] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={role === "BUYER" ? addCustomBuyerCategory : addCustomSupplierCategory}
                className="px-3 py-1.5 rounded-lg bg-[#1a2130] hover:bg-[#232c40] text-emerald-400 border border-emerald-900/50 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Suggestions Grid */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 block">Suggested Categories (click to toggle):</span>
              <div className="flex flex-wrap gap-1.5">
                {(role === "BUYER" ? SUGGESTED_BUYER_CATEGORIES : SUGGESTED_SUPPLIER_CATEGORIES).map((cat) => {
                  const isSelected = (role === "BUYER" ? buyerCategories : supplierCategories).includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => (role === "BUYER" ? toggleBuyerCategory(cat) : toggleSupplierCategory(cat))}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-500 text-white font-medium"
                          : "bg-[#10131a] hover:bg-[#181d28] border-[#232938] text-slate-300"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="pt-2 border-t border-[#1e2432]">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Direct Contact Phone <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 80 1234 5678"
                required
                className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors"
          >
            {isSubmitting ? (
              "Provisioning Organization Profile..."
            ) : (
              <>
                <span>
                  Create {role === "BUYER" ? "Buyer" : "Supplier"} Account & Continue to Document Upload
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Sign In to your workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
