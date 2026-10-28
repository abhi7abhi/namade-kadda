"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  FileCheck,
  HelpCircle,
  Download,
  Check
} from "lucide-react";
import {
  api,
  CompanyDocument,
  CompanyVerificationStatus,
  User
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface DocumentVerificationWorkspaceProps {
  role: "BUYER" | "SUPPLIER";
}

const DOCUMENT_TYPES = [
  { value: "COMPANY_REGISTRATION", label: "Company Registration Certificate (Certificate of Incorporation)" },
  { value: "BUSINESS_LICENSE", label: "Valid Business / Commercial Operating Licence" },
  { value: "TAX_CERTIFICATE", label: "Tax Registration Certificate (GST / VAT / EIN / PAN)" },
  { value: "REPRESENTATIVE_ID", label: "Authorized Representative / Director Identity Document" },
  { value: "PRODUCT_CERTIFICATION", label: "Product Compliance / Safety Certificate (CE, FCC, RoHS)" },
  { value: "QUALITY_CERTIFICATION", label: "Quality Management System Certification (ISO 9001, AS9100, IATF)" },
  { value: "OTHER", label: "Other Supporting Corporate Document" }
];

export default function DocumentVerificationWorkspace({ role }: DocumentVerificationWorkspaceProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState<CompanyVerificationStatus | null>(null);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [selectedType, setSelectedType] = useState<string>("COMPANY_REGISTRATION");
  const [documentTitle, setDocumentTitle] = useState<string>("");
  const [documentDescription, setDocumentDescription] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatusAndDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vStatus, docs] = await Promise.all([
        api.getCompanyVerificationStatus(),
        api.getCompanyDocuments()
      ]);
      setVerificationStatus(vStatus);
      setDocuments(docs);
    } catch (err: any) {
      console.warn("Failed to load verification status", err);
      setError(err?.message || "Failed to load verification status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      fetchStatusAndDocs();
    }
  }, [isAuthenticated, authLoading]);

  const handleFileSelect = (file: File) => {
    setError(null);
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg", ".pdf"];
    if (!allowed.includes(ext)) {
      setError(`Unsupported file format '${ext}'. Accepted formats are PNG, JPEG, and PDF (.png, .jpg, .jpeg, .pdf).`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`);
      return;
    }

    setSelectedFile(file);

    // If image, create object URL for preview
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    if (selectedType === "OTHER" && !documentDescription.trim()) {
      setError("Please provide a description when selecting 'Other Supporting Corporate Document'.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", selectedType);
      if (documentTitle.trim()) {
        formData.append("document_title", documentTitle.trim());
      }
      if (documentDescription.trim()) {
        formData.append("description", documentDescription.trim());
      }

      const uploaded = await api.uploadCompanyDocument(formData);
      setSuccessMsg(`Document '${uploaded.document_title}' uploaded successfully!`);

      // Reset form
      setSelectedFile(null);
      setFilePreview(null);
      setDocumentTitle("");
      setDocumentDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh list
      await fetchStatusAndDocs();
    } catch (err: any) {
      setError(err?.message || "Failed to upload document. Please verify format and size.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm("Are you sure you want to remove this document?")) return;
    try {
      setError(null);
      await api.deleteCompanyDocument(docId);
      setSuccessMsg("Document removed.");
      await fetchStatusAndDocs();
    } catch (err: any) {
      setError(err?.message || "Failed to delete document.");
    }
  };

  const handleSubmitForReview = async () => {
    if (documents.length === 0) {
      setError("Please upload at least one verification document before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const updated = await api.submitCompanyDocuments();
      setVerificationStatus(updated);
      setSuccessMsg("Your verification documents have been formally submitted for compliance review!");
      await refreshUser();
    } catch (err: any) {
      setError(err?.message || "Failed to submit documents for review.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-xs text-slate-400 font-mono gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Loading company verification records...</span>
      </div>
    );
  }

  const currentStatus = verificationStatus?.verification_status || user?.verification_status || "PENDING_REVIEW";
  const rejectionReason = verificationStatus?.rejection_reason || user?.verification_rejection_reason;

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 font-semibold uppercase">
                {role === "BUYER" ? "Industrial Buyer" : "Manufacturing Supplier"} Verification
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">{user?.company_name || "Enterprise Profile"}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
              Company Document Upload & Compliance Verification
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              To ensure platform security and fulfill legal audit standards, upload corporate credentials for compliance review.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={role === "BUYER" ? "/dashboard/buyer" : "/dashboard/supplier"}
              className="px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1c2331] text-slate-300 text-xs font-semibold border border-[#232938] flex items-center gap-1.5 transition-colors"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-[#121620] border border-emerald-800/40 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold block uppercase">Step 1: Completed</span>
              <span className="text-xs font-bold text-slate-200">Company Registration</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#141824] border border-emerald-500/50 shadow-md shadow-emerald-950/20 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold block uppercase">Step 2: Active</span>
              <span className="text-xs font-bold text-white">Upload Verification Docs</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#10131a] border border-[#1f242f] flex items-center gap-3 opacity-80">
            <div className="w-7 h-7 rounded-full bg-[#1b202c] text-slate-400 flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono font-semibold block uppercase">Step 3: Next</span>
              <span className="text-xs font-bold text-slate-400">Admin Review & Approval</span>
            </div>
          </div>
        </div>

        {/* Dynamic Verification Status Banner */}
        {currentStatus === "APPROVED" || currentStatus === "ACTIVE" ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-emerald-300 text-sm block">Company Verified & Approved</strong>
              <p className="text-slate-300 leading-relaxed">
                Your business credentials and submitted verification documents have been approved by Namade Kadda compliance officers. You possess verified privileges across the marketplace.
              </p>
            </div>
          </div>
        ) : currentStatus === "REJECTED" ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/70 text-red-200 text-xs flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <strong className="text-red-300 text-sm">Verification Submission Needs Correction</strong>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-300">
                  REJECTED
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Reason:</strong> {rejectionReason || "One or more documents did not satisfy verification criteria."}
              </p>
              <p className="text-[11px] text-red-300">
                Please remove or replace the flagged documents below and click <strong>"Submit Documents for Verification"</strong> to trigger a re-audit.
              </p>
            </div>
          </div>
        ) : currentStatus === "PENDING_REVIEW" ? (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <strong className="text-amber-300 text-sm">Documents Awaiting Review</strong>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
                  PENDING REVIEW
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Your verification package is currently queued for evaluation by our compliance team. You may attach additional supporting documents anytime using the <strong>Add More</strong> feature below.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-blue-300 text-sm">Action Required: Upload Verification Documents</strong>
              <p className="text-slate-300 leading-relaxed">
                Please upload your business registration and licensing documents below to initiate platform verification.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* Section 1: Upload New Verification Document Form */}
        <div className="bg-[#121620] border border-[#1f2533] p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232938]">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100">Attach Verification Document</h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Accepted: PNG, JPEG, PDF (Max 10MB)
            </span>
          </div>

          <form onSubmit={handleUploadDocument} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Document Category / Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#121620]">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Display Title (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Display Title (Optional)
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="e.g. 2026 Certificate of Incorporation"
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* If "Other" selected, Description is required */}
            {selectedType === "OTHER" && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document Description & Purpose <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  rows={2}
                  placeholder="Explain the legal or corporate authority of this supporting document..."
                  required
                  className="w-full bg-[#0c0f16] border border-[#232938] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            )}

            {/* Drag & Drop File Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Document File <span className="text-red-400">*</span>
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-emerald-500 bg-emerald-950/20"
                    : "border-[#252b3a] hover:border-emerald-500/50 bg-[#0d1017] hover:bg-[#10141d]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      {filePreview ? (
                        <img
                          src={filePreview}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-emerald-500/40"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-red-950/50 border border-red-900/40 flex items-center justify-center text-red-400 font-bold text-xs font-mono">
                          PDF
                        </div>
                      )}
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-100 block">
                          {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type || "Document"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <span className="text-[11px] text-emerald-400 font-medium">Ready to upload</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300 underline ml-2"
                      >
                        Remove / Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#181d28] border border-[#232938] flex items-center justify-center mx-auto text-slate-400">
                      <Upload className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-xs font-medium text-slate-200">
                      <span className="text-emerald-400 underline font-semibold">Click to browse</span> or drag and drop your document here
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Supports PNG, JPG, JPEG, and PDF documents up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Add / Upload Document */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading Document...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach & Save Document</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Uploaded Documents Table & Management */}
        <div className="bg-[#121620] border border-[#1f2533] p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#232938]">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Uploaded Documents Repository</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1a202d] text-slate-300 border border-[#273042]">
                  {documents.length} attached
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All attached documents remain safely encrypted in private storage.
              </p>
            </div>

            {/* Add More Button (Section 4 Requirement) */}
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#181d28] hover:bg-[#222838] border border-[#283144] text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Documents</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#0e1117] border border-[#1f242f] space-y-2">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-xs font-medium text-slate-300">No documents uploaded yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Attach your company incorporation certificate, tax registration, or operating license above to begin the verification process.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#212735]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1117] text-slate-400 uppercase text-[10px] font-mono border-b border-[#212735]">
                  <tr>
                    <th className="py-2.5 px-3">Document Title & Type</th>
                    <th className="py-2.5 px-3">File Name & Size</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2432]">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-[#151924] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-100 block">{doc.document_title}</span>
                        <span className="text-[10px] font-mono text-emerald-400/90 block">
                          {doc.document_type.replace(/_/g, " ")}
                        </span>
                        {doc.description && (
                          <span className="text-[11px] text-slate-400 italic block mt-0.5">
                            {doc.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-300 block font-mono text-[11px] truncate max-w-[180px]">
                          {doc.original_filename}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatFileSize(doc.file_size)} • {doc.mime_type}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {doc.status === "APPROVED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> APPROVED
                          </span>
                        ) : doc.status === "REJECTED" ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                              <XCircle className="w-3 h-3" /> REJECTED
                            </span>
                            {doc.rejection_reason && (
                              <p className="text-[10px] text-red-300 leading-tight max-w-[200px]">
                                {doc.rejection_reason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            <Clock className="w-3 h-3" /> PENDING REVIEW
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Secure Download / Preview Button */}
                          <a
                            href={api.getDocumentDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-[#1f2535] text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Download or Preview Document"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {/* Delete Document Button (Allowed if not approved) */}
                          {doc.status !== "APPROVED" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 rounded hover:bg-red-950/40 text-slate-400 hover:text-red-400 transition-colors"
                              title="Remove Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 3: Final Submission & Proceed Controls */}
          <div className="pt-4 border-t border-[#232938] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              {documents.length > 0 ? (
                <span>
                  ✓ {documents.length} document{documents.length > 1 ? "s" : ""} attached. Ready to queue for compliance verification.
                </span>
              ) : (
                <span>Attach at least one document to submit for review.</span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmitForReview}
                disabled={submitting || documents.length === 0}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting for Audit...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Documents for Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Informational Disclaimer Card */}
        <div className="p-4 rounded-xl bg-[#0f1219] border border-[#1f242f] text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            Verification Standards & Legal Compliance Notice
          </div>
          <p>
            Namade Kadda verifies industrial entities according to international commercial compliance protocols. Documents are securely archived and accessed strictly by certified compliance officers. Uploaded credentials do not constitute automated warranty of commercial solvency until audited.
          </p>
        </div>
      </div>
    </div>
  );
}
