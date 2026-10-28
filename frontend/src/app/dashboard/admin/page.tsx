"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Package,
  RefreshCw,
  Clock,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  FileCheck,
  Download,
  ShieldCheck,
  X,
  AlertTriangle
} from "lucide-react";
import { api, AdminMetrics, User, Supplier, AuditLogItem, AdminDocumentItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [pendingSuppliers, setPendingSuppliers] = useState<Supplier[]>([]);
  const [adminDocs, setAdminDocs] = useState<AdminDocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "suppliers" | "documents" | "audit">("users");

  const [docStatusFilter, setDocStatusFilter] = useState<string>("ALL");
  const [docRoleFilter, setDocRoleFilter] = useState<string>("ALL");
  const [rejectingDoc, setRejectingDoc] = useState<AdminDocumentItem | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, uList, supps, docs, logs] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminSuppliersReview(),
        api.getAdminDocuments(),
        api.getAdminAuditLogs(50)
      ]);
      setMetrics(m);
      setUsersList(uList);
      setPendingSuppliers(supps);
      setAdminDocs(docs);
      setAuditLogs(logs);
    } catch (err: any) {
      setError(err.message || "Failed to load administrative data. Administrator privileges required.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== "ADMIN") {
        return;
      }
      fetchAdminData();
    }
  }, [user, isAuthenticated, authLoading]);

  const handleToggleUserStatus = async (targetUser: User) => {
    try {
      const updated = await api.updateUserStatus(targetUser.id, !targetUser.is_active);
      setActionSuccess(`User ${updated.email} status updated to ${updated.is_active ? "ACTIVE" : "DEACTIVATED"}`);
      await fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to update user status");
    }
  };

  const handleVerifySupplier = async (supplierId: number, action: "APPROVE" | "REJECT") => {
    try {
      const updated = await api.verifySupplier(supplierId, action);
      setActionSuccess(`Supplier ${updated.name} ${action === "APPROVE" ? "approved & verified" : "rejected"}!`);
      await fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Failed to verify supplier");
    }
  };

  const handleReviewDocument = async (docId: number, action: "APPROVE" | "REJECT", reason?: string) => {
    try {
      setError(null);
      await api.reviewAdminDocument(docId, action, reason);
      setActionSuccess(`Document ${action === "APPROVE" ? "approved" : "rejected"}.`);
      setRejectingDoc(null);
      setRejectionReasonText("");
      await fetchAdminData();
    } catch (err: any) {
      setError(err?.message || "Failed to review document");
    }
  };

  const handleVerifyCompany = async (userId: number, action: "APPROVE" | "REJECT", reason?: string) => {
    try {
      setError(null);
      const res = await api.verifyAdminCompany(userId, action, reason);
      setActionSuccess(res.message);
      await fetchAdminData();
    } catch (err: any) {
      setError(err?.message || "Failed to update company verification");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400 font-mono">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400 mr-2" />
        Checking administrator session authorization...
      </div>
    );
  }

  // Real server-side & client-side authorization check
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 rounded-xl bg-red-950/20 border border-red-900/40 text-center space-y-4 text-xs">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-100">Administrator Access Restricted</h2>
        <p className="text-slate-400 leading-relaxed">
          You are signed in as {user ? `${user.email} (${user.role})` : "an unauthenticated visitor"}. This portal requires an active <strong>ADMIN</strong> session.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold inline-block"
          >
            Switch to Administrator Demo Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Platform Administration Console</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-red-950 text-red-400 border border-red-900/40 font-bold">
              ROLE: ADMINISTRATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong>{user.full_name}</strong> ({user.email}) • Platform Governance & Audit Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/complaints"
            className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-xs font-medium border border-rose-800/60 flex items-center gap-1.5 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Disputes & Complaints
          </Link>
          <button
            onClick={fetchAdminData}
            className="px-3 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 text-xs font-medium border border-[#232938] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Page Guide */}
      <PageGuide
        routeKey="admin-dashboard"
        steps={[
          "Monitor platform-wide marketplace GMV, active registered buyers, and supplier verification queues.",
          "Review incoming manufacturer applications and approve or reject supplier capability listings.",
          "Inspect the tamper-evident audit log stream recording user logins, quote acceptances, and order events."
        ]}
        tip="Admin operations are strictly authenticated on the backend; all actions are permanently logged."
        demoNote="Demonstration administrator console with real database persistence across PostgreSQL/SQLite."
      />

      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Platform High-Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-lg bg-[#141821] border border-[#212735]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{metrics?.total_users || 0}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {metrics?.total_buyers || 0} Buyers • {metrics?.total_suppliers || 0} Suppliers
          </p>
        </div>

        <div className="p-4 rounded-lg bg-[#141821] border border-[#212735]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400">Supplier Review Queue</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{pendingSuppliers.length}</div>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting compliance review</p>
        </div>

        <div className="p-4 rounded-lg bg-[#141821] border border-[#212735]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400">Total RFQs & Quotes</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {metrics?.total_rfqs || 0} / {metrics?.total_quotations || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">RFQs issued / Quotations submitted</p>
        </div>

        <div className="p-4 rounded-lg bg-[#141821] border border-[#212735]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400">Platform GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            ${(metrics?.total_platform_gmv || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{metrics?.total_orders || 0} Purchase Orders Booked</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#212735] gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "users"
              ? "border-emerald-500 text-emerald-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> User Management ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab("suppliers")}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "suppliers"
              ? "border-emerald-500 text-emerald-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Supplier Review Queue ({pendingSuppliers.length})
        </button>

        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "documents"
              ? "border-emerald-500 text-emerald-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" /> Document Verification ({adminDocs.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-2.5 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "audit"
              ? "border-emerald-500 text-emerald-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Audit Event Log ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === "users" && (
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#212735]">
            <h3 className="text-xs font-semibold text-slate-200">Registered Users Directory</h3>
            <span className="text-[10px] font-mono text-slate-500">{usersList.length} TOTAL ACCOUNTS</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1f2533] text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-2">User / Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Organization</th>
                  <th className="pb-2">Country</th>
                  <th className="pb-2">Created</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b202c]">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-[#181d27]">
                    <td className="py-2.5">
                      <div>
                        <span className="font-semibold text-slate-200">{u.full_name}</span>
                        <span className="block text-[11px] text-slate-400 font-mono">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        u.role === "ADMIN"
                          ? "bg-red-950 text-red-300 border-red-900"
                          : u.role === "SUPPLIER"
                          ? "bg-purple-950 text-purple-300 border-purple-900"
                          : "bg-blue-950 text-blue-300 border-blue-900"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{u.company_name || "N/A"}</td>
                    <td className="py-2.5 text-slate-400">{u.country || "India"}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[10px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        u.is_active ? "text-emerald-400 bg-emerald-950/60" : "text-red-400 bg-red-950/60"
                      }`}>
                        {u.is_active ? "ACTIVE" : "DEACTIVATED"}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        disabled={u.email === user.email}
                        className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                          u.is_active
                            ? "border-red-900/50 text-red-400 hover:bg-red-950/40"
                            : "border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/40"
                        } disabled:opacity-30`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Supplier Review Queue */}
      {activeTab === "suppliers" && (
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#212735]">
            <h3 className="text-xs font-semibold text-slate-200">Pending Supplier Verification Reviews</h3>
            <span className="text-[10px] font-mono text-slate-500">{pendingSuppliers.length} PENDING AUDITS</span>
          </div>

          {pendingSuppliers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No suppliers awaiting review. All manufacturers have been processed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSuppliers.map((supp) => (
                <div key={supp.id} className="p-4 rounded-lg bg-[#10131a] border border-[#1e2432] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200 text-sm">{supp.name}</span>
                      <span className="text-slate-400 text-xs ml-2">({supp.city}, {supp.country})</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-900">
                      {supp.verification_status}
                    </span>
                  </div>
                  <p className="text-slate-400">{supp.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Contact: {supp.contact_email} • MOQ: {supp.moq} pcs • Lead time: {supp.lead_time_days} days
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#1b202c]">
                    <button
                      onClick={() => handleVerifySupplier(supp.id, "REJECT")}
                      className="px-3 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold transition-colors"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleVerifySupplier(supp.id, "APPROVE")}
                      className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      Approve & Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Document Verification & Compliance Review Queue */}
      {activeTab === "documents" && (
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#212735]">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Compliance Document Verification Queue
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Audit submitted corporate registration certificates, business licenses, and tax records for Buyers and Suppliers.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <select
                value={docRoleFilter}
                onChange={(e) => setDocRoleFilter(e.target.value)}
                className="bg-[#0e1117] border border-[#232938] rounded-md px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden"
              >
                <option value="ALL">All Roles</option>
                <option value="BUYER">Buyers Only</option>
                <option value="SUPPLIER">Suppliers Only</option>
              </select>

              <select
                value={docStatusFilter}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="bg-[#0e1117] border border-[#232938] rounded-md px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Filtered Documents List */}
          {(() => {
            const filteredDocs = adminDocs.filter((d) => {
              if (docStatusFilter !== "ALL" && d.status !== docStatusFilter) return false;
              if (docRoleFilter !== "ALL" && d.role !== docRoleFilter) return false;
              return true;
            });

            if (filteredDocs.length === 0) {
              return (
                <div className="py-12 text-center text-slate-500 text-xs space-y-1">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-400 font-medium">No documents match the active filter criteria.</p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto rounded-xl border border-[#212735]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1117] text-slate-400 uppercase text-[10px] font-mono border-b border-[#212735]">
                    <tr>
                      <th className="py-2.5 px-3">Company & User</th>
                      <th className="py-2.5 px-3">Document Details</th>
                      <th className="py-2.5 px-3">File / Size</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Review Decisions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2432]">
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#181d27] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-200 block">{doc.company_name || "N/A"}</span>
                          <span className="text-[11px] text-slate-400 font-mono block">{doc.user_email}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              doc.role === "BUYER" ? "bg-blue-950 text-blue-300 border border-blue-900/60" : "bg-purple-950 text-purple-300 border border-purple-900/60"
                            }`}>
                              {doc.role}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">{doc.country || "India"}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-100 block">{doc.document_title}</span>
                          <span className="text-[10px] text-emerald-400 font-mono block">
                            {doc.document_type.replace(/_/g, " ")}
                          </span>
                          {doc.description && (
                            <span className="text-[11px] text-slate-400 italic block mt-0.5 max-w-xs">
                              {doc.description}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono block mt-1">
                            Uploaded: {new Date(doc.created_at).toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-300 font-mono text-[11px] block truncate max-w-[150px]">
                            {doc.original_filename}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {(doc.file_size / 1024).toFixed(1)} KB • {doc.mime_type}
                          </span>
                          <a
                            href={doc.download_url || api.getDocumentDownloadUrl(doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 mt-1 underline"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download / Inspect</span>
                          </a>
                        </td>

                        <td className="py-3 px-3">
                          {doc.status === "APPROVED" ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> APPROVED
                              </span>
                              {doc.reviewed_by && (
                                <span className="text-[9px] text-slate-500 font-mono block">
                                  by {doc.reviewed_by}
                                </span>
                              )}
                            </div>
                          ) : doc.status === "REJECTED" ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                                <XCircle className="w-3 h-3" /> REJECTED
                              </span>
                              {doc.rejection_reason && (
                                <p className="text-[10px] text-red-300 max-w-xs leading-tight">
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
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-1.5">
                              {/* Approve Document Button */}
                              <button
                                type="button"
                                onClick={() => handleReviewDocument(doc.id, "APPROVE")}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approve</span>
                              </button>

                              {/* Reject Document Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingDoc(doc);
                                  setRejectionReasonText("");
                                }}
                                className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-semibold transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </div>

                            {/* Batch Company Approval Button */}
                            <button
                              type="button"
                              onClick={() => handleVerifyCompany(doc.user_id, "APPROVE")}
                              className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline"
                              title="Approve entire company and all its documents"
                            >
                              Approve Entire Company
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal for Document Rejection Reason */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#232938] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#232938] pb-2">
              <h4 className="text-sm font-bold text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Reject Verification Document
              </h4>
              <button
                type="button"
                onClick={() => setRejectingDoc(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <p>
                <strong>Document:</strong> {rejectingDoc.document_title} ({rejectingDoc.original_filename})
              </p>
              <p>
                <strong>Company:</strong> {rejectingDoc.company_name} ({rejectingDoc.user_email})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Rejection (Displayed to user) <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                rows={3}
                placeholder="e.g. Certificate expired or blurriness prevents identification. Please upload current official version."
                className="w-full bg-[#0d1017] border border-[#232938] rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#232938]">
              <button
                type="button"
                onClick={() => setRejectingDoc(null)}
                className="px-3 py-1.5 rounded bg-[#10131a] hover:bg-[#1a202c] text-slate-300 text-xs font-medium border border-[#232938]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewDocument(rejectingDoc.id, "REJECT", rejectionReasonText)}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Event Log Viewer */}
      {activeTab === "audit" && (
        <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-[#212735]">
            <h3 className="text-xs font-semibold text-slate-200">Chronological Event Audit Trail</h3>
            <span className="text-[10px] font-mono text-slate-500">LATEST {auditLogs.length} EVENTS</span>
          </div>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-[#10131a] border border-[#1e2432] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400 font-bold text-[11px]">{log.action}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161a22] text-slate-400 border border-[#232938]">
                      {log.entity_type} #{log.entity_id}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">{log.details}</p>
                <p className="text-[10px] text-slate-500 font-mono">Actor: {log.user_email || "system"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
