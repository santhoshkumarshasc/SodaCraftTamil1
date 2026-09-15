import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Users,
  Receipt,
  RefreshCw,
  IndianRupee,
  Link as LinkIcon,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  Sliders,
  Copy,
  ArrowLeft,
  Sun,
  Moon,
  Home,
  Check,
  Info,
  ExternalLink as ExtLink,
  Zap,
} from "lucide-react";
import {
  getAdminConfig,
  saveAdminConfig,
  type AdminSiteConfig,
  type SiteSocialLink,
} from "@/lib/admin-config";
import {
  adminLoginAccountFn,
  getDbConfigFn,
  saveDbConfigFn,
  getAdminAccountsFn,
  createAdminAccountFn,
  deleteAdminAccountFn,
  getAdminPaymentsFn,
  deletePaymentFn,
  resetGoalPaymentsFn,
  type AdminAccount,
} from "@/lib/admin.functions";
import type { Supporter } from "@/lib/support.functions";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "SodaCraft Tamil - Admin Dashboard" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const search = Route.useSearch();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [config, setConfig] = useState<AdminSiteConfig>(getAdminConfig());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentAccount, setCurrentAccount] = useState<AdminAccount | null>(null);

  // Login form state
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs: support, realtime, links, accounts, security, access-info
  const [activeTab, setActiveTab] = useState<
    "support" | "realtime" | "links" | "accounts" | "security" | "access-info"
  >("support");

  // Real-time data from database
  const [payments, setPayments] = useState<Supporter[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResettingGoal, setIsResettingGoal] = useState(false);

  // Add Account form state
  const [newAccUser, setNewAccUser] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPass, setNewAccPass] = useState("");
  const [newAccRole, setNewAccRole] = useState<"admin" | "superadmin">("admin");

  // New Link & Preset temporary state
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [newPresetAmount, setNewPresetAmount] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [urlTokenInput, setUrlTokenInput] = useState(config.urlToken || "custom");

  // Load saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  const isLight = theme === "light";

  // Real-time data fetcher
  const fetchRealtimeData = useCallback(
    async (tokenToUse?: string) => {
      const token = tokenToUse || sessionToken;
      if (!token) return;
      setIsRefreshing(true);
      try {
        const paymentsRes = await getAdminPaymentsFn({ data: { token } });
        if (paymentsRes.success) {
          setPayments(paymentsRes.supporters);
        }

        const accountsRes = await getAdminAccountsFn({ data: { token } });
        if (accountsRes.success) {
          setAdminAccounts(accountsRes.accounts);
        }

        const dbConfig = await getDbConfigFn();
        if (dbConfig) {
          setConfig(dbConfig);
          setUrlTokenInput(dbConfig.urlToken || "custom");
          saveAdminConfig(dbConfig);
        }
      } catch (err) {
        console.error("Error fetching real-time admin data:", err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [sessionToken],
  );

  // Auto-authenticate if session token exists in sessionStorage or valid URL token matches
  useEffect(() => {
    async function initSession() {
      const storedToken = sessionStorage.getItem("sodacraft_admin_token");
      const storedAcc = sessionStorage.getItem("sodacraft_admin_account");

      if (storedToken) {
        setSessionToken(storedToken);
        setIsAuthenticated(true);
        if (storedAcc) {
          try {
            setCurrentAccount(JSON.parse(storedAcc));
          } catch {
            // ignore
          }
        }
        await fetchRealtimeData(storedToken);
      } else {
        // Also fetch latest db config
        try {
          const dbConfig = await getDbConfigFn();
          if (dbConfig) {
            setConfig(dbConfig);
            setUrlTokenInput(dbConfig.urlToken || "custom");
          }
        } catch {
          // ignore
        }

        // Ensure no credentials or passwords are auto-stored or autofilled
        try {
          localStorage.removeItem("sodacraft_saved_admin_user");
          localStorage.removeItem("sodacraft_saved_admin_pass");
        } catch {
          // ignore
        }
      }
    }
    initSession();
  }, [fetchRealtimeData]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const userInput = form.querySelector<HTMLInputElement>(
      'input[name="admin_username_no_autofill"]',
    );
    const passInput = form.querySelector<HTMLInputElement>(
      'input[name="admin_password_no_autofill"]',
    );
    const domUser = userInput?.value;
    const domPass = passInput?.value;

    const finalUser = (domUser || usernameInput || "").trim();
    const finalPass = (domPass || passwordInput || "").trim();

    if (!finalUser || !finalPass) {
      toast.error("Please enter both username/email and password");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await adminLoginAccountFn({
        data: {
          identifier: finalUser,
          secret: finalPass,
          passwordOrPasscode: finalPass,
        },
      });

      if (res.success && res.token && res.account) {
        setIsAuthenticated(true);
        setSessionToken(res.token);
        setCurrentAccount(res.account);
        sessionStorage.setItem("sodacraft_admin_token", res.token);
        sessionStorage.setItem("sodacraft_admin_account", JSON.stringify(res.account));

        // Always clean any saved credentials
        try {
          localStorage.removeItem("sodacraft_saved_admin_user");
          localStorage.removeItem("sodacraft_saved_admin_pass");
        } catch {
          // ignore
        }

        toast.success(`Welcome back, ${res.account.username}!`);
        await fetchRealtimeData(res.token);
      } else {
        toast.error(res.message || "Invalid credentials. Please check your details.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      toast.error("Database connection failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionToken(null);
    setCurrentAccount(null);
    sessionStorage.removeItem("sodacraft_admin_token");
    sessionStorage.removeItem("sodacraft_admin_account");
    toast.info("Admin session locked.");
  };

  const handleResetGoalConfirm = async () => {
    if (!sessionToken) {
      toast.error("Admin authentication required");
      return;
    }
    setIsResettingGoal(true);
    try {
      const res = await resetGoalPaymentsFn({ data: { token: sessionToken } });
      if (res.success) {
        setPayments([]);
        toast.success("✅ Goal payments reset to ₹0 successfully!");
        setShowResetConfirm(false);
        await fetchRealtimeData(sessionToken);
      } else {
        toast.error(res.message || "Failed to reset goal payments");
      }
    } catch (err) {
      console.error("Reset goal error:", err);
      toast.error("Failed to connect to database for reset");
    } finally {
      setIsResettingGoal(false);
    }
  };

  const handleDeletePayment = async (paymentId: string, name: string, amount: number) => {
    if (!sessionToken) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete payment of ₹${amount} from ${name}?`,
    );
    if (!confirmDelete) return;

    try {
      const res = await deletePaymentFn({
        data: { token: sessionToken, paymentId },
      });
      if (res.success) {
        setPayments((prev) => prev.filter((p) => (p.paymentId || p.id) !== paymentId));
        toast.success(`Payment of ₹${amount} removed from database`);
      } else {
        toast.error(res.message || "Failed to delete payment");
      }
    } catch (err) {
      console.error("Delete payment error:", err);
      toast.error("Database deletion failed");
    }
  };

  const handleUpdateUrlToken = async () => {
    const clean = urlTokenInput.trim() || "custom";
    const updated = { ...config, urlToken: clean };
    setConfig(updated);
    if (sessionToken) {
      try {
        await saveDbConfigFn({
          data: {
            token: sessionToken,
            config: { urlToken: clean },
          },
        });
        saveAdminConfig(updated);
        toast.success(`✅ Secret URL Token updated to: ?token=${clean}`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to save URL token to database");
      }
    } else {
      saveAdminConfig(updated);
      toast.success(`URL token updated to: ?token=${clean}`);
    }
  };

  const handleSaveAll = async () => {
    try {
      const mergedConfig = {
        ...config,
        urlToken: urlTokenInput.trim() || config.urlToken || "custom",
      };
      if (sessionToken) {
        await saveDbConfigFn({
          data: {
            token: sessionToken,
            config: mergedConfig,
          },
        });
      }
      saveAdminConfig(mergedConfig);
      toast.success("✅ Admin settings saved to database & applied instantly!");
    } catch (err) {
      console.error("Save config error:", err);
      toast.error("Failed to save settings to database");
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccUser.trim() || !newAccPass.trim()) {
      toast.error("Username and password are required");
      return;
    }
    try {
      const res = await createAdminAccountFn({
        data: {
          token: sessionToken || "",
          username: newAccUser,
          email: newAccEmail,
          password: newAccPass,
          role: newAccRole,
        },
      });
      if (res.success && res.accounts) {
        setAdminAccounts(res.accounts);
        setNewAccUser("");
        setNewAccEmail("");
        setNewAccPass("");
        toast.success("New admin account registered in database!");
      } else {
        toast.error(res.message || "Could not create account");
      }
    } catch (err) {
      console.error("Create account error:", err);
      toast.error("Failed to create admin account");
    }
  };

  const handleDeleteAccount = async (id: string, username: string) => {
    if (!sessionToken) return;
    if (adminAccounts.length <= 1) {
      toast.error("You must keep at least one admin account!");
      return;
    }
    const confirmDel = window.confirm(`Delete admin user "${username}" permanently?`);
    if (!confirmDel) return;

    try {
      const res = await deleteAdminAccountFn({
        data: { token: sessionToken, accountId: id },
      });
      if (res.success && res.accounts) {
        setAdminAccounts(res.accounts);
        toast.success(`Account ${username} deleted from database`);
      } else {
        toast.error(res.message || "Could not delete account");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Failed to delete admin account");
    }
  };

  const handleToggleSocialLink = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    }));
  };

  const handleUpdateSocialLinkHref = (id: string, href: string) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) => (item.id === id ? { ...item, href } : item)),
    }));
  };

  const handleAddSocialLink = () => {
    if (!newLinkLabel.trim() || !newLinkHref.trim()) {
      toast.error("Please provide both label and URL");
      return;
    }
    const newLink: SiteSocialLink = {
      id: `custom-${Date.now()}`,
      label: newLinkLabel.trim(),
      href: newLinkHref.trim(),
      enabled: true,
    };
    setConfig((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, newLink],
    }));
    setNewLinkLabel("");
    setNewLinkHref("");
    toast.success(`Added link: ${newLink.label}`);
  };

  const handleRemoveSocialLink = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((item) => item.id !== id),
    }));
  };

  const handleAddPreset = () => {
    const val = parseInt(newPresetAmount.trim(), 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid positive amount");
      return;
    }
    if (config.presetAmounts.includes(val)) {
      toast.error("Amount already exists");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      presetAmounts: [...prev.presetAmounts, val].sort((a, b) => a - b),
    }));
    setNewPresetAmount("");
    toast.success(`Added ₹${val} preset`);
  };

  const handleRemovePreset = (val: number) => {
    if (config.presetAmounts.length <= 1) {
      toast.error("Keep at least one preset amount");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      presetAmounts: prev.presetAmounts.filter((a) => a !== val),
    }));
  };

  const handleUpdatePasscode = () => {
    if (!newPasscode.trim() || newPasscode.trim().length < 4) {
      toast.error("Passcode must be at least 4 characters");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      secretCode: newPasscode.trim(),
    }));
    setNewPasscode("");
    toast.success("Secret passcode updated! Remember to click Save Settings.");
  };

  const totalRaised = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight ? "bg-slate-50 text-slate-800" : "bg-[oklch(0.12_0.02_260)] text-white"
      }`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between ${
          isLight
            ? "bg-white/85 border-slate-200 shadow-sm"
            : "bg-[oklch(0.14_0.02_260)]/85 border-white/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white/70 hover:text-white flex items-center gap-1.5 text-xs font-bold"
            title="Back to Website"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Website</span>
          </Link>

          <div className="h-5 w-px bg-white/15 mx-1" />

          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isAuthenticated
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[oklch(0.65_0.24_25)]/20 text-[oklch(0.75_0.22_25)] border border-[oklch(0.65_0.24_25)]/30"
              }`}
            >
              {isAuthenticated ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                <span>SodaCraft Admin Dashboard</span>
                {isAuthenticated && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </h1>
              <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-white/50"}`}>
                {isAuthenticated
                  ? `Logged in as ${currentAccount?.username || "Superadmin"} • Real-time Razorpay Database`
                  : "Database Admin Portal (Protected Access)"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
            title="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {isAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => fetchRealtimeData()}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                title="Refresh Real-time Data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/15 border border-rose-500/20 transition cursor-pointer"
                title="Lock Dashboard"
              >
                Lock Session
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!isAuthenticated ? (
          /* Login Card */
          <div className="max-w-md mx-auto my-12">
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-2xl text-center ${
                isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
              }`}
            >
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[oklch(0.65_0.24_25)]/15 border border-[oklch(0.65_0.24_25)]/30 flex items-center justify-center text-[oklch(0.75_0.22_25)] mb-4 shadow-lg shadow-red-500/10">
                <KeyRound className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-black mb-1">Admin Database Login</h2>
              <p className={`text-xs mb-6 ${isLight ? "text-slate-500" : "text-white/60"}`}>
                Sign in to manage Razorpay payments, real-time receipts & support settings
              </p>

              <form
                onSubmit={handleLogin}
                className="space-y-4 text-left"
                autoComplete="off"
                data-form-type="other"
              >
                <div>
                  <label
                    htmlFor="admin-login-username"
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80"
                  >
                    Username or Admin Email:
                  </label>
                  <input
                    id="admin-login-username"
                    name="admin_username_no_autofill"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter Admin Username or Email"
                    autoFocus
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium border outline-none transition ${
                      isLight
                        ? "bg-slate-100 border-slate-300 text-slate-900 focus:border-red-500"
                        : "bg-black/40 border-white/15 text-white focus:border-[oklch(0.65_0.24_25)]"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-login-password"
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80"
                  >
                    Password / Master Passcode:
                  </label>
                  <div className="relative">
                    <input
                      id="admin-login-password"
                      name="admin_password_no_autofill"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter Admin Password"
                      className={`w-full py-2.5 px-4 pr-11 rounded-xl text-sm font-medium border outline-none transition ${
                        isLight
                          ? "bg-slate-100 border-slate-300 text-slate-900 focus:border-red-500"
                          : "bg-black/40 border-white/15 text-white focus:border-[oklch(0.65_0.24_25)]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-6 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-extrabold text-sm shadow-lg shadow-red-500/20 transition cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoggingIn ? "Authenticating with Database..." : "Sign In to Admin Dashboard"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div
            className={`rounded-3xl border shadow-xl overflow-hidden ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            {/* Tabs Header */}
            <div
              className={`flex border-b overflow-x-auto ${
                isLight ? "border-slate-200 bg-slate-100/60" : "border-white/10 bg-white/5"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "support"
                    ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Support Details & Goal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("realtime")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "realtime"
                    ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Real-time Payments ({payments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("links")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "links"
                    ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Social Links</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("accounts")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "accounts"
                    ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Admin Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "security"
                    ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Security & Token</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("access-info")}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === "access-info"
                    ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Access, Links & Info</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 sm:p-8">
              {/* TAB 1: SUPPORT DETAILS & GOAL */}
              {activeTab === "support" && (
                <div className="space-y-6">
                  {/* Reset Goal Banner */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                          Goal Payments Reset Control
                        </h4>
                      </div>
                      <p className="text-xs text-white/70">
                        Current verified raised amount is{" "}
                        <span className="font-black text-white">
                          ₹{totalRaised.toLocaleString()}
                        </span>{" "}
                        of <span className="font-bold">₹{config.monthlyGoal.toLocaleString()}</span>
                        .
                      </p>
                    </div>

                    {!showResetConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(true)}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Goal to ₹0</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-rose-500/30">
                        <span className="text-xs text-rose-300 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Confirm Reset?
                        </span>
                        <button
                          type="button"
                          onClick={handleResetGoalConfirm}
                          disabled={isResettingGoal}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
                        >
                          {isResettingGoal ? "Resetting..." : "Yes, Reset to ₹0"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Goal Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        Monthly Goal Target (₹):
                      </label>
                      <input
                        type="number"
                        value={config.monthlyGoal}
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            monthlyGoal: Math.max(1, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        Goal Campaign Title:
                      </label>
                      <input
                        type="text"
                        value={config.goalTitle}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, goalTitle: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                    </div>
                  </div>

                  {/* Support Branding */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        Support Page Title:
                      </label>
                      <input
                        type="text"
                        value={config.supportTitle}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, supportTitle: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        Support Subtitle:
                      </label>
                      <input
                        type="text"
                        value={config.supportSubtitle}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, supportSubtitle: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                    </div>
                  </div>

                  {/* WhatsApp & UPI */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        Creator WhatsApp Number:
                      </label>
                      <input
                        type="text"
                        value={config.whatsappNumber}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            whatsappNumber: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        placeholder="919629123982"
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                      <span className="text-[10px] text-white/50">
                        Auto-receives WhatsApp receipt messages after payment
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        UPI ID:
                      </label>
                      <input
                        type="text"
                        value={config.upiId}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, upiId: e.target.value.trim() }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-1.5">
                        Payee Name:
                      </label>
                      <input
                        type="text"
                        value={config.payeeName}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, payeeName: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                    </div>
                  </div>

                  {/* Razorpay Live Credentials */}
                  <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
                    <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCardIcon className="w-4 h-4" />
                      <span>Razorpay Live Credentials (Database-Protected)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold opacity-75 block mb-1">
                          Razorpay Key ID:
                        </label>
                        <input
                          type="text"
                          value={config.razorpayKeyId || ""}
                          autoComplete="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, razorpayKeyId: e.target.value.trim() }))
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/30 border border-white/10 text-white outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold opacity-75 block mb-1">
                          Razorpay Key Secret:
                        </label>
                        <input
                          type="password"
                          value={config.razorpayKeySecret || ""}
                          autoComplete="new-password"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              razorpayKeySecret: e.target.value.trim(),
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-black/30 border border-white/10 text-white outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preset Amounts */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-80 block mb-2">
                      Preset Support Amounts:
                    </label>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {config.presetAmounts.map((amt) => (
                        <div
                          key={amt}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold"
                        >
                          <span>₹{amt}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePreset(amt)}
                            className="text-white/40 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 max-w-xs">
                      <input
                        type="number"
                        value={newPresetAmount}
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) => setNewPresetAmount(e.target.value)}
                        placeholder="Add amount (e.g. 2000)"
                        className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddPreset}
                        className="py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save All Support Details</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: REAL-TIME PAYMENTS */}
              {activeTab === "realtime" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-xs opacity-60 font-semibold mb-1">
                        Total Verified Raised
                      </div>
                      <div className="text-2xl font-black text-emerald-400">
                        ₹{totalRaised.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-xs opacity-60 font-semibold mb-1">Supporters Count</div>
                      <div className="text-2xl font-black">{payments.length}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="text-xs opacity-60 font-semibold mb-1">Goal Progress</div>
                      <div className="text-2xl font-black text-amber-400">
                        {Math.min(100, Math.round((totalRaised / (config.monthlyGoal || 1)) * 100))}
                        %
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">
                      Database Payment Records ({payments.length}):
                    </h4>
                    {payments.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-xs opacity-50">
                        No payments recorded yet. Goal is at ₹0. Real-time payments will appear here
                        instantly.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                        {payments.map((p) => (
                          <div
                            key={p.paymentId || p.id}
                            className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-sm text-white flex items-center gap-2">
                                <span>{p.name}</span>
                                {p.paymentId && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                    {p.paymentId}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/60">
                                {p.message || "No message attached"}
                              </p>
                              <span className="text-[10px] text-white/40">
                                {p.createdAt ? new Date(p.createdAt).toLocaleString() : "Just now"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-base font-black text-emerald-400">
                                  ₹{p.amount}
                                </div>
                                <span className="text-[10px] text-emerald-400/80 font-semibold">
                                  ✓ Verified
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePayment(p.paymentId || p.id, p.name, p.amount)
                                }
                                className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                                title="Delete payment entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SOCIAL LINKS */}
              {activeTab === "links" && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {config.socialLinks.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-white/10 bg-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSocialLink(item.id)}
                            className={`w-9 h-5 rounded-full transition relative cursor-pointer ${
                              item.enabled ? "bg-emerald-500" : "bg-white/20"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                                item.enabled ? "translate-x-4" : ""
                              }`}
                            />
                          </button>
                          <span className="font-bold text-xs">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
                          <input
                            type="url"
                            value={item.href}
                            autoComplete="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            onChange={(e) => handleUpdateSocialLinkHref(item.id, e.target.value)}
                            placeholder="https://..."
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-black/30 border border-white/10 text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveSocialLink(item.id)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Link */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider">Add Custom Link:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newLinkLabel}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) => setNewLinkLabel(e.target.value)}
                        placeholder="Label (e.g. Discord)"
                        className="px-3 py-2 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                      />
                      <input
                        type="url"
                        value={newLinkHref}
                        autoComplete="off"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        onChange={(e) => setNewLinkHref(e.target.value)}
                        placeholder="https://..."
                        className="px-3 py-2 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSocialLink}
                      className="py-1.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save All Links</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: ADMIN ACCOUNTS */}
              {activeTab === "accounts" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">
                      Registered Database Admin Accounts:
                    </h4>
                    <div className="space-y-2">
                      {adminAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm">{acc.username}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase font-bold">
                                {acc.role}
                              </span>
                            </div>
                            <p className="text-xs text-white/60">{acc.email || "No email"}</p>
                            <span className="text-[10px] text-white/40">
                              Created: {new Date(acc.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {adminAccounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAccount(acc.id, acc.username)}
                              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/15 transition cursor-pointer"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New Admin Account Form */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
                    <h5 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-400" />
                      <span>Add New Admin Account to Database</span>
                    </h5>
                    <form onSubmit={handleCreateAccount} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold opacity-75 block mb-1">
                            Username *
                          </label>
                          <input
                            type="text"
                            value={newAccUser}
                            onChange={(e) => setNewAccUser(e.target.value)}
                            placeholder="e.g. mod_santhosh"
                            required
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold opacity-75 block mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={newAccEmail}
                            onChange={(e) => setNewAccEmail(e.target.value)}
                            placeholder="admin@example.com"
                            autoComplete="off"
                            className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold opacity-75 block mb-1">
                            Password *
                          </label>
                          <input
                            type="password"
                            value={newAccPass}
                            onChange={(e) => setNewAccPass(e.target.value)}
                            placeholder="Strong admin password"
                            required
                            autoComplete="new-password"
                            className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold opacity-75 block mb-1">
                            Role
                          </label>
                          <select
                            value={newAccRole}
                            onChange={(e) =>
                              setNewAccRole(e.target.value as "admin" | "superadmin")
                            }
                            className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-white/10 text-white outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                      >
                        Register Account
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 5: SECURITY & TOKEN */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  {/* URL Token Management Card */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Secret URL Access Token (?token=...)</span>
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        ?token={urlTokenInput || "custom"}
                      </span>
                    </div>

                    <p className="text-xs text-white/80 leading-relaxed">
                      Change the URL token used to access the admin portal. You can use any custom
                      word like <code className="text-emerald-400 font-mono">custom</code> or your
                      own secret phrase.
                    </p>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                        URL Token Value:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-white/40">
                            ?token=
                          </span>
                          <input
                            type="text"
                            value={urlTokenInput}
                            onChange={(e) => setUrlTokenInput(e.target.value)}
                            placeholder="custom"
                            autoComplete="off"
                            className="w-full pl-18 pr-4 py-2 rounded-xl text-sm bg-black/40 border border-white/15 text-white font-mono outline-none focus:border-amber-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleUpdateUrlToken}
                          className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer"
                        >
                          Save Token
                        </button>
                      </div>
                    </div>

                    {/* Quick Links & Copy */}
                    <div className="space-y-2 pt-2 border-t border-amber-500/20">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-white/70 block">
                        Access URLs:
                      </label>

                      {/* Separate Tab Admin URL */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                        <div className="truncate font-mono text-emerald-400">
                          https://sodacrafttamil.vercel.app/admin?token={urlTokenInput || "custom"}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/admin?token=${urlTokenInput || "custom"}`,
                              );
                              toast.success("Copied Admin URL!");
                            }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                            title="Copy URL"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Home Modal URL */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                        <div className="truncate font-mono text-white/70">
                          https://sodacrafttamil.vercel.app/?token={urlTokenInput || "custom"}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/?token=${urlTokenInput || "custom"}`,
                            );
                            toast.success("Copied homepage secret token URL!");
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Master Secret Passcode */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-80 block">
                      Update Master Secret Passcode:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="Enter new 4+ character secret code"
                        autoComplete="new-password"
                        spellCheck={false}
                        data-lpignore="true"
                        data-1p-ignore="true"
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-black/30 border border-white/10 text-white outline-none focus:border-[oklch(0.65_0.24_25)]"
                      />
                      <button
                        type="button"
                        onClick={handleUpdatePasscode}
                        className="py-2.5 px-4 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Update Code
                      </button>
                    </div>
                    <p className="text-[11px] text-white/50">
                      Current Master Passcode:{" "}
                      <span className="font-mono text-white/80">{config.secretCode}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 6: ACCESS, LINKS & INFORMATION */}
              {activeTab === "access-info" && (
                <div className="space-y-6">
                  {/* Overview Card */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-[oklch(0.75_0.22_25)]" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Master Access, Links & Configuration Information
                      </h3>
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed">
                      All system entry points, secret URLs, admin configurations, and credentials
                      information are strictly centralized here inside the authenticated Admin
                      Panel. Default credential hints are completely hidden from public visitors on
                      the website.
                    </p>
                  </div>

                  {/* 1. Administrative Direct Access URLs */}
                  <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                          Admin Portal Access Links
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                        Token: {urlTokenInput || "custom"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Separate Tab Admin Page */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white/90">
                            Dedicated Admin Dashboard Page
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            Full Screen / Separate Route
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono text-emerald-400 truncate">
                            {typeof window !== "undefined" ? window.location.origin : ""}
                            /admin?token={urlTokenInput || "custom"}
                          </code>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/admin?token=${urlTokenInput || "custom"}`,
                                );
                                toast.success("Copied Dedicated Admin URL!");
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/admin?token=${encodeURIComponent(urlTokenInput || "custom")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition flex items-center gap-1 font-bold text-[11px]"
                              title="Open Link"
                            >
                              <ExtLink className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Homepage Secret Token Modal Link */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white/90">
                            Homepage Secret Popup Trigger Link
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            In-Page Modal
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono text-white/80 truncate">
                            {typeof window !== "undefined" ? window.location.origin : ""}/?token=
                            {urlTokenInput || "custom"}
                          </code>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/?token=${urlTokenInput || "custom"}`,
                                );
                                toast.success("Copied Homepage Secret Trigger URL!");
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/?token=${encodeURIComponent(urlTokenInput || "custom")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition flex items-center gap-1 font-bold text-[11px]"
                              title="Open Link"
                            >
                              <ExtLink className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Support Page Secret Token Modal Link */}
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white/90">
                            Support Page Secret Popup Trigger Link
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                            Supporter Route
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-xs font-mono text-blue-300 truncate">
                            {typeof window !== "undefined" ? window.location.origin : ""}
                            /support?token={urlTokenInput || "custom"}
                          </code>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/support?token=${urlTokenInput || "custom"}`,
                                );
                                toast.success("Copied Support Page Secret Trigger URL!");
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/support?token=${encodeURIComponent(urlTokenInput || "custom")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition flex items-center gap-1 font-bold text-[11px]"
                              title="Open Link"
                            >
                              <ExtLink className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Public Facing Website Links & Routes */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Public Website Routes & Navigation
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          label: "Home Page",
                          path: "/",
                          desc: "Live counter, videos, & supporter list",
                        },
                        {
                          label: "Support / Payment Page",
                          path: "/support",
                          desc: "UPI QR payment checkout & verified receipts",
                        },
                        {
                          label: "Contact Us",
                          path: "/contact",
                          desc: "Creator contact channels & support email",
                        },
                        {
                          label: "Terms & Conditions",
                          path: "/terms",
                          desc: "Legal terms of service & policy",
                        },
                        {
                          label: "Privacy Policy",
                          path: "/privacy",
                          desc: "Data privacy & user security guidelines",
                        },
                        {
                          label: "Refund Policy",
                          path: "/refund",
                          desc: "Creator donation & cancellation policy",
                        },
                      ].map((item) => (
                        <div
                          key={item.path}
                          className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white">{item.label}</div>
                            <div className="text-[11px] text-white/50 truncate font-mono">
                              {item.path}
                            </div>
                            <div className="text-[10px] text-white/40">{item.desc}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}${item.path}`,
                                );
                                toast.success(`Copied ${item.label} link!`);
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={item.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition"
                              title="Open link"
                            >
                              <ExtLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Confidential Superadmin & System Credentials Info */}
                  <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                          Internal System Credentials & Master Keys
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">
                        Admin Confidential
                      </span>
                    </div>

                    <p className="text-xs text-white/70">
                      These credentials allow authorized administrators to authenticate into this
                      dashboard. They are strictly hidden from public visitors and only stored here.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[11px] font-bold text-white/60 block">
                          Superadmin Username:
                        </span>
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono font-bold text-emerald-400">
                            SodaCraftTamil
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("SodaCraftTamil");
                              toast.success("Copied username!");
                            }}
                            className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[11px] font-bold text-white/60 block">
                          Superadmin Email:
                        </span>
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono font-bold text-emerald-400">
                            SodaCraftads@gmail.com
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText("SodaCraftads@gmail.com");
                              toast.success("Copied email!");
                            }}
                            className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[11px] font-bold text-white/60 block">
                          Master Secret Passcode:
                        </span>
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono font-bold text-amber-400">
                            {config.secretCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(config.secretCode);
                              toast.success("Copied passcode!");
                            }}
                            className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                        <span className="text-[11px] font-bold text-white/60 block">
                          URL Access Token (?token=...):
                        </span>
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono font-bold text-purple-400">
                            {config.urlToken || "custom"}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(config.urlToken || "custom");
                              toast.success("Copied URL token!");
                            }}
                            className="text-[11px] text-purple-400 hover:underline cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Support & Payment Configuration Snapshot */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Current Configuration Snapshot
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[10px] text-white/50 block">Monthly Goal</span>
                        <span className="font-extrabold text-white">
                          ₹{config.monthlyGoal.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[10px] text-white/50 block">UPI ID</span>
                        <span className="font-mono font-bold text-white truncate block">
                          {config.upiId}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[10px] text-white/50 block">Admin Accounts</span>
                        <span className="font-extrabold text-white">
                          {adminAccounts.length} Accounts
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[10px] text-white/50 block">
                          Active Verified Payments
                        </span>
                        <span className="font-extrabold text-white">
                          {payments.length} Payments
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CreditCardIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
