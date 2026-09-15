import { Link } from "@tanstack/react-router";
import {
  Home,
  Sun,
  Moon,
  RefreshCw,
  Lock,
  Unlock,
  Radio,
  ExternalLink,
  Shield,
  TrendingUp,
} from "lucide-react";
import type { AdminAccount } from "@/lib/admin.functions";

interface AdminHeaderProps {
  isLight: boolean;
  toggleTheme: () => void;
  isAuthenticated: boolean;
  currentAccount: AdminAccount | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  totalRaised: number;
  monthlyGoal: number;
}

export function AdminHeader({
  isLight,
  toggleTheme,
  isAuthenticated,
  currentAccount,
  isRefreshing,
  onRefresh,
  onLogout,
  totalRaised,
  monthlyGoal,
}: AdminHeaderProps) {
  const goalPercent = Math.min(100, Math.round((totalRaised / (monthlyGoal || 1)) * 100));

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl px-4 sm:px-8 py-3 transition-colors duration-300 ${
        isLight
          ? "bg-white/90 border-slate-200/80 shadow-xs"
          : "bg-[oklch(0.13_0.02_260)]/90 border-white/10 shadow-black/40"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-2 text-xs font-semibold ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white"
            }`}
            title="Return to Public Website"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Website</span>
          </Link>

          <div className={`h-4 w-px ${isLight ? "bg-slate-300" : "bg-white/15"} mx-0.5`} />

          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                isAuthenticated
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs shadow-emerald-500/10"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs shadow-rose-500/10"
              }`}
            >
              {isAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight font-display flex items-center gap-1.5">
                  <span>SodaCraft Command Center</span>
                </h1>
                {isAuthenticated && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <p className={`text-[11px] truncate max-w-xs sm:max-w-md ${isLight ? "text-slate-500" : "text-white/50"}`}>
                {isAuthenticated
                  ? `Signed in: ${currentAccount?.username || "Superadmin"} (${currentAccount?.role || "superadmin"}) • Real-time Razorpay DB`
                  : "Database Admin Portal • Authentication Required"}
              </p>
            </div>
          </div>
        </div>

        {/* Center / Stats Preview (Visible when authenticated on medium+ screens) */}
        {isAuthenticated && (
          <div className="hidden lg:flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded-xl text-xs flex items-center gap-2 border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/60"}`}>Raised:</span>
              <span className="font-extrabold text-emerald-400 font-display">₹{totalRaised.toLocaleString()}</span>
            </div>
            <div
              className={`px-3 py-1 rounded-xl text-xs flex items-center gap-2 border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/60"}`}>Goal:</span>
              <span className="font-bold font-display">{goalPercent}%</span>
            </div>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white"
            }`}
            title={`Switch to ${isLight ? "dark" : "light"} mode`}
            aria-label="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {isAuthenticated && (
            <>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-white/10 hover:bg-white/15 text-white/80 hover:text-white"
                }`}
                title="Sync database data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/15 border border-rose-500/25 transition cursor-pointer flex items-center gap-1.5"
                title="Lock Session"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock Session</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
