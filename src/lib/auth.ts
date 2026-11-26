import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { getDb } from "@/db";
import { getSessionSecret } from "./config";

export type UserRole =
  | "traveler"
  | "partner_owner"
  | "partner_manager"
  | "partner_staff"
  | "affiliate"
  | "support"
  | "finance"
  | "content_manager"
  | "admin"
  | "super_admin";

export interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  role: UserRole;
  status: string;
  email_verified: number;
  preferred_lang: string;
  preferred_currency: string;
  loyalty_points: number;
  referral_code: string | null;
}

export const SESSION_COOKIE_NAME = "marhaba_session";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, "hex");
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function hashSessionToken(token: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

export function createSession(userId: number, ip = "", ua = ""): { token: string; expiresAt: string } {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days
  const expiresAt = expires.toISOString();
  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`
  ).run(userId, tokenHash, expiresAt, ip, ua);
  return { token, expiresAt };
}

export function revokeSession(token: string) {
  const db = getDb();
  const tokenHash = hashSessionToken(token);
  db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
}

export function getUserFromToken(token: string | undefined | null): AuthUser | null {
  if (!token) return null;
  const db = getDb();
  const tokenHash = hashSessionToken(token);
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.role, u.status,
              u.email_verified, u.preferred_lang, u.preferred_currency, u.loyalty_points, u.referral_code,
              s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as (AuthUser & { expires_at: string }) | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
    return null;
  }
  if (row.status !== "active") return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    role: row.role,
    status: row.status,
    email_verified: row.email_verified,
    preferred_lang: row.preferred_lang,
    preferred_currency: row.preferred_currency,
    loyalty_points: row.loyalty_points,
    referral_code: row.referral_code,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const headerStore = await headers();
      const headerToken = headerStore.get("x-marhaba-session");
      const authHeader = headerStore.get("authorization");
      if (headerToken) {
        token = headerToken.trim();
      } else if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
      }
    }
    return getUserFromToken(token);
  } catch {
    return null;
  }
}

export function isAdminRole(role: string): boolean {
  return ["super_admin", "admin", "support", "finance", "content_manager"].includes(role);
}

export function isPartnerRole(role: string): boolean {
  return ["partner_owner", "partner_manager", "partner_staff", "admin", "super_admin"].includes(role);
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const matrix: Record<UserRole, string[]> = {
    super_admin: ["*"],
    admin: [
      "admin:read", "admin:users", "admin:properties", "admin:bookings",
      "admin:commissions", "admin:cms", "admin:support", "admin:settings",
      "partner:portal", "traveler:book"
    ],
    finance: ["admin:read", "admin:finance", "admin:payouts", "admin:commissions", "admin:bookings"],
    support: ["admin:read", "admin:support", "admin:bookings", "admin:users"],
    content_manager: ["admin:read", "admin:cms", "admin:properties"],
    partner_owner: ["partner:portal", "partner:finance", "partner:properties", "partner:bookings", "traveler:book"],
    partner_manager: ["partner:portal", "partner:properties", "partner:bookings", "traveler:book"],
    partner_staff: ["partner:portal", "partner:bookings", "traveler:book"],
    affiliate: ["affiliate:portal", "traveler:book"],
    traveler: ["traveler:book"],
  };
  const perms = matrix[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

export function logAudit(
  actorUserId: number | null,
  action: string,
  entityType: string,
  entityId: string | number,
  details: Record<string, unknown> = {},
  ip = ""
) {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(actorUserId, action, entityType, String(entityId), JSON.stringify(details), ip);
  } catch {
    // non-fatal
  }
}
