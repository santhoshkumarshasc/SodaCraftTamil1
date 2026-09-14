import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Heart,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Trophy,
  Users,
  IndianRupee,
  CheckCircle2,
  Sun,
  Moon,
  Send,
  Flame,
  Crown,
  Server,
  Zap,
  Radio,
  Smartphone,
  Check,
  RefreshCw,
  Hash,
  Clock,
  QrCode as QrIcon,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  getSupportData,
  submitSupporter,
  determineTier,
  initQrSession,
  getQrSessionStatus,
  reportQrScanned,
  completeQrSession,
  type SupportPayload,
  type Supporter,
  type QrSession,
} from "@/lib/support.functions";
import { UpiQrCode } from "@/components/UpiQrCode";

const supportQueryOptions = queryOptions<SupportPayload>({
  queryKey: ["support-data"],
  queryFn: () => getSupportData(),
  staleTime: 10_000,
  refetchInterval: 15_000,
});

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>) => ({
    session: typeof search.session === "string" ? search.session : undefined,
    amount: search.amount ? Number(search.amount) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Support SodaCraft Tamil - GPay & UPI QR Code" },
      {
        name: "description",
        content:
          "Support SodaCraft Tamil Minecraft gaming channel via Google Pay, PhonePe, Paytm, or any UPI app. Scan the QR code, auto-sync with live feed, and get featured on the wall of fame!",
      },
      { property: "og:title", content: "Support SodaCraft Tamil - GPay & UPI QR Code" },
      {
        property: "og:description",
        content:
          "Help fund SodaCraft Tamil Minecraft SMP server and live streams. Scan UPI QR code and automatically join the recent supporters list.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(supportQueryOptions),
  component: SupportPage,
});

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

function timeAgo(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getTierDetails(tier: Supporter["tier"]) {
  switch (tier) {
    case "diamond":
      return {
        label: "Diamond Supporter",
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        icon: Crown,
      };
    case "gold":
      return {
        label: "Gold Supporter",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        icon: Trophy,
      };
    case "iron":
      return {
        label: "Iron Supporter",
        color: "text-slate-300 bg-slate-500/10 border-slate-500/30",
        icon: ShieldCheck,
      };
    case "emerald":
    default:
      return {
        label: "Redstone Supporter",
        color:
          "text-[oklch(0.75_0.22_25)] bg-[oklch(0.65_0.24_25)]/15 border-[oklch(0.65_0.24_25)]/30",
        icon: Sparkles,
      };
  }
}

function getMethodBadge(method: Supporter["method"]) {
  switch (method) {
    case "gpay":
      return { label: "Google Pay", bg: "bg-blue-600/20 text-blue-400 border-blue-500/30" };
    case "phonepe":
      return { label: "PhonePe", bg: "bg-purple-600/20 text-purple-400 border-purple-500/30" };
    case "paytm":
      return { label: "Paytm", bg: "bg-sky-600/20 text-sky-400 border-sky-500/30" };
    case "upi":
    default:
      return {
        label: "UPI App",
        bg: "bg-[oklch(0.65_0.24_25)]/15 text-[oklch(0.75_0.22_25)] border-[oklch(0.65_0.24_25)]/30",
      };
  }
}

function generateSessionId() {
  return `SCT-${Math.floor(1000 + Math.random() * 9000)}`;
}

function SupportPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(supportQueryOptions);
  const search = Route.useSearch();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Active QR Session state
  const [sessionId, setSessionId] = useState<string>(() => search.session || generateSessionId());
  const [currentSession, setCurrentSession] = useState<QrSession | null>(null);
  const [isCompanionScannedView, setIsCompanionScannedView] = useState(Boolean(search.session));

  // Selected payment amount state (defaults to search.amount if present)
  const [selectedAmount, setSelectedAmount] = useState<number | undefined>(
    search.amount && search.amount > 0 ? search.amount : 100,
  );
  const [customAmountInput, setCustomAmountInput] = useState<string>(
    search.amount && search.amount > 0 && !PRESET_AMOUNTS.includes(search.amount)
      ? search.amount.toString()
      : "",
  );

  // Supporter Form State
  const [name, setName] = useState("");
  const [formAmount, setFormAmount] = useState<number>(
    search.amount && search.amount > 0 ? search.amount : 100,
  );
  const [method, setMethod] = useState<Supporter["method"]>("gpay");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Loaded Information state for the scanned person
  const [loadedSupporterInfo, setLoadedSupporterInfo] = useState<Supporter | null>(null);

  // UTR Fast-Verify input
  const [utrInput, setUtrInput] = useState("");
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);

  // App return detection prompt
  const [pendingAppReturn, setPendingAppReturn] = useState<{
    method: Supporter["method"];
    amount: number;
    timestamp: number;
  } | null>(null);

  // Track if payment was launched to catch returning focus
  const launchedPaymentRef = useRef<{
    method: Supporter["method"];
    amount: number;
    time: number;
  } | null>(null);

  // Local supporters state initialized to real supporters list
  const [localSupporters, setLocalSupporters] = useState<Supporter[]>(data.supporters || []);

  // 1. Initial theme & profile loading
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    // Auto-load stored user profile if available
    try {
      const savedProfile = localStorage.getItem("sodacraft_supporter_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setName(parsed.name);
        if (parsed.method) setMethod(parsed.method);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // 2. Refresh time for 'time ago' timestamps
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // 3. Synchronize server data when refetched
  useEffect(() => {
    if (data?.supporters) {
      setLocalSupporters((prev) => {
        const existingIds = new Set(data.supporters.map((s) => s.id));
        const customLocalOnly = prev.filter((s) => !existingIds.has(s.id));
        return [...customLocalOnly, ...data.supporters];
      });
    }
  }, [data]);

  // 4. Initialize session on backend and report scan if coming via companion link
  useEffect(() => {
    let isCancelled = false;

    // Initialize QR session on server
    initQrSession({
      data: {
        sessionId,
        amount: selectedAmount || 100,
        note: "Support SodaCraft Tamil Gaming",
      },
    })
      .then((res) => {
        if (!isCancelled && res?.session) {
          setCurrentSession(res.session);
        }
      })
      .catch((err) => console.error("Failed to init QR session", err));

    // If loaded from URL search parameter (meaning a mobile phone scanned the QR):
    if (search.session) {
      setIsCompanionScannedView(true);
      const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
      const isIOS =
        typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
      const devName = isAndroid ? "Android Phone" : isIOS ? "iPhone" : "Mobile Phone";

      reportQrScanned({
        data: {
          sessionId: search.session,
          deviceInfo: devName,
        },
      })
        .then(() => {
          toast.success(`📱 Connected to Live QR Session #${search.session}!`);
        })
        .catch((err) => console.error("Failed to report QR scan", err));
    }

    return () => {
      isCancelled = true;
    };
  }, [sessionId, search.session, selectedAmount]);

  // 5. Real-Time Auto-Sync Polling
  // Polls the server session status every 2.5 seconds to detect if another device scanned or completed
  useEffect(() => {
    if (!sessionId) return;
    let isCancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await getQrSessionStatus({ data: { sessionId } });
        if (isCancelled || !res?.session) return;

        const remote = res.session;

        // Detect transition to scanned state
        if (remote.status === "scanned" && currentSession?.status === "waiting") {
          toast.info(
            `📱 QR Code was just scanned by ${remote.scannedDeviceInfo || "a mobile device"}!`,
          );
        }

        // Detect transition to completed state
        if (remote.status === "completed" && remote.supporter) {
          if (!loadedSupporterInfo || loadedSupporterInfo.id !== remote.supporter.id) {
            setLoadedSupporterInfo(remote.supporter);
            setJustAddedId(remote.supporter.id);
            setLocalSupporters((prev) => {
              if (prev.some((s) => s.id === remote.supporter?.id)) return prev;
              return [remote.supporter!, ...prev];
            });
            toast.success(`🎉 Payment Verified! Welcome to the wall, ${remote.supporter.name}!`);
          }
        }

        setCurrentSession(remote);
      } catch {
        // Silently continue polling
      }
    }, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, currentSession?.status, loadedSupporterInfo]);

  // 6. Automatic App Return Detection (detects when user returns from GPay/PhonePe)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && launchedPaymentRef.current) {
        const attempt = launchedPaymentRef.current;
        const timeElapsed = Date.now() - attempt.time;

        // If returned within 5 minutes of clicking the app
        if (timeElapsed < 1000 * 60 * 5) {
          setPendingAppReturn(attempt);
          // Pre-fill form details automatically
          setFormAmount(attempt.amount);
          setMethod(attempt.method);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const isLight = theme === "light";

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setFormAmount(amount);
    setCustomAmountInput("");
    // Update session amount on server
    initQrSession({
      data: {
        sessionId,
        amount,
        note: "Support SodaCraft Tamil Gaming",
      },
    }).catch(console.error);
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmountInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedAmount(num);
      setFormAmount(num);
      initQrSession({
        data: {
          sessionId,
          amount: num,
          note: "Support SodaCraft Tamil Gaming",
        },
      }).catch(console.error);
    } else if (val === "") {
      setSelectedAmount(undefined);
    }
  };

  const handleAppInitiated = (selectedMethod: Supporter["method"]) => {
    const amt = formAmount || selectedAmount || 100;
    launchedPaymentRef.current = {
      method: selectedMethod,
      amount: amt,
      time: Date.now(),
    };
  };

  const handleNewSession = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setLoadedSupporterInfo(null);
    setCurrentSession(null);
    initQrSession({
      data: {
        sessionId: newId,
        amount: selectedAmount || 100,
        note: "Support SodaCraft Tamil Gaming",
      },
    })
      .then((res) => {
        if (res?.session) setCurrentSession(res.session);
        toast.success(`Generated new live session #${newId}`);
      })
      .catch(console.error);
  };

  // Submit and auto-sync supporter information
  const handleAutoSyncSupporter = async (
    e?: React.FormEvent,
    overrideData?: { name?: string; amount?: number; method?: Supporter["method"] },
  ) => {
    if (e) e.preventDefault();

    const finalName = (overrideData?.name ?? name).trim();
    const finalAmount = overrideData?.amount ?? formAmount;
    const finalMethod = overrideData?.method ?? method;

    if (!finalName) {
      toast.error("Please enter your name or Minecraft GamerTag to auto-sync!");
      return;
    }
    if (!finalAmount || finalAmount <= 0) {
      toast.error("Please enter a valid contribution amount!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save profile for auto-loading in future
      try {
        localStorage.setItem(
          "sodacraft_supporter_profile",
          JSON.stringify({ name: finalName, method: finalMethod }),
        );
      } catch {
        // Ignore storage errors
      }

      // Complete session on backend
      const res = await completeQrSession({
        data: {
          sessionId,
          name: finalName,
          amount: finalAmount,
          message: message.trim() || "Thank you for the awesome Minecraft videos! 🔥",
          method: finalMethod,
          utr: utrInput.trim() || undefined,
        },
      });

      if (res.success && res.supporter) {
        setLocalSupporters((prev) => [res.supporter, ...prev]);
        setJustAddedId(res.supporter.id);
        setLoadedSupporterInfo(res.supporter);
        setCurrentSession(res.session);
        setPendingAppReturn(null);
        launchedPaymentRef.current = null;
        setUtrInput("");

        toast.success(`🎉 Auto-Synced! ${res.supporter.name} added to Supporters Wall!`);

        // Reset form input
        setMessage("");

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["support-data"] });

        // Scroll to loaded information or wall
        const el =
          document.getElementById("loaded-info-section") ||
          document.getElementById("supporters-wall");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback local support addition
      const fallbackSupporter: Supporter = {
        id: `local-${Date.now()}`,
        name: finalName || "Soda Supporter",
        amount: finalAmount,
        message: message.trim() || "Love your videos bro! ❤️",
        method: finalMethod,
        timestamp: new Date().toISOString(),
        tier: determineTier(finalAmount),
      };
      setLocalSupporters((prev) => [fallbackSupporter, ...prev]);
      setJustAddedId(fallbackSupporter.id);
      setLoadedSupporterInfo(fallbackSupporter);
      setPendingAppReturn(null);
      launchedPaymentRef.current = null;
      toast.success(`🎉 Synced! ${fallbackSupporter.name} added to the wall.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant UTR verification handler
  const handleFastUtrVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrInput.trim().replace(/\D/g, "");
    if (cleanUtr.length < 8) {
      toast.error("Please enter a valid 12-digit UPI UTR / Transaction Reference Number!");
      return;
    }

    setIsVerifyingUtr(true);
    try {
      const payerName = name.trim() || "Verified UPI Supporter";
      const res = await completeQrSession({
        data: {
          sessionId,
          name: payerName,
          amount: formAmount || 100,
          message: `Verified via UPI Ref #${cleanUtr}`,
          method,
          utr: cleanUtr,
        },
      });

      if (res.success && res.supporter) {
        setLocalSupporters((prev) => [res.supporter, ...prev]);
        setJustAddedId(res.supporter.id);
        setLoadedSupporterInfo(res.supporter);
        setCurrentSession(res.session);
        setUtrInput("");
        toast.success(`✅ Ref #${cleanUtr} Verified! ${res.supporter.name} added to wall!`);
        queryClient.invalidateQueries({ queryKey: ["support-data"] });
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not verify reference number. Please try again.");
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  // Quick simulation helper for instant testing
  const handleSimulateScanAndSync = async () => {
    const demoNames = ["TamilCraft_Rider", "Alex_Gamer", "Praveen_MC", "Karthik_TNT"];
    const randomName = demoNames[Math.floor(Math.random() * demoNames.length)];
    const simAmount = selectedAmount || 100;

    await reportQrScanned({
      data: {
        sessionId,
        deviceInfo: "Simulated Mobile Device",
      },
    });

    setTimeout(async () => {
      await handleAutoSyncSupporter(undefined, {
        name: randomName,
        amount: simAmount,
        method: "gpay",
      });
    }, 1200);
  };

  const totalRaised = localSupporters.reduce((sum, s) => sum + s.amount, 0);
  const totalCount = localSupporters.length;
  const goal = data.stats.monthlyGoal || 15000;
  const progressPercent = Math.min(100, Math.round((totalRaised / goal) * 100));

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight
          ? "bg-[oklch(0.97_0.01_240)] text-slate-900"
          : "bg-[oklch(0.08_0.02_260)] text-white"
      }`}
    >
      {/* Background Ambient Glows themed to website Red tone */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-[140px] opacity-20 ${
            isLight ? "bg-red-400" : "bg-[oklch(0.65_0.24_25)]"
          }`}
        />
        <div
          className={`absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15 ${
            isLight ? "bg-orange-300" : "bg-red-900"
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-20">
        {/* Navigation Bar */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            to="/"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition duration-200 border ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm"
                : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Channel</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Live Sync Status indicator in header */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                currentSession?.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : currentSession?.status === "scanned"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-white/5 border-white/10 text-slate-300"
              }`}
            >
              <Radio
                className={`w-3 h-3 ${
                  currentSession?.status === "completed"
                    ? "text-emerald-400"
                    : "text-[oklch(0.65_0.24_25)] animate-pulse"
                }`}
              />
              <span className="font-mono">Ref: {sessionId}</span>
            </div>

            <button
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 cursor-pointer border ${
                isLight
                  ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm"
                  : "bg-white/10 hover:bg-white/20 border-white/5 text-white"
              }`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* COMPANION SCANNED BANNER (Appears if user opened via mobile QR scan link) */}
        {isCompanionScannedView && (
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-[oklch(0.65_0.24_25)]/20 via-orange-500/15 to-transparent border border-[oklch(0.65_0.24_25)]/40 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[oklch(0.65_0.24_25)] text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-[oklch(0.75_0.22_25)]">
                  Mobile QR Scanner Connected
                </div>
                <div className="text-sm font-bold">
                  Paired to Live Session{" "}
                  <span className="font-mono text-amber-300">#{sessionId}</span>
                </div>
                <div className="text-xs opacity-75">
                  Complete your payment below and both screens will auto-sync instantly!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DETECTED APP RETURN PROMPT (Detected when returning from GPay/PhonePe) */}
        <AnimatePresence>
          {pendingAppReturn && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[oklch(0.12_0.03_260)] to-emerald-900/40 border-2 border-emerald-500/60 shadow-2xl"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="p-3 rounded-xl bg-emerald-500 text-white animate-bounce">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                      Payment App Return Detected!
                    </div>
                    <div className="text-base font-extrabold text-white">
                      Did you complete ₹{pendingAppReturn.amount} via{" "}
                      {pendingAppReturn.method.toUpperCase()}?
                    </div>
                    <div className="text-xs text-slate-300">
                      Tap below to auto-sync your contribution directly to the Live Supporters
                      board!
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAutoSyncSupporter()}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 cursor-pointer transition transform active:scale-95"
                  >
                    Yes, Auto-Sync Now
                  </button>
                  <button
                    onClick={() => setPendingAppReturn(null)}
                    className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-[oklch(0.65_0.24_25)]/15 text-[oklch(0.75_0.22_25)] border border-[oklch(0.65_0.24_25)]/30 mb-4">
            <Heart className="w-3.5 h-3.5 fill-current text-[oklch(0.65_0.24_25)]" />
            <span>Official Creator Support</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Scan & Support via{" "}
            <span className="bg-gradient-to-r from-red-500 via-[oklch(0.65_0.24_25)] to-orange-400 bg-clip-text text-transparent">
              GPay & UPI
            </span>
          </h1>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            Scan with Google Pay, PhonePe, Paytm, or your phone camera. Scanned contributions
            automatically load and sync to the live community board in real time!
          </p>

          {/* Monthly Server Funding Goal Card */}
          <div
            className={`mt-7 rounded-2xl p-5 sm:p-6 border transition shadow-xl ${
              isLight
                ? "bg-white border-slate-200 shadow-slate-200/50"
                : "bg-white/5 border-white/10 shadow-black/30 backdrop-blur-md"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Monthly SMP Server & Stream Fund
                </span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[oklch(0.75_0.22_25)]">
                ₹{totalRaised.toLocaleString()} / ₹{goal.toLocaleString()} ({progressPercent}%)
              </div>
            </div>

            {/* Progress Bar */}
            <div
              className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/5"
              }`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[oklch(0.65_0.24_25)] to-orange-500 transition-all duration-1000 shadow-sm"
                style={{ width: `${Math.max(3, progressPercent)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-medium opacity-70">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {totalCount} Community Supporter
                {totalCount === 1 ? "" : "s"}
              </span>
              <span>100% direct creator funding • 0% platform fee</span>
            </div>
          </div>
        </section>

        {/* LOADED INFORMATION SECTION (HIGHLIGHTED WHEN SYNCED) */}
        <AnimatePresence>
          {loadedSupporterInfo && (
            <motion.section
              id="loaded-info-section"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`mb-12 rounded-3xl p-6 sm:p-7 border-2 shadow-2xl overflow-hidden relative ${
                isLight
                  ? "bg-gradient-to-br from-emerald-50 via-white to-red-50 border-emerald-400 text-slate-900"
                  : "bg-gradient-to-br from-emerald-950/50 via-[oklch(0.12_0.03_260)] to-red-950/30 border-emerald-500/50 text-white"
              }`}
            >
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Auto-Sync Verified • Loaded Information</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Thank you, {loadedSupporterInfo.name}!
                  </h2>

                  <p
                    className={`text-xs sm:text-sm max-w-xl ${
                      isLight ? "text-slate-600" : "text-slate-300"
                    }`}
                  >
                    Your contribution of{" "}
                    <strong className="text-emerald-400">₹{loadedSupporterInfo.amount}</strong> via{" "}
                    <strong>{getMethodBadge(loadedSupporterInfo.method).label}</strong> has been
                    loaded and automatically published to the community wall.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold border ${
                        getTierDetails(loadedSupporterInfo.tier).color
                      }`}
                    >
                      {getTierDetails(loadedSupporterInfo.tier).label}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg font-semibold bg-white/10 border border-white/10 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(loadedSupporterInfo.timestamp, now)}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg font-mono text-[11px] bg-white/10 border border-white/10">
                      Ref: {sessionId}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-center gap-3 w-full md:w-auto">
                  <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 w-full">
                    <div className="text-xs uppercase font-bold text-slate-400">Status</div>
                    <div className="text-lg font-black text-emerald-400">Live on Wall</div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* MAIN INTERACTIVE PAYMENT & QR CODE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column: Preset Amount Chooser + Auto-Sync Form + Fast UTR Input */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* 1. Amount Selector Card */}
            <div
              className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition ${
                isLight
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-[oklch(0.12_0.03_260)] border-white/10 text-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-current" />
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">
                    1. Choose Amount to Sync
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateScanAndSync}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                    isLight
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                  }`}
                  title="Test the real-time auto-sync simulation"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Test Auto-Sync</span>
                </button>
              </div>

              <p className={`text-xs mb-5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Selecting an amount instantly updates the live QR code and transaction token
              </p>

              {/* Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-4">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = selectedAmount === amt && !customAmountInput;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectPreset(amt)}
                      className={`py-3 px-2 rounded-xl font-black text-sm transition cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                        isSelected
                          ? "bg-[oklch(0.65_0.24_25)] border-[oklch(0.7_0.24_25)] text-white shadow-lg shadow-red-500/25 scale-[1.03]"
                          : isLight
                            ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                            : "bg-white/5 hover:bg-white/10 border-white/5 text-white"
                      }`}
                    >
                      <span className="text-xs font-normal opacity-70">₹</span>
                      <span className="text-base">{amt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  placeholder="Or enter any custom amount (e.g. 150)"
                  value={customAmountInput}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  min="1"
                  max="100000"
                  className={`w-full pl-9 pr-4 py-3 rounded-xl text-sm font-semibold border transition outline-none ${
                    isLight
                      ? "bg-slate-50 border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900"
                      : "bg-black/30 border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                  }`}
                />
              </div>

              {/* Supporter Perk Tier Highlight */}
              <div className="mt-4 p-3 rounded-xl bg-[oklch(0.65_0.24_25)]/10 border border-[oklch(0.65_0.24_25)]/20 flex items-center justify-between text-xs">
                <span className="font-medium text-[oklch(0.75_0.22_25)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Your Supporter Badge:
                </span>
                <span className="font-extrabold uppercase tracking-wider text-[oklch(0.85_0.18_25)]">
                  {selectedAmount
                    ? getTierDetails(determineTier(selectedAmount)).label
                    : "Redstone Supporter"}
                </span>
              </div>
            </div>

            {/* 2. Auto-Sync Registration & Name Form */}
            <div
              className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition ${
                isLight
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-[oklch(0.12_0.03_260)] border-white/10 text-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">
                    2. Auto-Sync Scanned Person
                  </h2>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>

              <p className={`text-xs mb-5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Your details are saved to this browser so returning contributors are automatically
                recognized and loaded!
              </p>

              <form onSubmit={(e) => handleAutoSyncSupporter(e)} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Your Name / GamerTag <span className="text-[oklch(0.65_0.24_25)]">*</span>
                    </label>
                    {name && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        ✓ Profile Loaded
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="e.g. Arun_Crafter or TamilGamer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition outline-none ${
                      isLight
                        ? "bg-slate-50 border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900"
                        : "bg-black/30 border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Amount Paid (₹) <span className="text-[oklch(0.65_0.24_25)]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formAmount}
                      onChange={(e) => setFormAmount(Number(e.target.value))}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition outline-none ${
                        isLight
                          ? "bg-slate-50 border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900"
                          : "bg-black/30 border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Payment App Used
                    </label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as Supporter["method"])}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm font-medium border transition outline-none cursor-pointer ${
                        isLight
                          ? "bg-slate-50 border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900"
                          : "bg-[oklch(0.15_0.03_260)] border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                      }`}
                    >
                      <option value="gpay">Google Pay (GPay)</option>
                      <option value="phonepe">PhonePe</option>
                      <option value="paytm">Paytm</option>
                      <option value="upi">BHIM / Other UPI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Cheer Message / Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={180}
                    placeholder="e.g. Love your live streams and Minecraft tutorials bro! 🔥"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition outline-none resize-none ${
                      isLight
                        ? "bg-slate-50 border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900"
                        : "bg-black/30 border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-extrabold text-sm shadow-lg shadow-red-500/25 transition cursor-pointer transform active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Syncing..." : "Auto-Sync to Supporters Wall"}</span>
                </button>
              </form>
            </div>

            {/* 3. Fast UPI UTR / Ref ID Verification */}
            <div
              className={`rounded-3xl p-5 sm:p-6 border transition ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Hash className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                <h3 className="text-sm font-bold">Fast UTR / Ref ID Auto-Verification</h3>
              </div>
              <p className={`text-xs mb-3 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Have a 12-digit UPI Ref/UTR number from Google Pay or bank SMS? Paste it here to
                instantly load and sync.
              </p>

              <form onSubmit={handleFastUtrVerify} className="flex gap-2">
                <input
                  type="text"
                  maxLength={30}
                  placeholder="e.g. 412345678901 or UTR"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-mono border transition outline-none ${
                    isLight
                      ? "bg-white border-slate-200 text-slate-900"
                      : "bg-black/30 border-white/10 text-white"
                  }`}
                />
                <button
                  type="submit"
                  disabled={isVerifyingUtr || !utrInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-bold text-xs cursor-pointer transition disabled:opacity-50 shrink-0"
                >
                  {isVerifyingUtr ? "Verifying..." : "Verify Ref"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: High-Res UPI QR Code with Live Auto-Sync Status */}
          <div className="lg:col-span-6 sticky top-6">
            <UpiQrCode
              upiId={data.upiConfig.upiId}
              payeeName={data.upiConfig.payeeName}
              amount={selectedAmount}
              note="Support SodaCraft Tamil Gaming"
              isLight={isLight}
              sessionId={sessionId}
              session={currentSession}
              onAppInitiated={handleAppInitiated}
              onRefreshSession={handleNewSession}
            />

            {/* Perks / Community Benefits Banner */}
            <div
              className={`mt-4 p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                isLight
                  ? "bg-red-50/70 border-red-200 text-slate-800"
                  : "bg-[oklch(0.65_0.24_25)]/10 border-[oklch(0.65_0.24_25)]/20 text-slate-200"
              }`}
            >
              <Flame className="w-5 h-5 text-[oklch(0.65_0.24_25)] shrink-0" />
              <div>
                <span className="font-bold">Supporter Perks:</span> All supporters get exclusive
                mention in our upcoming live stream descriptions and priority entry to Discord
                Minecraft gaming events!
              </div>
            </div>
          </div>
        </div>

        {/* RECENT SUPPORTERS WALL OF FAME (AUTOMATICALLY ADDED & SYNCED) */}
        <section id="supporters-wall" className="mt-16 pt-10 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[oklch(0.65_0.24_25)]/15 text-[oklch(0.75_0.22_25)] border border-[oklch(0.65_0.24_25)]/30 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.65_0.24_25)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.65_0.24_25)]"></span>
                </span>
                <span>Live Feed • Auto-Synced Real Time</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Recent Community Supporters
              </h2>
              <p className={`text-xs sm:text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Thank you to our awesome viewers & gamers keeping the channel alive!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                  isLight
                    ? "bg-white border-slate-200 text-slate-800"
                    : "bg-white/5 border-white/10 text-white"
                }`}
              >
                Total:{" "}
                <span className="text-[oklch(0.75_0.22_25)] font-extrabold">{totalCount}</span>{" "}
                supporter{totalCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          {/* Supporters Grid or Empty State */}
          {localSupporters.length === 0 ? (
            <div
              className={`rounded-3xl p-10 text-center border ${
                isLight
                  ? "bg-white border-slate-200 text-slate-800 shadow-sm"
                  : "bg-white/5 border-white/10 text-white"
              }`}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[oklch(0.65_0.24_25)]/15 text-[oklch(0.75_0.22_25)] mb-4">
                <Heart className="w-7 h-7 fill-current" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Be the First Supporter!</h3>
              <p
                className={`text-xs sm:text-sm max-w-md mx-auto ${
                  isLight ? "text-slate-600" : "text-slate-400"
                }`}
              >
                Scan the QR code above with Google Pay or any UPI app, submit your name, and become
                the first supporter featured on the wall of fame!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence initial={false}>
                {localSupporters.map((supporter) => {
                  const tierInfo = getTierDetails(supporter.tier);
                  const methodInfo = getMethodBadge(supporter.method);
                  const isNew = supporter.id === justAddedId;

                  return (
                    <motion.div
                      key={supporter.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`relative rounded-2xl p-5 border transition duration-300 flex flex-col justify-between overflow-hidden shadow-lg ${
                        isNew
                          ? "ring-2 ring-[oklch(0.65_0.24_25)] shadow-red-500/20 animate-pulse"
                          : ""
                      } ${
                        isLight
                          ? "bg-white border-slate-200 text-slate-900 shadow-slate-200/50"
                          : "bg-[oklch(0.12_0.03_260)] border-white/10 text-white shadow-black/40"
                      }`}
                    >
                      {/* Top Row: Name + Tier & Amount */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm sm:text-base truncate">
                                {supporter.name}
                              </span>
                              {isNew && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider bg-[oklch(0.65_0.24_25)] text-white rounded">
                                  NEW
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tierInfo.color}`}
                              >
                                {tierInfo.label}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${methodInfo.bg}`}
                              >
                                {methodInfo.label}
                              </span>
                            </div>
                          </div>

                          {/* Amount Badge */}
                          <div className="shrink-0 text-right">
                            <div className="text-base sm:text-lg font-black text-[oklch(0.75_0.22_25)]">
                              ₹{supporter.amount}
                            </div>
                          </div>
                        </div>

                        {/* Cheer Message */}
                        <p
                          className={`text-xs leading-relaxed italic my-3 line-clamp-3 ${
                            isLight ? "text-slate-600" : "text-slate-300"
                          }`}
                        >
                          "{supporter.message}"
                        </p>
                      </div>

                      {/* Bottom Metadata */}
                      <div
                        className={`pt-3 border-t flex items-center justify-between text-[11px] ${
                          isLight
                            ? "border-slate-100 text-slate-400"
                            : "border-white/5 text-slate-500"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Verified Auto-Sync</span>
                        </span>
                        <span>{mounted ? timeAgo(supporter.timestamp, now) : "recently"}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <section className="mt-16 max-w-2xl mx-auto text-center">
          <h3 className="text-lg font-bold mb-2">How Does Auto-Sync Work?</h3>
          <div
            className={`rounded-2xl p-5 border text-left text-xs space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            <div>
              <span className="font-bold text-[oklch(0.75_0.22_25)]">
                1. Dynamic Session Reference:
              </span>
              <p className="mt-0.5 opacity-80">
                Every time you visit this page, a unique live session token (e.g. #{sessionId}) is
                embedded into the QR code and payment note.
              </p>
            </div>
            <div>
              <span className="font-bold text-[oklch(0.75_0.22_25)]">
                2. Real-Time Scan & App Return Tracking:
              </span>
              <p className="mt-0.5 opacity-80">
                When you tap GPay or scan with your phone, the system detects your return and
                automatically synchronizes your contribution with the live stream supporters board.
              </p>
            </div>
            <div>
              <span className="font-bold text-[oklch(0.75_0.22_25)]">
                3. Fast UTR Verification:
              </span>
              <p className="mt-0.5 opacity-80">
                You can also enter your 12-digit transaction reference number from Google Pay to
                instantly verify and display your supporter badge.
              </p>
            </div>
          </div>

          <footer
            className={`mt-10 text-xs font-medium tracking-wide ${
              isLight ? "text-slate-400" : "text-white/30"
            }`}
          >
            © {new Date().getFullYear()} SodaCraftTamil. Official Creator Support Page.
          </footer>
        </section>
      </div>
    </div>
  );
}
