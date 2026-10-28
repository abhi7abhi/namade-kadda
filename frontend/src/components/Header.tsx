"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Sparkles,
  User,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Menu,
  LogOut,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { api, HealthInfo } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch((err) => console.warn("Backend health check failed:", err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/suppliers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sampleNotifications = [
    {
      id: "1",
      title: "Quotation received from Bharat ForgeTech",
      time: "10 mins ago",
      type: "demo",
      unread: true
    },
    {
      id: "2",
      title: "Order PO-2026-001 advanced to IN_PRODUCTION",
      time: "1 hour ago",
      type: "demo",
      unread: false
    },
    {
      id: "3",
      title: "Multi-Agent Procurement run RUN-2026-001 synthesized",
      time: "2 hours ago",
      type: "demo",
      unread: false
    }
  ];

  return (
    <header className="h-16 bg-[#11141b]/95 backdrop-blur-xs border-b border-[#1f242f] sticky top-0 z-20 px-4 md:px-6 flex items-center justify-between gap-3">
      {/* Mobile Hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#181d26] md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <form onSubmit={handleSearchSubmit} className="relative w-full" data-tour="search">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers, materials, parts, or RFQs..."
            className="w-full bg-[#161a22] border border-[#232938] rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Persistent AI Mode Indicator */}
        <div
          data-tour="ai-mode"
          className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#161a23] border border-[#232938] text-[11px] font-mono"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">AI Mode:</span>
          {health?.ai_mode === "LIVE" ? (
            <span className="text-emerald-400 font-semibold">LIVE LLM</span>
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              DEMO (DETERMINISTIC)
            </span>
          )}
        </div>

        {/* Action: New Sourcing Request */}
        <button
          data-tour="new-sourcing"
          onClick={() => router.push("/sourcing")}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Sourcing</span>
          <span className="sm:hidden">Sourcing</span>
        </button>

        {/* Help Center Button */}
        <Link
          href="/help"
          title="Help Center & Product Tour"
          className="p-2 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-[#181d26] transition-colors"
          aria-label="Open Help Center"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#181d26] transition-colors relative"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#161a23] border border-[#262c3d] rounded-lg shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#232938] mb-2">
                <span className="text-xs font-semibold text-slate-200">Platform Notifications</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40">
                  DEMO SIMULATION
                </span>
              </div>
              <div className="space-y-2">
                {sampleNotifications.map((n) => (
                  <div key={n.id} className="p-2 rounded bg-[#101319] border border-[#1d222e] text-xs">
                    <p className="text-slate-200 font-medium">{n.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                      <span>{n.time}</span>
                      <span className="text-emerald-400">Simulated event</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile */}
        <div className="relative">
          {isMounted && isAuthenticated && user ? (
            <>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#181d26] transition-colors"
                aria-label="User profile menu"
              >
                <div className="w-7 h-7 rounded-full bg-[#202634] border border-[#2c3447] flex items-center justify-center text-xs font-semibold text-emerald-400">
                  {user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "US"}
                </div>
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-medium text-slate-200 leading-none">{user.full_name}</p>
                  <p className="text-[10px] text-emerald-400 font-mono leading-none mt-1">{user.role}</p>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#161a23] border border-[#262c3d] rounded-lg shadow-xl p-3 z-50 text-xs space-y-2">
                  <div className="pb-2 border-b border-[#232938]">
                    <p className="font-semibold text-slate-200">{user.full_name}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{user.email}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-emerald-400 text-[10px] font-mono font-bold">ROLE: {user.role}</span>
                      <span className="text-slate-500 text-[10px]">{user.company_name}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/dashboard");
                      }}
                      className="w-full text-left py-1 text-slate-300 hover:text-emerald-400 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Workspace Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/settings");
                      }}
                      className="w-full text-left py-1 text-slate-300 hover:text-emerald-400 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Profile & Environment Settings</span>
                    </button>
                    {user.role !== "ADMIN" && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push(user.role === "SUPPLIER" ? "/register/supplier/documents" : "/register/buyer/documents");
                        }}
                        className="w-full text-left py-1 text-slate-300 hover:text-emerald-400 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Compliance Documents</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push("/");
                      }}
                      className="w-full text-left py-1 text-slate-300 hover:text-emerald-400 flex items-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Public Marketplace Home</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#232938]">
                    <button
                      disabled={isLoggingOut}
                      onClick={async () => {
                        setShowUserMenu(false);
                        await logout("/");
                      }}
                      className="w-full text-left py-1 text-red-400 hover:text-red-300 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isLoggingOut ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
