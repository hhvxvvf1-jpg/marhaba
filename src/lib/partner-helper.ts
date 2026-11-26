import { getDb } from "@/db";
import { getCurrentUser, isAdminRole, isPartnerRole } from "./auth";

export async function requirePartnerContext() {
  const user = await getCurrentUser();
  if (!user || !isPartnerRole(user.role)) {
    return { error: "Partner access required", status: 403 as const, user: null, partner: null };
  }
  const db = getDb();
  let partner = db.prepare(`SELECT * FROM partners WHERE user_id = ?`).get(user.id) as Record<string, unknown> | undefined;
  if (!partner && isAdminRole(user.role)) {
    partner = db.prepare(`SELECT * FROM partners ORDER BY id ASC LIMIT 1`).get() as Record<string, unknown> | undefined;
  }
  if (!partner) {
    return { error: "Partner profile not found", status: 404 as const, user, partner: null };
  }
  return { error: null, status: 200 as const, user, partner };
}
