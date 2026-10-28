"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  CheckCircle2,
  User,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Info
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type RoleType = "BUYER" | "SUPPLIER" | "ADMIN";

export default function LoginPage() {
  const router = useRouter();
  const { login, adminLogin } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleType>("BUYER");
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (role: RoleType) => {
    setSelectedRole(role);
    setError(null);
    setPassword("");
    if (role === "ADMIN") {
      setEmail("");
    } else {
      setAdminId("");
    }
  };

  const handleAdminIdChange = (val: string) => {
    // Enforce digits only for numeric administrator ID
    const digitsOnly = val.replace(/\D/g, "");
    setAdminId(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedRole === "ADMIN") {
      if (!adminId.trim()) {
        setError("Please enter your numeric Administrator ID (e.g. 12345667).");
        return;
      }
      if (!/^\d+$/.test(adminId.trim())) {
        setError("Administrator ID must consist of numeric digits only.");
        return;
      }
      if (!password.trim()) {
        setError("Please enter your administrator password.");
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError("Please enter both email address and password.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (selectedRole === "ADMIN") {
        const loggedAdmin = await adminLogin(adminId.trim(), password);
        router.push("/dashboard/admin");
      } else {
        const loggedUser = await login(email.trim(), password, rememberMe, selectedRole);

        // Verification-aware redirection based on backend records
        if (loggedUser.role === "SUPPLIER") {
          if (loggedUser.verification_status === "NOT_SUBMITTED" || loggedUser.verification_status === "PENDING_REVIEW") {
            router.push("/register/supplier/documents");
          } else {
            router.push("/dashboard/supplier");
          }
        } else {
          // BUYER
          if (loggedUser.verification_status === "NOT_SUBMITTED" || loggedUser.verification_status === "PENDING_REVIEW") {
            router.push("/register/buyer/documents");
          } else {
            router.push("/dashboard/buyer");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const prefillDemoCredentials = (role: RoleType) => {
    setSelectedRole(role);
    setError(null);
    if (role === "BUYER") {
      setEmail("buyer@namadekadda.demo");
      setAdminId("");
      setPassword("NmkBuyer@2026");
    } else if (role === "SUPPLIER") {
      setEmail("supplier@namadekadda.demo");
      setAdminId("");
      setPassword("NmkSupplier@2026");
    } else if (role === "ADMIN") {
      setEmail("");
      setAdminId("12345667");
      setPassword("NmkAdmin@2026");
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Column: Industrial Brand Proposition */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#121622] via-[#0d1017] to-[#0b0d11] p-12 border-r border-[#1f242f] flex-col justify-between relative overflow-hidden">
          <Link href="/" className="flex items-center gap-3 group z-10">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-xs font-mono text-sm">
              NK
            </div>
            <div>
              <span className="font-bold text-slate-100 tracking-wider text-sm font-mono block">
                NAMADE KADDA
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-tight block">
                B2B AI SOURCING MARKETPLACE
              </span>
            </div>
          </Link>

          <div className="space-y-6 z-10 my-auto py-12">
            <span className="inline-block px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-xs font-mono font-medium">
              VERIFIED INDUSTRIAL ECOSYSTEM
            </span>
            <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
              Role-Governed <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Procurement & Sourcing.
              </span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Enterprise portal connecting verified manufacturing suppliers with industrial buyers. Role-isolated access ensures strict confidentiality, legal document compliance, and auditable sourcing.
            </p>

            <div className="space-y-3 pt-4 border-t border-[#1e2432] text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Three-tier role isolation: Buyer, Supplier, and Governance Admin</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Mandatory corporate document verification (PNG, JPEG, PDF)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Secure dual-factor numeric governance credentials for administrators</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono z-10 flex items-center justify-between">
            <span>&copy; 2026 Namade Kadda Platform</span>
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Return to Homepage →
            </Link>
          </div>
        </div>

        {/* Right Column: Role-Based Authentication Form */}
        <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                  Sign in to Namade Kadda
                </h1>
                <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 lg:hidden">
                  Home
                </Link>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select your account role to display your dedicated authentication portal.
              </p>
            </div>

            {/* Role Selection Switcher (Section 1 Requirement) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Choose Your Role
              </label>
              <div className="grid grid-cols-3 gap-2 bg-[#0e1118] p-1.5 rounded-xl border border-[#232938]">
                <button
                  type="button"
                  onClick={() => handleRoleChange("BUYER")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === "BUYER"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#161a24]"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("SUPPLIER")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === "SUPPLIER"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#161a24]"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Supplier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange("ADMIN")}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedRole === "ADMIN"
                      ? "bg-red-600 text-white shadow-md shadow-red-950"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#161a24]"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Administrator</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Pre-fill Panel */}
            <div className="p-3.5 rounded-xl bg-[#141822] border border-[#232938] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Quick Demo Sign-In
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/50">
                  DEVELOPMENT READY
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => prefillDemoCredentials("BUYER")}
                  className={`py-1.5 px-2 rounded border text-[11px] font-medium transition-colors text-center ${
                    selectedRole === "BUYER"
                      ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
                      : "bg-[#101319] hover:bg-[#191f2c] border-[#212735] text-slate-300"
                  }`}
                >
                  Buyer Demo
                </button>
                <button
                  type="button"
                  onClick={() => prefillDemoCredentials("SUPPLIER")}
                  className={`py-1.5 px-2 rounded border text-[11px] font-medium transition-colors text-center ${
                    selectedRole === "SUPPLIER"
                      ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
                      : "bg-[#101319] hover:bg-[#191f2c] border-[#212735] text-slate-300"
                  }`}
                >
                  Supplier Demo
                </button>
                <button
                  type="button"
                  onClick={() => prefillDemoCredentials("ADMIN")}
                  className={`py-1.5 px-2 rounded border text-[11px] font-medium transition-colors text-center ${
                    selectedRole === "ADMIN"
                      ? "bg-red-950/60 border-red-500/60 text-red-300"
                      : "bg-[#101319] hover:bg-[#191f2c] border-[#212735] text-slate-300"
                  }`}
                >
                  Admin ID 12345667
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Dynamic Login Form Determined by Selected Role */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Administrator Mode: Numeric ID Field */}
              {selectedRole === "ADMIN" ? (
                <>
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-[11px] text-red-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Administrator Governance Mode:</strong> Enter your numeric Administrator ID and secret key. Access is restricted to authorized platform auditors.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Numeric Administrator ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={adminId}
                        onChange={(e) => handleAdminIdChange(e.target.value)}
                        placeholder="e.g. 12345667"
                        required
                        className="w-full bg-[#10131a] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-hidden focus:border-red-500"
                      />
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Seed development Administrator ID: <code className="text-red-400 font-mono">12345667</code>
                    </span>
                  </div>
                </>
              ) : (
                /* Buyer and Supplier Mode: Business Email Field */
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {selectedRole === "BUYER" ? "Corporate Buyer Email" : "Supplier Business Email"}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === "BUYER" ? "procurement@aerospace.com" : "sales@precisioncnc.com"}
                      required
                      className="w-full bg-[#10131a] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              {/* Password Field (Common to all roles) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {selectedRole === "ADMIN" ? "Administrator Secret Key / Password" : "Password"}
                  </label>
                  {selectedRole !== "ADMIN" && (
                    <Link
                      href="/forgot-password"
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className={`w-full bg-[#10131a] border border-[#232938] rounded-lg pl-9 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden ${
                      selectedRole === "ADMIN" ? "focus:border-red-500" : "focus:border-emerald-500"
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {selectedRole !== "ADMIN" && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-[#10131a] border-[#232938] text-emerald-500 focus:ring-0"
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-2.5 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 ${
                  selectedRole === "ADMIN"
                    ? "bg-red-600 hover:bg-red-500 shadow-red-950"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950"
                }`}
              >
                {isSubmitting ? (
                  "Verifying Authentication..."
                ) : selectedRole === "ADMIN" ? (
                  <>
                    <span>Authenticate as Administrator</span>
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Sign In to {selectedRole === "BUYER" ? "Buyer Workspace" : "Supplier Workspace"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Registration Links / Security Warnings */}
            {selectedRole === "ADMIN" ? (
              <div className="p-3 rounded-lg bg-[#0e1117] border border-[#1f242f] text-center text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  Protected Infrastructure Account
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Administrator registration is strictly provisioned by internal platform engineering. Self-registration is disabled for platform security.
                </p>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#1f242f]">
                {selectedRole === "BUYER" ? (
                  <>
                    New industrial buyer?{" "}
                    <Link
                      href="/register?role=BUYER"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Register Buyer Company
                    </Link>
                  </>
                ) : (
                  <>
                    New manufacturer or supplier?{" "}
                    <Link
                      href="/register?role=SUPPLIER"
                      className="text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Register Supplier Facility
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
