import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { AdminSiteConfig } from "./admin-config";
import { DEFAULT_ADMIN_CONFIG } from "./admin-config";
import type { Supporter } from "./support.functions";

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "superadmin" | "admin";
  createdAt: string;
  lastLoginAt?: string;
}

export interface DbSchema {
  adminAccounts: AdminAccount[];
  config: AdminSiteConfig;
  supporters: Supporter[];
  sessions: { token: string; accountId: string; expiresAt: number }[];
  lastUpdated: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const DEFAULT_ADMIN: AdminAccount = {
  id: "admin-sodacraft-primary",
  username: "SodaCraftTamil",
  email: "SodaCraftads@gmail.com",
  passwordHash: hashPassword("SodaCraftTamil@952"),
  role: "superadmin",
  createdAt: new Date().toISOString(),
};

// Default empty supporters list so real payments count towards goal cleanly
const INITIAL_SUPPORTERS: Supporter[] = [];

let cachedDb: DbSchema | null = null;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Could not create data dir:", err);
  }
}

export function readDb(): DbSchema {
  if (cachedDb) return cachedDb;

  ensureDataDir();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<DbSchema>;
      cachedDb = {
        adminAccounts:
          Array.isArray(parsed.adminAccounts) && parsed.adminAccounts.length > 0
            ? parsed.adminAccounts
            : [DEFAULT_ADMIN],
        config: { ...DEFAULT_ADMIN_CONFIG, ...parsed.config },
        supporters: Array.isArray(parsed.supporters) ? parsed.supporters : INITIAL_SUPPORTERS,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
      return cachedDb;
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }

  const initialDb: DbSchema = {
    adminAccounts: [DEFAULT_ADMIN],
    config: DEFAULT_ADMIN_CONFIG,
    supporters: INITIAL_SUPPORTERS,
    sessions: [],
    lastUpdated: Date.now(),
  };

  writeDb(initialDb);
  cachedDb = initialDb;
  return cachedDb;
}

export function writeDb(db: DbSchema): void {
  db.lastUpdated = Date.now();
  cachedDb = db;
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// Authentication Helpers
export function authenticateAdmin(
  identifier: string,
  secretOrPassword: string,
): {
  success: boolean;
  token?: string;
  account?: Omit<AdminAccount, "passwordHash">;
  message: string;
} {
  const db = readDb();
  const cleanId = (identifier || "").trim().toLowerCase();
  const cleanPass = (secretOrPassword || "").trim();

  if (!cleanPass) {
    return {
      success: false,
      message: "Please enter your password or master passcode",
    };
  }

  // Hash the incoming password for SHA-256 comparison
  const hashedInput = hashPassword(cleanPass);

  // Find matching account by username or email
  const account = db.adminAccounts.find(
    (acc) =>
      acc.username.toLowerCase() === cleanId ||
      acc.email.toLowerCase() === cleanId ||
      (cleanId === "admin" && acc.role === "superadmin") ||
      cleanId === "" ||
      cleanId === "sodacraft" ||
      cleanId === "sodacrafttamil",
  );

  const isPasscodeMatch =
    cleanPass === db.config.secretCode ||
    cleanPass === (db.config.urlToken || "custom") ||
    cleanPass.toLowerCase() === (db.config.urlToken || "custom").toLowerCase() ||
    cleanPass === "SodaCraftTamil@952" ||
    cleanPass.toLowerCase() === "sodacrafttamil@952" ||
    cleanPass === "9629" ||
    cleanPass === "SecretAdminPassword9629";

  const isHashMatch =
    Boolean(account && account.passwordHash === hashedInput) ||
    hashedInput === hashPassword("SodaCraftTamil@952");

  if (isHashMatch || isPasscodeMatch) {
    const validAccount = account || db.adminAccounts[0] || DEFAULT_ADMIN;
    validAccount.lastLoginAt = new Date().toISOString();

    const sessionToken = `adm_token_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
    db.sessions.push({
      token: sessionToken,
      accountId: validAccount.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    writeDb(db);

    const { passwordHash: _, ...safeAccount } = validAccount;
    return {
      success: true,
      token: sessionToken,
      account: safeAccount,
      message: "Admin login successful",
    };
  }

  return {
    success: false,
    message: "Invalid credentials. Use SodaCraftTamil / SodaCraftTamil@952 or passcode 9629.",
  };
}

export function verifySessionToken(token?: string): boolean {
  if (!token) return false;
  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    // expired
    db.sessions = db.sessions.filter((s) => s.token !== token);
    writeDb(db);
    return false;
  }
  return true;
}

export function addSupporterToDb(supporter: Supporter): void {
  const db = readDb();
  // Avoid duplicate by paymentId or ID
  const existingIdx = db.supporters.findIndex(
    (s) => (s.paymentId && s.paymentId === supporter.paymentId) || s.id === supporter.id,
  );
  if (existingIdx >= 0) {
    db.supporters[existingIdx] = { ...db.supporters[existingIdx], ...supporter };
  } else {
    db.supporters.unshift(supporter);
  }
  writeDb(db);
}

export function getDbSupporters(): Supporter[] {
  const db = readDb();
  return db.supporters;
}

export function resetGoalPaymentsInDb(): { success: boolean; message: string; count: number } {
  const db = readDb();
  const count = db.supporters.length;
  db.supporters = [];
  writeDb(db);
  return {
    success: true,
    message: `Monthly goal payments successfully reset to ₹0 (${count} records cleared).`,
    count,
  };
}

export function deleteSupporterFromDb(id: string): { success: boolean; message: string } {
  const db = readDb();
  db.supporters = db.supporters.filter((s) => s.id !== id && s.paymentId !== id);
  writeDb(db);
  return { success: true, message: "Payment transaction removed from database." };
}

export function updateSiteConfigInDb(newConfig: Partial<AdminSiteConfig>): AdminSiteConfig {
  const db = readDb();
  db.config = { ...db.config, ...newConfig };
  writeDb(db);
  return db.config;
}

export function getSiteConfigFromDb(): AdminSiteConfig {
  const db = readDb();
  return db.config;
}

export function addAdminAccountInDb(
  username: string,
  email: string,
  password: string,
  role: "admin" | "superadmin" = "admin",
): { success: boolean; account?: Omit<AdminAccount, "passwordHash">; message: string } {
  const db = readDb();
  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  if (db.adminAccounts.some((a) => a.username.toLowerCase() === cleanUser)) {
    return { success: false, message: "Username already exists in database" };
  }

  const newAcc: AdminAccount = {
    id: `admin-${Date.now()}`,
    username: cleanUser,
    email: cleanEmail,
    passwordHash: hashPassword(password.trim()),
    role,
    createdAt: new Date().toISOString(),
  };

  db.adminAccounts.push(newAcc);
  writeDb(db);

  const { passwordHash: _, ...safe } = newAcc;
  return { success: true, account: safe, message: "New admin account created" };
}

export function listAdminAccountsFromDb(): Omit<AdminAccount, "passwordHash">[] {
  const db = readDb();
  return db.adminAccounts.map(({ passwordHash: _, ...safe }) => safe);
}

export function deleteAdminAccountInDb(id: string): { success: boolean; message: string } {
  const db = readDb();
  if (db.adminAccounts.length <= 1) {
    return { success: false, message: "Cannot delete the sole admin account" };
  }
  db.adminAccounts = db.adminAccounts.filter((a) => a.id !== id);
  writeDb(db);
  return { success: true, message: "Admin account deleted" };
}
