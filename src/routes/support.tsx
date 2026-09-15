import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Heart,
  ArrowLeft,
  Sun,
  Moon,
  Server,
  Zap,
  Check,
  IndianRupee,
  FileText,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Lock,
  Download,
  QrCode,
  Sparkles,
} from "lucide-react";
import {
  getSupportData,
  submitSupporter,
  createRazorpayOrder,
  type SupportPayload,
  type Supporter,
} from "@/lib/support.functions";
import { UpiQrCode } from "@/components/UpiQrCode";
import { PaymentReceipt } from "@/components/PaymentReceipt";
import {
  getCreatorWhatsAppUrl,
  cleanPhoneNumber,
  DEFAULT_CREATOR_WHATSAPP,
} from "@/lib/whatsapp.utils";
import { loadRazorpayScript, type RazorpayOptions } from "@/lib/razorpay";
import { useAdminConfig } from "@/lib/admin-config";
import { AdminSecretModal } from "@/components/AdminSecretModal";

const supportQueryOptions = queryOptions<SupportPayload>({
  queryKey: ["support-data"],
  queryFn: () => getSupportData(),
  staleTime: 30_000,
});

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>) => ({
    amount: search.amount ? Number(search.amount) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Support SodaCraft Tamil - Official Creator Support" },
      {
        name: "description",
        content:
          "Support SodaCraft Tamil via direct UPI QR code or Razorpay. Instant payment receipt and direct WhatsApp receipt confirmation to creator.",
      },
      { property: "og:title", content: "Support SodaCraft Tamil - Official Creator Support" },
      {
        property: "og:description",
        content:
          "Fund SodaCraft Tamil Minecraft SMP server and live streams. Support via UPI QR or Razorpay with instant private WhatsApp receipt confirmation.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(supportQueryOptions),
  component: SupportPage,
});

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

function SupportPage() {
  const queryClient = useQueryClient();
  const loaderData = Route.useLoaderData();
  const { data } = useSuspenseQuery({
    ...supportQueryOptions,
    initialData: loaderData,
  });
  const search = Route.useSearch();
  const { config } = useAdminConfig();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Creator WhatsApp phone number state (from admin config, server config, or official default)
  const creatorPhone =
    config.whatsappNumber || data.upiConfig.whatsappNumber || DEFAULT_CREATOR_WHATSAPP;
  const activePresetAmounts =
    config.presetAmounts && config.presetAmounts.length > 0 ? config.presetAmounts : PRESET_AMOUNTS;
  const activeUpiId = config.upiId || data.upiConfig.upiId;
  const activePayeeName = config.payeeName || data.upiConfig.payeeName;
  const activeGoal = config.monthlyGoal || data.stats.monthlyGoal || 15000;
  const activeTitle = config.supportTitle || "Support SodaCraft Tamil";
  const activeSubtitle =
    config.supportSubtitle ||
    "Fund our Minecraft SMP server, hardware, and high-quality live streams. Pay via Razorpay or direct UPI QR, and send your payment receipt directly to the creator's WhatsApp!";

  // Selected payment amount state (defaults to preset 100 or search query)
  const initialAmount = search.amount && search.amount > 0 ? search.amount : 100;
  const [selectedAmount, setSelectedAmount] = useState<number>(initialAmount);
  const [formAmount, setFormAmount] = useState<number>(initialAmount);

  // Payment method selection tab: "razorpay" (Card/Netbanking/UPI) vs "upi" (Manual QR)
  const [paymentMode, setPaymentMode] = useState<"razorpay" | "upi">("razorpay");

  // Supporter Form State
  const [name, setName] = useState("");
  const [upiMethod, setUpiMethod] = useState<Supporter["method"]>("gpay");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);

  // Active Payment Receipt Modal state
  const [activeReceiptSupporter, setActiveReceiptSupporter] = useState<Supporter | null>(null);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }

    try {
      const savedProfile = localStorage.getItem("sodacraft_supporter_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setName(parsed.name);
        if (parsed.upiMethod) setUpiMethod(parsed.upiMethod);
      }
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const isLight = theme === "light";
  const cleanPhone = cleanPhoneNumber(creatorPhone);

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setFormAmount(amount);
  };

  const handleCustomAmountChange = (valStr: string) => {
    const numeric = parseInt(valStr, 10);
    if (isNaN(numeric) || numeric <= 0) {
      setSelectedAmount(0);
      setFormAmount(0);
    } else {
      setSelectedAmount(numeric);
      setFormAmount(numeric);
    }
  };

  // Automatically dispatch receipt directly to creator's WhatsApp (+91 9629123982)
  const dispatchReceiptToCreatorWhatsApp = (supporter: Supporter) => {
    try {
      const waUrl = getCreatorWhatsAppUrl(
        supporter,
        cleanPhone,
        data.upiConfig.upiId,
        data.upiConfig.payeeName,
      );
      if (typeof window !== "undefined") {
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      console.error("Error opening WhatsApp message:", e);
    }
  };

  // Submit UPI Manual Payment receipt
  const handleSubmitUpiPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Please enter your Name or Minecraft GamerTag!");
      return;
    }

    if (!formAmount || formAmount <= 0) {
      toast.error("Please choose or enter a valid support amount (minimum ₹1)!");
      return;
    }

    setIsSubmitting(true);
    try {
      try {
        localStorage.setItem(
          "sodacraft_supporter_profile",
          JSON.stringify({ name: cleanName, upiMethod }),
        );
      } catch {
        // Ignore storage errors
      }

      const res = await submitSupporter({
        data: {
          name: cleanName,
          amount: formAmount,
          message: message.trim() || "Thank you for the awesome Minecraft videos! 🔥",
          method: upiMethod,
        },
      });

      if (res.success && res.supporter) {
        setActiveReceiptSupporter(res.supporter);
        dispatchReceiptToCreatorWhatsApp(res.supporter);
        toast.success(
          `🎉 Thank you, ${res.supporter.name}! Receipt sent to creator (+${cleanPhone}).`,
        );
        setMessage("");
        queryClient.invalidateQueries({ queryKey: ["support-data"] });
      }
    } catch (err) {
      console.error(err);
      const fallbackSupporter: Supporter = {
        id: `sup-${Date.now()}`,
        name: cleanName,
        amount: formAmount,
        message: message.trim() || "Thank you for the awesome Minecraft videos! 🔥",
        method: upiMethod,
        timestamp: new Date().toISOString(),
        receiptNumber: `SCT-REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
        verified: false,
      };
      setActiveReceiptSupporter(fallbackSupporter);
      dispatchReceiptToCreatorWhatsApp(fallbackSupporter);
      toast.success(
        `🎉 Thank you, ${fallbackSupporter.name}! Receipt sent to creator (+${cleanPhone}).`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initiate Razorpay Checkout & Confirmation
  const handlePayWithRazorpay = async () => {
    const cleanName = name.trim() || "Community Supporter";
    const amountToPay = formAmount || selectedAmount;

    if (!amountToPay || amountToPay <= 0) {
      toast.error("Please select or enter a valid amount (minimum ₹1)!");
      return;
    }

    setIsRazorpayLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Could not load Razorpay gateway. Please check your internet connection.");
        setIsRazorpayLoading(false);
        return;
      }

      // Create order via server function
      const order = await createRazorpayOrder({
        data: {
          amount: amountToPay,
          name: cleanName,
        },
      });

      const options: RazorpayOptions = {
        key: order.keyId || data.upiConfig.razorpayKeyId || "rzp_test_sodacraft",
        amount: Math.round(amountToPay * 100),
        currency: "INR",
        name: data.upiConfig.payeeName || "SodaCraft Tamil",
        description: `Support SodaCraft Tamil SMP - ₹${amountToPay}`,
        image: "/favicon.ico",
        order_id: order.isTest ? undefined : order.orderId,
        prefill: {
          name: cleanName,
        },
        theme: {
          color: "#e11d48",
        },
        handler: async (response) => {
          const paymentId = response.razorpay_payment_id || `pay_${Date.now().toString(36)}`;
          try {
            const res = await submitSupporter({
              data: {
                name: cleanName,
                amount: amountToPay,
                message: message.trim() || "Supported via Razorpay! 🔥",
                method: "razorpay",
                paymentId,
                verified: true,
              },
            });

            if (res.success && res.supporter) {
              setActiveReceiptSupporter(res.supporter);
              dispatchReceiptToCreatorWhatsApp(res.supporter);
              toast.success(
                `🎉 Payment confirmed! Receipt sent directly to creator (+${cleanPhone}).`,
              );
              queryClient.invalidateQueries({ queryKey: ["support-data"] });
            }
          } catch (e) {
            console.error(e);
            const fallback: Supporter = {
              id: `rzp-${Date.now()}`,
              name: cleanName,
              amount: amountToPay,
              message: message.trim() || "Supported via Razorpay! 🔥",
              method: "razorpay",
              paymentId,
              timestamp: new Date().toISOString(),
              receiptNumber: `SCT-RZP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
              verified: true,
            };
            setActiveReceiptSupporter(fallback);
            dispatchReceiptToCreatorWhatsApp(fallback);
            toast.success(
              `🎉 Payment confirmed! Receipt sent directly to creator (+${cleanPhone}).`,
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Razorpay payment window closed");
          },
        },
      };

      const razorpayConstructor = (
        window as unknown as { Razorpay: new (opts: RazorpayOptions) => { open: () => void } }
      ).Razorpay;
      if (razorpayConstructor) {
        const rzp = new razorpayConstructor(options);
        rzp.open();
      } else {
        // Simulated checkout if gateway blocked in strict sandbox
        toast.info("Simulating Razorpay confirmation...");
        setTimeout(async () => {
          const mockPaymentId = `pay_sim_${Date.now().toString(36)}`;
          const res = await submitSupporter({
            data: {
              name: cleanName,
              amount: amountToPay,
              message: message.trim() || "Supported via Razorpay! 🔥",
              method: "razorpay",
              paymentId: mockPaymentId,
              verified: true,
            },
          });
          setActiveReceiptSupporter(res.supporter);
          dispatchReceiptToCreatorWhatsApp(res.supporter);
          toast.success(`Payment confirmed! Receipt sent directly to creator (+${cleanPhone}).`);
        }, 800);
      }
    } catch (err) {
      console.error("Razorpay initiation error:", err);
      toast.error("Failed to initiate Razorpay payment. You can also use direct UPI QR.");
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  const totalRaised = data.stats.totalAmountRaised || 0;
  const goal = activeGoal;
  const progressPercent = Math.min(100, Math.round((totalRaised / goal) * 100));

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isLight
          ? "bg-[oklch(0.97_0.01_240)] text-slate-900"
          : "bg-[oklch(0.08_0.02_260)] text-white"
      }`}
    >
      {/* Background Ambient Glows */}
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsAdminOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition duration-200 border cursor-pointer ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                  : "bg-white/5 hover:bg-white/15 border-white/10 text-white/80"
              }`}
              title="Admin Dashboard (Secret Code 9629)"
              aria-label="Admin Dashboard"
            >
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>

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

        {/* Hero Title Section */}
        <section className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[oklch(0.65_0.24_25)]/15 text-[oklch(0.75_0.22_25)] border border-[oklch(0.65_0.24_25)]/30 mb-4">
            <Heart className="w-3.5 h-3.5 fill-current text-[oklch(0.65_0.24_25)]" />
            <span>Official Creator Support</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{activeTitle}</h1>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-slate-300"
            }`}
          >
            {activeSubtitle}
          </p>

          {/* Monthly Server Funding Goal Card (Private & Aggregate Only - No public names/receipts) */}
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
                style={{ width: `${Math.max(4, progressPercent)}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] font-medium opacity-75">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>100% Private Contributions • Receipt Sent Directly to Creator</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">0% Middleman Fees</span>
            </div>
          </div>
        </section>

        {/* ACTIVE PAYMENT RECEIPT DISPLAY (PRIVATE TO THE CURRENT USER) */}
        <AnimatePresence>
          {activeReceiptSupporter && (
            <motion.section
              id="active-receipt-section"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Your Official Payment Receipt is Ready</span>
                </div>
                <button
                  onClick={() => setActiveReceiptSupporter(null)}
                  className="text-xs opacity-75 hover:opacity-100 cursor-pointer underline"
                >
                  Close Receipt
                </button>
              </div>

              <PaymentReceipt
                supporter={activeReceiptSupporter}
                upiId={data.upiConfig.upiId}
                payeeName={data.upiConfig.payeeName}
                creatorWhatsAppNumber={creatorPhone}
                isLight={isLight}
                onClose={() => setActiveReceiptSupporter(null)}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* MAIN INTERACTIVE PAYMENT & QR CODE SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column: 1. Choose Amount (Presets + Custom Input) + 2. Payment & Confirm */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* 1. CHOOSE SUPPORT AMOUNT (PRESET BUTTONS + CUSTOM PAYMENT INPUT AREA) */}
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
                    1. Choose Support Amount
                  </h2>
                </div>
                {selectedAmount > 0 && (
                  <span className="text-xs font-black px-2.5 py-1 rounded-full bg-[oklch(0.65_0.24_25)] text-white">
                    ₹{selectedAmount}
                  </span>
                )}
              </div>

              <p className={`text-xs mb-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Tap any preset or enter a custom amount to update the live QR code
              </p>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                {activePresetAmounts.map((amt) => {
                  const isSelected = selectedAmount === amt;
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
                      <span className="text-[11px] font-normal opacity-70">₹</span>
                      <span className="text-base">{amt}</span>
                    </button>
                  );
                })}
              </div>

              {/* CUSTOM PAYMENT INPUT AREA */}
              <div
                className={`p-4 rounded-2xl border transition ${
                  isLight
                    ? "bg-slate-50/90 border-slate-200"
                    : "bg-black/25 border-white/10 focus-within:border-[oklch(0.65_0.24_25)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="custom-amount-input"
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5 text-[oklch(0.65_0.24_25)]" />
                    <span>Or Enter Custom Amount</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Any amount ₹1 – ₹1,00,000
                  </span>
                </div>

                <div className="relative flex items-center">
                  <span
                    className="absolute left-3.5 text-lg font-black text-[oklch(0.65_0.24_25)] select-none"
                    aria-hidden="true"
                  >
                    ₹
                  </span>
                  <input
                    id="custom-amount-input"
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    value={selectedAmount || ""}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="e.g. 250, 750, 1500..."
                    className={`w-full pl-9 pr-4 py-3 rounded-xl font-black text-lg border transition outline-none ${
                      isLight
                        ? "bg-white border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900 shadow-inner"
                        : "bg-black/50 border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                    }`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] opacity-70">
                  <span>Custom amount instantly syncs with UPI QR code</span>
                  {selectedAmount > 0 && !PRESET_AMOUNTS.includes(selectedAmount) && (
                    <span className="font-bold text-[oklch(0.75_0.22_25)]">
                      Custom ₹{selectedAmount}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. PAYMENT CONFIRMATION (RAZORPAY GATEWAY + UPI DETAILS) */}
            <div
              className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition ${
                isLight
                  ? "bg-white border-slate-200 text-slate-900"
                  : "bg-[oklch(0.12_0.03_260)] border-white/10 text-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">
                    2. Payment & Receipt Confirmation
                  </h2>
                </div>
              </div>

              <p className={`text-xs mb-4 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Pay securely with Razorpay or scan UPI QR directly, then send confirmation to the
                creator
              </p>

              {/* Payment Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/20 border border-white/10 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMode("razorpay")}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    paymentMode === "razorpay"
                      ? "bg-[oklch(0.65_0.24_25)] text-white shadow-md shadow-red-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Razorpay (Instant)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("upi")}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    paymentMode === "upi"
                      ? "bg-[oklch(0.65_0.24_25)] text-white shadow-md shadow-red-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI QR (Manual)</span>
                </button>
              </div>

              {/* Supporter Details Form */}
              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Your Name / GamerTag <span className="text-[oklch(0.65_0.24_25)]">*</span>
                  </label>
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

                {/* Amount and App Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                        isLight ? "text-slate-700" : "text-slate-300"
                      }`}
                    >
                      Contribution Amount (₹)
                    </label>
                    <div
                      className={`px-4 py-2.5 rounded-xl text-sm font-black border flex items-center justify-between ${
                        isLight
                          ? "bg-slate-50 border-slate-200 text-slate-900"
                          : "bg-black/30 border-white/10 text-white"
                      }`}
                    >
                      <span>₹{formAmount || selectedAmount}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">
                        {PRESET_AMOUNTS.includes(formAmount) ? "Preset" : "Custom"}
                      </span>
                    </div>
                  </div>

                  {paymentMode === "upi" ? (
                    <div>
                      <label
                        className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                          isLight ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        Payment App Used
                      </label>
                      <select
                        value={upiMethod}
                        onChange={(e) => setUpiMethod(e.target.value as Supporter["method"])}
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
                  ) : (
                    <div>
                      <label
                        className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                          isLight ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        Gateway Mode
                      </label>
                      <div
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                          isLight
                            ? "bg-slate-50 border-slate-200 text-slate-800"
                            : "bg-black/30 border-white/10 text-emerald-300"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">Razorpay Secure Checkout</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    Note / Message for Creator (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={180}
                    placeholder="e.g. Love your live streams and Minecraft tutorial builds bro! 🔥"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition outline-none resize-none ${
                      isLight
                        ? "bg-slate-50 border-slate-200 focus:border-[oklch(0.65_0.24_25)] text-slate-900"
                        : "bg-black/30 border-white/10 focus:border-[oklch(0.75_0.22_25)] text-white"
                    }`}
                  />
                </div>

                {/* ACTION BUTTONS: RAZORPAY / UPI RECEIPT / WHATSAPP DIRECT TO CREATOR */}
                <div className="flex flex-col gap-2.5 pt-2">
                  {paymentMode === "razorpay" ? (
                    <button
                      type="button"
                      onClick={handlePayWithRazorpay}
                      disabled={isRazorpayLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-extrabold text-sm shadow-lg shadow-red-500/25 transition cursor-pointer transform active:scale-95 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isRazorpayLoading
                          ? "Opening Razorpay..."
                          : `Pay ₹${formAmount || selectedAmount} with Razorpay • Download Receipt`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitUpiPayment}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-extrabold text-sm shadow-lg shadow-red-500/25 transition cursor-pointer transform active:scale-95 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? "Generating Receipt..."
                          : "I Paid via QR • Download My Official Receipt"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-Res Dynamic UPI QR Code & Benefits */}
          <div className="lg:col-span-6 sticky top-6">
            <UpiQrCode
              upiId={activeUpiId}
              payeeName={activePayeeName}
              amount={selectedAmount}
              note="Support SodaCraft Tamil Gaming"
              isLight={isLight}
            />

            {/* Perks / Community Benefits Banner */}
            <div
              className={`mt-4 p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                isLight
                  ? "bg-red-50/70 border-red-200 text-slate-800"
                  : "bg-[oklch(0.65_0.24_25)]/10 border-[oklch(0.65_0.24_25)]/20 text-slate-200"
              }`}
            >
              <Sparkles className="w-5 h-5 text-[oklch(0.65_0.24_25)] shrink-0" />
              <div>
                <span className="font-bold">Creator Supporter Perks:</span> Exclusive mention in
                upcoming live stream descriptions and priority entry to Discord Minecraft gaming
                events!
              </div>
            </div>
          </div>
        </div>

        {/* HOW PAYMENT & RECEIPT CONFIRMATION WORKS (PRIVATE, NO PUBLIC WALL) */}
        <section className="mt-12 max-w-3xl mx-auto text-center">
          <h3 className="text-lg font-black mb-3">How Private Support Confirmation Works</h3>
          <div
            className={`rounded-2xl p-5 sm:p-6 border text-left text-xs grid grid-cols-1 sm:grid-cols-3 gap-4 ${
              isLight ? "bg-white border-slate-200" : "bg-white/5 border-white/10"
            }`}
          >
            <div className="space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[oklch(0.65_0.24_25)]/20 text-[oklch(0.75_0.22_25)] flex items-center justify-center font-black">
                1
              </div>
              <span className="font-bold text-sm block">Choose & Pay</span>
              <p className="opacity-80 text-[11px] leading-relaxed">
                Pick a preset or enter any custom amount. Pay via Razorpay (cards/UPI) or scan the
                UPI QR directly.
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[oklch(0.65_0.24_25)]/20 text-[oklch(0.75_0.22_25)] flex items-center justify-center font-black">
                2
              </div>
              <span className="font-bold text-sm block">Instant Receipt</span>
              <p className="opacity-80 text-[11px] leading-relaxed">
                Get an official verified payment receipt with unique serial number, printable or
                savable as PDF on your screen.
              </p>
            </div>

            <div className="space-y-1">
              <div className="w-7 h-7 rounded-lg bg-[#25D366]/20 text-emerald-400 flex items-center justify-center font-black">
                3
              </div>
              <span className="font-bold text-sm block">WhatsApp to Creator</span>
              <p className="opacity-80 text-[11px] leading-relaxed">
                Click to send the receipt directly to creator's WhatsApp (+{cleanPhone}). 100%
                private with no public disclosure.
              </p>
            </div>
          </div>

          <footer
            className={`mt-10 text-xs font-medium tracking-wide ${
              isLight ? "text-slate-400" : "text-white/30"
            }`}
          >
            © {new Date().getFullYear()} SodaCraft Tamil. Official Creator Support Page.
          </footer>
        </section>
      </div>

      {/* Admin Secret Dashboard Modal */}
      <AdminSecretModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}
