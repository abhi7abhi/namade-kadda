"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  FileText,
  Upload,
  Globe2,
  Clock,
  Layers,
  Award,
  Phone,
  Mail,
  MapPin,
  FileCheck
} from "lucide-react";
import { api, Supplier } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function SupplierProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    legal_business_name: "",
    description: "",
    country: "India",
    city: "Bangalore",
    state_region: "Karnataka",
    address: "",
    contact_email: "",
    phone: "",
    website: "",
    business_type: "Manufacturer & Exporter",
    years_of_operation: 12,
    factory_location: "",
    export_countries: "",
    languages_supported: "",
    moq: 100,
    typical_lead_time_days: 21,
    production_capacity: "",
    manufacturing_capabilities: "",
    materials_supported: "",
    certifications: "",
    business_registration_number: ""
  });

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [taxId, setTaxId] = useState("29AAAAA0000A1Z5");
  const [certDocs, setCertDocs] = useState("ISO 9001:2015, AS9100D Certificate PDF");
  const [verifNotes, setVerifNotes] = useState("Factory premises audited by TUV Rheinland.");
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSupplierMe();
      setSupplier(res);
      setForm({
        name: res.name || "",
        legal_business_name: (res as any).legal_business_name || res.name || "",
        description: res.description || "",
        country: res.country || "India",
        city: res.city || "",
        state_region: (res as any).state_region || "",
        address: res.address || "",
        contact_email: res.contact_email || "",
        phone: res.phone || "",
        website: res.website || "",
        business_type: (res as any).business_type || "Manufacturer & Exporter",
        years_of_operation: (res as any).years_of_operation || 12,
        factory_location: (res as any).factory_location || "",
        export_countries: (res as any).export_countries || "United States, Germany, UAE, Singapore",
        languages_supported: (res as any).languages_supported || "English, Hindi",
        moq: res.moq || 100,
        typical_lead_time_days: res.lead_time_days || 21,
        production_capacity: (res as any).production_capacity || "50,000 components / month",
        manufacturing_capabilities: res.capabilities?.[0]?.process_type || "5-Axis CNC Machining & Precision Milling",
        materials_supported: (res as any).materials_supported || "Stainless Steel 304/316, Aluminum 6061, Brass",
        certifications: (res as any).certifications_documents || "ISO 9001:2015, IATF 16949",
        business_registration_number: (res as any).business_registration_number || "U28910KA2014PTC074129"
      });
    } catch (err: any) {
      setError(err.message || "Failed to load supplier profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [isAuthenticated, authLoading, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.updateSupplierProfile(form);
      setSupplier(updated);
      setSuccess("Company profile and manufacturing parameters saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save company profile");
    } finally {
      setSaving(false);
    }
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);
    try {
      await api.requestSupplierVerification({
        business_registration_number: form.business_registration_number,
        tax_id_or_gst: taxId,
        certification_names: certDocs,
        notes: verifNotes
      });
      setShowVerifyModal(false);
      setSuccess("Accreditation application submitted! Placed in admin review queue.");
      fetchProfile();
    } catch (err: any) {
      setError(err.message || "Failed to submit verification request");
    } finally {
      setIsVerifying(false);
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

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading company credentials...</p>
      </div>
    );
  }

  const completeness = (supplier as any)?.profile_completeness || 90;
  const verifStatus = supplier?.verification_status || "PENDING_REVIEW";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageGuide
        badge="COMPANY PROFILE & CREDENTIALS"
        title="Industrial Manufacturer Operations Profile"
        description="Configure your factory capabilities, export markets, quality certifications, and statutory registration to receive verified enterprise RFQs."
        tip="Enterprise buyers filter strictly by documented ISO certifications and production capacities. Complete all fields to maximize RFQ matches."
      />

      {/* Top Banner with Verification & Completeness */}
      <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#1c2230] border border-[#2b3548] flex items-center justify-center text-emerald-400 font-bold font-mono text-lg shrink-0">
              {supplier?.name ? supplier.name.slice(0, 2).toUpperCase() : "AP"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100">{supplier?.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  verifStatus === "VERIFIED"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-amber-950 text-amber-300 border border-amber-800"
                }`}>
                  {verifStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {form.legal_business_name} · {form.city}, {form.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              className="px-3.5 py-1.5 rounded bg-[#181e2b] hover:bg-[#202738] text-slate-200 border border-[#2a3449] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Submit for Verification</span>
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="space-y-1.5 pt-2 border-t border-[#1f2533]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Profile Completeness Score:</span>
            <span className="text-emerald-400 font-bold">{completeness}% Complete</span>
          </div>
          <div className="w-full bg-[#1b212d] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500">
            Based on completed factory address, tax registration number, production capacities, and ISO quality documentation.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800/60 rounded text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Legal & Company Identification */}
        <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
          <h2 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> 1. Legal Entity & Registration Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Marketplace Trade Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Legal Registered Entity Name</label>
              <input
                type="text"
                value={form.legal_business_name}
                onChange={(e) => setForm({ ...form, legal_business_name: e.target.value })}
                placeholder="e.g. Apex Precision Engineering Private Limited"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Corporate Registration / CIN / VAT</label>
              <input
                type="text"
                value={form.business_registration_number}
                onChange={(e) => setForm({ ...form, business_registration_number: e.target.value })}
                placeholder="e.g. U28910KA2014PTC074129"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Business Classification Type</label>
              <select
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Manufacturer & Exporter">Manufacturer & Exporter</option>
                <option value="Contract Manufacturing / OEM">Contract Manufacturing / OEM</option>
                <option value="Precision Machine Shop">Precision Machine Shop</option>
                <option value="Industrial Wholesaler">Industrial Wholesaler</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Years in Commercial Operation</label>
              <input
                type="number"
                value={form.years_of_operation}
                onChange={(e) => setForm({ ...form, years_of_operation: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Official Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://company.example.com"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Company Executive Overview</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Factory Facility & Geographic Logistics */}
        <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
          <h2 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> 2. Factory Location & International Export Markets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Country</label>
              <input
                type="text"
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">City / Industrial Cluster</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">State / Province / Region</label>
              <input
                type="text"
                value={form.state_region}
                onChange={(e) => setForm({ ...form, state_region: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Primary Factory / Plant Address</label>
              <input
                type="text"
                value={form.factory_location}
                onChange={(e) => setForm({ ...form, factory_location: e.target.value })}
                placeholder="e.g. Plot 44, Peenya Industrial Area, Phase II"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Business Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Export Countries Served (Comma-separated)</label>
              <input
                type="text"
                value={form.export_countries}
                onChange={(e) => setForm({ ...form, export_countries: e.target.value })}
                placeholder="e.g. United States, Germany, UAE, Singapore, Japan, United Kingdom"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Supported Business Languages</label>
              <input
                type="text"
                value={form.languages_supported}
                onChange={(e) => setForm({ ...form, languages_supported: e.target.value })}
                placeholder="e.g. English, Hindi, German"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Manufacturing Capabilities, Materials & QA */}
        <div className="p-5 rounded-xl bg-[#141821] border border-[#212735] space-y-4">
          <h2 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> 3. Technical Manufacturing Envelope & QA Certifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Monthly Production Capacity</label>
              <input
                type="text"
                value={form.production_capacity}
                onChange={(e) => setForm({ ...form, production_capacity: e.target.value })}
                placeholder="e.g. 75,000 components / month"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Standard Production Lead Time (Days)</label>
              <input
                type="number"
                value={form.typical_lead_time_days}
                onChange={(e) => setForm({ ...form, typical_lead_time_days: parseInt(e.target.value) || 14 })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Standard Factory Minimum Order Quantity (MOQ)</label>
              <input
                type="number"
                value={form.moq}
                onChange={(e) => setForm({ ...form, moq: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Quality Certifications & Compliance Standards</label>
              <input
                type="text"
                value={form.certifications}
                onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                placeholder="e.g. ISO 9001:2015, AS9100D, IATF 16949, CE Marking"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Supported Engineering Materials & Grades</label>
              <textarea
                rows={2}
                value={form.materials_supported}
                onChange={(e) => setForm({ ...form, materials_supported: e.target.value })}
                placeholder="e.g. SS 304, SS 316L, Aluminum 6061-T6, Copper C11000, Brass, Inconel 718"
                className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/dashboard/supplier"
            className="px-4 py-2 rounded bg-[#171d27] hover:bg-[#202735] text-slate-300 text-xs font-semibold"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Profile & Credentials"}</span>
          </button>
        </div>
      </form>

      {/* Verification Request Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232b3b] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#232b3b]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Submit Factory Accreditation Package</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Official verification confirms your manufacturing license and ISO compliance to enterprise buyers, enabling verified supplier badges on all product listings.
            </p>

            <form onSubmit={handleRequestVerification} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Business Registration Number</label>
                <input
                  type="text"
                  required
                  value={form.business_registration_number}
                  onChange={(e) => setForm({ ...form, business_registration_number: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Tax ID / GST Identification</label>
                <input
                  type="text"
                  required
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Quality Certificates Document Package</label>
                <input
                  type="text"
                  required
                  value={certDocs}
                  onChange={(e) => setCertDocs(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Compliance Auditor Notes</label>
                <textarea
                  rows={2}
                  value={verifNotes}
                  onChange={(e) => setVerifNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0e1117] border border-[#222938] rounded text-slate-100"
                />
              </div>

              <div className="p-3 bg-[#0d1016] border border-[#1e2432] rounded text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Applications are audited by platform administrators. Uploaded documents are encrypted and accessible only to authorized compliance officers.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-3.5 py-1.5 rounded bg-[#181e2b] text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{isVerifying ? "Submitting..." : "Submit Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
