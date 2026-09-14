import { createServerFn } from "@tanstack/react-start";

export type Supporter = {
  id: string;
  name: string;
  amount: number;
  message: string;
  method: "gpay" | "phonepe" | "paytm" | "upi" | "other";
  timestamp: string;
  tier: "diamond" | "gold" | "iron" | "emerald";
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
  };
};

const DEFAULT_UPI_ID = "santhoshkumarshasc@oksbi";
const DEFAULT_PAYEE_NAME = "SodaCraft Tamil";
const MONTHLY_GOAL = 15000;

export type QrSession = {
  id: string;
  amount: number;
  note: string;
  status: "waiting" | "scanned" | "completed";
  createdAt: string;
  scannedAt?: string;
  scannedDeviceInfo?: string;
  supporter?: Supporter;
  utr?: string;
};

// In-memory active QR sessions (auto-expires after 2 hours)
const qrSessions = new Map<string, QrSession>();

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of qrSessions.entries()) {
    if (now - new Date(session.createdAt).getTime() > 1000 * 60 * 60 * 2) {
      qrSessions.delete(id);
    }
  }
}

// Empty list by default - real live community supporters only
const INITIAL_SUPPORTERS: Supporter[] = [];

let inMemorySupporters: Supporter[] = [...INITIAL_SUPPORTERS];

export function determineTier(amount: number): "diamond" | "gold" | "iron" | "emerald" {
  if (amount >= 500) return "diamond";
  if (amount >= 200) return "gold";
  if (amount >= 100) return "iron";
  return "emerald";
}

function calculateStats(supporters: Supporter[]): SupportStats {
  const totalSupporters = supporters.length;
  const totalAmountRaised = supporters.reduce((sum, s) => sum + s.amount, 0);
  const goalProgressPercent = Math.min(100, Math.round((totalAmountRaised / MONTHLY_GOAL) * 100));

  let topSupporter: Supporter | null = null;
  if (supporters.length > 0) {
    topSupporter = [...supporters].sort((a, b) => b.amount - a.amount)[0];
  }

  return {
    totalSupporters,
    totalAmountRaised,
    monthlyGoal: MONTHLY_GOAL,
    goalProgressPercent,
    topSupporter,
  };
}

export const getSupportData = createServerFn({ method: "GET" }).handler(
  async (): Promise<SupportPayload> => {
    return {
      supporters: inMemorySupporters,
      stats: calculateStats(inMemorySupporters),
      upiConfig: {
        upiId: process.env.CREATOR_UPI_ID || DEFAULT_UPI_ID,
        payeeName: process.env.CREATOR_PAYEE_NAME || DEFAULT_PAYEE_NAME,
        note: "Support SodaCraft Tamil Gaming",
      },
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
    };
    const name = (d.name || "Anonymous Gamer").trim().slice(0, 40);
    const amount = Math.max(1, Math.min(100000, Number(d.amount) || 50));
    const message = (d.message || "Keep up the awesome content!").trim().slice(0, 200);
    const validMethods: Supporter["method"][] = ["gpay", "phonepe", "paytm", "upi", "other"];
    const method: Supporter["method"] = validMethods.includes(d.method as Supporter["method"])
      ? (d.method as Supporter["method"])
      : "upi";

    return { name, amount, message, method };
  })
  .handler(async ({ data }): Promise<{ success: boolean; supporter: Supporter }> => {
    const newSupporter: Supporter = {
      id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: data.name,
      amount: data.amount,
      message: data.message,
      method: data.method,
      timestamp: new Date().toISOString(),
      tier: determineTier(data.amount),
    };

    // Prepend to in-memory list
    inMemorySupporters = [newSupporter, ...inMemorySupporters];

    return {
      success: true,
      supporter: newSupporter,
    };
  });

export const initQrSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { sessionId?: string; amount?: number; note?: string };
    const sessionId = (d.sessionId || `SCT-${Math.floor(1000 + Math.random() * 9000)}`).trim();
    const amount = Math.max(1, Number(d.amount) || 100);
    const note = (d.note || "Support SodaCraft Tamil").trim();
    return { sessionId, amount, note };
  })
  .handler(async ({ data }): Promise<{ session: QrSession }> => {
    cleanupExpiredSessions();
    const existing = qrSessions.get(data.sessionId);
    if (existing && existing.status !== "completed") {
      existing.amount = data.amount;
      return { session: existing };
    }

    const session: QrSession = {
      id: data.sessionId,
      amount: data.amount,
      note: data.note,
      status: "waiting",
      createdAt: new Date().toISOString(),
    };
    qrSessions.set(session.id, session);
    return { session };
  });

export const getQrSessionStatus = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const d = data as { sessionId?: string };
    return { sessionId: (d?.sessionId || "").trim() };
  })
  .handler(async ({ data }): Promise<{ session: QrSession | null }> => {
    cleanupExpiredSessions();
    if (!data.sessionId) return { session: null };
    const session = qrSessions.get(data.sessionId) || null;
    return { session };
  });

export const reportQrScanned = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { sessionId: string; deviceInfo?: string };
    return {
      sessionId: (d.sessionId || "").trim(),
      deviceInfo: (d.deviceInfo || "Mobile Browser").slice(0, 80),
    };
  })
  .handler(async ({ data }): Promise<{ success: boolean; session: QrSession | null }> => {
    if (!data.sessionId) return { success: false, session: null };
    const session = qrSessions.get(data.sessionId);
    if (!session) return { success: false, session: null };

    if (session.status === "waiting") {
      session.status = "scanned";
      session.scannedAt = new Date().toISOString();
      session.scannedDeviceInfo = data.deviceInfo;
    }
    return { success: true, session };
  });

export const completeQrSession = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      sessionId: string;
      name?: string;
      amount?: number;
      message?: string;
      method?: string;
      utr?: string;
    };
    return {
      sessionId: (d.sessionId || "").trim(),
      name: (d.name || "Gamer").trim().slice(0, 40),
      amount: Math.max(1, Number(d.amount) || 100),
      message: (d.message || "Thank you for the awesome videos!").trim().slice(0, 200),
      method: (d.method || "gpay") as Supporter["method"],
      utr: (d.utr || "").trim().slice(0, 30),
    };
  })
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; supporter: Supporter; session: QrSession | null }> => {
      const supporter: Supporter = {
        id: `sup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: data.name,
        amount: data.amount,
        message: data.message,
        method: data.method,
        timestamp: new Date().toISOString(),
        tier: determineTier(data.amount),
      };

      inMemorySupporters = [supporter, ...inMemorySupporters];

      const session = qrSessions.get(data.sessionId);
      if (session) {
        session.status = "completed";
        session.supporter = supporter;
        session.amount = data.amount;
        if (data.utr) session.utr = data.utr;
      }

      return {
        success: true,
        supporter,
        session: session || null,
      };
    },
  );
