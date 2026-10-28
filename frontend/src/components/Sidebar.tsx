"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileText,
  FileSpreadsheet,
  Package,
  Bot,
  Layers,
  Globe2,
  BarChart3,
  Settings,
  ShieldCheck,
  HelpCircle,
  Compass,
  ShieldAlert,
  LogOut,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  Truck,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Users,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, NotificationItem } from "@/lib/api";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  tourKey?: string;
}

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user?.role === "SUPPLIER") {
      api.getSupplierNotifications()
        .then((items) => {
          setNotifications(items);
          setUnreadCount(items.filter((i) => !i.is_read).length);
        })
        .catch(() => {});
    }
  }, [isMounted, user]);

  const handleTourClick = () => {
    if (onClose) onClose();
    window.dispatchEvent(new CustomEvent("nk-start-tour"));
  };

  // Buyer Workspace Navigation:
  const buyerNavItems: NavItem[] = [
    { name: "AI Procurement Council", href: "/agents", icon: Bot, badge: "6 Agents", tourKey: "nav-agents" },
    { name: "Relevant Suppliers", href: "/relevant-suppliers", icon: Sparkles, badge: "AI Match" },
    { name: "Delivery Status", href: "/orders", icon: Truck, badge: "PO Track" },
    { name: "Dashboard", href: "/dashboard/buyer", icon: LayoutDashboard },
    { name: "Negotiation", href: "/negotiations", icon: MessageSquare },
    { name: "Discover Suppliers", href: "/suppliers", icon: Building2 },
    { name: "Complaints", href: "/buyer/complaints", icon: AlertTriangle, badge: "Support" }
  ];

  // Supplier Workspace Navigation:
  const supplierNavItems: NavItem[] = [
    { name: "AI Seller Assistant", href: "/supplier/ai-assistant", icon: Bot, badge: "6 Roles" },
    { name: "Relevant Buyers", href: "/supplier/relevant-buyers", icon: Sparkles, badge: "AI Match" },
    { name: "Order & Fulfillment", href: "/supplier/orders", icon: Truck },
    { name: "Negotiation", href: "/supplier/negotiations", icon: MessageSquare },
    { name: "Dashboard", href: "/dashboard/supplier", icon: LayoutDashboard },
    { name: "Discover Buyers", href: "/supplier/buyers", icon: Users },
    { name: "Incoming RFQs", href: "/supplier/rfqs", icon: FileText, badge: "New" },
    { name: "Complaints", href: "/supplier/complaints", icon: AlertTriangle, badge: "Support" }
  ];

  const adminNavItems: NavItem[] = [
    { name: "Admin Console", href: "/dashboard/admin", icon: ShieldAlert, badge: "Admin" },
    { name: "Complaint Management", href: "/dashboard/admin/complaints", icon: AlertTriangle, badge: "Cases" },
    { name: "Product Catalogue", href: "/products", icon: ShoppingBag },
    { name: "Sourcing Requests", href: "/dashboard/admin/sourcing-requests", icon: FileText },
    { name: "RFQs & Quotations", href: "/quotations", icon: FileSpreadsheet }
  ];

  // Only evaluate role-specific navigation once mounted on the client to avoid SSR hydration mismatch
  const navItems = (!isMounted || !user)
    ? buyerNavItems
    : user.role === "ADMIN"
    ? adminNavItems
    : user.role === "SUPPLIER"
    ? supplierNavItems
    : buyerNavItems;

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "NK";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        data-tour="sidebar"
        className={`w-64 bg-[#11141b] border-r border-[#1f242f] flex flex-col h-screen fixed left-0 top-0 z-40 select-none transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#1f242f] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 font-mono font-bold text-sm">
              NK
            </div>
            <div>
              <span className="font-bold text-slate-100 tracking-tight text-sm font-mono">NAMADE KADDA</span>
              <span className="block text-[10px] text-emerald-400 font-mono tracking-wider uppercase font-semibold">
                {(!isMounted || !user)
                  ? "Global B2B Sourcing"
                  : user.role === "SUPPLIER"
                  ? "Seller Workspace"
                  : user.role === "ADMIN"
                  ? "Admin Workspace"
                  : "Buyer Workspace"}
              </span>
            </div>
          </Link>
        </div>

        {/* Section 3: Seller Company Identity Area (for Suppliers) */}
        {isMounted && user?.role === "SUPPLIER" && (
          <div className="p-3 bg-[#0d1016] border-b border-[#1e2430] space-y-2">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-100 truncate block">
                    {user.company_name || "Apex Precision Engineering"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate pl-5">
                  {user.country ? `${user.country} · Industrial Hub` : "India · Bangalore"}
                </p>
              </div>

              {/* In-App Notifications Button */}
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 rounded bg-[#171c26] hover:bg-[#202735] text-slate-300 hover:text-white transition-colors"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Badges: Status & Verification */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 text-[9px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                VERIFIED SELLER
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 text-[9px] font-mono">
                ACTIVE
              </span>
            </div>

            {/* Profile Completeness Bar */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Profile Completion:</span>
                <span className="text-emerald-400 font-bold">95%</span>
              </div>
              <div className="w-full bg-[#1b212d] h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full" style={{ width: "95%" }} />
              </div>
            </div>

            {/* Notifications Dropdown Panel */}
            {showNotifications && (
              <div className="p-2 rounded bg-[#151a24] border border-[#232b3b] shadow-xl space-y-1.5 text-xs mt-1">
                <div className="flex items-center justify-between pb-1 border-b border-[#232b3b]">
                  <span className="text-[10px] font-mono font-bold text-slate-200">IN-APP NOTIFICATIONS</span>
                  <button
                    onClick={() => {
                      api.markAllNotificationsRead();
                      setUnreadCount(0);
                    }}
                    className="text-[9px] text-emerald-400 hover:underline"
                  >
                    Mark read
                  </button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {notifications.slice(0, 3).map((n) => (
                    <div key={n.id} className="p-1.5 rounded bg-[#0f1218] border border-[#1d2331]">
                      <p className="text-[11px] font-bold text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">
            {isMounted && user?.role ? `${user.role} WORKSPACE` : "PROCUREMENT PLATFORM"}
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                {...(item.tourKey ? { "data-tour": item.tourKey } : {})}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#181d26]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Support, Tour & Public Site Link */}
        <div className="px-3 py-2 border-t border-[#1a1f2b] bg-[#0e1117] space-y-1">
          <Link
            href="/products"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-emerald-400 hover:bg-[#161a23] transition-colors"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Public Marketplace</span>
          </Link>
          <Link
            href="/help"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              pathname === "/help"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-300 hover:text-emerald-400 hover:bg-[#161a23]"
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Help Center & FAQ</span>
          </Link>
          <button
            type="button"
            onClick={handleTourClick}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#161a23] transition-colors text-left"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Restart Product Tour</span>
          </button>
        </div>

        {/* User Profile Section at Bottom */}
        <div className="p-3 border-t border-[#1f242f] bg-[#0d1015] space-y-2">
          {isMounted && user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-white shrink-0 font-mono">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-200 truncate leading-tight">
                      {user.full_name || "Demo User"}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate font-mono">
                      {user.company_name || "Namade Kadda Partner"}
                    </p>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold shrink-0">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#181c25] text-[10px]">
                <Link
                  href={user.role === "SUPPLIER" ? "/supplier/settings" : "/settings"}
                  onClick={onClose}
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 py-0.5"
                >
                  <Settings className="w-3 h-3 text-slate-500" /> Settings
                </Link>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={async () => {
                    if (onClose) onClose();
                    await logout("/");
                  }}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 py-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  title="Log out and return to public homepage"
                >
                  {isLoggingOut ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <LogOut className="w-3 h-3" />
                  )}
                  <span>{isLoggingOut ? "Exiting..." : "Logout"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-300 truncate">Guest Session</p>
                <p className="text-[9px] text-slate-500 truncate font-mono">DEMO ENVIRONMENT</p>
              </div>
              <Link
                href="/login"
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded font-semibold"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
