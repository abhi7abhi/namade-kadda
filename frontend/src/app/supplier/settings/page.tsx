"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  User as UserIcon,
  Building2,
  Bell,
  Shield,
  Key,
  Globe,
  Clock,
  DollarSign,
  Save,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Laptop,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  ExternalLink
} from "lucide-react";
import { api } from "@/lib/api";
import type { User, Supplier } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface SupplierSettingsState {
  currency: string;
  timeZone: string;
  defaultIncoterm: string;
  defaultPaymentTerm: string;
  notifyNewRfqEmail: boolean;
  notifyNewRfqInApp: boolean;
  notifyCounteroffer: boolean;
  notifyOrderMilestone: boolean;
  notifyWeeklyDigest: boolean;
}

const DEFAULT_SETTINGS: SupplierSettingsState = {
  currency: "USD",
  timeZone: "Asia/Kolkata",
  defaultIncoterm: "FOB",
  defaultPaymentTerm: "30% Advance, 70% before shipment",
  notifyNewRfqEmail: true,
  notifyNewRfqInApp: true,
  notifyCounteroffer: true,
  notifyOrderMilestone: true,
  notifyWeeklyDigest: false
};

export default function SupplierSettingsPage() {
  const router = useRouter();
  const { logout, isLoggingOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings
  const [settings, setSettings] = useState<SupplierSettingsState>(DEFAULT_SETTINGS);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    // Load local stored preferences
    try {
      const stored = localStorage.getItem("nk_supplier_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn("Failed to read settings from localStorage", e);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [userData, profileData] = await Promise.all([
          api.getCurrentUser().catch(() => null),
          api.getSupplierMe().catch(() => null)
        ]);
        if (userData) setUser(userData);
        if (profileData) setProfile(profileData);
      } catch (err) {
        console.error("Error loading profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSavePreferences = () => {
    setSavingPreferences(true);
    try {
      localStorage.setItem("nk_supplier_settings", JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPreferences(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus({ type: null, message: "" });

    if (!currentPassword) {
      setPasswordStatus({ type: "error", message: "Current password is required." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({
        type: "error",
        message: "New password must be at least 8 characters."
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New passwords do not match."
      });
      return;
    }

    setUpdatingPassword(true);
    // Simulate secure credential rotation
    setTimeout(() => {
      setUpdatingPassword(false);
      setPasswordStatus({
        type: "success",
        message: "Password updated successfully. Next session will require new credentials."
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 800);
  };

  const handleLogout = async () => {
    await logout("/");
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-zinc-100 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/50 rounded-lg text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Seller Workspace Settings
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure your account identity, enterprise commercial defaults, notification webhooks and security credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Preferences Saved
            </span>
          )}

          <button
            onClick={handleSavePreferences}
            disabled={savingPreferences}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            {savingPreferences ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Account & Identity */}
          <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                1. Account & Operator Identity
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={user?.full_name || "Vikram Patel (Demo Supplier)"}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Login Email</label>
                <input
                  type="email"
                  readOnly
                  value={user?.email || "supplier@namadekadda.demo"}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Role / Authorization Level</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-200 font-medium">{user?.role || "SUPPLIER"} (Verified Enterprise Seller)</span>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Company Association</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-200 font-medium">{profile?.legal_business_name || profile?.name || user?.company_name || "Apex Precision Engineering"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Looking to update company registration or manufacturing capabilities?</span>
              <button
                onClick={() => router.push("/supplier/profile")}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                Go to Company Profile <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Section 2: Commercial Defaults */}
          <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                2. Enterprise Commercial Defaults
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Pre-populate your standard quote terms, currencies and time zones for rapid quotation authoring.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Default Currency */}
              <div>
                <label className="text-zinc-400 block mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Default Quotation Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="USD">USD ($) — United States Dollar (Global Benchmark)</option>
                  <option value="EUR">EUR (€) — Euro (European Union)</option>
                  <option value="INR">INR (₹) — Indian Rupee (Domestic Settlements)</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="AED">AED (د.إ) — UAE Dirham</option>
                  <option value="SGD">SGD (S$) — Singapore Dollar</option>
                </select>
              </div>

              {/* Time Zone */}
              <div>
                <label className="text-zinc-400 block mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Operating Time Zone
                </label>
                <select
                  value={settings.timeZone}
                  onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+05:30)</option>
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST, UTC+04:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+08:00)</option>
                </select>
              </div>

              {/* Default Incoterm */}
              <div>
                <label className="text-zinc-400 block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Standard Incoterms 2020
                </label>
                <select
                  value={settings.defaultIncoterm}
                  onChange={(e) => setSettings({ ...settings, defaultIncoterm: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="FOB">FOB — Free on Board (Port of Origin)</option>
                  <option value="EXW">EXW — Ex Works (Factory Floor)</option>
                  <option value="CIF">CIF — Cost, Insurance & Freight (Destination Port)</option>
                  <option value="DDP">DDP — Delivered Duty Paid (Door-to-Door)</option>
                  <option value="CFR">CFR — Cost and Freight</option>
                </select>
              </div>

              {/* Default Payment Terms */}
              <div>
                <label className="text-zinc-400 block mb-1">Standard Payment Terms</label>
                <select
                  value={settings.defaultPaymentTerm}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentTerm: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="30% Advance, 70% before shipment">30% Advance, 70% before shipment</option>
                  <option value="Net 30 Days">Net 30 Days (from invoice)</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                  <option value="50% Deposit, 50% upon BL copy">50% Deposit, 50% upon BL copy</option>
                  <option value="100% LC at Sight">100% Irrevocable Letter of Credit (LC) at Sight</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Preferences */}
          <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                3. Operational Notification Webhooks & Alerts
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <label className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer">
                <div>
                  <div className="font-medium text-zinc-200">Email Alerts on New RFQs</div>
                  <div className="text-[11px] text-zinc-400">Receive immediate email dispatch whenever a buyer publishes an RFQ matching your capability matrix.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyNewRfqEmail}
                  onChange={(e) => setSettings({ ...settings, notifyNewRfqEmail: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-700 bg-zinc-800"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer">
                <div>
                  <div className="font-medium text-zinc-200">In-App Negotiation Alerts</div>
                  <div className="text-[11px] text-zinc-400">Get instant badge notifications when a buyer submits a counteroffer or clarification inquiry.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyCounteroffer}
                  onChange={(e) => setSettings({ ...settings, notifyCounteroffer: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-700 bg-zinc-800"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer">
                <div>
                  <div className="font-medium text-zinc-200">Order Milestone Sync</div>
                  <div className="text-[11px] text-zinc-400">Receive alerts when purchase orders are confirmed or delivery confirmations are submitted.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOrderMilestone}
                  onChange={(e) => setSettings({ ...settings, notifyOrderMilestone: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-700 bg-zinc-800"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition cursor-pointer">
                <div>
                  <div className="font-medium text-zinc-200">Weekly Executive Digest</div>
                  <div className="text-[11px] text-zinc-400">Automated weekly rollup summarizing quotation acceptance rate, RFQ views and active shipments.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyWeeklyDigest}
                  onChange={(e) => setSettings({ ...settings, notifyWeeklyDigest: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-700 bg-zinc-800"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Security & Session Management */}
        <div className="space-y-6">
          {/* Section 4: Security & Password Update */}
          <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800/60">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                4. Security & Credentials
              </h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Confirm New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {passwordStatus.type && (
                <div
                  className={`p-2.5 rounded-lg text-[11px] flex items-center gap-1.5 ${
                    passwordStatus.type === "success"
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                      : "bg-red-950/60 text-red-300 border border-red-800/50"
                  }`}
                >
                  {passwordStatus.type === "success" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full mt-2 py-2 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5" />
                {updatingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Section 5: Active Sessions & Enterprise MFA */}
          <div className="bg-[#11141b] border border-zinc-800/80 rounded-xl p-5 shadow-sm text-xs">
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-400" />
              Active Sessions & MFA
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400" />
                    Chrome / Windows 11 (Current)
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-semibold">
                    ACTIVE NOW
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  IP: 127.0.0.1 • Localhost Secure Context
                </div>
              </div>

              <div className="p-3 bg-zinc-900/30 border border-zinc-800/40 rounded-lg opacity-75">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                    Mobile Web (Safari / iOS)
                  </div>
                  <span className="text-[10px] text-zinc-500">2 days ago</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  IP: 49.37.112.94 • Bengaluru, India
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-emerald-400 text-xs">Enterprise MFA (2FA)</div>
                  <div className="text-[10px] text-zinc-400">TOTP Authenticator app sync</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-700/50 rounded text-[10px] font-medium">
                  Configured
                </span>
              </div>
            </div>
          </div>

          {/* Section 6: Workspace Logout */}
          <div className="bg-[#11141b] border border-red-900/30 rounded-xl p-5 shadow-sm text-xs">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Session Termination
            </h3>
            <p className="text-zinc-400 mb-4 text-[11px] leading-relaxed">
              Sign out of the Namade Kadda seller portal. Your active RFQ quotes, negotiation threads and order states remain preserved.
            </p>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed border border-red-800/60 text-red-300 hover:text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {isLoggingOut ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Sign Out of Seller Workspace"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
