"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: string;
  className?: string;
  title?: string;
}

export default function Tooltip({ content, className = "", title }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && visible) {
        setVisible(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  return (
    <span
      ref={containerRef}
      className={`relative inline-flex items-center text-slate-500 hover:text-emerald-400 focus-within:text-emerald-400 transition-colors cursor-help ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        aria-label={title || "Definition & Information"}
        aria-expanded={visible}
        onClick={(e) => {
          e.preventDefault();
          setVisible(!visible);
        }}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="p-0.5 rounded hover:bg-[#1a202c] focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 rounded-md bg-[#161b24] border border-[#2b3345] text-slate-200 text-[11px] font-sans font-normal normal-case tracking-normal shadow-xl z-50 pointer-events-none leading-relaxed text-left block"
        >
          {title && <span className="block font-semibold text-emerald-400 mb-0.5">{title}</span>}
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#2b3345]" />
        </span>
      )}
    </span>
  );
}
