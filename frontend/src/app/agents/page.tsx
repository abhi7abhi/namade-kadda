"use client";

import { useEffect, useState, Suspense } from "react";
import PageGuide from "@/components/PageGuide";
import ComponentIntelligenceExplorer from "@/components/ComponentIntelligenceExplorer";
import {
  Bot,
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight,
  UserCheck,
  Network
} from "lucide-react";
import { api, AgentRunOut, AgentStepResult } from "@/lib/api";

const AGENT_ROLE_BADGES: Record<string, { bg: string; text: string; icon: string }> = {
  "Procurement Agent": { bg: "bg-blue-950/80 border-blue-800", text: "text-blue-400", icon: "Strategy" },
  "Supplier Matching Agent": { bg: "bg-purple-950/80 border-purple-800", text: "text-purple-400", icon: "Discovery" },
  "Engineering Agent": { bg: "bg-amber-950/80 border-amber-800", text: "text-amber-400", icon: "Specs" },
  "Trade & Compliance Agent": { bg: "bg-cyan-950/80 border-cyan-800", text: "text-cyan-400", icon: "Customs" },
  "Negotiation Agent": { bg: "bg-rose-950/80 border-rose-800", text: "text-rose-400", icon: "Offers" },
  "Coordinator Agent": { bg: "bg-emerald-950/80 border-emerald-800", text: "text-emerald-400", icon: "Synthesis" }
};

