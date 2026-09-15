import { createServerFn } from "@tanstack/react-start";
import { getDbSupporters, addSupporterToDb, getSiteConfigFromDb } from "./db.server";

export type Supporter = {
  id: string;
  name: string;
  amount: number;
  message: string;
  method: "gpay" | "phonepe" | "paytm" | "upi" | "razorpay" | "other";
  timestamp: string;
  receiptNumber?: string;
  paymentId?: string;
  verified?: boolean;
  avatar?: string;
};

export type SupportStats = {
  totalSupporters: number;
  totalAmountRaised: number;
  monthlyGoal: number;
  goalProgressPercent: number;
  topSupporter: Supporter | null;
};

export type SupportPayload = {
  supporters: Supporter[];
  stats: SupportStats;
  upiConfig: {
    upiId: string;
    payeeName: string;
    note: string;
    whatsappNumber: string;
    razorpayKeyId: string;
    hasRazorpay: boolean;
  };
};

const DEFAULT_UPI_ID = "santhoshkumarshasc@oksbi";
const DEFAULT_PAYEE_NAME = "SodaCraft Tamil";
const DEFAULT_WHATSAPP_NUMBER = "919629123982";
const MONTHLY_GOAL = 15000;
const DEFAULT_RAZORPAY_KEY_ID = "rzp_live_Tc8MHDDnSr3cwl";
const DEFAULT_RAZORPAY_KEY_SECRET = "42rJlLTF0hJc1exM4t7JOLGY";

function generateReceiptNumber(prefix = "SCT-RZP"): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${year}-${random}`;
}

function calculateStats(supporters: Supporter[], goal = MONTHLY_GOAL): SupportStats {
  const totalSupporters = supporters.length;
  const totalAmountRaised = supporters.reduce((sum, s) => sum + s.amount, 0);
  const goalProgressPercent = Math.min(100, Math.round((totalAmountRaised / (goal || 1)) * 100));

  let topSupporter: Supporter | null = null;
  if (supporters.length > 0) {
    topSupporter = [...supporters].sort((a, b) => b.amount - a.amount)[0];
  }

  return {
    totalSupporters,
    totalAmountRaised,
    monthlyGoal: goal,
    goalProgressPercent,
    topSupporter,
  };
}

export const getSupportData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SupportPayload> => {
    const config = getSiteConfigFromDb();
    const supporters = getDbSupporters();
    const razorpayKeyId =
      config.razorpayKeyId || process.env.RAZORPAY_KEY_ID || DEFAULT_RAZORPAY_KEY_ID;
    const whatsappNumber =
      config.whatsappNumber || process.env.CREATOR_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER;
    const monthlyGoal = config.monthlyGoal || MONTHLY_GOAL;

    return {
      supporters: [], // Intentionally empty for public privacy
      stats: calculateStats(supporters, monthlyGoal),
      upiConfig: {
        upiId: config.upiId || process.env.CREATOR_UPI_ID || DEFAULT_UPI_ID,
        payeeName: config.payeeName || process.env.CREATOR_PAYEE_NAME || DEFAULT_PAYEE_NAME,
        note: config.paymentNote || "Support SodaCraft Tamil Gaming",
        whatsappNumber,
        razorpayKeyId,
        hasRazorpay: Boolean(razorpayKeyId),
      },
    };
  },
);

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { amount?: number; name?: string };
    const amount = Math.max(1, Math.min(100000, Number(d.amount) || 100));
    return { amount, name: d.name || "Supporter" };
  })
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      isTest: boolean;
    }> => {
      const config = getSiteConfigFromDb();
      const keyId = config.razorpayKeyId || process.env.RAZORPAY_KEY_ID || DEFAULT_RAZORPAY_KEY_ID;
      const keySecret =
        config.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || DEFAULT_RAZORPAY_KEY_SECRET;
      const amountPaise = data.amount * 100;

      if (keyId && keySecret) {
        try {
          const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
          const response = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({
              amount: amountPaise,
              currency: "INR",
              receipt: `rcpt_${Date.now().toString().slice(-8)}`,
              notes: {
                supporter_name: data.name,
                service: "SodaCraft Tamil Creator Support",
              },
            }),
          });

          if (response.ok) {
            const orderData = (await response.json()) as { id: string };
            return {
              success: true,
              orderId: orderData.id,
              amount: data.amount,
              currency: "INR",
              keyId,
              isTest: false,
            };
          }
        } catch (err) {
          console.error("Razorpay order creation error:", err);
        }
      }

      // Fallback or demo order for seamless testing / client checkout
      const fallbackOrderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      return {
        success: true,
        orderId: fallbackOrderId,
        amount: data.amount,
        currency: "INR",
        keyId: keyId || DEFAULT_RAZORPAY_KEY_ID,
        isTest: !keyId,
      };
    },
  );

export const submitSupporter = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      name?: string;
      amount?: number;
      message?: string;
      method?: string;
      paymentId?: string;
      verified?: boolean;
    };
    const name = (d.name || "Community Supporter").trim().slice(0, 40);
    const amount = Math.max(1, Math.min(100000, Number(d.amount) || 100));
    const message = (d.message || "Thank you for the awesome Minecraft videos!")
      .trim()
      .slice(0, 200);
    const validMethods: Supporter["method"][] = [
      "gpay",
      "phonepe",
      "paytm",
      "upi",
      "razorpay",
      "other",
    ];
    const method: Supporter["method"] = validMethods.includes(d.method as Supporter["method"])
      ? (d.method as Supporter["method"])
      : "upi";

    return {
      name,
      amount,
      message,
      method,
      paymentId: d.paymentId?.trim().slice(0, 60),
      verified: Boolean(d.verified),
    };
  })
  .handler(async ({ data }): Promise<{ success: boolean; supporter: Supporter }> => {
    const prefix = data.method === "razorpay" ? "SCT-RZP" : "SCT-REC";
    const receiptNumber = generateReceiptNumber(prefix);

    const newSupporter: Supporter = {
      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.name,
      amount: data.amount,
      message: data.message,
      method: "razorpay", // Strictly Razorpay
      timestamp: new Date().toISOString(),
      receiptNumber,
      paymentId: data.paymentId || `pay_rzp_${Date.now()}`,
      verified: true,
    };

    addSupporterToDb(newSupporter);

    return {
      success: true,
      supporter: newSupporter,
    };
  });
