"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Check
} from "lucide-react";

interface TourStep {
  selector: string;
  title: string;
  content: string;
  targetPage?: string; // Route where element is found
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="sidebar"]',
    title: "1. Navigation Hub",
    content: "Everything lives here. Follow the pages from top to bottom for the full procurement workflow—from Discover Suppliers to Orders and Analytics."
  },
  {
    selector: '[data-tour="search"]',
    title: "2. Global Search",
    content: "Search suppliers, materials, machining processes, or active RFQs from anywhere across the platform."
  },
  {
    selector: '[data-tour="new-sourcing"]',
    title: "3. Quick Sourcing",
    content: "Start here. Describe what industrial part or custom assembly you need to buy in plain English."
  },
  {
    selector: '[data-tour="ai-mode"]',
    title: "4. Explainable AI Telemetry",
    content: "DEMO means offline deterministic AI running locally without external credentials. LIVE means a connected cloud LLM."
  },
  {
    selector: '[data-tour="dashboard-cards"]',
    title: "5. Real Database Metrics",
    content: "Live numbers aggregated directly from your PostgreSQL/SQLite database tables—no mock figures.",
    targetPage: "/"
  },
  {
    selector: '[data-tour="nav-agents"]',
    title: "6. Specialist AI Council",
    content: "Ask the 6-agent council (Procurement, Supplier Matching, Engineering, Trade, Negotiation, Coordinator) for an actionable procurement plan."
  }
];

export default function ProductTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Listen for custom event to trigger tour
  useEffect(() => {
    const handleStartTour = () => {
      // If not on homepage, navigate to / to ensure all tour targets are visible
      if (pathname !== "/") {
        router.push("/");
      }
      setCurrentStepIndex(0);
      setIsActive(true);
    };

    window.addEventListener("nk-start-tour", handleStartTour);
    return () => window.removeEventListener("nk-start-tour", handleStartTour);
  }, [pathname, router]);

  // Update target bounding box
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStepIndex];
    if (!step) return;

    const element = document.querySelector(step.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      // Ensure target is in view
      element.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      // If target element is missing on current page, skip step or find next
      setTargetRect(null);
    }
  }, [isActive, currentStepIndex]);

  useEffect(() => {
    if (!isActive) return;

    updateTargetPosition();

    const handleResizeOrScroll = () => {
      updateTargetPosition();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isActive, currentStepIndex, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, currentStepIndex]);

  const handleClose = () => {
    setIsActive(false);
    setTargetRect(null);
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate Tooltip Coordinates with bounds checking
  let tooltipTop = 100;
  let tooltipLeft = 20;

  if (targetRect) {
    const isSidebarTarget = step.selector.includes("sidebar") || step.selector.includes("nav-agents");
    
    if (isSidebarTarget) {
      // Place to right of sidebar
      tooltipLeft = targetRect.right + 16;
      tooltipTop = Math.max(20, targetRect.top + (targetRect.height / 2) - 80);
    } else {
      // Place below target
      tooltipTop = targetRect.bottom + 12;
      tooltipLeft = targetRect.left + (targetRect.width / 2) - 160;
    }

    // Window bounds checking
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    if (tooltipLeft + 320 > windowWidth) {
      tooltipLeft = windowWidth - 336;
    }
    if (tooltipLeft < 16) {
      tooltipLeft = 16;
    }
    if (tooltipTop + 200 > windowHeight) {
      tooltipTop = targetRect.top - 210;
      if (tooltipTop < 16) tooltipTop = 16;
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto" role="dialog" aria-modal="true">
      {/* Dark Spotlight Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={handleClose}
      />

      {/* Target Element Highlight Cutout Box */}
      {targetRect && (
        <div
          className="fixed rounded-lg border-2 border-emerald-400 bg-emerald-500/10 pointer-events-none transition-all duration-300 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
          style={{
            top: `${Math.max(0, targetRect.top - 4)}px`,
            left: `${Math.max(0, targetRect.left - 4)}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        ref={cardRef}
        className="fixed z-50 w-80 p-4 rounded-xl bg-[#161a24] border border-[#2d3549] shadow-2xl space-y-3 text-slate-200 transition-all duration-200 animate-in fade-in"
        style={{
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`
        }}
      >
        {/* Header: Title & Close */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">{step.title}</h3>
              <span className="text-[10px] font-mono text-emerald-400">Step {currentStepIndex + 1} of {TOUR_STEPS.length}</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Exit tour"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1f2533]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {step.content}
        </p>

        {/* Progress Dots & Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-[#232938]">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "bg-emerald-400 w-3"
                    : idx < currentStepIndex
                    ? "bg-emerald-800"
                    : "bg-[#273042]"
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="px-2 py-1 rounded bg-[#10131a] hover:bg-[#1a202d] text-slate-300 text-xs font-medium border border-[#232938]"
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1"
            >
              <span>{isLast ? "Finish" : "Next"}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
