"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-[#12161f] border-b border-[#232938] px-6 py-2 text-xs flex items-center justify-between text-slate-400">
      <div className="flex items-center gap-2">
        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 font-mono text-[10px] font-bold">
          STUDENT PROTOTYPE
        </span>
        <span>
          Real relational database persistence active. AI workflows run deterministically offline (or via configured LLM). Quotation and logistics actions are simulated demo transactions.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-500 hover:text-slate-300 ml-4"
        title="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
