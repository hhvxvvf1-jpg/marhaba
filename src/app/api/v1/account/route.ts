import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hashPassword, logAudit, verifyPassword } from "@/lib/auth";
import { sanitizeString } from "@/lib/security";

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().max(40).optional(),
  preferredLang: z.enum(["ar", "fr", "en", "es", "de", "it", "pt"]).optional(),
  preferredCurrency: z.enum(["MAD", "EUR", "USD"]).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
});

export async function PATCH(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile fields." }, { status: 400 });
  }

  const db = getDb();

  if (parsed.data.newPassword) {
    const row = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(user.id) as { password_hash: string } | undefined;
    if (!row || !parsed.data.currentPassword || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    const nextHash = hashPassword(parsed.data.newPassword);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(nextHash, user.id);
    logAudit(user.id, "account.password_changed", "user", user.id);
  }

  db.prepare(
    `UPDATE users
     SET full_name = COALESCE(?, full_name),
         phone = COALESCE(?, phone),
         preferred_lang = COALESCE(?, preferred_lang),
         preferred_currency = COALESCE(?, preferred_currency),
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    parsed.data.fullName ? sanitizeString(parsed.data.fullName, 100) : null,
    parsed.data.phone !== undefined ? sanitizeString(parsed.data.phone, 40) : null,
    parsed.data.preferredLang ?? null,
    parsed.data.preferredCurrency ?? null,
    user.id
  );

  logAudit(user.id, "account.profile_updated", "user", user.id);
  return NextResponse.json({ ok: true, message: "Profile updated successfully." });
}

export async function DELETE() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role === "super_admin") {
    return NextResponse.json({ error: "Super Admin accounts cannot be deleted via self-service." }, { status: 403 });
  }

  const db = getDb();
  // Anonymize personal info while preserving financial/audit integrity
  const anonEmail = `deleted-${user.id}-${Date.now()}@deleted.marhaba.local`;
  db.prepare(
    `UPDATE users
     SET email = ?, full_name = 'Deleted User', phone = '', password_hash = 'DELETED', status = 'suspended', updated_at = datetime('now')
     WHERE id = ?`
  ).run(anonEmail, user.id);
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(user.id);
  logAudit(user.id, "account.deleted", "user", user.id);

  const res = NextResponse.json({ ok: true, message: "Account anonymized and signed out." });
  res.cookies.delete("marhaba_session");
  return res;
}
