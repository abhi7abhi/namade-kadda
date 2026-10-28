"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  X,
  Download,
  MessageSquare,
  Send,
  Paperclip,
  Building2,
  Package,
  Tag,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Info
} from "lucide-react";
import {
  api,
  ComplaintSummary,
  ComplaintDetail,
  ComplaintReferenceOptions,
  ComplaintCreateRequest,
  ComplaintMessageItem,
  ComplaintEvidenceItem,
  buildApiUrl
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Props {
  role: "BUYER" | "SUPPLIER";
}

const BUYER_CATEGORIES = [
  "Product Quality",
  "Delivery Delay",
  "Payment or Refund",
  "Incorrect Product or Quantity",
  "Misleading Information",
  "Unprofessional Behaviour",
  "Fraud or Suspicious Activity",
  "Other"
];

const SUPPLIER_CATEGORIES = [
  "Payment Default or Delay",
  "Unreasonable Cancellation",
  "Fraudulent RFQ or Specs",
  "Breach of Commercial Terms",
  "Unprofessional Behaviour",
  "Other"
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUBMITTED: { label: "Submitted", bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-800/40" },
  UNDER_REVIEW: { label: "Under Review", bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-800/40" },
  AWAITING_INFO: { label: "Awaiting Your Info", bg: "bg-cyan-950/40", text: "text-cyan-400", border: "border-cyan-800/40" },
  RESOLVED: { label: "Resolved", bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-800/40" },
  REJECTED: { label: "Rejected", bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-800/40" },
  CLOSED: { label: "Closed", bg: "bg-slate-800/50", text: "text-slate-400", border: "border-slate-700/50" }
};

const PRIORITY_CONFIG: Record<string, { label: string; text: string; bg: string }> = {
  LOW: { label: "Low", text: "text-slate-400", bg: "bg-slate-800/60" },
  MEDIUM: { label: "Medium", text: "text-amber-400", bg: "bg-amber-950/40" },
  HIGH: { label: "High", text: "text-orange-400", bg: "bg-orange-950/40" },
  URGENT: { label: "Urgent", text: "text-rose-400", bg: "bg-rose-950/50" }
};

export default function UserComplaintsWorkspace({ role }: Props) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Reference options for filing
  const [references, setReferences] = useState<ComplaintReferenceOptions | null>(null);
  const [referencesLoading, setReferencesLoading] = useState(false);

  // Modals
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [activeComplaintDetail, setActiveComplaintDetail] = useState<ComplaintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states for raising complaint
  const [accusedCompanyName, setAccusedCompanyName] = useState("");
  const [targetCompanyId, setTargetCompanyId] = useState<string>("");
  const [category, setCategory] = useState<string>(role === "BUYER" ? BUYER_CATEGORIES[0] : SUPPLIER_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [relatedOrderId, setRelatedOrderId] = useState<string>("");
  const [relatedRfqId, setRelatedRfqId] = useState<string>("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal response / reply message
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [additionalEvidenceFile, setAdditionalEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  const categories = role === "BUYER" ? BUYER_CATEGORIES : SUPPLIER_CATEGORIES;

  // Stable, role-appropriate and deduplicated target companies for counterparty selection
  const displayTargetCompanies = useMemo(() => {
    if (!references?.target_companies) return [];

    const expectedType = role === "BUYER" ? "SUPPLIER" : "BUYER";

    // 1. Filter by role counterparty if type is specified
    const filtered = references.target_companies.filter(
      (tc) => !tc.type || tc.type === expectedType
    );

    // 2. Deduplicate by stable company identifier (normalized company name & stable ID)
    const seenNames = new Set<string>();
    const seenIds = new Set<number | string>();
    const deduplicated: typeof references.target_companies = [];

    for (const tc of filtered) {
      const normName = (tc.name || "").trim().toLowerCase();
      // Skip duplicate representations of the same company or duplicate IDs
      if (normName && seenNames.has(normName)) {
        continue;
      }
      if (tc.id !== undefined && tc.id !== null && seenIds.has(tc.id)) {
        continue;
      }

      if (normName) seenNames.add(normName);
      if (tc.id !== undefined && tc.id !== null) seenIds.add(tc.id);
      deduplicated.push(tc);
    }

    return deduplicated;
  }, [references, role]);

  // Load complaints
  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getComplaints({
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery
      });
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  // Load reference options (for filing)
  const loadReferences = async () => {
    setReferencesLoading(true);
    try {
      const refs = await api.getComplaintReferences();
      setReferences(refs);
    } catch (err) {
      console.warn("Could not load references:", err);
    } finally {
      setReferencesLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    loadReferences();
  }, [statusFilter, categoryFilter]);

  // Load detail when selected
  useEffect(() => {
    if (selectedComplaintId) {
      setDetailLoading(true);
      api.getComplaintDetail(selectedComplaintId)
        .then((detail) => {
          setActiveComplaintDetail(detail);
        })
        .catch((err) => {
          setError(err.message || "Failed to load complaint details.");
        })
        .finally(() => {
          setDetailLoading(false);
        });
    } else {
      setActiveComplaintDetail(null);
    }
  }, [selectedComplaintId]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints();
  };

  // Handle Raising a Complaint
  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accusedCompanyName.trim()) {
      setError("Please specify the accused company or business partner.");
      return;
    }
    if (!subject.trim()) {
      setError("Please provide a concise subject for your complaint.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a detailed description of the incident.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload: ComplaintCreateRequest = {
        accused_company_name: accusedCompanyName.trim(),
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        related_order_id: relatedOrderId ? parseInt(relatedOrderId) : null,
        related_rfq_id: relatedRfqId ? parseInt(relatedRfqId) : null
      };

      if (targetCompanyId) {
        if (role === "BUYER") {
          payload.accused_supplier_id = parseInt(targetCompanyId);
        } else {
          payload.accused_buyer_id = parseInt(targetCompanyId);
        }
      }

      const created = await api.raiseComplaint(payload);

      // Upload initial evidence file if provided
      if (evidenceFile) {
        try {
          await api.uploadComplaintEvidence(created.id, evidenceFile);
        } catch (uploadErr) {
          console.warn("Initial evidence upload notice:", uploadErr);
        }
      }

      setSuccessMsg(`Complaint ${created.complaint_code} filed successfully! Platform Administration will review and respond.`);
      setIsRaiseModalOpen(false);
      resetRaiseForm();
      await loadComplaints();
      setSelectedComplaintId(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to submit complaint. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRaiseForm = () => {
    setAccusedCompanyName("");
    setTargetCompanyId("");
    setCategory(categories[0]);
    setSubject("");
    setDescription("");
    setPriority("MEDIUM");
    setRelatedOrderId("");
    setRelatedRfqId("");
    setEvidenceFile(null);
  };

  // Handle sending reply to Admin
  const handleSendReply = async () => {
    if (!selectedComplaintId || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await api.sendComplaintMessage(selectedComplaintId, { message: replyText.trim() });
      setReplyText("");
      // Refresh detail
      const refreshed = await api.getComplaintDetail(selectedComplaintId);
      setActiveComplaintDetail(refreshed);
    } catch (err: any) {
      setError(err.message || "Failed to send message to platform admin.");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Handle uploading additional evidence in drawer
  const handleUploadAdditionalEvidence = async () => {
    if (!selectedComplaintId || !additionalEvidenceFile) return;
    setIsUploadingEvidence(true);
    try {
      const updated = await api.uploadComplaintEvidence(selectedComplaintId, additionalEvidenceFile);
      setActiveComplaintDetail(updated);
      setAdditionalEvidenceFile(null);
      setSuccessMsg("Additional evidence attached successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to upload evidence.");
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: complaints.length,
      submitted: complaints.filter(c => c.status === "SUBMITTED").length,
      underReview: complaints.filter(c => c.status === "UNDER_REVIEW").length,
      awaitingInfo: complaints.filter(c => c.status === "AWAITING_INFO").length,
      resolved: complaints.filter(c => c.status === "RESOLVED" || c.status === "CLOSED").length,
    };
  }, [complaints]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11141b] border border-[#1f242f] rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                {role === "BUYER" ? "Complaints & Supplier Disputes" : "Complaints & Counterparty Disputes"}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Official dispute resolution channel. Complaints route strictly and confidentially to Platform Administration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadComplaints();
              loadReferences();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-300 bg-[#161a23] hover:bg-[#1c2230] border border-[#232938] rounded-lg transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetRaiseForm();
              setIsRaiseModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-950/40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {role === "BUYER" ? "Raise Complaint against Supplier" : "Raise Complaint against Buyer"}
          </button>
        </div>
      </div>

      {/* Privacy Notice Alert */}
      <div className="flex items-start gap-3 bg-[#0d121c] border border-blue-900/30 rounded-xl p-4 text-xs font-mono text-slate-300">
        <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-blue-300">Strict Confidentiality & Arbitration Privacy</span>
          <p className="text-slate-400 leading-relaxed">
            All complaints and submitted evidence are routed <strong className="text-slate-200">strictly and exclusively</strong> to Platform Administration.
            The counterparty or accused company does <strong className="text-rose-300">NOT</strong> receive notifications or access to this complaint.
            Only you and authorized platform investigators can access this thread.
          </p>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-950/30 border border-rose-800/40 text-rose-400 rounded-xl text-xs font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Filed</span>
          <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider block">Submitted</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">{stats.submitted}</span>
        </div>
        <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">Under Review</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">{stats.underReview}</span>
        </div>
        <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">Action Req.</span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">{stats.awaitingInfo}</span>
        </div>
        <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">Resolved</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">{stats.resolved}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#11141b] border border-[#1f242f] rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by ticket ID, company name, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 bg-[#161a23] border border-[#232938] px-2.5 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-[#161a23]">All Statuses</option>
              <option value="SUBMITTED" className="bg-[#161a23]">Submitted</option>
              <option value="UNDER_REVIEW" className="bg-[#161a23]">Under Review</option>
              <option value="AWAITING_INFO" className="bg-[#161a23]">Awaiting Info</option>
              <option value="RESOLVED" className="bg-[#161a23]">Resolved</option>
              <option value="REJECTED" className="bg-[#161a23]">Rejected</option>
              <option value="CLOSED" className="bg-[#161a23]">Closed</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 bg-[#161a23] border border-[#232938] px-2.5 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL" className="bg-[#161a23]">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#161a23]">{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List Table */}
      <div className="bg-[#11141b] border border-[#1f242f] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading complaint records...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 space-y-3">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No Complaints Recorded</p>
            <p className="max-w-md mx-auto text-slate-500 text-[11px]">
              You have not filed any complaints under the current filter criteria.
              If you experience contract breaches, delivery defaults, or quality violations, you can file a complaint directly with Platform Administration.
            </p>
            <button
              onClick={() => setIsRaiseModalOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              File First Complaint
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f242f] bg-[#161a23]/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">{role === "BUYER" ? "Accused Supplier" : "Accused Buyer"}</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin Response</th>
                  <th className="py-3 px-4">Filed Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f242f] text-xs font-mono">
                {complaints.map((item) => {
                  const statusMeta = STATUS_CONFIG[item.status] || {
                    label: item.status,
                    bg: "bg-slate-800",
                    text: "text-slate-300",
                    border: "border-slate-700"
                  };
                  const prioMeta = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.MEDIUM;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#161a23]/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedComplaintId(item.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-rose-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-500/70" />
                        {item.complaint_code}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[140px]">{item.accused_company_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-[#1a202c] border border-slate-700/60 text-slate-300">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate" title={item.subject}>
                        {item.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prioMeta.bg} ${prioMeta.text}`}>
                          {prioMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.has_admin_response ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Response available</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Awaiting review</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaintId(item.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2e3748] rounded transition-colors inline-flex items-center gap-1"
                        >
                          View Details
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RAISE A COMPLAINT */}
      {isRaiseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#11141b] border border-[#1f242f] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-4 border-b border-[#1f242f] flex items-center justify-between bg-[#161a23]">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold font-mono text-slate-100">
                  {role === "BUYER" ? "File Complaint Against Supplier" : "File Complaint Against Buyer"}
                </h3>
              </div>
              <button
                onClick={() => setIsRaiseModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Privacy Warning in Modal */}
              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-xs font-mono text-slate-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Privacy:</strong> This dispute will be reviewed exclusively by Namade Kadda Platform Administration. The accused party will not receive direct alerts or access.
                </span>
              </div>

              {/* Target Accused Company */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Accused Company Name <span className="text-rose-400">*</span>
                </label>
                {displayTargetCompanies.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={targetCompanyId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTargetCompanyId(val);
                        const found = displayTargetCompanies.find(c => String(c.id) === val);
                        if (found) setAccusedCompanyName(found.name);
                      }}
                      className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                    >
                      <option value="">-- Select from your counterparty companies or type below --</option>
                      {displayTargetCompanies.map((tc) => (
                        <option key={tc.key || `${tc.type || role}_${tc.id}`} value={tc.id}>
                          {tc.name} {tc.country ? `(${tc.country})` : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or enter company name manually if not in list..."
                      value={accusedCompanyName}
                      onChange={(e) => {
                        setAccusedCompanyName(e.target.value);
                        setTargetCompanyId("");
                      }}
                      className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter company name..."
                    value={accusedCompanyName}
                    onChange={(e) => setAccusedCompanyName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                  />
                )}
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Complaint Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Dispute Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                  >
                    <option value="LOW">Low (Informational / Minor)</option>
                    <option value="MEDIUM">Medium (Contract Notice / Inquiry)</option>
                    <option value="HIGH">High (Substantial Breach / Delay)</option>
                    <option value="URGENT">Urgent (Severe Quality / Financial Risk)</option>
                  </select>
                </div>
              </div>

              {/* Related Order or RFQ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Related Purchase Order (Optional)
                  </label>
                  <select
                    value={relatedOrderId}
                    onChange={(e) => setRelatedOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                  >
                    <option value="">None / Not Order-Specific</option>
                    {references?.orders.map((ord) => (
                      <option key={`ord_${ord.id}`} value={ord.id}>
                        {ord.order_code} (${ord.total_amount.toLocaleString()}) - {ord.status}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Related RFQ (Optional)
                  </label>
                  <select
                    value={relatedRfqId}
                    onChange={(e) => setRelatedRfqId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                  >
                    <option value="">None / Not RFQ-Specific</option>
                    {references?.rfqs.map((rfq) => (
                      <option key={`rfq_${rfq.id}`} value={rfq.id}>
                        {rfq.rfq_code} - {rfq.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Complaint Subject <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Critical 14-day delivery delay without notification on PO-2026-004"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Detailed Description & Timeline <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide complete facts, dates, promised deliverables, communications, and requested arbitration outcome..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              {/* Supporting Evidence File Upload */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Supporting Evidence / Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-[#232938] hover:border-slate-500 rounded-xl p-4 text-center cursor-pointer bg-[#161a23]/40 transition-colors relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEvidenceFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-mono text-slate-300">
                    {evidenceFile ? (
                      <span className="text-emerald-400 font-semibold">{evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(1)} KB)</span>
                    ) : (
                      "Click or drag PDF, inspection sheet, photo, or invoice"
                    )}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">Maximum file size 25MB</p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f242f]">
                <button
                  type="button"
                  onClick={() => setIsRaiseModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-mono font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-950/40 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Filing Dispute...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Submit to Platform Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPLAINT DETAILS & ARBITRATION THREAD */}
      {selectedComplaintId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#11141b] border border-[#1f242f] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1f242f] flex items-center justify-between bg-[#161a23]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-slate-100">
                      {activeComplaintDetail?.complaint_code || `Ticket #${selectedComplaintId}`}
                    </span>
                    {activeComplaintDetail && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                        STATUS_CONFIG[activeComplaintDetail.status]?.bg || "bg-slate-800"
                      } ${STATUS_CONFIG[activeComplaintDetail.status]?.text || "text-slate-300"} ${
                        STATUS_CONFIG[activeComplaintDetail.status]?.border || "border-slate-700"
                      }`}>
                        {STATUS_CONFIG[activeComplaintDetail.status]?.label || activeComplaintDetail.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    Confidential Arbitration Thread • Platform Administration Review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaintId(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {detailLoading || !activeComplaintDetail ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                  Loading case details...
                </div>
              ) : (
                <>
                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161a23]/60 p-4 rounded-xl border border-[#232938]">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Accused Party</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                        {activeComplaintDetail.accused_company_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Category</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block">
                        {activeComplaintDetail.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Priority</span>
                      <span className={`font-semibold mt-0.5 block ${PRIORITY_CONFIG[activeComplaintDetail.priority]?.text || "text-slate-200"}`}>
                        {activeComplaintDetail.priority}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Assigned Admin</span>
                      <span className="font-semibold text-emerald-400 mt-0.5 block">
                        {activeComplaintDetail.assigned_admin_name || "Platform Arbitration Desk"}
                      </span>
                    </div>
                  </div>

                  {/* Associated Transaction Reference */}
                  {(activeComplaintDetail.related_order_code || activeComplaintDetail.related_rfq_code) && (
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-[#161a23]/40 border border-[#232938] rounded-xl text-[11px]">
                      <span className="text-slate-400">Linked Commercial Records:</span>
                      {activeComplaintDetail.related_order_code && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-950/40 border border-blue-800/40 text-blue-300 rounded">
                          <Package className="w-3 h-3" />
                          Order: {activeComplaintDetail.related_order_code}
                        </span>
                      )}
                      {activeComplaintDetail.related_rfq_code && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-950/40 border border-purple-800/40 text-purple-300 rounded">
                          <FileText className="w-3 h-3" />
                          RFQ: {activeComplaintDetail.related_rfq_code}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Complaint Description */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Incident Summary & Subject: {activeComplaintDetail.subject}
                    </span>
                    <div className="p-4 bg-[#161a23] border border-[#232938] rounded-xl text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {activeComplaintDetail.description}
                    </div>
                  </div>

                  {/* Resolution Notes (if closed or resolved) */}
                  {activeComplaintDetail.resolution_notes && (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1">
                      <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-wider block">
                        Official Resolution Decision
                      </span>
                      <p className="text-slate-200 leading-relaxed">{activeComplaintDetail.resolution_notes}</p>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {activeComplaintDetail.rejection_reason && (
                    <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-1">
                      <span className="text-rose-400 font-bold uppercase text-[10px] tracking-wider block">
                        Administrative Finding / Rejection Reason
                      </span>
                      <p className="text-slate-200 leading-relaxed">{activeComplaintDetail.rejection_reason}</p>
                    </div>
                  )}

                  {/* Supporting Evidence List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Submitted Evidence & Documentation ({activeComplaintDetail.evidence?.length || 0})
                      </span>
                    </div>

                    {activeComplaintDetail.evidence && activeComplaintDetail.evidence.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeComplaintDetail.evidence.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center justify-between p-2.5 bg-[#161a23] border border-[#232938] rounded-lg"
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <Paperclip className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="text-slate-200 truncate" title={ev.file_name}>{ev.file_name}</span>
                              <span className="text-[10px] text-slate-500">({(ev.file_size / 1024).toFixed(0)} KB)</span>
                            </div>
                            <a
                              href={buildApiUrl(ev.download_url)}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="p-1.5 bg-[#232938] hover:bg-[#2d3548] text-slate-300 hover:text-white rounded transition-colors"
                              title="Download Attachment"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px] italic">No evidence documents attached to this dispute.</p>
                    )}

                    {/* Upload additional evidence */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161a23] hover:bg-[#1f2533] border border-[#232938] rounded-lg text-slate-300 cursor-pointer text-xs">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span>{additionalEvidenceFile ? additionalEvidenceFile.name : "Attach Follow-up Evidence File"}</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setAdditionalEvidenceFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      {additionalEvidenceFile && (
                        <button
                          onClick={handleUploadAdditionalEvidence}
                          disabled={isUploadingEvidence}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                        >
                          {isUploadingEvidence ? "Uploading..." : "Upload File"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2-Way Message Thread with Admin */}
                  <div className="space-y-3 pt-2 border-t border-[#1f242f]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        Communications with Platform Administration
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {activeComplaintDetail.messages?.length || 0} messages
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 bg-[#0d1017] border border-[#1f242f] rounded-xl">
                      {activeComplaintDetail.messages && activeComplaintDetail.messages.length > 0 ? (
                        activeComplaintDetail.messages.map((msg) => {
                          const isAdmin = msg.sender_role === "ADMIN";
                          return (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl border text-xs ${
                                isAdmin
                                  ? "bg-[#141b27] border-blue-800/40 text-blue-100 ml-4"
                                  : "bg-[#181d27] border-slate-700/40 text-slate-200 mr-4"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-700/30">
                                <span className={`font-bold ${isAdmin ? "text-blue-400" : "text-emerald-400"}`}>
                                  {isAdmin ? "🛡️ Platform Administrator" : `You (${msg.sender_name})`}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {msg.created_at ? new Date(msg.created_at).toLocaleString() : "Recent"}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center py-4 text-slate-500 text-[11px]">
                          No messages exchanged yet. The administrator will communicate updates here.
                        </p>
                      )}
                    </div>

                    {/* Reply composer */}
                    {activeComplaintDetail.status !== "CLOSED" && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          placeholder="Submit response, follow-up clarification, or additional details to Platform Administration..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500/60"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleSendReply}
                            disabled={isSendingReply || !replyText.trim()}
                            className="px-4 py-1.5 text-xs font-mono font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {isSendingReply ? "Sending..." : "Send Message to Admin"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit History Timeline */}
                  {activeComplaintDetail.history && activeComplaintDetail.history.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#1f242f]">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Audit & Status Log
                      </span>
                      <div className="space-y-1.5">
                        {activeComplaintDetail.history.map((h) => (
                          <div key={h.id} className="text-[10px] text-slate-400 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>
                              {h.created_at ? new Date(h.created_at).toLocaleDateString() : ""} {h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""} —
                              Status changed to <strong className="text-slate-200">{h.new_status}</strong> by {h.changed_by_name} ({h.changed_by_role})
                              {h.notes && <span className="text-slate-500 italic ml-1">"{h.notes}"</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#1f242f] bg-[#161a23] flex justify-end">
              <button
                onClick={() => setSelectedComplaintId(null)}
                className="px-4 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-[#232938] hover:bg-[#2d3548] rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
