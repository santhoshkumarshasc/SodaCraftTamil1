import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Radio,
  ScanLine,
  RefreshCw,
  Sparkles,
  QrCode as QrIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { QrSession } from "@/lib/support.functions";

interface UpiQrCodeProps {
  upiId: string;
  payeeName: string;
  amount?: number;
  note?: string;
  isLight?: boolean;
  sessionId: string;
  session?: QrSession | null;
  onAppInitiated?: (method: "gpay" | "phonepe" | "paytm" | "upi") => void;
  onRefreshSession?: () => void;
}

export function UpiQrCode({
  upiId,
  payeeName,
  amount,
  note = "Support SodaCraft Tamil",
  isLight = false,
  sessionId,
  session,
  onAppInitiated,
  onRefreshSession,
}: UpiQrCodeProps) {
  const [qrType, setQrType] = useState<"upi" | "companion">("upi");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Determine origin for companion scanner link
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const companionUrl = `${origin}/support?session=${encodeURIComponent(sessionId)}${
    amount ? `&amount=${amount}` : ""
  }`;

  // Build standard NPCI UPI URI with transaction note & reference token
  const upiUrl = (() => {
    const params = new URLSearchParams();
    params.set("pa", upiId);
    params.set("pn", payeeName);
    params.set("tn", `${note} ${sessionId}`);
    params.set("tr", sessionId);
    params.set("cu", "INR");
    if (amount && amount > 0) {
      params.set("am", amount.toString());
    }
    return `upi://pay?${params.toString()}`;
  })();

  const activeQrPayload = qrType === "upi" ? upiUrl : companionUrl;

  useEffect(() => {
    let isCancelled = false;
    QRCode.toDataURL(activeQrPayload, {
      width: 440,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (!isCancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeQrPayload]);

  const copyToClipboard = async (text: string, isUpiId = true) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isUpiId) {
        setCopiedUpi(true);
        setTimeout(() => setCopiedUpi(false), 2000);
        toast.success(`Copied UPI ID: ${text}`);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast.success("Copied mobile scan link!");
      }
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleAppClick = (method: "gpay" | "phonepe" | "paytm" | "upi") => {
    onAppInitiated?.(method);
    toast.info(
      `Opening ${method.toUpperCase()}... Please return here after completing payment to auto-sync!`,
    );
  };

  const isScanned = session?.status === "scanned";
  const isCompleted = session?.status === "completed";

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all duration-300 flex flex-col items-center text-center ${
        isCompleted
          ? "border-emerald-500/50 bg-emerald-950/20"
          : isScanned
            ? "border-amber-500/50 bg-amber-950/20"
            : isLight
              ? "bg-white border-slate-200 text-slate-900 shadow-slate-200/60"
              : "bg-[oklch(0.12_0.03_260)] border-white/10 text-white shadow-black/60"
      }`}
    >
      {/* Live Sync Status Pill */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        {isCompleted ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>Payment Verified & Synced!</span>
          </div>
        ) : isScanned ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <ScanLine className="w-3.5 h-3.5" />
            <span>📱 QR Scanned by {session?.scannedDeviceInfo || "Mobile Device"}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[oklch(0.65_0.24_25)]/15 text-[oklch(0.75_0.22_25)] border border-[oklch(0.65_0.24_25)]/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[oklch(0.65_0.24_25)]" />
            <span>Live Auto-Sync Active • Ref #{sessionId}</span>
          </div>
        )}
      </div>

      <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-1">
        Scan & Pay via any UPI App
      </h3>
      <p
        className={`text-xs sm:text-sm max-w-sm mb-4 ${
          isLight ? "text-slate-600" : "text-slate-400"
        }`}
      >
        Google Pay, PhonePe, Paytm, BHIM, CRED, or any banking app
      </p>

      {/* QR Code Type Switcher */}
      <div
        className={`flex items-center p-1 rounded-xl mb-5 border text-xs font-bold ${
          isLight ? "bg-slate-100 border-slate-200" : "bg-black/30 border-white/10"
        }`}
      >
        <button
          type="button"
          onClick={() => setQrType("upi")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
            qrType === "upi"
              ? "bg-[oklch(0.65_0.24_25)] text-white shadow"
              : isLight
                ? "text-slate-600 hover:text-slate-900"
                : "text-slate-400 hover:text-white"
          }`}
        >
          <QrIcon className="w-3.5 h-3.5" />
          <span>UPI App QR</span>
        </button>

        <button
          type="button"
          onClick={() => setQrType("companion")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
            qrType === "companion"
              ? "bg-[oklch(0.65_0.24_25)] text-white shadow"
              : isLight
                ? "text-slate-600 hover:text-slate-900"
                : "text-slate-400 hover:text-white"
          }`}
          title="Scan with normal phone camera to auto-sync mobile to this screen"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile Sync QR</span>
        </button>
      </div>

      {/* QR Code Container with channel red accent framing */}
      <div className="relative group">
        <div className="p-4 bg-white rounded-2xl shadow-xl ring-4 ring-[oklch(0.65_0.24_25)]/30 border border-slate-200 relative overflow-hidden">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`UPI QR Code for ${payeeName}`}
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400">
              <span className="animate-pulse text-sm font-medium">Generating QR...</span>
            </div>
          )}

          {/* Center Badge on QR */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white px-2.5 py-1 rounded-md shadow-md border border-slate-300 flex items-center gap-1">
              <span className="text-[11px] font-black tracking-tighter text-[oklch(0.55_0.24_25)]">
                UPI
              </span>
              <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1 rounded">
                GPay
              </span>
            </div>
          </div>
        </div>

        {/* Amount & Sync Tag */}
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          {amount && amount > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[oklch(0.65_0.24_25)]/20 text-[oklch(0.75_0.22_25)] text-xs font-bold border border-[oklch(0.65_0.24_25)]/30">
              <span>Amount:</span>
              <span className="text-sm font-extrabold text-[oklch(0.85_0.18_25)]">₹{amount}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-medium">Scan to enter any amount</div>
          )}

          {onRefreshSession && (
            <button
              onClick={onRefreshSession}
              type="button"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
              }`}
              title="Generate new session reference"
            >
              <RefreshCw className="w-3 h-3" />
              <span>New Ref</span>
            </button>
          )}
        </div>
      </div>

      {/* Helpful instruction banner based on selected QR mode */}
      <div
        className={`mt-4 w-full max-w-sm rounded-xl p-3 text-xs text-left border ${
          isLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
        }`}
      >
        {qrType === "upi" ? (
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="opacity-90">
              Open <strong>Google Pay / PhonePe</strong>, scan this QR code, and complete your
              payment. Return here or fill the form below to auto-sync!
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="opacity-90">
              Scan with your <strong>phone camera or Google Lens</strong>. It instantly opens this
              session on your phone and automatically synchronizes both screens!
            </span>
          </div>
        )}
      </div>

      {/* UPI ID quick copy bar */}
      <div
        className={`mt-4 w-full max-w-sm rounded-xl p-3 flex items-center justify-between gap-2 border transition ${
          isLight
            ? "bg-slate-50 border-slate-200 hover:border-slate-300"
            : "bg-white/5 border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex flex-col text-left truncate">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            Direct UPI ID
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold truncate select-all text-[oklch(0.75_0.22_25)]">
            {upiId}
          </span>
        </div>
        <button
          onClick={() => copyToClipboard(upiId, true)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
            copiedUpi
              ? "bg-[oklch(0.65_0.24_25)] text-white"
              : isLight
                ? "bg-slate-200 hover:bg-slate-300 text-slate-800"
                : "bg-white/10 hover:bg-white/20 text-white"
          }`}
          title="Copy UPI ID"
        >
          {copiedUpi ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* One-click Mobile UPI App Launchers (with auto-sync detection trigger) */}
      <div className="mt-6 w-full max-w-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Pay Directly via App (Auto-Syncs on Return)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* GPay direct deep link */}
          <a
            href={upiUrl}
            onClick={() => handleAppClick("gpay")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition transform active:scale-95"
          >
            <span className="font-extrabold tracking-tight">GPay</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {/* PhonePe direct deep link */}
          <a
            href={upiUrl}
            onClick={() => handleAppClick("phonepe")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 transition transform active:scale-95"
          >
            <span className="font-extrabold tracking-tight">PhonePe</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {/* Paytm direct deep link */}
          <a
            href={upiUrl}
            onClick={() => handleAppClick("paytm")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/20 transition transform active:scale-95"
          >
            <span className="font-extrabold tracking-tight">Paytm</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          {/* Any UPI app with website red theme */}
          <a
            href={upiUrl}
            onClick={() => handleAppClick("upi")}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white text-xs font-bold shadow-lg shadow-red-500/20 transition transform active:scale-95"
          >
            <span className="font-extrabold tracking-tight">Any UPI App</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
}
