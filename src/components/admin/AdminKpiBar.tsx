import {
  TrendingUp,
  Users,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Supporter } from "@/lib/support.functions";

interface AdminKpiBarProps {
  isLight: boolean;
  totalRaised: number;
  monthlyGoal: number;
  payments: Supporter[];
  accountsCount: number;
  upiId: string;
  razorpayKeyId?: string;
  urlToken: string;
}

export function AdminKpiBar({
  isLight,
  totalRaised,
  monthlyGoal,
  payments,
  accountsCount,
  upiId,
  razorpayKeyId,
  urlToken,
}: AdminKpiBarProps) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const goalPercent = Math.min(100, Math.round((totalRaised / (monthlyGoal || 1)) * 100));
  const remaining = Math.max(0, monthlyGoal - totalRaised);
  const avgDonation = payments.length > 0 ? Math.round(totalRaised / payments.length) : 0;
  const latestSupporter = payments.length > 0 ? payments[0] : null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Revenue & Milestone Progress */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? "bg-white border-slate-200/90 shadow-xs hover:border-emerald-300"
            : "bg-white/5 border-white/10 hover:border-emerald-500/30"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-white/60"}`}>
              Verified Revenue
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-display">
            {goalPercent}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-2xl sm:text-3xl font-black font-display text-emerald-400 tracking-tight">
            ₹{totalRaised.toLocaleString()}
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? "bg-slate-100" : "bg-white/10"}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>

          <div className={`flex items-center justify-between text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>
            <span>Goal: ₹{monthlyGoal.toLocaleString()}</span>
            <span>{remaining === 0 ? "Goal achieved!" : `₹${remaining.toLocaleString()} left`}</span>
          </div>
        </div>
      </div>

      {/* 2. Community Backers */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? "bg-white border-slate-200/90 shadow-xs hover:border-blue-300"
            : "bg-white/5 border-white/10 hover:border-blue-500/30"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-white/60"}`}>
              Supporters
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
            Avg ₹{avgDonation}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            {payments.length}
            <span className={`text-xs font-medium ml-1.5 ${isLight ? "text-slate-400" : "text-white/40"}`}>
              backers
            </span>
          </div>

          <p className={`text-xs truncate ${isLight ? "text-slate-500" : "text-white/60"}`}>
            {latestSupporter ? (
              <>
                Recent: <strong className={isLight ? "text-slate-800" : "text-white"}>{latestSupporter.name}</strong> (₹{latestSupporter.amount})
              </>
            ) : (
              "Waiting for first support payment"
            )}
          </p>
        </div>
      </div>

      {/* 3. Payment Gateway & Channels */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? "bg-white border-slate-200/90 shadow-xs hover:border-purple-300"
            : "bg-white/5 border-white/10 hover:border-purple-500/30"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-white/60"}`}>
              Gateway Health
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Live
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-1 text-xs">
            <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>Razorpay API:</span>
            <span className="font-mono text-[11px] font-semibold text-emerald-400 truncate max-w-[130px]">
              {razorpayKeyId ? `${razorpayKeyId.slice(0, 10)}...` : "Configured"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 text-xs">
            <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>UPI ID:</span>
            <button
              type="button"
              onClick={handleCopyUpi}
              className={`font-mono text-[11px] font-semibold flex items-center gap-1 truncate max-w-[130px] hover:underline cursor-pointer ${
                isLight ? "text-slate-700 hover:text-emerald-600" : "text-white/90 hover:text-emerald-400"
              }`}
              title="Copy UPI ID"
            >
              <span className="truncate">{upiId}</span>
              {copiedUpi ? <Check className="w-3 h-3 text-emerald-400 shrink-0" /> : <Copy className="w-3 h-3 text-white/40 shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Security & Access Shield */}
      <div
        className={`p-5 rounded-2xl border transition-all duration-200 ${
          isLight
            ? "bg-white border-slate-200/90 shadow-xs hover:border-amber-300"
            : "bg-white/5 border-white/10 hover:border-amber-500/30"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-white/60"}`}>
              Security Shield
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
            Protected
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>Route Guard:</span>
            <code className="text-[11px] font-mono text-emerald-400 font-bold">
              ?token={urlToken || "SodaCraftTamil"}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>Admin Accounts:</span>
            <span className="font-bold text-xs">
              {accountsCount} Registered
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
