import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  KeyRound,
  X,
  Check,
  RotateCcw,
  Sliders,
  Link as LinkIcon,
  IndianRupee,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Power,
  Heart,
  Save,
} from "lucide-react";
import {
  getAdminConfig,
  saveAdminConfig,
  resetAdminConfig,
  type AdminSiteConfig,
  type SiteSocialLink,
} from "@/lib/admin-config";

interface AdminSecretModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
}

export function AdminSecretModal({ isOpen, onClose, isLight = false }: AdminSecretModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<AdminSiteConfig>(getAdminConfig());
  const [activeTab, setActiveTab] = useState<"toggle" | "links" | "amounts" | "security">("toggle");

  // New Link temporary state
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [newPresetAmount, setNewPresetAmount] = useState("");

  // New Passcode temporary state
  const [newPasscode, setNewPasscode] = useState("");

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getAdminConfig();
      setConfig(currentConfig);
      // Check session authentication
      const sessionAuth = sessionStorage.getItem("sodacraft_admin_authenticated");
      if (sessionAuth === "true") {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setPasscodeInput("");
      }
    }
  }, [isOpen]);

  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentConfig = getAdminConfig();
    const cleanInput = passcodeInput.trim();

    if (cleanInput === currentConfig.secretCode || cleanInput === "9629") {
      setIsAuthenticated(true);
      sessionStorage.setItem("sodacraft_admin_authenticated", "true");
      toast.success("🔓 Admin access granted! Welcome Creator.");
      setPasscodeInput("");
    } else {
      toast.error("❌ Incorrect secret code. Try default: 9629");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("sodacraft_admin_authenticated");
    toast.info("Admin session locked.");
  };

  const handleSaveAll = () => {
    saveAdminConfig(config);
    toast.success("✅ Admin settings saved & applied across the website!");
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all settings to original defaults?")) {
      const def = resetAdminConfig();
      setConfig(def);
      toast.info("Reset to default configuration.");
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
      toast.error("This preset already exists");
      return;
    }
    const updated = [...config.presetAmounts, val].sort((a, b) => a - b);
    setConfig((prev) => ({ ...prev, presetAmounts: updated }));
    setNewPresetAmount("");
    toast.success(`Added ₹${val} preset!`);
  };

  const handleRemovePreset = (val: number) => {
    if (config.presetAmounts.length <= 1) {
      toast.error("Keep at least one preset amount");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      presetAmounts: prev.presetAmounts.filter((p) => p !== val),
    }));
  };

  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasscode.trim() || newPasscode.trim().length < 4) {
      toast.error("Secret code must be at least 4 characters");
      return;
    }
    setConfig((prev) => ({ ...prev, secretCode: newPasscode.trim() }));
    setNewPasscode("");
    toast.success("Secret code updated! Remember your new code.");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-8 ${
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
                className={`p-2 rounded-xl ${
                  isAuthenticated
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-[oklch(0.65_0.24_25)]/20 text-[oklch(0.75_0.22_25)]"
                }`}
              >
                {isAuthenticated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Creator Secret Dashboard</span>
                  {isAuthenticated && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider">
                      Unlocked
                    </span>
                  )}
                </h2>
                <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>
                  {isAuthenticated
                    ? "Live control of Support button, Links & Details"
                    : "Enter secret passkey to access creator controls"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Lock Dashboard"
                >
                  Lock
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {!isAuthenticated ? (
            /* Passcode Verification Screen */
            <div className="p-6 sm:p-8 max-w-md mx-auto text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[oklch(0.65_0.24_25)]/15 border border-[oklch(0.65_0.24_25)]/30 flex items-center justify-center text-[oklch(0.75_0.22_25)] mb-4">
                <KeyRound className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black mb-1">Enter Secret Code</h3>
              <p className={`text-xs mb-6 ${isLight ? "text-slate-500" : "text-white/60"}`}>
                Authorized for SodaCraft Tamil administrator only
              </p>

              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passcodeInput}
                    onChange={(e) => setPasscodeInput(e.target.value)}
                    placeholder="Enter Secret Code"
                    autoFocus
                    className={`w-full text-center py-3.5 px-12 rounded-xl text-lg tracking-widest font-mono font-bold border outline-none transition ${
                      isLight
                        ? "bg-slate-100 border-slate-300 text-slate-900 focus:border-red-500"
                        : "bg-black/40 border-white/15 text-white focus:border-[oklch(0.65_0.24_25)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => setPasscodeInput("9629")}
                    className="text-[oklch(0.75_0.22_25)] hover:underline font-semibold cursor-pointer"
                  >
                    Default Code: 9629
                  </button>
                  <span className={`text-[11px] ${isLight ? "text-slate-400" : "text-white/40"}`}>
                    Hint: Creator Phone Prefix
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-extrabold text-sm shadow-lg shadow-red-500/20 transition cursor-pointer"
                >
                  Unlock Dashboard
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Admin Dashboard */
            <div>
              {/* Tabs Navigation */}
              <div
                className={`flex border-b overflow-x-auto ${
                  isLight ? "border-slate-100 bg-slate-50/50" : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("toggle")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "toggle"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Button Toggle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("links")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "links"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Link Editors</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("amounts")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "amounts"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Amount & Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === "security"
                      ? "border-[oklch(0.65_0.24_25)] text-[oklch(0.75_0.22_25)]"
                      : "border-transparent text-white/60 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Secret Code</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                {/* TAB 1: BUTTON TOGGLE (SUPPORT) */}
                {activeTab === "toggle" && (
                  <div className="space-y-6">
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
                          When toggled off, the Support button is hidden.
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

                    {/* Support Button Custom Label */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80">
                        Support Button Text:
                      </label>
                      <input
                        type="text"
                        value={config.supportButtonLabel}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, supportButtonLabel: e.target.value }))
                        }
                        placeholder="e.g. Support"
                        className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
                          isLight
                            ? "bg-slate-50 border-slate-200 text-slate-900"
                            : "bg-black/30 border-white/10 text-white"
                        }`}
                      />
                    </div>

                    {/* Live Preview of Button */}
                    <div
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold opacity-70 block">
                        Live Navbar Preview:
                      </span>
                      <div className="flex items-center gap-3">
                        {config.supportButtonEnabled ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border bg-[oklch(0.65_0.24_25)]/15 border-[oklch(0.65_0.24_25)]/30 text-[oklch(0.75_0.22_25)] shadow-sm">
                            <Heart className="h-4 w-4 fill-current text-[oklch(0.65_0.24_25)]" />
                            <span>{config.supportButtonLabel || "Support"}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-rose-400 italic bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                            Support button is currently hidden from public visitors.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LINK EDITORS */}
                {activeTab === "links" && (
                  <div className="space-y-6">
                    {/* Primary Channel & Live URLs */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[oklch(0.75_0.22_25)]">
                        Core URLs
                      </h4>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            YouTube Subscribe URL:
                          </label>
                          <input
                            type="text"
                            value={config.subscribeUrl}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, subscribeUrl: e.target.value }))
                            }
                            className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            Latest Videos Playlist / Channel URL:
                          </label>
                          <input
                            type="text"
                            value={config.latestVideosUrl}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, latestVideosUrl: e.target.value }))
                            }
                            className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            Live Stream Override URL (optional):
                          </label>
                          <input
                            type="text"
                            value={config.liveStreamUrl}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, liveStreamUrl: e.target.value }))
                            }
                            placeholder="e.g. https://www.youtube.com/watch?v=YOUR_LIVE_ID"
                            className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social & Channel Links List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-[oklch(0.75_0.22_25)]">
                          Social & Community Links
                        </h4>
                        <span className="text-[11px] opacity-60">
                          {config.socialLinks.filter((l) => l.enabled).length} Active Links
                        </span>
                      </div>

                      <div className="space-y-2">
                        {config.socialLinks.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-2.5 justify-between ${
                              item.enabled
                                ? isLight
                                  ? "bg-slate-50 border-slate-200"
                                  : "bg-white/5 border-white/10"
                                : "opacity-50 bg-black/20 border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateSocialLink(item.id, { enabled: !item.enabled })
                                }
                                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                  item.enabled
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-zinc-600/20 text-zinc-400"
                                }`}
                                title={item.enabled ? "Disable link" : "Enable link"}
                              >
                                {item.enabled ? (
                                  <Eye className="w-3.5 h-3.5" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={item.label}
                                  onChange={(e) =>
                                    handleUpdateSocialLink(item.id, { label: e.target.value })
                                  }
                                  className="text-xs font-bold bg-transparent outline-none border-b border-transparent focus:border-[oklch(0.65_0.24_25)] w-36"
                                />
                                <input
                                  type="text"
                                  value={item.href}
                                  onChange={(e) =>
                                    handleUpdateSocialLink(item.id, { href: e.target.value })
                                  }
                                  placeholder="https://..."
                                  className="text-[11px] font-mono opacity-70 bg-transparent outline-none border-b border-transparent focus:border-[oklch(0.65_0.24_25)] w-full block truncate"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {item.href && (
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-white/40 hover:text-white"
                                  title="Test link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveSocialLink(item.id)}
                                className="p-1 text-rose-400/60 hover:text-rose-400 cursor-pointer"
                                title="Delete link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add New Link Card */}
                      <div
                        className={`p-3.5 rounded-2xl border border-dashed space-y-2.5 ${
                          isLight ? "border-slate-300 bg-slate-50" : "border-white/20 bg-black/20"
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1 text-[oklch(0.75_0.22_25)]">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New Link:</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newLinkLabel}
                            onChange={(e) => setNewLinkLabel(e.target.value)}
                            placeholder="Label (e.g. Telegram)"
                            className={`px-3 py-1.5 rounded-lg text-xs border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-800"
                                : "bg-black/40 border-white/10 text-white"
                            }`}
                          />
                          <input
                            type="text"
                            value={newLinkHref}
                            onChange={(e) => setNewLinkHref(e.target.value)}
                            placeholder="URL (https://...)"
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-white border-slate-200 text-slate-800"
                                : "bg-black/40 border-white/10 text-white"
                            }`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSocialLink}
                          className="w-full py-1.5 rounded-lg bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white text-xs font-bold transition cursor-pointer"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AMOUNT & DETAILS */}
                {activeTab === "amounts" && (
                  <div className="space-y-6">
                    {/* Preset Payment Amounts */}
                    <div className="space-y-3">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-[oklch(0.75_0.22_25)] block">
                        Support Preset Amounts (₹):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {config.presetAmounts.map((amount) => (
                          <div
                            key={amount}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                              isLight
                                ? "bg-slate-100 border-slate-200 text-slate-800"
                                : "bg-white/10 border-white/15 text-white"
                            }`}
                          >
                            <span>₹{amount}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePreset(amount)}
                              className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add new preset amount */}
                      <div className="flex gap-2 max-w-xs">
                        <input
                          type="number"
                          value={newPresetAmount}
                          onChange={(e) => setNewPresetAmount(e.target.value)}
                          placeholder="e.g. 2000"
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs border outline-none ${
                            isLight
                              ? "bg-slate-50 border-slate-200 text-slate-800"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddPreset}
                          className="px-3.5 py-1.5 rounded-lg bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white text-xs font-bold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Monthly Goal Amount */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-80 block">
                        Monthly Support Goal (₹):
                      </label>
                      <div className="relative max-w-sm">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold opacity-60">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={config.monthlyGoal}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              monthlyGoal: parseInt(e.target.value, 10) || 1000,
                            }))
                          }
                          className={`w-full pl-8 pr-4 py-2 rounded-xl text-sm font-bold border outline-none ${
                            isLight
                              ? "bg-slate-50 border-slate-200 text-slate-900"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>

                    {/* UPI & Payee Details */}
                    <div className="space-y-4 pt-2 border-t border-white/10">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[oklch(0.75_0.22_25)]">
                        Payee & UPI Configuration
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            Creator UPI ID:
                          </label>
                          <input
                            type="text"
                            value={config.upiId}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, upiId: e.target.value }))
                            }
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            Payee Name:
                          </label>
                          <input
                            type="text"
                            value={config.payeeName}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, payeeName: e.target.value }))
                            }
                            className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            WhatsApp Number (Direct Dispatch):
                          </label>
                          <input
                            type="text"
                            value={config.whatsappNumber}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                            }
                            placeholder="e.g. 919629123982"
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold opacity-75 block mb-1">
                            Payment Transaction Note:
                          </label>
                          <input
                            type="text"
                            value={config.paymentNote}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, paymentNote: e.target.value }))
                            }
                            className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                              isLight
                                ? "bg-slate-50 border-slate-200 text-slate-900"
                                : "bg-black/30 border-white/10 text-white"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Support Page Titles */}
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[oklch(0.75_0.22_25)]">
                        Support Page Branding
                      </h4>

                      <div>
                        <label className="text-xs font-semibold opacity-75 block mb-1">
                          Support Page Title:
                        </label>
                        <input
                          type="text"
                          value={config.supportTitle}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, supportTitle: e.target.value }))
                          }
                          className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                            isLight
                              ? "bg-slate-50 border-slate-200 text-slate-900"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold opacity-75 block mb-1">
                          Support Subtitle:
                        </label>
                        <textarea
                          value={config.supportSubtitle}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, supportSubtitle: e.target.value }))
                          }
                          rows={2}
                          className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                            isLight
                              ? "bg-slate-50 border-slate-200 text-slate-900"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: SECURITY & SECRET CODE */}
                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isLight
                          ? "bg-amber-50 border-amber-200"
                          : "bg-amber-500/10 border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <KeyRound className="w-4 h-4" />
                        <span>Admin Secret Passcode</span>
                      </div>
                      <p className={`text-xs ${isLight ? "text-slate-600" : "text-white/70"}`}>
                        This secret code locks and unlocks this dashboard. You can change it anytime
                        here. The current active code is:{" "}
                        <strong className="font-mono text-amber-400 font-bold">
                          {config.secretCode}
                        </strong>
                      </p>
                    </div>

                    <form onSubmit={handleChangePasscode} className="space-y-4 max-w-sm">
                      <div>
                        <label className="text-xs font-semibold opacity-75 block mb-1">
                          New Secret Code:
                        </label>
                        <input
                          type="text"
                          value={newPasscode}
                          onChange={(e) => setNewPasscode(e.target.value)}
                          placeholder="e.g. 962912 or custom code"
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono border outline-none ${
                            isLight
                              ? "bg-slate-50 border-slate-200 text-slate-900"
                              : "bg-black/30 border-white/10 text-white"
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md transition"
                      >
                        Update Secret Code
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div
                className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                  isLight ? "border-slate-100 bg-slate-50" : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      isLight
                        ? "border-slate-200 hover:bg-slate-100 text-slate-700"
                        : "border-white/10 hover:bg-white/10 text-white"
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAll}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white text-xs font-extrabold shadow-lg shadow-red-500/20 transition cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Apply Changes</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
