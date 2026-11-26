import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, hasPermission, logAudit } from "@/lib/auth";

export async function GET() {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || (!hasPermission(user.role, "admin:finance") && !hasPermission(user.role, "admin:commissions"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const payouts = db
    .prepare(
      `SELECT po.*, pa.business_name, pa.bank_name, pa.rib_iban
       FROM payouts po
       JOIN partners pa ON pa.id = po.partner_id
       ORDER BY po.created_at DESC`
    )
    .all();

  const ledger = db
    .prepare(
      `SELECT le.*, pa.business_name
       FROM ledger_entries le
       LEFT JOIN partners pa ON pa.id = le.partner_id
       ORDER BY le.created_at DESC
       LIMIT 100`
    )
    .all();

  const promotions = db.prepare(`SELECT * FROM promotions ORDER BY created_at DESC`).all();
  const commissionSetting = db.prepare(`SELECT value_json FROM system_settings WHERE key = 'default_commission_pct'`).get() as
    | { value_json: string }
    | undefined;

  return NextResponse.json({
    payouts,
    ledger,
    promotions,
    defaultCommissionPct: commissionSetting ? JSON.parse(commissionSetting.value_json) : 15,
  });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user || (!hasPermission(user.role, "admin:finance") && !hasPermission(user.role, "admin:commissions"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = getDb();

  if (body.action === "update_default_commission") {
    const pct = Math.max(0, Math.min(40, Number(body.commissionPct)));
    db.prepare(`INSERT OR REPLACE INTO system_settings (key, value_json, updated_at) VALUES ('default_commission_pct', ?, datetime('now'))`).run(
      JSON.stringify(pct)
    );
    logAudit(user.id, "admin.commission_updated", "system_settings", "default_commission_pct", { pct });
    return NextResponse.json({ ok: true, defaultCommissionPct: pct });
  }

  if (body.action === "update_payout") {
    const payoutId = Number(body.payoutId);
    const status = String(body.status);
    db.prepare(
      `UPDATE payouts
       SET status = ?, bank_reference = COALESCE(?, bank_reference), approved_by_user_id = ?,
           paid_at = CASE WHEN ? = 'paid' THEN datetime('now') ELSE paid_at END
       WHERE id = ?`
    ).run(status, body.bankReference ?? null, user.id, status, payoutId);
    logAudit(user.id, "admin.payout_updated", "payout", payoutId, { status, bankReference: body.bankReference });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "create_promotion") {
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Promo code required" }, { status: 400 });
    db.prepare(
      `INSERT INTO promotions (code, name, discount_pct, discount_fixed_mad, min_booking_mad, valid_from, valid_to, category_filter, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(
      code,
      String(body.name || code),
      Number(body.discountPct || 10),
      Number(body.discountFixedMad || 0),
      Number(body.minBookingMad || 0),
      body.validFrom || "2026-01-01",
      body.validTo || "2027-12-31",
      body.categoryFilter || ""
    );
    logAudit(user.id, "admin.promotion_created", "promotion", code, body);
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
