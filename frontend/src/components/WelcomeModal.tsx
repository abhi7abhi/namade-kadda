"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Building2,
  FileText,
  FileSpreadsheet,
  Package,
  ShieldAlert,
  X,
  ArrowRight,
  Compass
} from "lucide-react";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("nk_onboarding_seen");
      if (!seen) {
        setIsOpen(true);
      }
    } catch (e) {
      // Storage access blocked or unavailable
    }
  }, []);

  // Listen for manual re-open request from Help Center
  useEffect(() => {
    const handleOpenModal = () => setIsOpen(true);
    window.addEventListener("nk-open-welcome", handleOpenModal);
    return () => window.removeEventListener("nk-open-welcome", handleOpenModal);
  }, []);

  // Keyboard navigation & Esc key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleDismiss();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dontShowAgain]);

  const handleDismiss = () => {
    try {
      if (dontShowAgain) {
        localStorage.setItem("nk_onboarding_seen", "true");
      }
    } catch (e) {
      // Ignore storage errors
    }
    setIsOpen(false);
  };

  const handleStartTour = () => {
    handleDismiss();
    window.dispatchEvent(new CustomEvent("nk-start-tour"));
  };

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: "Find suppliers",
      href: "/suppliers",
      icon: Building2,
      desc: "Browse and filter verified industrial fabricators, CNC machine shops and casting foundries."
    },
    {
      num: 2,
      title: "Describe your need",
      href: "/sourcing",
      icon: FileText,
      desc: "Type requirements in plain English. The AI parses parameters without hallucinating specs."
    },
    {
      num: 3,
      title: "Compare quotes",
      href: "/quotations",
      icon: FileSpreadsheet,
      desc: "Review side-by-side offers, adjust Price / Lead / Reliability weights, and accept the best quote."
    },
    {
      num: 4,
      title: "Track the order",
      href: "/orders",
      icon: Package,
      desc: "Follow the generated PO from Confirmed to In Production, Ready to Ship, Shipped and Delivered."
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-xl p-6 rounded-xl bg-[#13171f] border border-[#252b3b] shadow-2xl space-y-5 text-slate-200 outline-hidden focus:ring-1 focus:ring-emerald-500 max-h-[95vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#1f242f]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="welcome-modal-title" className="text-base font-bold text-slate-100 tracking-tight">
                Welcome to Namade Kadda
              </h2>
              <p className="text-xs text-emerald-400 font-mono font-medium">
                AI-Powered B2B Sourcing, Procurement & Manufacturing Marketplace
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close welcome modal"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Pitch */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Namade Kadda is an explainable industrial procurement platform. Instead of browsing a generic product grid, you collaborate with specialist AI agents to structure technical specs, evaluate bids transparently, and manage orders.
        </p>

        {/* 4-Step Workflow */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            The 4-Step Procurement Journey
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  className="p-3 rounded-lg bg-[#0d1015] border border-[#1f2533] space-y-1 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[10px] flex items-center justify-center font-bold">
                      {s.num}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-slate-200">{s.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Student Prototype Disclosure Box */}
        <div className="p-3 rounded-lg bg-[#0d1015] border border-amber-900/40 text-amber-300/90 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-amber-300">Student Prototype Notice:</strong> Real database persistence (PostgreSQL/SQLite) and math models are active. Quotations, payments, external emails, and carrier shipping are simulated demonstration workflows.
          </p>
        </div>

        {/* Actions & Checkbox */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1f242f]">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded bg-[#0d1015] border-[#2b3345] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
            />
            <span>Don't show this welcome dialog again</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-[#181d26] transition-colors"
            >
              Skip, I'll explore
            </button>
            <button
              onClick={handleStartTour}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Take the 2-minute tour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
