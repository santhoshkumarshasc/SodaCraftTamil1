import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  KeyRound,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Power,
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
  Info,
  Zap,
} from "lucide-react";
import {
  getAdminConfig,
  saveAdminConfig,
  resetAdminConfig,
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
  resetGoalPaymentsFn,
  deletePaymentFn,
} from "@/lib/admin.functions";
import type { Supporter } from "@/lib/support.functions";

interface AdminSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function AdminSecretModal({ isOpen, onClose, isLight = false }: AdminSecretModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [currentAccount, setCurrentAccount] = useState<{
    id: string;
    username: string;
    email: string;
    role: string;
  } | null>(null);

  // Login Form States
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    "support" | "realtime" | "links" | "accounts" | "security" | "access-info"
  >("support");

  // Support details & Goal action states
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isResettingGoal, setIsResettingGoal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Database Data States
  const [config, setConfig] = useState<AdminSiteConfig>(getAdminConfig());
  const [payments, setPayments] = useState<Supporter[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<
    { id: string; username: string; email: string; role: string; createdAt: string }[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Account Form
  const [newAccUser, setNewAccUser] = useState("");
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPass, setNewAccPass] = useState("");
  const [newAccRole, setNewAccRole] = useState<"admin" | "superadmin">("admin");

  // New Link & Preset temporary state
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [newPresetAmount, setNewPresetAmount] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [urlTokenInput, setUrlTokenInput] = useState(config.urlToken || "SodaCraftTamil");

  const fetchRealtimeData = useCallback(
    async (tokenToUse?: string) => {
      const token = tokenToUse || sessionToken;
      if (!token) return;
      setIsRefreshing(true);
      try {
        // 1. Fetch Payments in real-time
        const paymentsRes = await getAdminPaymentsFn({ data: { token } });
        if (paymentsRes.success) {
          setPayments(paymentsRes.supporters);
        }

        // 2. Fetch Admin Accounts
        const accountsRes = await getAdminAccountsFn({ data: { token } });
        if (accountsRes.success) {
          setAdminAccounts(accountsRes.accounts);
        }

        // 3. Fetch latest Config
        const dbConfig = await getDbConfigFn();
        if (dbConfig) {
          setConfig(dbConfig);
          setUrlTokenInput(dbConfig.urlToken || "SodaCraftTamil");
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

  useEffect(() => {
    if (isOpen) {
      const savedToken = sessionStorage.getItem("sodacraft_admin_token");
      if (savedToken) {
        setSessionToken(savedToken);
        setIsAuthenticated(true);
        fetchRealtimeData(savedToken);
      } else {
        setIsAuthenticated(false);
        setPasswordInput("");
        // Ensure no autofilled credentials
        try {
          localStorage.removeItem("sodacraft_saved_admin_user");
          localStorage.removeItem("sodacraft_saved_admin_pass");
        } catch {
          // ignore
        }
      }
    }
  }, [isOpen, fetchRealtimeData]);

  // Real-time polling when modal is open and authenticated
  useEffect(() => {
    if (!isOpen || !isAuthenticated || !sessionToken) return;
    const interval = setInterval(() => {
      fetchRealtimeData();
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, isAuthenticated, sessionToken, fetchRealtimeData]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const form = e ? (e.currentTarget as HTMLFormElement) : null;
    const userInput = form?.querySelector<HTMLInputElement>(
      'input[name="modal_username_no_autofill"]',
    );
    const passInput = form?.querySelector<HTMLInputElement>(
      'input[name="modal_password_no_autofill"]',
    );
    const domUser = userInput?.value;
    const domPass = passInput?.value;

    const finalUser = (domUser || usernameInput || "").trim();
    const finalPass = (domPass || passwordInput || "").trim();

    if (!finalPass) {
      toast.error("Please enter password or passcode");
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

      if (res.success && res.token) {
        setSessionToken(res.token);
        setIsAuthenticated(true);
        if (res.account) {
          setCurrentAccount(res.account);
        }
        sessionStorage.setItem("sodacraft_admin_token", res.token);
        sessionStorage.setItem("sodacraft_admin_authenticated", "true");

        try {
          localStorage.removeItem("sodacraft_saved_admin_user");
          localStorage.removeItem("sodacraft_saved_admin_pass");
        } catch {
          // ignore
        }

        toast.success("🔓 Admin access granted! Connected to live database.");
        fetchRealtimeData(res.token);
      } else {
        toast.error(res.message || "Invalid credentials. Please verify your details.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Connection error while logging in");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSessionToken("");
    setCurrentAccount(null);
    sessionStorage.removeItem("sodacraft_admin_token");
    sessionStorage.removeItem("sodacraft_admin_authenticated");
    toast.info("Admin session locked.");
  };

  const handleUpdateUrlToken = async () => {
    const clean = urlTokenInput.trim() || "SodaCraftTamil";
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
        urlToken: urlTokenInput.trim() || config.urlToken || "SodaCraftTamil",
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
      onClose();
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
          token: sessionToken,
          username: newAccUser,
          email: newAccEmail,
          password: newAccPass,
          role: newAccRole,
        },
      });
      if (res.success) {
        toast.success(`Admin account "${newAccUser}" created in database!`);
        setNewAccUser("");
        setNewAccEmail("");
        setNewAccPass("");
        fetchRealtimeData();
      } else {
        toast.error(res.message || "Failed to create account");
      }
    } catch (err) {
      console.error("Create account error:", err);
      toast.error("Error creating account");
    }
  };

  const handleDeleteAccount = async (id: string, username: string) => {
    if (!confirm(`Delete admin account "${username}" from database?`)) return;
    try {
      const res = await deleteAdminAccountFn({
        data: {
          token: sessionToken,
          accountId: id,
        },
      });
      if (res.success) {
        toast.success(`Account "${username}" removed.`);
        fetchRealtimeData();
      } else {
        toast.error(res.message || "Cannot delete account");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Error deleting account");
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all settings to original defaults?")) {
      const def = resetAdminConfig();
      setConfig(def);
      toast.info("Reset to default configuration.");
    }
  };

  const handleResetGoalPayments = async () => {
    setIsResettingGoal(true);
    try {
      if (sessionToken) {
        const res = await resetGoalPaymentsFn({ data: { token: sessionToken } });
        if (res.success) {
          setPayments([]);
          toast.success("✅ Payment in goal successfully reset to ₹0!");
          setShowResetConfirm(false);
          await fetchRealtimeData();
          return;
        }
      }
      setPayments([]);
      toast.success("Payment in goal reset to ₹0.");
      setShowResetConfirm(false);
    } catch (err) {
      console.error("Reset goal payments error:", err);
      toast.error("Failed to reset goal payments");
    } finally {
      setIsResettingGoal(false);
    }
  };

  const handleDeletePayment = async (paymentId: string, name: string, amount: number) => {
    if (!confirm(`Delete payment transaction of ₹${amount} from "${name}"?`)) return;
    try {
      if (sessionToken) {
        const res = await deletePaymentFn({ data: { token: sessionToken, paymentId } });
        if (res.success) {
          toast.success(`Removed transaction of ₹${amount}`);
          setPayments((prev) =>
            prev.filter((p) => p.id !== paymentId && p.paymentId !== paymentId),
          );
          fetchRealtimeData();
          return;
        }
      }
      setPayments((prev) => prev.filter((p) => p.id !== paymentId && p.paymentId !== paymentId));
      toast.success("Transaction removed");
    } catch (err) {
      console.error("Delete payment error:", err);
      toast.error("Failed to delete transaction");
    }
  };

  const handleToggleSupport = () => {
    setConfig((prev) => ({
      ...prev,
      supportButtonEnabled: !prev.supportButtonEnabled,
    }));
  };

  const handleUpdateSocialLink = (id: string, updates: Partial<SiteSocialLink>) => {
    setConfig((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
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
    toast.success("Secret code updated! Remember your new code.");
  };

  if (!isOpen) return null;

  const totalRaised = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden my-6 ${
            isLight
              ? "bg-white border-slate-200 text-slate-800"
              : "bg-[oklch(0.12_0.02_260)] border-white/10 text-white"
          }`}
        >
          {/* Header Bar */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between ${
              isLight ? "border-slate-100 bg-slate-50" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isAuthenticated
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-[oklch(0.65_0.24_25)]/20 text-[oklch(0.75_0.22_25)] border border-[oklch(0.65_0.24_25)]/30"
                }`}
              >
                {isAuthenticated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>SodaCraft Admin Dashboard</span>
                  {isAuthenticated && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Database
                    </span>
                  )}
                </h2>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>
                  {isAuthenticated
                    ? `Logged in as ${currentAccount?.username || "Admin"} • Real-time Razorpay & Account Database`
                    : "Database-backed Admin Login (Accessed via Secret Token)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/admin?token=${encodeURIComponent(urlTokenInput || config.urlToken || "SodaCraftTamil")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 transition flex items-center gap-1.5 cursor-pointer"
                title="Open Dashboard in Separate Tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Separate Tab</span>
              </a>

              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    onClick={() => fetchRealtimeData()}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Refresh Real-time Data"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
                    title="Lock Dashboard"
                  >
                    Lock Session
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {!isAuthenticated ? (
            /* Admin Login Account Screen */
            <div className="p-6 sm:p-8 max-w-md mx-auto text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[oklch(0.65_0.24_25)]/15 border border-[oklch(0.65_0.24_25)]/30 flex items-center justify-center text-[oklch(0.75_0.22_25)] mb-4 shadow-lg shadow-red-500/10">
                <KeyRound className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black mb-1">Admin Database Login</h3>
              <p className={`text-xs mb-6 ${isLight ? "text-slate-500" : "text-white/60"}`}>
                Sign in to manage Razorpay payments, real-time receipts & admin accounts
              </p>

              <form
                onSubmit={handleLogin}
                className="space-y-4 text-left"
                autoComplete="off"
                data-form-type="other"
              >
                <div>
                  <label
                    htmlFor="modal-login-username"
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80"
                  >
                    Username or Admin Email:
                  </label>
                  <input
                    id="modal-login-username"
                    name="modal_username_no_autofill"
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
                    htmlFor="modal-login-password"
                    className="block text-xs font-bold uppercase tracking-wider mb-1.5 opacity-80"
                  >
                    Password / Master Passcode:
                  </label>
                  <div className="relative">
                    <input
                      id="modal-login-password"
                      name="modal_password_no_autofill"
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
          ) : (
            /* Authenticated Admin Dashboard */
            <div>
              {/* Tabs Navigation */}
              <div
                className={`flex border-b overflow-x-auto ${
                  isLight ? "border-slate-100 bg-slate-50/50" : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("support")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "support"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Support Details & Goal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("realtime")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "realtime"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Real-time Payments ({payments.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("links")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "links"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Social Links</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("accounts")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "accounts"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Admin Accounts ({adminAccounts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "security"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Security & Passcode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("access-info")}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "access-info"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Access, Links & Info</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5 sm:p-6 max-h-[62vh] overflow-y-auto space-y-6">
                {/* TAB 0: SUPPORT DETAILS & GOAL (ADMIN FULL EDIT) */}
                {activeTab === "support" && (
                  <div className="space-y-6">
                    {/* 1. MONTHLY GOAL & RESET COLLECTED PAYMENTS */}
                    <div
                      className={`p-5 rounded-2xl border space-y-4 ${
                        isLight
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white/5 border-white/10 shadow-lg"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-5 h-5 text-[oklch(0.75_0.22_25)]" />
                          <h4 className="font-extrabold text-sm sm:text-base">
                            Monthly Goal & Payment Reset
                          </h4>
                        </div>

                        {/* Reset Goal Payments Button */}
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(true)}
                          disabled={isResettingGoal || totalRaised === 0}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${isResettingGoal ? "animate-spin" : ""}`}
                          />
                          <span>Reset Payment in Goal (₹0)</span>
                        </button>
                      </div>

                      {/* Goal Live Progress Banner */}
                      <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 space-y-2">
                        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                          <span className="font-semibold text-white/70">Current Goal Raised:</span>
                          <span className="font-black text-emerald-400">
                            ₹{totalRaised.toLocaleString("en-IN")} / ₹
                            {config.monthlyGoal.toLocaleString("en-IN")} (
                            {config.monthlyGoal > 0
                              ? Math.round((totalRaised / config.monthlyGoal) * 100)
                              : 0}
                            %)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-black/40 overflow-hidden border border-white/5 p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.24_25)] to-orange-500 transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, config.monthlyGoal > 0 ? (totalRaised / config.monthlyGoal) * 100 : 0))}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/40">
                          <span>{payments.length} verified transactions recorded</span>
                          <span>
                            Click &apos;Reset Payment in Goal&apos; to clear payments back to ₹0
                          </span>
                        </div>
                      </div>

                      {/* Goal Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
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
                                monthlyGoal: Math.max(100, parseInt(e.target.value, 10) || 15000),
                              }))
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-bold ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                            Monthly Goal Heading / Title:
                          </label>
                          <input
                            type="text"
                            value={config.goalTitle || ""}
                            autoComplete="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                goalTitle: e.target.value,
                              }))
                            }
                            placeholder="e.g. Monthly SMP Server & Stream Fund"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. SUPPORT PAGE BRANDING & DETAILS */}
                    <div
                      className={`p-5 rounded-2xl border space-y-4 ${
                        isLight
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white/5 border-white/10 shadow-lg"
                      }`}
                    >
                      <h4 className="font-extrabold text-sm sm:text-base">
                        Support Page Branding & Content
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                            Support Page Headline:
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
                            placeholder="Support SodaCraft Tamil Gaming"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                            Payee / Channel Display Name:
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
                            placeholder="SodaCraft Tamil"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                          Support Subtitle / Community Bio:
                        </label>
                        <textarea
                          rows={2}
                          value={config.supportSubtitle}
                          autoComplete="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, supportSubtitle: e.target.value }))
                          }
                          placeholder="Fuel next-level Minecraft Tamil adventures, SMP episodes & high-FPS live streams..."
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none resize-none ${
                            isLight
                              ? "bg-white border-slate-200 text-slate-900"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                          Payment Note / Purpose:
                        </label>
                        <input
                          type="text"
                          value={config.paymentNote}
                          autoComplete="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, paymentNote: e.target.value }))
                          }
                          placeholder="Support SodaCraft Tamil Gaming"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                            isLight
                              ? "bg-white border-slate-200 text-slate-900"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* 3. RAZORPAY LIVE GATEWAY CREDENTIALS */}
                    <div
                      className={`p-5 rounded-2xl border space-y-4 ${
                        isLight
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white/5 border-white/10 shadow-lg"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Razorpay Live Payment Gateway</span>
                        </h4>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                          Live Production Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
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
                              setConfig((prev) => ({
                                ...prev,
                                razorpayKeyId: e.target.value.trim(),
                              }))
                            }
                            placeholder="rzp_live_..."
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-emerald-400"
                            }`}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                              Razorpay Key Secret:
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowSecretKey(!showSecretKey)}
                              className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              {showSecretKey ? (
                                <>
                                  <EyeOff className="w-3 h-3" /> Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" /> Show
                                </>
                              )}
                            </button>
                          </div>
                          <input
                            type={showSecretKey ? "text" : "password"}
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
                            placeholder="42rJlLTF..."
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-emerald-400"
                            }`}
                          />
                        </div>
                      </div>

                      <span className="text-[10px] text-white/50 block">
                        Direct API integration: Orders are created server-side with this secret,
                        ensuring full payment verification and instant WhatsApp receipt dispatch.
                      </span>
                    </div>

                    {/* 4. WHATSAPP RECEIPT & UPI */}
                    <div
                      className={`p-5 rounded-2xl border space-y-4 ${
                        isLight
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white/5 border-white/10 shadow-lg"
                      }`}
                    >
                      <h4 className="font-extrabold text-sm sm:text-base">
                        WhatsApp Receipt Delivery & UPI
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
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
                                whatsappNumber: e.target.value.trim(),
                              }))
                            }
                            placeholder="919629123982"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                          <span className="text-[10px] text-white/50 block">
                            Receipts and transaction messages are automatically sent to this
                            WhatsApp number.
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                            Creator UPI ID (VPA):
                          </label>
                          <input
                            type="text"
                            value={config.upiId}
                            autoComplete="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                upiId: e.target.value.trim(),
                              }))
                            }
                            placeholder="santhoshkumarshasc@oksbi"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none font-mono ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                          <span className="text-[10px] text-white/50 block">
                            Displayed on the official receipt as the registered creator VPA.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 5. PRESET DONATION AMOUNTS */}
                    <div
                      className={`p-5 rounded-2xl border space-y-3.5 ${
                        isLight
                          ? "bg-slate-50 border-slate-200"
                          : "bg-white/5 border-white/10 shadow-lg"
                      }`}
                    >
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block">
                        Preset Support Amounts (₹):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {config.presetAmounts.map((amt) => (
                          <div
                            key={amt}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-bold"
                          >
                            <span>₹{amt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePreset(amt)}
                              className="text-white/40 hover:text-rose-400 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="number"
                          value={newPresetAmount}
                          autoComplete="off"
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) => setNewPresetAmount(e.target.value)}
                          placeholder="Add ₹ (e.g. 750)"
                          className="px-3.5 py-2 rounded-xl text-xs bg-black/20 border border-white/10 outline-none w-36"
                        />
                        <button
                          type="button"
                          onClick={handleAddPreset}
                          className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Preset</span>
                        </button>
                      </div>
                    </div>

                    {/* 6. SUPPORT BUTTON HEADER VISIBILITY & LABEL */}
                    <div
                      className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
                        config.supportButtonEnabled
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : isLight
                            ? "bg-slate-100 border-slate-200"
                            : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm sm:text-base">
                            Support Button Visibility
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                              config.supportButtonEnabled
                                ? "bg-emerald-500 text-white"
                                : "bg-zinc-500 text-white"
                            }`}
                          >
                            {config.supportButtonEnabled ? "ACTIVE (VISIBLE)" : "PAUSED (HIDDEN)"}
                          </span>
                        </div>
                        <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/60"}`}>
                          When enabled, visitors see the Support button in the navbar and header.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleToggleSupport}
                        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          config.supportButtonEnabled ? "bg-emerald-500" : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            config.supportButtonEnabled ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider opacity-80 block">
                        Support Button Label Text:
                      </label>
                      <input
                        type="text"
                        value={config.supportButtonLabel}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, supportButtonLabel: e.target.value }))
                        }
                        placeholder="e.g. Support"
                        className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
                          isLight
                            ? "bg-white border-slate-200 text-slate-900"
                            : "bg-black/30 border-white/10 text-white"
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 1: REAL-TIME PAYMENTS & RECEIPTS */}
                {activeTab === "realtime" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          Total Verified Raised
                        </span>
                        <div className="text-2xl font-black text-emerald-400 mt-1">
                          ₹{totalRaised.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-white/50">via Razorpay Gateway</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                          Total Supporters
                        </span>
                        <div className="text-2xl font-black text-blue-400 mt-1">
                          {payments.length}
                        </div>
                        <span className="text-[10px] text-white/50">
                          Official Receipts Generated
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                          Real-time Sync
                        </span>
                        <div className="text-sm font-black text-purple-300 mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Auto-refreshing (4s)
                        </div>
                        <span className="text-[10px] text-white/50">
                          Direct WhatsApp Dispatch Active
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider opacity-80">
                            Live Razorpay Transactions & Receipts:
                          </h4>
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Razorpay Only
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fetchRealtimeData()}
                            disabled={isRefreshing}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`}
                            />
                            <span>Refresh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResetConfirm(true)}
                            disabled={isResettingGoal || payments.length === 0}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <RotateCcw
                              className={`w-3.5 h-3.5 ${isResettingGoal ? "animate-spin" : ""}`}
                            />
                            <span>Reset Goal to ₹0</span>
                          </button>
                        </div>
                      </div>

                      {payments.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-white/50 text-sm">
                          No payments recorded yet. Make a test payment on the Support page to see
                          it appear here in real-time!
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {payments.map((p) => (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                                isLight
                                  ? "bg-slate-50 border-slate-200"
                                  : "bg-white/5 border-white/10 hover:border-white/20 transition"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm">{p.name}</span>
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                                    {p.receiptNumber || "SCT-RZP"}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 uppercase font-bold">
                                    Razorpay
                                  </span>
                                </div>
                                <p className="text-xs text-white/70 italic">
                                  &ldquo;{p.message}&rdquo;
                                </p>
                                <div className="text-[10px] text-white/40 flex items-center gap-2">
                                  <span>ID: {p.paymentId || "pay_rzp"}</span>
                                  <span>•</span>
                                  <span>{new Date(p.timestamp).toLocaleString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
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
                                  className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 transition cursor-pointer"
                                  title="Delete transaction entry"
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

                {/* TAB 2: ADMIN ACCOUNTS (DATABASE) */}
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
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                              isLight
                                ? "bg-slate-50 border-slate-200"
                                : "bg-white/5 border-white/10"
                            }`}
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
                    <div
                      className={`p-4 rounded-2xl border ${isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10"}`}
                    >
                      <h5 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-emerald-400" />
                        <span>Add New Admin Account to Database</span>
                      </h5>
                      <form
                        onSubmit={handleCreateAccount}
                        className="space-y-3"
                        autoComplete="off"
                        data-form-type="other"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold opacity-75 block mb-1">
                              Username *
                            </label>
                            <input
                              type="text"
                              value={newAccUser}
                              autoComplete="off"
                              spellCheck={false}
                              data-lpignore="true"
                              data-1p-ignore="true"
                              onChange={(e) => setNewAccUser(e.target.value)}
                              placeholder="e.g. mod_santhosh"
                              required
                              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                                isLight
                                  ? "bg-white border-slate-200"
                                  : "bg-black/30 border-white/10 text-white"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold opacity-75 block mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={newAccEmail}
                              autoComplete="off"
                              spellCheck={false}
                              data-lpignore="true"
                              data-1p-ignore="true"
                              onChange={(e) => setNewAccEmail(e.target.value)}
                              placeholder="e.g. admin@sodacraft.com"
                              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                                isLight
                                  ? "bg-white border-slate-200"
                                  : "bg-black/30 border-white/10 text-white"
                              }`}
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
                              autoComplete="new-password"
                              spellCheck={false}
                              data-lpignore="true"
                              data-1p-ignore="true"
                              onChange={(e) => setNewAccPass(e.target.value)}
                              placeholder="Strong admin password"
                              required
                              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                                isLight
                                  ? "bg-white border-slate-200"
                                  : "bg-black/30 border-white/10 text-white"
                              }`}
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
                              className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                                isLight
                                  ? "bg-white border-slate-200"
                                  : "bg-black/30 border-white/10 text-white"
                              }`}
                            >
                              <option value="admin">Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Admin Account in Database</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* TAB 4: SOCIAL LINKS */}
                {activeTab === "links" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Manage Header & Footer Links:
                      </label>
                      <div className="space-y-2.5">
                        {config.socialLinks.map((link) => (
                          <div
                            key={link.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                              isLight
                                ? "bg-slate-50 border-slate-200"
                                : "bg-black/20 border-white/10"
                            }`}
                          >
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={link.label}
                                autoComplete="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-1p-ignore="true"
                                onChange={(e) =>
                                  handleUpdateSocialLink(link.id, { label: e.target.value })
                                }
                                placeholder="Link Label"
                                className="px-3 py-1.5 rounded-lg text-xs bg-transparent border border-white/10 outline-none"
                              />
                              <input
                                type="url"
                                value={link.href}
                                autoComplete="off"
                                spellCheck={false}
                                data-lpignore="true"
                                data-1p-ignore="true"
                                onChange={(e) =>
                                  handleUpdateSocialLink(link.id, { href: e.target.value })
                                }
                                placeholder="URL (https://...)"
                                className="px-3 py-1.5 rounded-lg text-xs bg-transparent border border-white/10 outline-none text-emerald-400 font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSocialLink(link.id)}
                              className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add New Link */}
                    <div className="p-3.5 rounded-xl border border-dashed border-white/15 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                        Add New Link:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newLinkLabel}
                          autoComplete="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) => setNewLinkLabel(e.target.value)}
                          placeholder="e.g. Discord Community"
                          className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/10 outline-none"
                        />
                        <input
                          type="url"
                          value={newLinkHref}
                          autoComplete="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) => setNewLinkHref(e.target.value)}
                          placeholder="https://discord.gg/..."
                          className="px-3 py-2 rounded-lg text-xs bg-black/20 border border-white/10 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSocialLink}
                        className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Link</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 5: SECURITY & PASSCODE */}
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
                          ?token={urlTokenInput || "SodaCraftTamil"}
                        </span>
                      </div>

                      <p className="text-xs text-white/80 leading-relaxed">
                        Change the URL token used to access the admin portal. Default is{" "}
                        <code className="text-emerald-400 font-mono">SodaCraftTamil</code>.
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
                              autoComplete="off"
                              spellCheck={false}
                              data-lpignore="true"
                              data-1p-ignore="true"
                              onChange={(e) => setUrlTokenInput(e.target.value)}
                              placeholder="SodaCraftTamil"
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
                            https://sodacrafttamil.vercel.app/admin?token=
                            {urlTokenInput || "SodaCraftTamil"}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}/admin?token=${urlTokenInput || "SodaCraftTamil"}`,
                                );
                                toast.success("Copied separate tab Admin URL!");
                              }}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                              title="Copy URL"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`/admin?token=${encodeURIComponent(urlTokenInput || "SodaCraftTamil")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition flex items-center gap-1 font-bold text-[11px]"
                              title="Open in Separate Tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>

                        {/* Home Modal URL */}
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                          <div className="truncate font-mono text-white/70">
                            https://sodacrafttamil.vercel.app/?token={urlTokenInput || "SodaCraftTamil"}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/?token=${urlTokenInput || "SodaCraftTamil"}`,
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
                          type="text"
                          value={newPasscode}
                          autoComplete="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                          onChange={(e) => setNewPasscode(e.target.value)}
                          placeholder="Enter new 4+ character secret code"
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
                        Panel. Default credential hints are completely hidden from public visitors
                        on the website.
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
                          Token: {urlTokenInput || "SodaCraftTamil"}
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
                              /admin?token={urlTokenInput || "SodaCraftTamil"}
                            </code>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/admin?token=${urlTokenInput || "SodaCraftTamil"}`,
                                  );
                                  toast.success("Copied Dedicated Admin URL!");
                                }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                                title="Copy URL"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`/admin?token=${encodeURIComponent(urlTokenInput || "SodaCraftTamil")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition flex items-center gap-1 font-bold text-[11px]"
                                title="Open Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
                              {urlTokenInput || "SodaCraftTamil"}
                            </code>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/?token=${urlTokenInput || "SodaCraftTamil"}`,
                                  );
                                  toast.success("Copied Homepage Secret Trigger URL!");
                                }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                                title="Copy URL"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`/?token=${encodeURIComponent(urlTokenInput || "SodaCraftTamil")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition flex items-center gap-1 font-bold text-[11px]"
                                title="Open Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
                              /support?token={urlTokenInput || "SodaCraftTamil"}
                            </code>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/support?token=${urlTokenInput || "SodaCraftTamil"}`,
                                  );
                                  toast.success("Copied Support Page Secret Trigger URL!");
                                }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
                                title="Copy URL"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`/support?token=${encodeURIComponent(urlTokenInput || "SodaCraftTamil")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition flex items-center gap-1 font-bold text-[11px]"
                                title="Open Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
                                <ExternalLink className="w-3 h-3" />
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
                        dashboard. They are strictly hidden from public visitors and only stored
                        here.
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
                              {config.urlToken || "SodaCraftTamil"}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(config.urlToken || "SodaCraftTamil");
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

              {/* Modal Footer Actions */}
              <div
                className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                  isLight ? "border-slate-100 bg-slate-50" : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-xs font-bold text-white/50 hover:text-white transition cursor-pointer"
                >
                  Reset Defaults
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Database & Apply</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Confirmation Dialog for Goal Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className={`p-6 rounded-3xl max-w-md w-full border space-y-4 shadow-2xl relative ${
              isLight
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-zinc-950 border-rose-500/30 text-white"
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h4 className="font-black text-base">Reset Goal Payments?</h4>
                <p className="text-[11px] text-rose-400/80 font-medium">
                  Irreversible payment database purge
                </p>
              </div>
            </div>

            <p className="text-xs opacity-80 leading-relaxed">
              This will clear all recorded payment transactions from the monthly goal database and
              reset the total verified raised amount back to{" "}
              <strong className="text-rose-400 font-black">₹0</strong>. Supporter counts and
              progress bars will reset to 0%.
            </p>

            <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-white/70 space-y-1">
              <div className="flex justify-between">
                <span>Current Total Verified:</span>
                <span className="font-bold text-emerald-400">
                  ₹{totalRaised.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Recorded Transactions:</span>
                <span className="font-bold text-blue-400">{payments.length}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResettingGoal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetGoalPayments}
                disabled={isResettingGoal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResettingGoal ? "animate-spin" : ""}`} />
                <span>{isResettingGoal ? "Resetting to ₹0..." : "Yes, Reset to ₹0"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
