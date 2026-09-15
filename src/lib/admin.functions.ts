import { createServerFn } from "@tanstack/react-start";
import {
  authenticateAdmin,
  verifySessionToken,
  getSiteConfigFromDb,
  updateSiteConfigInDb,
  getDbSupporters,
  resetGoalPaymentsInDb,
  deleteSupporterFromDb,
  listAdminAccountsFromDb,
  addAdminAccountInDb,
  deleteAdminAccountInDb,
  type AdminAccount,
} from "./db.server";
import type { AdminSiteConfig } from "./admin-config";
import type { Supporter } from "./support.functions";

export const adminLoginAccountFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      identifier?: string;
      secret?: string;
      passwordOrPasscode?: string;
      password?: string;
    };
    return {
      identifier: (d.identifier || "admin").trim(),
      secret: (d.secret || d.passwordOrPasscode || d.password || "").trim(),
    };
  })
  .handler(async ({ data }) => {
    return authenticateAdmin(data.identifier, data.secret);
  });

export const getDbConfigFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSiteConfig> => {
    return getSiteConfigFromDb();
  },
);

export const saveDbConfigFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string; config: Partial<AdminSiteConfig> };
    return {
      token: d.token || "",
      config: d.config,
    };
  })
  .handler(async ({ data }) => {
    if (!verifySessionToken(data.token)) {
      throw new Error("Unauthorized: Invalid admin session token");
    }
    const updated = updateSiteConfigInDb(data.config);
    return { success: true, config: updated };
  });

export const getAdminAccountsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string };
    return { token: d.token || "" };
  })
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; accounts: Omit<AdminAccount, "passwordHash">[] }> => {
      if (!verifySessionToken(data.token)) {
        throw new Error("Unauthorized: Invalid admin session token");
      }
      return {
        success: true,
        accounts: listAdminAccountsFromDb(),
      };
    },
  );

export const createAdminAccountFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as {
      token?: string;
      username: string;
      email: string;
      password: string;
      role?: "admin" | "superadmin";
    };
    return {
      token: d.token || "",
      username: (d.username || "").trim(),
      email: (d.email || "").trim(),
      password: (d.password || "").trim(),
      role: d.role || "admin",
    };
  })
  .handler(async ({ data }) => {
    if (!verifySessionToken(data.token)) {
      throw new Error("Unauthorized: Invalid admin session token");
    }
    if (!data.username || !data.password) {
      return { success: false, message: "Username and password are required" };
    }
    return addAdminAccountInDb(data.username, data.email, data.password, data.role);
  });

export const deleteAdminAccountFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string; accountId: string };
    return {
      token: d.token || "",
      accountId: d.accountId,
    };
  })
  .handler(async ({ data }) => {
    if (!verifySessionToken(data.token)) {
      throw new Error("Unauthorized: Invalid admin session token");
    }
    return deleteAdminAccountInDb(data.accountId);
  });

export const getAdminPaymentsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string };
    return { token: d.token || "" };
  })
  .handler(async ({ data }): Promise<{ success: boolean; supporters: Supporter[] }> => {
    if (!verifySessionToken(data.token)) {
      throw new Error("Unauthorized: Invalid admin session token");
    }
    return {
      success: true,
      supporters: getDbSupporters(),
    };
  });

export const resetGoalPaymentsFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string };
    return { token: d.token || "" };
  })
  .handler(async ({ data }): Promise<{ success: boolean; message: string; count: number }> => {
    if (!verifySessionToken(data.token)) {
      throw new Error("Unauthorized: Invalid admin session token");
    }
    return resetGoalPaymentsInDb();
  });

export const deletePaymentFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const d = data as { token?: string; paymentId: string };
    return {
      token: d.token || "",
      paymentId: (d.paymentId || "").trim(),
    };
  })
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    if (!verifySessionToken(data.token)) {
      throw new Error("Unauthorized: Invalid admin session token");
    }
    if (!data.paymentId) {
      return { success: false, message: "Payment ID is required" };
    }
    return deleteSupporterFromDb(data.paymentId);
  });
