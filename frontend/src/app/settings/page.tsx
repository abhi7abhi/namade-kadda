"use client";

import { useEffect, useState } from "react";
import PageGuide from "@/components/PageGuide";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  User,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { api, HealthInfo } from "@/lib/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div className="pb-2 border-b border-[#1f242f]">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Platform Configuration & System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect backend database connection status, AI execution providers, role permissions, and deployment parameters.
        </p>
      </div>

      {/* Page Guide */}
      <PageGuide
        route="settings"
        steps={[
          "Check core system health, database connection state, and active AI orchestration mode.",
          "Inspect the active B2B Buyer role and organization profile parameters.",
          "Review instructions for switching from offline DEMO mode to a LIVE cloud LLM provider."
        ]}
        tip="Add LLM_PROVIDER=groq and your API key to backend/.env to connect cloud models."
        demoNote="Current session operates under a simulated B2B Enterprise Buyer identity."
      />

      {/* Health & Status Card */}
      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Core System Health & Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-[#10131a] border border-[#1f2533]">
            <span className="text-[10px] text-slate-500 uppercase block">API Status</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {health?.status?.toUpperCase() || "CONNECTING..."}
            </span>
          </div>

          <div className="p-3 rounded bg-[#10131a] border border-[#1f2533]">
            <span className="text-[10px] text-slate-500 uppercase block">Database Engine</span>
            <span className="text-slate-200 font-bold flex items-center gap-1 mt-1">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              PostgreSQL / SQLAlchemy
            </span>
          </div>

          <div className="p-3 rounded bg-[#10131a] border border-[#1f2533]">
            <span className="text-[10px] text-slate-500 uppercase block">Active AI Provider</span>
            <span className="text-amber-400 font-bold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {health?.ai_mode === "LIVE" ? "Live Cloud LLM" : "Deterministic Demo"}
            </span>
          </div>
        </div>
      </div>

      {/* Role & Prototype Identity */}
      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Active Identity & RBAC Matrix</span>
        </h3>
        <p className="text-xs text-slate-400">
          The prototype currently executes under the authenticated Buyer context.
        </p>
        <div className="p-3 rounded bg-[#10131a] border border-[#1f2533] space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">User: Rajesh Sharma</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              ROLE: BUYER
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Organization: Apex Dynamics Pvt Ltd</p>
          <p className="text-[11px] text-slate-500">Email: buyer@industrial-corp.com</p>
        </div>
      </div>

      {/* Environment Configuration Guidelines */}
      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3 text-xs">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Security & Environment Variables</span>
        </h3>
        <p className="text-slate-400">
          To connect a live cloud LLM (Groq, OpenAI, or Gemini), update backend <code>.env</code> file:
        </p>
        <pre className="p-3 rounded bg-[#0e1117] border border-[#1c222e] text-slate-300 font-mono text-[11px] overflow-x-auto">
{`# Backend Environment Configuration (.env)
LLM_PROVIDER=groq               # groq, openai, gemini, or demo
LLM_API_KEY=gsk_your_api_key_here
LLM_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite:///./namade_kadda.db  # or postgresql://user:pass@localhost:5432/namade_kadda
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`}
        </pre>
        <div className="p-3 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300 text-[11px]">
          API keys and secrets are never returned in client network bundles or browser code. When no API key is set, the application operates deterministically without external API costs or network failures.
        </div>
      </div>
    </div>
  );
}
