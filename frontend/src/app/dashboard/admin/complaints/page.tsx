"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Download,
  MessageSquare,
  Send,
  Paperclip,
  Building2,
  Package,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Layers,
  ArrowRight,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ExternalLink
} from "lucide-react";
import {
  api,
  ComplaintSummary,
  ComplaintDetail,
  ComplaintAdminOverview,
  ComplaintMessageItem,
  ComplaintEvidenceItem,
  buildApiUrl
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SUBMITTED: { label: "Submitted", bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-800/40" },
  UNDER_REVIEW: { label: "Under Review", bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-800/40" },
  AWAITING_INFO: { label: "Awaiting Info", bg: "bg-cyan-950/40", text: "text-cyan-400", border: "border-cyan-800/40" },
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

const ALL_CATEGORIES = [
  "Product Quality",
  "Delivery Delay",
  "Payment or Refund",
  "Incorrect Product or Quantity",
  "Misleading Information",
  "Unprofessional Behaviour",
  "Fraud or Suspicious Activity",
  "Payment Default or Delay",
  "Unreasonable Cancellation",
  "Breach of Commercial Terms",
  "Other"
];

export default function AdminComplaintsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [overview, setOverview] = useState<ComplaintAdminOverview | null>(null);
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Investigation Drawer
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [activeComplaintDetail, setActiveComplaintDetail] = useState<ComplaintDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status & Workflow Transition State
  const [newStatus, setNewStatus] = useState("UNDER_REVIEW");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [assignedAdmin, setAssignedAdmin] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [officialResponse, setOfficialResponse] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Direct Message Composer State
  const [directMsg, setDirectMsg] = useState("");
  const [isInternalDirect, setIsInternalDirect] = useState(false);
  const [isSendingDirectMsg, setIsSendingDirectMsg] = useState(false);

  // Security Check
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "ADMIN")) {
      router.push("/login");
    }
  }, [user, isAuthenticated, authLoading, router]);

  // Load Overview & Complaints
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, listData] = await Promise.all([
        api.getComplaintAdminOverview(),
        api.getComplaints({
          status: statusFilter,
          category: categoryFilter,
          priority: priorityFilter,
          search: searchQuery
        })
      ]);
      setOverview(overviewData);
      setComplaints(listData);
    } catch (err: any) {
      setError(err.message || "Failed to load admin complaints console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadData();
    }
  }, [statusFilter, categoryFilter, priorityFilter, user]);

  // Load Detail
  useEffect(() => {
    if (selectedComplaintId) {
      setDetailLoading(true);
      api.getComplaintDetail(selectedComplaintId)
        .then((detail) => {
          setActiveComplaintDetail(detail);
          setNewStatus(detail.status);
          setNewPriority(detail.priority);
          setAssignedAdmin(detail.assigned_admin_name || user?.full_name || "Platform Admin");
          setInternalNotes("");
          setOfficialResponse("");
        })
        .catch((err) => {
          setError(err.message || "Failed to load complaint dossier.");
        })
        .finally(() => {
          setDetailLoading(false);
        });
    } else {
      setActiveComplaintDetail(null);
    }
  }, [selectedComplaintId, user]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Filter complaints locally by Complainant Role if selected
  const filteredComplaints = useMemo(() => {
    if (roleFilter === "ALL") return complaints;
    return complaints.filter((c) => c.complainant_role === roleFilter);
  }, [complaints, roleFilter]);

  // Handle Workflow Status Update
  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    setIsUpdatingStatus(true);
    setError(null);
    try {
      const updated = await api.updateComplaintStatus(selectedComplaintId, {
        new_status: newStatus,
        priority: newPriority,
        assigned_admin_name: assignedAdmin.trim() || undefined,
        notes: internalNotes.trim() || undefined,
        response_to_complainant: officialResponse.trim() || undefined
      });

      setActiveComplaintDetail(updated);
      setSuccessMsg(`Status for ${updated.complaint_code} updated to ${updated.status}.`);
      setInternalNotes("");
      setOfficialResponse("");
      // Refresh list & overview
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update complaint status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle Direct Message / Note Send
  const handleSendDirectMsg = async () => {
    if (!selectedComplaintId || !directMsg.trim()) return;

    setIsSendingDirectMsg(true);
    try {
      await api.sendComplaintMessage(selectedComplaintId, {
        message: directMsg.trim(),
        is_internal: isInternalDirect
      });
      setDirectMsg("");
      const refreshed = await api.getComplaintDetail(selectedComplaintId);
      setActiveComplaintDetail(refreshed);
    } catch (err: any) {
      setError(err.message || "Failed to post message.");
    } finally {
      setIsSendingDirectMsg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#11141b] border border-[#1f242f] rounded-xl p-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                  Complaint Management & Platform Arbitration
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/40 border border-rose-800/40 text-rose-400">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Investigate disputes, arbitrate commercial violations, record administrative findings, and communicate securely with complainants.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-300 bg-[#161a23] hover:bg-[#1c2230] border border-[#232938] rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh Queue
          </button>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-300 bg-[#161a23] hover:bg-[#1c2230] border border-[#232938] rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Admin Overview
          </Link>
        </div>
      </div>

      {/* Success / Error Banners */}
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

      {/* Overview KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Filed</span>
            <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">{overview.total_complaints}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Platform-wide cases</span>
          </div>
          <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
            <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider block">New / Submitted</span>
            <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">{overview.submitted_count}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Awaiting triage</span>
          </div>
          <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">Under Review</span>
            <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{overview.under_review_count}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Active investigation</span>
          </div>
          <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">Awaiting Info</span>
            <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">{overview.awaiting_info_count}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Complainant response</span>
          </div>
          <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">Resolved</span>
            <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{overview.resolved_count}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Successfully settled</span>
          </div>
          <div className="bg-[#11141b] border border-[#1f242f] p-4 rounded-xl">
            <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block">Rejected / Closed</span>
            <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
              {overview.rejected_count + overview.closed_count}
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Dismissed or archived</span>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-[#11141b] border border-[#1f242f] rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by ticket code (CMP-2026-...), company name, subject, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/60"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
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

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-[#161a23] border border-[#232938] px-2.5 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-500">Complainant:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161a23]">All Roles</option>
                <option value="BUYER" className="bg-[#161a23]">Buyer Complaints</option>
                <option value="SUPPLIER" className="bg-[#161a23]">Supplier Complaints</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 bg-[#161a23] border border-[#232938] px-2.5 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#161a23]">All Priorities</option>
                <option value="URGENT" className="bg-[#161a23]">Urgent</option>
                <option value="HIGH" className="bg-[#161a23]">High</option>
                <option value="MEDIUM" className="bg-[#161a23]">Medium</option>
                <option value="LOW" className="bg-[#161a23]">Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#161a23] border border-[#232938] px-2.5 py-1.5 rounded-lg text-xs font-mono">
              <span className="text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                <option value="ALL" className="bg-[#161a23]">All Categories</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#161a23]">{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Complaints Table */}
      <div className="bg-[#11141b] border border-[#1f242f] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading arbitration docket...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No Complaints Found</p>
            <p className="text-slate-500 text-[11px]">No active complaints match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f242f] bg-[#161a23]/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Complainant</th>
                  <th className="py-3 px-4">Accused Target</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Admin</th>
                  <th className="py-3 px-4">Filed</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f242f] text-xs font-mono">
                {filteredComplaints.map((c) => {
                  const statusMeta = STATUS_CONFIG[c.status] || {
                    label: c.status,
                    bg: "bg-slate-800",
                    text: "text-slate-300",
                    border: "border-slate-700"
                  };
                  const prioMeta = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.MEDIUM;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#161a23]/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedComplaintId(c.id)}
                    >
                      <td className="py-3.5 px-4 font-bold text-rose-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-rose-500/70" />
                        {c.complaint_code}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-200 block truncate max-w-[150px]">
                            {c.complainant_company_name}
                          </span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                            c.complainant_role === "BUYER" ? "bg-blue-950/60 text-blue-300" : "bg-emerald-950/60 text-emerald-300"
                          }`}>
                            {c.complainant_role}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate max-w-[140px] font-medium">{c.accused_company_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-[#1a202c] border border-slate-700/60 text-slate-300">
                          {c.category}
                        </span>
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
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {c.assigned_admin_name || <span className="text-slate-600 italic">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedComplaintId(c.id);
                          }}
                          className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-[#1a202c] hover:bg-[#242c3d] border border-[#2e3748] rounded transition-colors inline-flex items-center gap-1"
                        >
                          Investigate
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

      {/* INVESTIGATION & ARBITRATION DRAWER / MODAL */}
      {selectedComplaintId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#11141b] border border-[#1f242f] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1f242f] flex items-center justify-between bg-[#161a23]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-lg text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-mono text-slate-100">
                      Investigating {activeComplaintDetail?.complaint_code || `Ticket #${selectedComplaintId}`}
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
                    Administrative Arbitration Dossier • Strict Internal Privacy Enforced
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

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
              {detailLoading || !activeComplaintDetail ? (
                <div className="p-12 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                  Loading case details...
                </div>
              ) : (
                <>
                  {/* Parties & Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#161a23]/60 p-4 rounded-xl border border-[#232938]">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Complainant Party</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block truncate">
                        {activeComplaintDetail.complainant_company_name}
                      </span>
                      <span className="text-[10px] text-blue-400">({activeComplaintDetail.complainant_role})</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Accused Target</span>
                      <span className="font-semibold text-rose-300 mt-0.5 block truncate">
                        {activeComplaintDetail.accused_company_name}
                      </span>
                      <span className="text-[9px] text-slate-500">🔒 Accused party not alerted</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Category</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block">
                        {activeComplaintDetail.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Assigned Admin</span>
                      <span className="font-semibold text-emerald-400 mt-0.5 block">
                        {activeComplaintDetail.assigned_admin_name || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  {/* Linked Commercial Records */}
                  {(activeComplaintDetail.related_order_code || activeComplaintDetail.related_rfq_code) && (
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-[#161a23]/40 border border-[#232938] rounded-xl text-[11px]">
                      <span className="text-slate-400">Associated Transactions:</span>
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

                  {/* Complainant's Claim */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Dispute Subject: {activeComplaintDetail.subject}
                    </span>
                    <div className="p-4 bg-[#161a23] border border-[#232938] rounded-xl text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {activeComplaintDetail.description}
                    </div>
                  </div>

                  {/* Evidence Attachments */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Submitted Supporting Documentation ({activeComplaintDetail.evidence?.length || 0})
                    </span>
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
                      <p className="text-slate-500 text-[11px] italic">No evidence documents submitted with this claim.</p>
                    )}
                  </div>

                  {/* WORKFLOW MANAGEMENT PANEL */}
                  <div className="p-5 bg-[#141822] border border-blue-900/40 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-blue-900/30 pb-2">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                        Administrative Action & Status Workflow
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Platform Investigation Controls</span>
                    </div>

                    <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-mono text-slate-300 mb-1">
                            Target Workflow Status
                          </label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="SUBMITTED">SUBMITTED (Initial Queue)</option>
                            <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
                            <option value="AWAITING_INFO">AWAITING_INFO (Requested Complainant Info)</option>
                            <option value="RESOLVED">RESOLVED (Arbitration Settled)</option>
                            <option value="REJECTED">REJECTED (Claim Dismissed)</option>
                            <option value="CLOSED">CLOSED (Archived / Final)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-slate-300 mb-1">
                            Severity / Priority
                          </label>
                          <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value)}
                            className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="URGENT">URGENT</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-mono text-slate-300 mb-1">
                            Assigned Lead Investigator
                          </label>
                          <input
                            type="text"
                            value={assignedAdmin}
                            onChange={(e) => setAssignedAdmin(e.target.value)}
                            placeholder="e.g., Sarah Chen (Senior Auditor)"
                            className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Internal Notes (Admin-only) */}
                      <div>
                        <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Internal Administrative Notes (Visible strictly to administrators)
                        </label>
                        <textarea
                          rows={2}
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="Record investigation findings, counterparty review notes, contract clause checks..."
                          className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Official Response to Complainant */}
                      <div>
                        <label className="block text-[11px] font-mono text-slate-300 mb-1 flex items-center gap-1.5">
                          <Send className="w-3 h-3 text-emerald-400" />
                          Official Response to Complainant (Sent directly into complainant's case thread)
                        </label>
                        <textarea
                          rows={2}
                          value={officialResponse}
                          onChange={(e) => setOfficialResponse(e.target.value)}
                          placeholder="Provide official finding, request specific invoices/inspection slips, or announce resolution..."
                          className="w-full px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isUpdatingStatus}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-mono font-medium text-xs transition-colors shadow-lg shadow-blue-950/40 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          {isUpdatingStatus ? "Applying Updates..." : "Save Status & Dispatch Official Update"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Previous Internal Notes Audit */}
                  {activeComplaintDetail.internal_notes && (
                    <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1">
                      <span className="text-amber-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        Internal Administrative Notes Log
                      </span>
                      <pre className="text-slate-300 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                        {activeComplaintDetail.internal_notes}
                      </pre>
                    </div>
                  )}

                  {/* Communications History */}
                  <div className="space-y-3 pt-2 border-t border-[#1f242f]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        Communications Log & Case Messages
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {activeComplaintDetail.messages?.length || 0} communications
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto p-3 bg-[#0d1017] border border-[#1f242f] rounded-xl">
                      {activeComplaintDetail.messages && activeComplaintDetail.messages.length > 0 ? (
                        activeComplaintDetail.messages.map((msg) => {
                          const isAdmin = msg.sender_role === "ADMIN";
                          return (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl border text-xs ${
                                msg.is_internal
                                  ? "bg-amber-950/20 border-amber-800/40 text-amber-200"
                                  : isAdmin
                                  ? "bg-[#141b27] border-blue-800/40 text-blue-100"
                                  : "bg-[#181d27] border-slate-700/40 text-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-700/30">
                                <span className={`font-bold flex items-center gap-1.5 ${
                                  msg.is_internal ? "text-amber-400" : isAdmin ? "text-blue-400" : "text-emerald-400"
                                }`}>
                                  {msg.is_internal && <Lock className="w-3 h-3 text-amber-400" />}
                                  {msg.is_internal
                                    ? `[INTERNAL NOTE] ${msg.sender_name}`
                                    : isAdmin
                                    ? `🛡️ Platform Admin (${msg.sender_name})`
                                    : `🏢 ${activeComplaintDetail.complainant_company_name} (${msg.sender_name})`}
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
                        <p className="text-center py-4 text-slate-500 text-[11px]">No messages on record.</p>
                      )}
                    </div>

                    {/* Direct Quick Composer */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Post Quick Message to Docket:</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-amber-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternalDirect}
                            onChange={(e) => setIsInternalDirect(e.target.checked)}
                            className="rounded bg-[#161a23] border-[#232938] text-amber-500 focus:ring-0"
                          />
                          <span>Internal note only (complainant cannot see)</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={directMsg}
                          onChange={(e) => setDirectMsg(e.target.value)}
                          placeholder="Type inquiry or note..."
                          className="flex-1 px-3 py-2 bg-[#161a23] border border-[#232938] rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={handleSendDirectMsg}
                          disabled={isSendingDirectMsg || !directMsg.trim()}
                          className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono font-medium disabled:opacity-50 flex items-center gap-1 self-end py-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Audit History Timeline */}
                  {activeComplaintDetail.history && activeComplaintDetail.history.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-[#1f242f]">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Audit Trail & Decision Timeline
                      </span>
                      <div className="space-y-1.5">
                        {activeComplaintDetail.history.map((h) => (
                          <div key={h.id} className="text-[10px] text-slate-400 flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>
                              {h.created_at ? new Date(h.created_at).toLocaleDateString() : ""} {h.created_at ? new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""} —
                              Transitioned to <strong className="text-slate-200">{h.new_status}</strong> by {h.changed_by_name} ({h.changed_by_role})
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
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
