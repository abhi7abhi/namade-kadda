"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  FileText,
  DollarSign,
  Package,
  Layers,
  Scale,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Users,
  TrendingDown,
  Activity
} from "lucide-react";
import { api, SupplierAIAssistantResult } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import PageGuide from "@/components/PageGuide";
import CustomerRetentionWorkspace from "@/components/supplier/CustomerRetentionWorkspace";

interface MessageEntry {
  id: string;
  sender: "USER" | "AI";
  text: string;
  roleTitle?: string;
  suggestedActions?: string[];
  dataSources?: string[];
  assumptions?: string[];
  timestamp: string;
}

function AIAssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const initialTab = searchParams.get("tab") === "chat" ? "chat" : "retention";
  const initialCompany = searchParams.get("company") || undefined;

  const [activeTab, setActiveTab] = useState<"retention" | "chat">(initialTab);
  const [activeRole, setActiveRole] = useState("WORKFLOW_COORDINATOR");
  const [promptInput, setPromptInput] = useState("");
  const [messages, setMessages] = useState<MessageEntry[]>([
    {
      id: "init-1",
      sender: "AI",
      text: "Welcome to your AI Seller Operations Command Center. I am initialized with your active shop-floor capabilities, catalog inventory, and incoming RFQs. How can I assist your operations today?",
      roleTitle: "Seller Workflow & Operations Coordinator",
      suggestedActions: [
        "Which incoming RFQs match my capabilities?",
        "Help me prepare a quotation structure",
        "Suggest a negotiation strategy for counteroffers",
        "Summarize pending orders and upcoming dispatch dates"
      ],
      dataSources: ["Apex Precision Engineering Profile", "Product Catalog DB", "Incoming RFQs DB", "Active Purchase Orders"],
      assumptions: ["Offline deterministic AI mode active. All commercial proposals require explicit seller confirmation."],
      timestamp: "Just now"
    }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || promptInput;
    if (!textToSend.trim()) return;

    const userEntry: MessageEntry = {
      id: `u-${Date.now()}`,
      sender: "USER",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userEntry]);
    setPromptInput("");
    setLoading(true);

    try {
      const res = await api.askSellerAIAssistant({
        role: activeRole,
        prompt: textToSend
      });

      const aiEntry: MessageEntry = {
        id: `ai-${Date.now()}`,
        sender: "AI",
        text: res.reply,
        roleTitle: res.role_title,
        suggestedActions: res.suggested_actions,
        dataSources: res.data_sources_used,
        assumptions: res.assumptions_and_limitations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiEntry]);
    } catch (err: any) {
      const errorEntry: MessageEntry = {
        id: `err-${Date.now()}`,
        sender: "AI",
        text: "Error generating recommendation. Please check backend connection.",
        roleTitle: "System Alert",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorEntry]);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "WORKFLOW_COORDINATOR", label: "Operations Coordinator", icon: Calendar },
    { id: "RFQ_MATCHING", label: "RFQ Capability Matcher", icon: FileText },
    { id: "QUOTATION_BUILDER", label: "Quotation & Pricing Advisor", icon: DollarSign },
    { id: "PRODUCT_LISTING", label: "Catalog Optimization", icon: Package },
    { id: "MANUFACTURING_SPECS", label: "Manufacturing & BOM Advisor", icon: Layers },
    { id: "NEGOTIATION_STRATEGY", label: "Negotiation Strategist", icon: Scale }
  ];

  const promptChips = [
    "Which incoming RFQs match my capabilities?",
    "Help me prepare a quotation for this requirement",
    "Which product specifications are missing in my catalog?",
    "Suggest a negotiation strategy for buyer price pushback",
    "Summarize my pending orders and upcoming delivery dates"
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageGuide
        badge="SELLER AI PROCUREMENT ASSISTANT"
        title="AI Operational Intelligence & Customer Retention"
        description="Monitor buyer purchase frequencies, identify dormant accounts before churn occurs, review previous products purchased, and coordinate shop-floor engineering."
        tip="Use Customer Insights to discover inactive high-value accounts and deploy proactive replenishment offers."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
              AI SELLER INTELLIGENCE ENGINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Deterministic Historical Ledgers · Zero External Credential Dependencies
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mt-1">
            <Bot className="w-6 h-6 text-emerald-400" />
            <span>AI Seller Assistant & Customer Retention</span>
          </h1>
        </div>

        {activeTab === "chat" && (
          <button
            onClick={() => setMessages(messages.slice(0, 1))}
            className="px-3 py-1.5 rounded bg-[#171d27] hover:bg-[#202735] text-slate-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Chat Session</span>
          </button>
        )}
      </div>

      {/* Main Feature Tabs (Customer Insights vs Operations Chat) */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#11151e] border border-[#1f2636] w-fit">
        <button
          onClick={() => setActiveTab("retention")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "retention"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-white hover:bg-[#18202d]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Insights & Retention</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Analytics
          </span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === "chat"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-400 hover:text-white hover:bg-[#18202d]"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Operations Advisory & 6 AI Roles</span>
        </button>
      </div>

      {/* Tab 1: Customer Insights & Retention Workspace */}
      {activeTab === "retention" && (
        <CustomerRetentionWorkspace initialCompany={initialCompany} />
      )}

      {/* Tab 2: Operations Advisory Chat (6 Specialist Roles) */}
      {activeTab === "chat" && (
        <div className="space-y-6">
          {/* Role Selector Tabs (Section 14: 6 Specialist Roles) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                    isActive
                      ? "bg-emerald-950/40 border-emerald-500/60 shadow-xs"
                      : "bg-[#141821] border-[#212735] hover:bg-[#181d27]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <p className={`text-[11px] font-bold leading-tight ${isActive ? "text-emerald-300" : "text-slate-300"}`}>
                    {r.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Main Chat & Telemetry Viewport */}
          <div className="rounded-xl bg-[#11141b] border border-[#1f242f] overflow-hidden flex flex-col h-[520px]">
            {/* Chat Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.sender === "USER";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
                  >
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="font-bold text-slate-300">{isUser ? "You (Seller Operations)" : msg.roleTitle || "AI Advisor"}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-2xl p-4 rounded-xl text-xs space-y-3 leading-relaxed ${
                        isUser
                          ? "bg-[#18202d] border border-[#273449] text-slate-100"
                          : "bg-[#141923] border border-[#202837] text-slate-200"
                      }`}
                    >
                      <p>{msg.text}</p>

                      {/* Suggested Quick Actions */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="pt-2 border-t border-[#1e2534] space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider block">
                            Recommended Next Steps:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestedActions.map((act, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleSend(act)}
                                className="px-2.5 py-1 rounded bg-[#0e1218] hover:bg-[#1b2230] text-[11px] text-slate-300 hover:text-emerald-300 border border-[#232a39] flex items-center gap-1 transition-colors"
                              >
                                <span>{act}</span>
                                <ChevronRight className="w-3 h-3 text-emerald-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Data Sources & Transparency Footer */}
                      {msg.dataSources && (
                        <div className="pt-2 border-t border-[#1e2534] text-[10px] font-mono text-slate-400 space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-500">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Data context: {msg.dataSources.join(" · ")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 p-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing supplier database telemetry...</span>
                </div>
              )}
            </div>

            {/* Prompt Chips Bar */}
            <div className="px-4 py-2 bg-[#0e1117] border-t border-[#1a1f2b] flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-mono text-slate-500 uppercase whitespace-nowrap">Suggested Briefs:</span>
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 rounded-full bg-[#151a24] hover:bg-[#1f2635] text-[10px] text-slate-300 hover:text-emerald-400 border border-[#222a3a] whitespace-nowrap transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#11141b] border-t border-[#1f242f]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Ask the ${roles.find((r) => r.id === activeRole)?.label}...`}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 bg-[#0e1117] border border-[#222938] rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loading || !promptInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupplierAIAssistantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-slate-400">Loading AI Seller Operations...</div>}>
      <AIAssistantContent />
    </Suspense>
  );
}
