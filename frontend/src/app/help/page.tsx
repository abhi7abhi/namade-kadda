"use client";

import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  Compass,
  Building2,
  FileText,
  FileSpreadsheet,
  Package,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles
} from "lucide-react";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleRestartTour = () => {
    try {
      localStorage.removeItem("nk_onboarding_seen");
    } catch (e) {
      // Ignore
    }
    window.location.href = "/";
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("nk-start-tour"));
    }, 300);
  };

  const handleOpenWelcomeModal = () => {
    window.dispatchEvent(new CustomEvent("nk-open-welcome"));
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const quickStartSteps = [
    {
      num: 1,
      title: "1. Discover Suppliers",
      href: "/suppliers",
      icon: Building2,
      desc: "Search by manufacturing process (CNC, sheet metal, stamping, casting), country, maximum MOQ, and lead time."
    },
    {
      num: 2,
      title: "2. Sourcing Requests",
      href: "/sourcing",
      icon: FileText,
      desc: "Describe what you need in natural English. The engine parses technical parameters, highlights missing tolerances, and saves to PostgreSQL."
    },
    {
      num: 3,
      title: "3. Quotations & RFQs",
      href: "/quotations",
      icon: FileSpreadsheet,
      desc: "Compare bids side-by-side. Customize the Price, Delivery Lead Time, and Reliability weights. Accept the winning quote to generate a PO."
    },
    {
      num: 4,
      title: "4. Orders & Tracking",
      href: "/orders",
      icon: Package,
      desc: "Follow the contract from Confirmed to In Production, Ready to Ship, Shipped and Delivered with audit logs."
    }
  ];

  const glossaryItems = [
    {
      term: "RFQ (Request for Quotation)",
      definition: "A formal commercial inquiry sent to industrial suppliers requesting pricing, lead time, tooling fees, and payment terms for a specific batch.",
      example: "Example: Sending an RFQ to 3 CNC machine shops in Bangalore for 500 units of SS 304 mounting brackets."
    },
    {
      term: "BOM (Bill of Materials)",
      definition: "A comprehensive hierarchy of all raw materials, sub-assemblies, fasteners, and processing steps required to manufacture an industrial product.",
      example: "Example: A bracket assembly BOM listing base plates, stiffener gussets, DIN 6921 bolts, and chemical passivation."
    },
    {
      term: "MOQ (Minimum Order Quantity)",
      definition: "The smallest production batch a manufacturer agrees to produce in a single production run to cover setup, tooling, and raw material overhead.",
      example: "Example: An aluminum die casting shop requiring an MOQ of 200 units to justify machine setup and mould installation."
    },
    {
      term: "PO (Purchase Order)",
      definition: "A legally binding contract issued by a buyer committing to purchase goods at agreed unit prices, delivery schedule, and specifications.",
      example: "Example: Order PO-2026-001 issued upon quotation acceptance specifying delivery within 14 calendar days."
    },
    {
      term: "HS Code (Harmonized System Code)",
      definition: "A standardized 6-to-8 digit commodity code recognized worldwide by customs authorities to classify traded goods for tariff calculations.",
      example: "Example: 7326.90.99 for other fabricated articles of stainless steel entering Indian ports."
    },
    {
      term: "CIF (Cost, Insurance & Freight)",
      definition: "An Incoterm where the seller pays for production, ocean/air freight, and marine transit insurance to the destination port of entry.",
      example: "Example: Declared value $8,500 + Freight $450 = CIF value $8,950 as the taxable base for Indian customs duty."
    },
    {
      term: "BCD (Basic Customs Duty)",
      definition: "The standard tariff levied by the national customs authority on imported goods entering the country under the Customs Tariff Act.",
      example: "Example: A 7.5% BCD rate applied to stainless steel articles entering India."
    },
    {
      term: "IGST (Integrated Goods and Services Tax)",
      definition: "The tax levied on all imports into India under the GST regime, ensuring parity between domestic and imported industrial commodities.",
      example: "Example: 18% standard IGST calculated on the assessable value (CIF + BCD + SWS)."
    },
    {
      term: "SWS (Social Welfare Surcharge)",
      definition: "A 10% cess levied on the Basic Customs Duty amount to fund social welfare programs in India.",
      example: "Example: On a BCD of $671.25, the 10% SWS is $67.13."
    },
    {
      term: "Landed Cost",
      definition: "The complete end-to-end total cost of an imported part at your factory gate, including purchase price, freight, insurance, tariffs, taxes, and port clearance.",
      example: "Formula: Landed Cost = CIF + Customs Duty + SWS + IGST + Local handling."
    },
    {
      term: "Lead Time",
      definition: "The total elapsed calendar time from formal purchase order confirmation until parts are manufactured, inspected, and ready for shipment.",
      example: "Example: A 14-day lead time for sheet metal laser cutting, bending, and passivation."
    }
  ];

  const faqs = [
    {
      q: "Is real money moved or real purchases made?",
      a: "No. Namade Kadda is a student-project prototype. Purchase orders and accepted quotations represent simulated transactions persisted in the local database. No credit cards, banking APIs, or escrow funds are moved."
    },
    {
      q: "Are emails or RFQs really sent to external suppliers?",
      a: "No. The system records RFQs, supplier invitations, and vendor quotes entirely inside your local PostgreSQL / SQLite database. No external emails or webhooks are dispatched without explicit future configuration."
    },
    {
      q: "What is the difference between DEMO and LIVE AI mode?",
      a: "In DEMO mode, the platform runs offline using fast, deterministic Python heuristics and rule-based engineering parsers with zero cloud costs. In LIVE mode (configured with an LLM_API_KEY in .env), the platform delegates reasoning to cloud LLMs (Groq, OpenAI, or Gemini)."
    },
    {
      q: "Where is my data stored?",
      a: "All sourcing requests, quotations, supplier records, BOM line items, and audit histories are stored in your relational PostgreSQL or SQLite database using SQLAlchemy 2.0 ORM and Alembic migrations. Your data persists across server restarts."
    },
    {
      q: "Can I trust the AI agent recommendations?",
      a: "All AI deliverables (procurement strategies, draft BOMs, customs estimates, and counter-offers) are advisory decision aids. They declare explicit assumptions, limitations, and warnings, and require human review before binding decisions are committed."
    }
  ];

  const demoVsRealRows = [
    { feature: "Database Persistence", status: "REAL", desc: "Stored in PostgreSQL/SQLite relational tables; persists across restarts." },
    { feature: "Supplier Directory", status: "SAMPLE DATA", desc: "Real query and filter engine; company names and profiles are synthetic records." },
    { feature: "Natural Language Sourcing", status: "REAL / DEMO", desc: "Extracts real quantities, tolerances, materials; uses deterministic engine offline." },
    { feature: "Quotation Comparison", status: "REAL", desc: "Dynamic mathematical normalization and weighted composite scoring formulas." },
    { feature: "Purchase Order Lifecycle", status: "REAL", desc: "Audited state machine transitions with timestamped change logs." },
    { feature: "Shipment Tracking", status: "SIMULATED", desc: "Generates synthetic tracking codes (SIM-TRK-XXXX); no live carrier GPS sync." },
    { feature: "Specialist AI Agents", status: "REAL / DEMO", desc: "6-agent sequential pipeline with structured input/output schemas." },
    { feature: "Engineering BOM", status: "REAL", desc: "Line item additions, subtotal recalculations, and real CSV file downloads." },
    { feature: "Trade & Duty Estimates", status: "ESTIMATE", desc: "Illustrative reference calculation; not an official customs determination." }
  ];

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Title & Tour Launch Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#1f242f]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">Help Center & Platform Orientation</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#18212e] text-emerald-400 border border-emerald-900/50 font-bold">
              USER GUIDE & GLOSSARY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Learn the 4-step procurement workflow, restart the guided tour, review B2B terminology, and explore prototype FAQs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenWelcomeModal}
            className="px-3.5 py-1.5 rounded bg-[#161a23] hover:bg-[#1f2433] text-slate-300 border border-[#232938] text-xs font-medium transition-colors"
          >
            Show Welcome Modal
          </button>
          <button
            onClick={handleRestartTour}
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Launch Product Tour</span>
          </button>
        </div>
      </div>

      {/* 1. Quick Start Workflow */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            1. Quick Start: The 4-Step Procurement Workflow
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickStartSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.num}
                href={step.href}
                className="p-4 rounded-lg bg-[#141821] border border-[#212735] hover:border-emerald-500/40 transition-all group block space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {step.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2. Industry Glossary */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            2. Industrial Sourcing & Customs Glossary
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {glossaryItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg bg-[#141821] border border-[#212735] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 font-mono text-xs">{item.term}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{item.definition}</p>
              <p className="text-slate-500 text-[11px] italic bg-[#0f121a] p-2 rounded border border-[#1c222e]">
                {item.example}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Frequently Asked Questions (FAQ Accordion) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            3. Frequently Asked Questions
          </h2>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-lg bg-[#141821] border border-[#212735] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-[#181d28] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-400 border-t border-[#1d2330] bg-[#10131a] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Demo vs Real Transparency Matrix */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            4. Demo vs. Real Capability Matrix
          </h2>
        </div>
        <div className="border border-[#212735] rounded-lg overflow-hidden bg-[#141821]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#10131a] border-b border-[#212735] text-[10px] font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3">Platform Capability</th>
                <th className="p-3">Status</th>
                <th className="p-3">Technical Implementation Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1d2330]">
              {demoVsRealRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#181d28] transition-colors">
                  <td className="p-3 font-medium text-slate-200">{row.feature}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        row.status.includes("REAL")
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/40"
                          : row.status.includes("SIMULATED")
                          ? "bg-purple-950/80 text-purple-400 border-purple-800/40"
                          : "bg-amber-950/80 text-amber-400 border-amber-800/40"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
