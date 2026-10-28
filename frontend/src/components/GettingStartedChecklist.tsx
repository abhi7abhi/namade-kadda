"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  X,
  Compass,
  Trophy
} from "lucide-react";
import { AnalyticsDashboardResponse } from "@/lib/api";

interface GettingStartedProps {
  metrics?: AnalyticsDashboardResponse | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  isComplete: boolean;
  desc: string;
}

export default function GettingStartedChecklist({ metrics }: GettingStartedProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    try {
      if (localStorage.getItem("nk_dismiss_checklist") === "true") {
        setIsDismissed(true);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    let visitedSuppliers = false;
    let visitedSourcing = false;
    let visitedQuotes = false;
    let advancedOrder = false;
    let runAgents = false;

    try {
      visitedSuppliers = localStorage.getItem("nk_visited_suppliers") === "true";
      visitedSourcing = localStorage.getItem("nk_visited_sourcing") === "true";
      visitedQuotes = localStorage.getItem("nk_visited_quotations") === "true";
      advancedOrder = localStorage.getItem("nk_advanced_order") === "true";
      runAgents = localStorage.getItem("nk_run_agents") === "true";
    } catch (e) {
      // Ignore
    }

    // Auto-tick based on real database records
    const hasSourcingInDb = Boolean(metrics && metrics.total_sourcing_requests > 0);
    const hasOrderAccepted = Boolean(metrics && metrics.active_orders > 0);
    const hasStatusAdvanced = Boolean(
      metrics &&
      metrics.orders_by_status?.some((s) =>
        ["IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(s.name) && s.count > 0
      )
    );

    const checklist: ChecklistItem[] = [
      {
        id: "suppliers",
        label: "Browse verified suppliers",
        href: "/suppliers",
        isComplete: visitedSuppliers || (metrics ? metrics.total_suppliers > 0 : false),
        desc: "Filter industrial machine shops and fabricators by certified process."
      },
      {
        id: "sourcing",
        label: "Create a sourcing request",
        href: "/sourcing",
        isComplete: visitedSourcing || hasSourcingInDb,
        desc: "Describe what you need in plain English and save structured specs."
      },
      {
        id: "quotations",
        label: "Compare quotes and accept one",
        href: "/quotations",
        isComplete: visitedQuotes || hasOrderAccepted,
        desc: "Adjust weighted scoring sliders and issue a contract Purchase Order."
      },
      {
        id: "orders",
        label: "Advance an order status",
        href: "/orders",
        isComplete: advancedOrder || hasStatusAdvanced,
        desc: "Follow the audited lifecycle through production milestones."
      },
      {
        id: "agents",
        label: "Run the specialist AI agents",
        href: "/agents",
        isComplete: runAgents,
        desc: "Synthesize an end-to-end procurement plan across 6 agent roles."
      }
    ];

    setItems(checklist);
  }, [metrics]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("nk_dismiss_checklist", "true");
    } catch (e) {
      // Ignore
    }
  };

  if (isDismissed || items.length === 0) return null;

  const completedCount = items.filter((i) => i.isComplete).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  // Automatically hide when all 5 are completed
  if (completedCount === items.length) return null;

  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-[#121722] via-[#141a27] to-[#121620] border border-emerald-500/30 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2638]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              <span>Getting Started Checklist</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-800/40">
                {completedCount} of {items.length} completed ({progressPercent}%)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Complete these 5 core milestones to master the Namade Kadda procurement workspace.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-slate-300 p-1 rounded"
          title="Dismiss checklist"
          aria-label="Dismiss checklist"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0d1015] rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 5 Checkable Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`p-2.5 rounded-md border transition-all block space-y-1 group ${
              item.isComplete
                ? "bg-[#0f141d] border-emerald-900/40 text-slate-300"
                : "bg-[#10131b] border-[#1e2433] hover:border-emerald-500/40 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {item.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0 group-hover:text-emerald-400 transition-colors" />
              )}
              <span className={`font-semibold truncate text-[11px] ${item.isComplete ? "text-emerald-400/90 line-through" : "text-slate-200"}`}>
                {item.label}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
