import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hashPassword, logAudit, verifyPassword } from "@/lib/auth";
import { sanitizeString } from "@/lib/security";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const db = getDb();
  const partner = db.prepare(`SELECT id, business_name, verification_status FROM partners WHERE user_id = ?`).get(user.id);
  const affiliate = db.prepare(`SELECT id, code, status, total_earned_mad FROM affiliates WHERE user_id = ?`).get(user.id);
  const referrals = db.prepare(`SELECT * FROM referrals WHERE referrer_user_id = ?`).all(user.id);
  const unreadNotifications = (
    db.prepare(`SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0`).get(user.id) as { cnt: number }
  ).cnt;

  return NextResponse.json({
    user,
    partner: partner || null,
    affiliate: affiliate || null,
    referrals,
    unreadNotifications,
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  if (body.action === "change_password") {
    const currentRow = db.prepare(`SELECT password_hash FROM users WHERE id = ?`).get(user.id) as { password_hash: string };
    if (!verifyPassword(String(body.currentPassword || ""), currentRow.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (String(body.newPassword || "").length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      hashPassword(String(body.newPassword)),
      user.id
    );
    logAudit(user.id, "user.password_changed", "user", user.id, {});
    return NextResponse.json({ ok: true });
  }

  const fullName = body.full_name ? sanitizeString(body.full_name, 100) : user.full_name;
  const phone = body.phone !== undefined ? sanitizeString(body.phone, 40) : user.phone;
  const preferredLang = ["en", "fr", "ar"].includes(body.preferred_lang) ? body.preferred_lang : user.preferred_lang;
  const preferredCurrency = ["MAD", "EUR", "USD"].includes(body.preferred_currency)
    ? body.preferred_currency
    : user.preferred_currency;

  db.prepare(
    `UPDATE users
     SET full_name = ?, phone = ?, preferred_lang = ?, preferred_currency = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(fullName, phone, preferredLang, preferredCurrency, user.id);

  logAudit(user.id, "user.profile_updated", "user", user.id, { preferredLang, preferredCurrency });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  db.prepare(`UPDATE users SET status = 'suspended', updated_at = datetime('now') WHERE id = ?`).run(user.id);
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(user.id);
  logAudit(user.id, "user.self_deactivated", "user", user.id, {});
  return NextResponse.json({ ok: true });
}
