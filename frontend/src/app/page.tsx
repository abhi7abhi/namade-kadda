"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Package,
  Layers,
  Cpu,
  Globe2,
  Scale,
  Clock,
  ChevronRight,
  TrendingUp,
  Sliders,
  Menu,
  X,
  UserCheck,
  FileText,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PublicHomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasUser = isMounted && !isLoading && isAuthenticated && !!user;
  const dashboardHref = user?.role === "ADMIN"
    ? "/dashboard/admin"
    : user?.role === "SUPPLIER"
    ? "/dashboard/supplier"
    : "/dashboard/buyer";

  // Sourcing Search Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [quantity, setQuantity] = useState("500");
  const [destination, setDestination] = useState("Bangalore, India");

  const handleSourcingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim() || "500 stainless-steel brackets, grade 304, delivery in 4 weeks";
    router.push(`/sourcing?query=${encodeURIComponent(query)}&qty=${encodeURIComponent(quantity)}&dest=${encodeURIComponent(destination)}`);
  };

  const sampleSuppliers = [
    {
      id: 1,
      name: "Apex Precision Engineering",
      country: "India",
      city: "Bangalore",
      category: "CNC Machining & Milling",
      capabilities: "5-axis milling, wire EDM, structural titanium & SS 304",
      moq: 50,
      leadTime: "18 days",
      priceRating: "$$",
      isVerified: true
    },
    {
      id: 2,
      name: "Bharat ForgeTech Solutions",
      country: "India",
      city: "Pune",
      category: "Sheet Metal & Stamping",
      capabilities: "Fiber laser cutting, CNC press brake, welded assemblies",
      moq: 100,
      leadTime: "14 days",
      priceRating: "$",
      isVerified: true
    },
    {
      id: 3,
      name: "Rhein-Ruhr Präzision GmbH",
      country: "Germany",
      city: "Dortmund",
      category: "Heavy Fabrication & Castings",
      capabilities: "Investment casting, high-tensile fasteners, DIN EN ISO 9001",
      moq: 200,
      leadTime: "28 days",
      priceRating: "$$$",
      isVerified: true
    }
  ];

  const industrialCategories = [
    {
      name: "Industrial Components",
      slug: "Industrial Components",
      count: "1,240 parts",
      desc: "Fasteners, brackets, bushings, structural couplings & flanges",
      icon: Layers
    },
    {
      name: "Metals & Raw Materials",
      slug: "Raw Materials",
      count: "890 grades",
      desc: "Stainless steel (304/316), aerospace aluminum 6061, brass, tool steels",
      icon: Cpu
    },
    {
      name: "Electrical Equipment",
      slug: "Electrical",
      count: "650 units",
      desc: "Industrial enclosures, busbars, wiring harnesses, control switchgear",
      icon: Sparkles
    },
    {
      name: "Mechanical Parts",
      slug: "Mechanical Parts",
      count: "1,420 items",
      desc: "Spur gears, precision drive shafts, hydraulic blocks, valve manifolds",
      icon: Package
    },
    {
      name: "Manufacturing Services",
      slug: "CNC Machining",
      count: "340 facilities",
      desc: "5-axis CNC machining, progressive stamping, sheet bending, anodizing",
      icon: Building2
    },
    {
      name: "Custom Engineering",
      slug: "Custom Engineering",
      count: "On-demand",
      desc: "BOM breakdown, tolerance analysis, DFM audits, reverse engineering",
      icon: Bot
    }
  ];

  const agentCouncil = [
    {
      role: "Procurement Agent",
      focus: "Strategy & Budget",
      desc: "Analyzes commercial volume, target price curves, and dual-sourcing splits."
    },
    {
      role: "Supplier Matching Agent",
      focus: "Vendor Discovery",
      desc: "Ranks machine shops against ISO certs, machine beds, and delivery track record."
    },
    {
      role: "Engineering Agent",
      focus: "Specifications & BOM",
      desc: "Parses CAD callouts, DIN/ASTM tolerances, and amortizes unit fabrication costs."
    },
    {
      role: "Trade & Compliance Agent",
      focus: "Customs & Tariffs",
      desc: "Estimates landed CIF base, BCD customs duty, IGST tax, and filing checklists."
    },
    {
      role: "Negotiation Agent",
      focus: "Commercial Offers",
      desc: "Identifies missing MTR deliverables and prepares counter-proposals on lead time."
    },
    {
      role: "Coordinator Agent",
      focus: "Executive Synthesis",
      desc: "Synthesizes multi-agent telemetry into an explainable, human-governed action plan."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* 4.A Public Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0b0d11]/90 backdrop-blur-md border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Descriptor */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-xs font-mono text-sm group-hover:scale-105 transition-transform">
              NK
            </div>
            <div>
              <span className="font-bold text-slate-100 tracking-wider text-sm font-mono block">
                NAMADE KADDA
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-tight block">
                AI PROCUREMENT PLATFORM
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <Link href="/products" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors flex items-center gap-1">
              Products <span className="px-1.5 py-0.2 bg-emerald-950 text-[9px] rounded border border-emerald-800/60 font-mono">Marketplace</span>
            </Link>
            <Link href="/suppliers" className="hover:text-emerald-400 transition-colors">Explore Suppliers</Link>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#about" className="hover:text-emerald-400 transition-colors">About</a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {hasUser ? (
              <Link
                href={dashboardHref}
                className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                Go to Dashboard ({user?.role}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded text-slate-400 hover:text-white hover:bg-[#161a23]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#1f242f] bg-[#11141b] px-4 py-4 space-y-3 text-xs">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300 hover:text-emerald-400">Home</Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-emerald-400 font-semibold">Products Marketplace</Link>
            <Link href="/suppliers" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300 hover:text-emerald-400">Explore Suppliers</Link>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300 hover:text-emerald-400">How It Works</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-300 hover:text-emerald-400">About</a>
            <div className="pt-2 border-t border-[#1f242f] flex gap-2">
              {hasUser ? (
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 bg-emerald-600 rounded text-white font-semibold flex items-center justify-center gap-1.5"
                >
                  Go to Dashboard ({user?.role}) <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 bg-[#161a23] rounded text-slate-200">Log In</Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 bg-emerald-600 rounded text-white font-semibold">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 4.B Hero Section (Split Layout) */}
      <section className="relative overflow-hidden py-12 md:py-20 border-b border-[#1f242f] bg-radial from-[#151c27] via-[#0b0d11] to-[#0b0d11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-[11px] font-mono font-medium">
                <Sparkles className="w-3 h-3" />
                THE NEXT GENERATION OF B2B PROCUREMENT
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
                Source Globally. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Manufacture Smarter.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
                Discover products from global suppliers, request competitive quotations, calculate landed costs and transform your manufacturing requirements with AI-powered procurement.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:translate-y-[-1px]"
                >
                  Next &rarr;
                </Link>
                <Link
                  href={hasUser ? "/sourcing" : "/login?redirect=/sourcing"}
                  className="px-5 py-3 rounded-lg bg-[#141821] hover:bg-[#1a202c] text-slate-200 border border-[#212735] text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4 text-emerald-400" /> Start Sourcing
                </Link>
              </div>

              {/* 3 Compact Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#1a202d] text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Intelligent supplier matching</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Transparent quotation comparison</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Connected procurement workflows</span>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Product Preview Widget */}
            <div className="lg:col-span-5">
              <div className="rounded-xl bg-[#11141b] border border-[#222938] shadow-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2432]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200 font-mono">WORKSPACE LIVE TELEMETRY</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px] font-mono font-bold">
                    DEMO DATA
                  </span>
                </div>

                {/* Natural Language Request Preview */}
                <div className="p-3 rounded-lg bg-[#0d0f15] border border-[#1b212d] space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Active Requirement:</span>
                  <p className="text-xs text-slate-200 font-medium">
                    &ldquo;Source 500 stainless-steel brackets, Grade 304, 4mm gauge, passivated, with mill certificates for aerospace delivery in 4 weeks.&rdquo;
                  </p>
                </div>

                {/* Matching Suppliers Preview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Matching Vetted Suppliers:</span>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded bg-[#151922] border border-[#242b3b] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Apex Precision Engineering</span>
                        <span className="block text-[10px] text-slate-500">Bangalore, India • 5-Axis CNC • ISO 9001</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-emerald-400 font-bold">$14.20 / pc</span>
                        <span className="block text-[10px] text-slate-500 font-mono">14 days</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-[#151922] border border-[#242b3b] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">Bharat ForgeTech Solutions</span>
                        <span className="block text-[10px] text-slate-500">Pune, India • Fiber Laser Cut • AS9100</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-emerald-400 font-bold">$15.70 / pc</span>
                        <span className="block text-[10px] text-slate-500 font-mono">20 days</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact AI Agent Timeline */}
                <div className="pt-2 border-t border-[#1e2432]">
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5">Council Agent Execution:</span>
                  <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                    <div className="p-1 rounded bg-blue-950/60 border border-blue-900 text-blue-300">Strategy OK</div>
                    <div className="p-1 rounded bg-purple-950/60 border border-purple-900 text-purple-300">Matched (2)</div>
                    <div className="p-1 rounded bg-cyan-950/60 border border-cyan-900 text-cyan-300">HS 7326.90</div>
                    <div className="p-1 rounded bg-emerald-950/60 border border-emerald-900 text-emerald-300">Approved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.C Natural-Language Sourcing Search Panel */}
      <section id="sourcing-search" className="py-12 bg-[#0e1118] border-b border-[#1f242f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              What do you need to source?
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your component requirements in plain language. Our parser extracts alloy grades, tolerances, quantities, and delivery targets.
            </p>
          </div>

          <form onSubmit={handleSourcingSearch} className="p-4 sm:p-5 rounded-xl bg-[#141822] border border-[#232938] shadow-lg space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technical Requirement & Part Specifications
              </label>
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find 500 stainless-steel brackets, grade 304, with delivery within four weeks..."
                rows={3}
                className="w-full bg-[#0d0f15] border border-[#212735] rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 leading-relaxed font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Quantity</label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500 pcs"
                  className="w-full bg-[#0d0f15] border border-[#212735] rounded-md px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Destination Port or City</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Bangalore, India or Hamburg"
                  className="w-full bg-[#0d0f15] border border-[#212735] rounded-md px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#1e2432]">
              <Link
                href="/sourcing"
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              >
                Advanced Requirements Workspace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" /> Search Matching Suppliers
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 4.D How It Works (4 Steps) */}
      <section id="how-it-works" className="py-16 border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              STREAMLINED B2B WORKFLOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mt-1">
              How Namade Kadda Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From natural-language request to audited factory order in four transparent steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-3 relative">
              <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-200">Explore products or describe your requirements</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse catalogue items from global suppliers or type your custom requirement in natural language. The system extracts technical parameters, material grades and tolerances.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-3 relative">
              <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-200">Connect with suitable global suppliers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Broadcast structured RFQs to vetted manufacturers across India, Germany, China, Japan and the United States based on certified machining capabilities and MOQs.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-3 relative">
              <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-200">Compare offers and calculate total costs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluate quotations side by side using custom Price, Lead Time and Reliability weights. Calculate landed duties (CIF, BCD, IGST) and generate trade-cost PDF reports.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-3 relative">
              <div className="w-8 h-8 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-200">Place orders and monitor fulfilment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Issue binding purchase orders with automated line item breakdowns. Track production milestones through audited state transitions from confirmation to delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4.D Homepage Products Preview Section (New) */}
      <section className="py-16 bg-[#0a0c10] border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  GLOBAL CATALOG PREVIEW
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                  ILLUSTRATIVE DEMO DATA
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mt-1">
                Featured Industrial Products & Indicative Prices
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Real-world industrial products sourced across multiple international manufacturing hubs. Click to inspect technical specifications, origin details, and pricing.
              </p>
            </div>
            <Link
              href="/products"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              Explore Full Marketplace <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Stainless-Steel Mounting Brackets",
                origin: "India",
                flag: "🇮🇳",
                price: "$14.20",
                moq: "100 pcs",
                leadTime: "12 days",
                category: "Sheet Metal",
                supplier: "Bharat ForgeTech Solutions, Pune",
                img: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "Industrial Ball Bearings",
                origin: "Germany",
                flag: "🇩🇪",
                price: "$38.50",
                moq: "50 pcs",
                leadTime: "18 days",
                category: "Bearings & Motion",
                supplier: "Rhineland Machining GmbH, Stuttgart",
                img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "CNC-Machined Aluminium Components",
                origin: "China",
                flag: "🇨🇳",
                price: "$22.00",
                moq: "200 pcs",
                leadTime: "15 days",
                category: "CNC Machining",
                supplier: "Shenzhen Precision Metalworks Ltd",
                img: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "Industrial Sensors",
                origin: "Japan",
                flag: "🇯🇵",
                price: "$85.00",
                moq: "20 pcs",
                leadTime: "10 days",
                category: "Industrial Sensors",
                supplier: "Tokyo Sensor & Robotics Instruments Co",
                img: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "Hydraulic Valves",
                origin: "United States",
                flag: "🇺🇸",
                price: "$145.00",
                moq: "15 pcs",
                leadTime: "21 days",
                category: "Hydraulics & Valves",
                supplier: "Midwest Hydraulic Valves & Systems Inc",
                img: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80"
              },
              {
                name: "Copper Sheets",
                origin: "India",
                flag: "🇮🇳",
                price: "$64.00",
                moq: "25 pcs",
                leadTime: "14 days",
                category: "Metals & Raw Materials",
                supplier: "Bharat ForgeTech Solutions, Pune",
                img: "https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80"
              }
            ].map((p, i) => (
              <div key={i} className="rounded-xl bg-[#12151d] border border-[#212735] hover:border-emerald-500/50 hover:bg-[#151924] transition-all overflow-hidden flex flex-col justify-between group shadow-xs">
                <div className="relative h-36 bg-[#0e1117] overflow-hidden">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-200">
                    <span>{p.flag}</span>
                    <span>{p.origin}</span>
                  </div>
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/50 text-[10px] font-mono font-semibold">
                    {p.category}
                  </div>
                </div>

                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-1">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{p.supplier}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-[#0d0f15] p-2 rounded border border-[#1a1f2b]">
                    <div>
                      <span className="text-slate-500 block">MOQ:</span>
                      <span className="text-slate-200 font-semibold">{p.moq}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">LEAD TIME:</span>
                      <span className="text-slate-200 font-semibold">{p.leadTime}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 block">INDICATIVE PRICE</span>
                      <span className="text-base font-extrabold text-emerald-400 font-mono">{p.price} USD</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase bg-[#181d26] px-1.5 py-0.5 rounded border border-[#232a38]">
                      Demo Quote
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0f1218] border-t border-[#1a1f2b]">
                  <Link
                    href="/products"
                    className="w-full py-1.5 bg-[#181e2b] hover:bg-[#202738] text-slate-200 border border-[#252f42] text-[11px] font-semibold rounded flex items-center justify-center gap-1 transition-colors"
                  >
                    View Details & RFQ Options &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.E Explore Industrial Categories */}
      <section id="solutions" className="py-16 bg-[#0e1118] border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                MARKETPLACE DIRECTORY
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mt-1">
                Explore Industrial Categories
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Precision components, certified engineering alloys, and custom contract manufacturing services.
              </p>
            </div>
            <Link
              href="/suppliers"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
            >
              View All Suppliers <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {industrialCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  href={`/suppliers?category=${encodeURIComponent(cat.slug)}`}
                  className="p-5 rounded-xl bg-[#141822] border border-[#212735] hover:border-emerald-500/50 hover:bg-[#181e2b] transition-all group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#101319] border border-[#242b3b] flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 bg-[#0d0f15] px-2 py-0.5 rounded border border-[#1e2432]">
                      {cat.count}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4.F AI Procurement Section */}
      <section className="py-16 border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              MULTI-AGENT SPECIALIST ORCHESTRATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mt-1">
              From Complex Requirements to Clear Decisions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Instead of another generic product grid, Namade Kadda deploys a council of six specialist AI agents with bounded roles, transparent reasoning, and human-in-the-loop approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {agentCouncil.map((agent, i) => (
              <div key={i} className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{agent.role}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18212e] text-emerald-400 border border-emerald-900/40">
                    {agent.focus}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/agents"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Bot className="w-4 h-4" /> Explore the AI Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* 4.G Supplier Discovery Preview */}
      <section className="py-16 bg-[#0e1118] border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  VETTED MANUFACTURERS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18212e] text-slate-400 border border-[#232938]">
                  SAMPLE DATASET
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                Featured Industrial Suppliers
              </h2>
            </div>
            <Link href="/suppliers" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
              Browse Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleSuppliers.map((s) => (
              <div key={s.id} className="p-5 rounded-xl bg-[#141822] border border-[#212735] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-slate-100">{s.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                      {s.country}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium">{s.category}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{s.capabilities}</p>
                </div>

                <div className="pt-3 border-t border-[#1e2432] space-y-3">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>MOQ: {s.moq} pcs</span>
                    <span>Lead time: {s.leadTime}</span>
                  </div>
                  <Link
                    href={`/suppliers?search=${encodeURIComponent(s.name)}`}
                    className="w-full py-2 bg-[#181e2b] hover:bg-[#202738] border border-[#263145] text-slate-200 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View Supplier Profile <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.H Trust & Transparency Section */}
      <section id="about" className="py-16 border-b border-[#1f242f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
              ENTERPRISE GOVERNANCE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mt-1">
              Built on Trust and Explainable AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              B2B procurement requires accountability. We enforce human governance at every milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-2.5">
              <Scale className="w-6 h-6 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Transparent Quotation Logic</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare bids using explicit weighted scoring formulas (Price, Lead Time, Track Record) rather than black-box algorithms.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-2.5">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Human Approval Gates</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Critical procurement decisions require authorized buyer confirmation. Agents recommend; humans approve and order.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Traceable Audit History</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every RFQ broadcast, quotation submission, status advance, and administrative approval is permanently logged.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#11141b] border border-[#1f2533] space-y-2.5">
              <AlertCircle className="w-6 h-6 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Honest AI Disclosures</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We clearly separate offline deterministic algorithms from live cloud LLMs, and flag trade estimates as non-binding customs guides.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4.I Final Call to Action */}
      <section className="py-16 bg-gradient-to-b from-[#111622] to-[#0b0d11] border-b border-[#1f242f] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase font-semibold">
            START SOURCING TODAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
            Ready to Transform Your Sourcing Workflow?
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Join enterprise industrial buyers and certified manufacturers on Namade Kadda. Source smarter, compare transparently, and manufacture better.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/products"
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all hover:translate-y-[-1px]"
            >
              <Package className="w-4 h-4" /> Explore Products &rarr;
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg bg-[#141822] hover:bg-[#1c2230] text-slate-200 border border-[#273042] text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" /> Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* 4.J Public Footer */}
      <footer className="bg-[#08090d] text-slate-400 text-xs py-12 border-t border-[#181c25]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-[#181c25]">
            {/* Col 1: Brand */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-xs font-mono">
                  NK
                </div>
                <span className="font-bold text-slate-100 tracking-wider font-mono text-sm">
                  NAMADE KADDA
                </span>
              </div>
              <p className="text-slate-400 max-w-sm text-[11px] leading-relaxed">
                One intelligent workspace for industrial sourcing, supplier discovery, and manufacturing procurement.
              </p>
              <div className="text-[10px] text-slate-600 font-mono">
                STUDENT PROTOTYPE • DETERMINISTIC DEMO ARCHITECTURE
              </div>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-200 uppercase font-mono block">Platform</span>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/suppliers" className="hover:text-emerald-400 transition-colors">Supplier Directory</Link></li>
                <li><Link href="/sourcing" className="hover:text-emerald-400 transition-colors">Sourcing Requests</Link></li>
                <li><Link href="/quotations" className="hover:text-emerald-400 transition-colors">Quotation Matrix</Link></li>
                <li><Link href="/orders" className="hover:text-emerald-400 transition-colors">Order Tracking</Link></li>
                <li><Link href="/agents" className="hover:text-emerald-400 transition-colors">AI Procurement Council</Link></li>
              </ul>
            </div>

            {/* Col 3: Tools */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-200 uppercase font-mono block">Engineering</span>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/bom" className="hover:text-emerald-400 transition-colors">Bill of Materials (BOM)</Link></li>
                <li><Link href="/trade" className="hover:text-emerald-400 transition-colors">Trade & Customs (HS / BCD)</Link></li>
                <li><Link href="/analytics" className="hover:text-emerald-400 transition-colors">Analytics Telemetry</Link></li>
                <li><Link href="/settings" className="hover:text-emerald-400 transition-colors">System Configuration</Link></li>
              </ul>
            </div>

            {/* Col 4: Support & Legal */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-200 uppercase font-mono block">Support & Trust</span>
              <ul className="space-y-1.5 text-[11px]">
                <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Help Center & FAQ</Link></li>
                <li><Link href="/register?role=supplier" className="hover:text-emerald-400 transition-colors">Supplier Registration</Link></li>
                <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Member Sign In</Link></li>
                <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
            <p>&copy; 2026 Namade Kadda. All rights reserved.</p>
            <p className="font-mono">Source Smarter. Manufacture Better.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
