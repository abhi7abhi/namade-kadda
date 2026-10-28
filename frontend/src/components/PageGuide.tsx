"use client";

import { useState, useEffect } from "react";
import {
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";

interface PageGuideProps {
  routeKey?: string; // e.g. "overview", "suppliers", "sourcing", etc.
  route?: string; // alias for routeKey
  title?: string;
  steps?: [string, string, string] | string[];
  tip?: string;
  demoNote?: string;
  badge?: string;
  description?: string;
  actionLabel?: string;
}

export default function PageGuide({
  routeKey,
  route,
  title = "How this page works",
  steps,
  tip,
  demoNote,
  badge,
  description,
  actionLabel
}: PageGuideProps) {
  const activeKey = routeKey || route || (title ? title.toLowerCase().replace(/\s+/g, "_") : "default");
  const [isExpanded, setIsExpanded] = useState(true);

  // Load persisted state from localStorage (only in useEffect to prevent hydration error)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`nk_guide_${activeKey}`);
      if (stored !== null) {
        setIsExpanded(stored === "true");
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, [activeKey]);

  const toggleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    try {
      localStorage.setItem(`nk_guide_${activeKey}`, next.toString());
    } catch (e) {
      // Ignore storage errors
    }
  };

  return (
    <div className="rounded-lg bg-[#121620] border border-[#212735] overflow-hidden text-xs transition-all shadow-sm">
      {/* Header bar / Toggle */}
      <button
        type="button"
        onClick={toggleExpand}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#161c28] transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          {badge && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold tracking-wider uppercase">
              {badge}
            </span>
          )}
          <span className="font-semibold text-slate-200">{title}</span>
          {!badge && steps && (
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
              • 3-Step Guide
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actionLabel && (
            <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 hidden md:inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {actionLabel}
            </span>
          )}
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isExpanded ? "Hide guide" : "Show guide"}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-4 pt-2 border-t border-[#1a202d] space-y-3 bg-[#0f121a]">
          {/* Optional Description */}
          {description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {description}
            </p>
          )}

          {/* Steps Grid if provided */}
          {steps && steps.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {steps.map((text, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#131722] border border-[#1e2433] flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[10px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tip & Demo Note Row */}
          {(tip || demoNote) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-[#181d2a] text-[11px]">
              {tip && (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-slate-200 font-semibold">Tip:</strong> {tip}
                  </span>
                </div>
              )}

              {demoNote && (
                <div className="flex items-center gap-1 text-amber-400/90 font-mono text-[10px] bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 shrink-0">
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Demo note: {demoNote}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
