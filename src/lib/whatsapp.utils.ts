import type { Supporter } from "@/lib/support.functions";

export const DEFAULT_CREATOR_WHATSAPP = "919629123982";

export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return DEFAULT_CREATOR_WHATSAPP;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return DEFAULT_CREATOR_WHATSAPP;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function formatWhatsAppMessage(
  supporter: Supporter,
  upiId = "santhoshkumarshasc@oksbi",
  payeeName = "SodaCraft Tamil",
): string {
  const methodLabels: Record<string, string> = {
    gpay: "Google Pay (GPay)",
    phonepe: "PhonePe",
    paytm: "Paytm",
    upi: "BHIM / UPI App",
    razorpay: "Razorpay (Gateway)",
    other: "UPI Transfer",
  };
  const methodName = methodLabels[supporter.method] || "UPI";
  const dateStr = new Date(supporter.timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const receiptNo = supporter.receiptNumber || `SCT-REC-${supporter.id.slice(-6).toUpperCase()}`;

  const paymentIdLine = supporter.paymentId
    ? `\n🆔 *Transaction / Gateway ID:* ${supporter.paymentId}`
    : "";

  return `🎮 *SodaCraft Tamil - Official Supporter Receipt*
───────────────────────────
🧾 *Receipt No:* ${receiptNo}${paymentIdLine}
👤 *Supporter:* ${supporter.name}
💰 *Amount Paid:* ₹${supporter.amount}
📱 *Payment Method:* ${methodName}
🏷️ *Paid To:* ${payeeName} (${upiId})
📅 *Date & Time:* ${dateStr}
💬 *Message:* "${supporter.message}"
───────────────────────────
✅ *Status:* ${supporter.verified ? "Verified Payment" : "Submitted Contribution"}
❤️ *Thank you for supporting SodaCraft Tamil!*`;
}

export function getCreatorWhatsAppUrl(
  supporter: Supporter,
  creatorPhone = DEFAULT_CREATOR_WHATSAPP,
  upiId = "santhoshkumarshasc@oksbi",
  payeeName = "SodaCraft Tamil",
): string {
  const message = formatWhatsAppMessage(supporter, upiId, payeeName);
  const targetPhone = cleanPhoneNumber(creatorPhone);
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

export function downloadReceiptTxt(
  supporter: Supporter,
  upiId = "santhoshkumarshasc@oksbi",
  payeeName = "SodaCraft Tamil",
): void {
  if (typeof window === "undefined") return;
  const rawMessage = formatWhatsAppMessage(supporter, upiId, payeeName);
  // Strip formatting asterisks for pure clean text file
  const cleanText = rawMessage.replace(/\*/g, "");
  const blob = new Blob([cleanText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const receiptNo = supporter.receiptNumber || `SCT-REC-${supporter.id.slice(-6).toUpperCase()}`;
  link.href = url;
  link.download = `${receiptNo}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
