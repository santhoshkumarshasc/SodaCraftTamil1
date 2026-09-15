import { useState } from "react";
import {
  CheckCircle2,
  Printer,
  Copy,
  Check,
  X,
  Calendar,
  User,
  Smartphone,
  ShieldCheck,
  CreditCard,
  FileDown,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { Supporter } from "@/lib/support.functions";
import {
  formatWhatsAppMessage,
  cleanPhoneNumber,
  downloadReceiptTxt,
  DEFAULT_CREATOR_WHATSAPP,
} from "@/lib/whatsapp.utils";

interface PaymentReceiptProps {
  supporter: Supporter;
  upiId?: string;
  payeeName?: string;
  creatorWhatsAppNumber?: string;
  isLight?: boolean;
  onClose?: () => void;
}

export function PaymentReceipt({
  supporter,
  upiId = "santhoshkumarshasc@oksbi",
  payeeName = "SodaCraft Tamil",
  creatorWhatsAppNumber = DEFAULT_CREATOR_WHATSAPP,
  isLight = false,
  onClose,
}: PaymentReceiptProps) {
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const cleanPhone = cleanPhoneNumber(creatorWhatsAppNumber);

  const receiptNo = supporter.receiptNumber || `SCT-REC-${supporter.id.slice(-6).toUpperCase()}`;
  const formattedDate = new Date(supporter.timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const methodLabels: Record<string, { label: string; icon: typeof Smartphone }> = {
    gpay: { label: "Google Pay", icon: Smartphone },
    phonepe: { label: "PhonePe", icon: Smartphone },
    paytm: { label: "Paytm", icon: Smartphone },
    upi: { label: "BHIM / UPI", icon: Smartphone },
    razorpay: { label: "Razorpay Gateway", icon: CreditCard },
    other: { label: "UPI Transfer", icon: Smartphone },
  };

  const methodInfo = methodLabels[supporter.method] || {
    label: "UPI Payment",
    icon: Smartphone,
  };
  const MethodIcon = methodInfo.icon;

  const receiptText = formatWhatsAppMessage(supporter, upiId, payeeName);

  const handleDownloadPdf = () => {
    toast.info("Opening print dialog. Select 'Save as PDF' to download your receipt!");
    window.print();
  };

  const handleDownloadTxt = () => {
    try {
      downloadReceiptTxt(supporter, upiId, payeeName);
      toast.success("Receipt downloaded as text file!");
    } catch {
      toast.error("Could not download text receipt");
    }
  };

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
      toast.success("Receipt details copied to clipboard!");
    } catch {
      toast.error("Could not copy receipt");
    }
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Receipt Card Container */}
      <div
        id="printable-payment-receipt"
        className={`rounded-3xl border shadow-2xl overflow-hidden transition ${
          isLight
            ? "bg-white border-slate-200 text-slate-900 shadow-slate-300/50"
            : "bg-[oklch(0.12_0.03_260)] border-white/15 text-white shadow-black/80"
        }`}
      >
        {/* Top Header Banner themed to channel red */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-[oklch(0.65_0.24_25)] to-orange-600 text-white relative">
          {onClose && (
            <button
              onClick={onClose}
              className="no-print absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
              title="Close Receipt"
              aria-label="Close Receipt"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm text-white">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-white/90">
                Official Payment Receipt
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{payeeName}</h2>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-white/90 pt-3 border-t border-white/20">
            <span className="font-mono font-bold tracking-wider">{receiptNo}</span>
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              {supporter.verified || supporter.method === "razorpay"
                ? "Verified Payment"
                : "Official Receipt"}
            </span>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Big Amount Callout */}
          <div
            className={`p-5 rounded-2xl text-center border ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-black/30 border-white/10"
            }`}
          >
            <div
              className={`text-xs uppercase font-bold tracking-wider mb-1 ${
                isLight ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Amount Contributed
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[oklch(0.65_0.24_25)] flex items-center justify-center gap-1">
              <span>₹</span>
              <span>{supporter.amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-500 mt-1 flex items-center justify-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {supporter.method === "razorpay"
                ? "Instant Razorpay Confirmation"
                : "Direct Creator Support Received"}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
              }`}
            >
              <span
                className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Supporter / GamerTag
              </span>
              <div className="font-black text-sm flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-[oklch(0.65_0.24_25)] shrink-0" />
                <span className="truncate">{supporter.name}</span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
              }`}
            >
              <span
                className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Payment Method
              </span>
              <div className="font-black text-sm flex items-center gap-1.5 truncate">
                <MethodIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{methodInfo.label}</span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
              }`}
            >
              <span
                className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Paid To (Creator UPI)
              </span>
              <div className="font-mono font-bold text-xs truncate text-[oklch(0.75_0.22_25)]">
                {upiId}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-100" : "bg-white/5 border-white/5"
              }`}
            >
              <span
                className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Date & Time
              </span>
              <div className="font-bold text-xs flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Razorpay Transaction ID or Reference */}
          {supporter.paymentId && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                isLight
                  ? "bg-slate-50 border-emerald-200 text-slate-800"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              }`}
            >
              <div className="truncate">
                <span className="block text-[10px] font-bold uppercase tracking-wider opacity-75">
                  Gateway Payment ID
                </span>
                <span className="font-mono font-bold text-xs truncate">{supporter.paymentId}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shrink-0">
                Verified
              </span>
            </div>
          )}

          {/* Supporter cheer message */}
          {supporter.message && (
            <div
              className={`p-4 rounded-xl border text-xs italic ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-white/5 border-white/10 text-slate-300"
              }`}
            >
              <span
                className={`block not-italic text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}
              >
                Message from Supporter:
              </span>
              "{supporter.message}"
            </div>
          )}

          {/* SECTION 1: DOWNLOAD RECEIPT DIRECTLY VIA WEBPAGE (FOR ALL SUPPORTERS) */}
          <div className="no-print p-4 sm:p-5 rounded-2xl bg-black/25 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[oklch(0.75_0.22_25)]" />
                <span className="font-black text-xs uppercase tracking-wider">
                  Download Receipt to Your Device
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                Webpage Download
              </span>
            </div>

            <p className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Save this verified receipt on your phone or computer as proof of your contribution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[oklch(0.65_0.24_25)] hover:bg-[oklch(0.7_0.24_25)] text-white font-black text-xs shadow-md shadow-red-500/20 transition cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Download / Save as PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs border transition cursor-pointer active:scale-95 ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                    : "bg-white/10 hover:bg-white/20 border-white/10 text-white"
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download .TXT File</span>
              </button>
            </div>
          </div>

          {/* DIRECT CREATOR DISPATCH STATUS */}
          <div className="no-print p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-emerald-400 block text-xs">
                Receipt Dispatched to Creator
              </span>
              <span className={`text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Payment record transmitted directly to creator's WhatsApp (+{cleanPhone})
              </span>
            </div>
          </div>

          {/* Receipt Action Buttons */}
          <div className="no-print flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleCopyReceipt}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                copiedReceipt
                  ? "bg-[oklch(0.65_0.24_25)] text-white border-[oklch(0.65_0.24_25)]"
                  : isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
              }`}
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Details</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs cursor-pointer transition"
              >
                Close Receipt
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