export default function AgentsWorkspacePage() {
  const [activeTab, setActiveTab] = useState<"intelligence" | "council">("intelligence");
  const [prompt, setPrompt] = useState(
    "Evaluate procurement strategy for 500 stainless brackets: balance delivery lead time against regional manufacturing costs."
  );
  const [currentRun, setCurrentRun] = useState<AgentRunOut | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  });

  const fetchHistoryAndLatest = async () => {
    try {
      const runs = await api.getAgentRunHistory();
      setHistory(runs);
      if (runs.length > 0) {
        const latest = await api.getAgentRun(runs[0].id);
        setCurrentRun(latest);
      }
    } catch (err: any) {
      console.warn("Could not fetch history:", err);
    }
  };

  useEffect(() => {
    fetchHistoryAndLatest();
  }, []);

  const handleRunWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsRunning(true);
    setError(null);

    try {
      const run = await api.runAgentWorkflow({
        prompt: prompt.trim(),
        force_demo_mode: false
      });
      setCurrentRun(run);
      try {
        localStorage.setItem("nk_run_agents", "true");
      } catch {
        // ignore
      }
      await fetchHistoryAndLatest();
    } catch (err: any) {
      setError(err.message || "Failed to execute multi-agent workflow");
    } finally {
      setIsRunning(false);
    }
  };

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">AI Multi-Agent Procurement Workspace</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              6 SPECIALIST ROLES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explainable agent orchestration pipeline with bounded tools, inspectable reasoning steps, and audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#141822] border border-[#212735] text-slate-400">
            {currentRun?.mode === "LIVE" ? "Live Provider Connected" : "SIMULATED AGENT OUTPUT"}
          </span>
        </div>
      </div>

      {/* Workspace Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1f242f] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("intelligence")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "intelligence"
              ? "border-emerald-500 text-emerald-400 bg-[#161a23]/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Two-Way Component Intelligence</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            NEW
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("council")}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "council"
              ? "border-emerald-500 text-emerald-400 bg-[#161a23]/60"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bot className="w-4 h-4 text-blue-400" />
          <span>Multi-Agent Procurement Council</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#161d2a] text-slate-400 border border-[#232a39]">
            6 ROLES
          </span>
        </button>
      </div>

      {activeTab === "intelligence" ? (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Component Intelligence...</div>}>
          <ComponentIntelligenceExplorer />
        </Suspense>
      ) : (
        <>
          {/* Page Guide */}
          <PageGuide
        route="agents"
        steps={[
          "Type your procurement objective or click one of the suggested prompt templates.",
          "Watch all 6 specialist agents execute sequentially across the live telemetry timeline.",
          "Expand any agent's step to inspect deliverables, declared assumptions, and warning limitations."
        ]}
        tip="Pay close attention to 'Approval Required' badges before taking commercial actions on agent recommendations."
        demoNote="Runs offline deterministic Python logic unless live LLM provider is configured in backend/.env."
      />

      {error && (
        <div className="p-4 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 block mb-0.5">Procurement Council Connection Notice</span>
              <span>{error}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => handleRunWorkflow(e)}
            disabled={isRunning}
            className="px-3.5 py-1.5 rounded bg-red-900/80 hover:bg-red-800 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            <span>Retry Execution</span>
          </button>
        </div>
      )}

      {/* Workflow Prompt Dispatcher */}
      <div className="p-5 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Direct the Multi-Agent Procurement Council:</span>
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Suggested:</span>
            <button
              type="button"
              onClick={() => setPrompt("Smartphone")}
              className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition-colors font-bold"
            >
              Smartphone (Product BOM)
            </button>
            <button
              type="button"
              onClick={() => setPrompt("Chip")}
              className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors font-bold"
            >
              Chip (Component Applications)
            </button>
            <button
              type="button"
              onClick={() =>
                setPrompt("Dual-sourcing strategy for 1,000 CNC stainless flange adapters under $18/unit.")
              }
              className="text-[10px] px-2 py-0.5 rounded bg-[#101319] hover:bg-[#1a202c] text-emerald-400 border border-emerald-900/40 transition-colors"
            >
              CNC Flanges
            </button>
            <button
              type="button"
              onClick={() =>
                setPrompt("Delivery lead-time optimization for 500 sheet metal mounting brackets.")
              }
              className="text-[10px] px-2 py-0.5 rounded bg-[#101319] hover:bg-[#1a202c] text-amber-400 border border-amber-900/40 transition-colors"
            >
              Lead Time
            </button>
          </div>
        </div>
        <form onSubmit={handleRunWorkflow} className="space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isRunning}
            rows={2}
            placeholder="Type your procurement objective or product name (e.g. Smartphone, Chip, CNC Flanges)..."
            className="w-full bg-[#10131a] border border-[#232938] rounded-md p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 disabled:opacity-60"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              Dispatches task across 6 specialist roles: Strategy, Matching, Engineering, Trade, Negotiation & Coordinator.
            </div>

            <button
              type="submit"
              disabled={isRunning || !prompt.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-2 shadow-xs transition-colors"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing 6-Agent Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Run Agent Workflow</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Two-Column Execution Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Run History Sidebar (1 col) */}
        <div className="p-4 rounded-lg bg-[#141821] border border-[#212735] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#212735]">
            <span className="text-xs font-semibold text-slate-200">Execution History</span>
            <span className="text-[10px] font-mono text-slate-500">{history.length} RUNS</span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No previous runs recorded. Launch your first multi-agent workflow above.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const isSelected = currentRun?.id === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={async () => {
                      const run = await api.getAgentRun(h.id);
                      setCurrentRun(run);
                    }}
                    className={`w-full text-left p-2.5 rounded border text-xs transition-all ${
                      isSelected
                        ? "bg-[#191f2c] border-emerald-500/50"
                        : "bg-[#10131a] border-[#212735] hover:border-[#2f384c]"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-emerald-400 font-bold">{h.run_code}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                        {h.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{h.prompt}</p>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">
                      {new Date(h.started_at).toLocaleTimeString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Agent Activity Timeline & Synthesis (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {currentRun ? (
            <>
              {/* Executive Synthesis Card */}
              <div className="p-5 rounded-lg bg-gradient-to-r from-[#141a24] to-[#171d2b] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-slate-100">
                      Coordinator Agent — Executive Synthesis
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono">
                    Run ID: {currentRun.run_code}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentRun.summary || "Workflow completed successfully."}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] text-slate-400 font-mono">
                  <span>Model: {currentRun.model}</span>
                  <span>Provider: {currentRun.provider}</span>
                  <span>Mode: {currentRun.mode === "DEMO" ? "SIMULATED AGENT OUTPUT" : "LIVE"}</span>
                </div>
              </div>

              {/* Specialist Steps Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Specialist Step Telemetry ({currentRun.events.length} Agents)
                </h4>

                {currentRun.events.map((event, idx) => {
                  const badge = AGENT_ROLE_BADGES[event.agent_name] || {
                    bg: "bg-slate-900",
                    text: "text-slate-300",
                    icon: "Role"
                  };
                  const isExpanded = expandedSteps[idx] ?? true;

                  return (
                    <div
                      key={idx}
                      className="rounded-lg bg-[#141821] border border-[#212735] overflow-hidden transition-all"
                    >
                      {/* Step Header */}
                      <button
                        type="button"
                        onClick={() => toggleStep(idx)}
                        className="w-full text-left p-3.5 flex items-center justify-between hover:bg-[#181d27] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-[#10131a] border border-[#212735] text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                            {event.execution_order}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${badge.text}`}>
                                {event.agent_name}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge.bg} ${badge.text}`}>
                                {badge.icon}
                              </span>
                              {event.human_approval_required && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                                  <UserCheck className="w-2.5 h-2.5" /> Approval Required
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{event.task}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-slate-500">
                            {event.mode === "DEMO" ? "SIMULATED OUTPUT" : event.mode}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Step Details */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-[#1e2432] space-y-3 text-xs bg-[#11141c]">
                          {/* Structured Result Output */}
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                              Agent Deliverable & Decisions
                            </span>
                            <pre className="p-3 rounded bg-[#0d0f15] border border-[#1c222e] text-slate-200 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                              {JSON.stringify(event.result, null, 2)}
                            </pre>
                          </div>

                          {/* Assumptions & Warnings */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {event.assumptions.length > 0 && (
                              <div className="p-2.5 rounded bg-[#101319] border border-[#1c212c]">
                                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                                  Declared Assumptions
                                </span>
                                <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                                  {event.assumptions.map((a, i) => (
                                    <li key={i}>{a}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {event.warnings.length > 0 && (
                              <div className="p-2.5 rounded bg-amber-950/20 border border-amber-900/40">
                                <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Limitations & Warnings
                                </span>
                                <ul className="list-disc pl-4 space-y-0.5 text-amber-300 text-[11px]">
                                  {event.warnings.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="p-12 text-center rounded-lg bg-[#141821] border border-[#212735] text-slate-500 text-xs">
              <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <span>No agent run selected. Run a new workflow above.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )}
</div>
  );
}
