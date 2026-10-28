"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [devNote, setDevNote] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setResponseMessage(null);
    setDevNote(null);

    try {
      const res = await api.forgotPassword(email.trim());
      setResponseMessage(res.message);
      setDevNote(res.dev_note);
    } catch (err: any) {
      setResponseMessage("If an account exists with this email address, a password reset link has been dispatched.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d11] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-white shadow-xs font-mono text-sm">
              NK
            </div>
            <span className="font-bold text-slate-100 tracking-wider font-mono text-base">
              NAMADE KADDA
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Reset Account Password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        {responseMessage ? (
          <div className="p-6 rounded-xl bg-[#141822] border border-[#232938] space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Recovery Request Processed</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {responseMessage}
            </p>
            {devNote && (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300 text-xs space-y-1">
                <span className="font-bold font-mono text-[10px] uppercase block">Notice:</span>
                <p className="leading-relaxed">{devNote}</p>
              </div>
            )}
            <Link
              href="/login"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-[#141822] border border-[#232938] space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Registered Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-[#10131a] border border-[#232938] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              {isSubmitting ? "Dispatching Request..." : "Send Recovery Instructions"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-2 border-t border-[#1e2432]">
              <Link href="/login" className="text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
