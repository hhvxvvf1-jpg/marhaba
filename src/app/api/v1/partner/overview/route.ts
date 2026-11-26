import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { requirePartnerContext } from "@/lib/partner-helper";
import { sanitizeString } from "@/lib/security";

export async function GET() {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const db = getDb();
  const partnerId = ctx.partner.id as number;

  const stats = db
    .prepare(
      `SELECT
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN status IN ('confirmed','completed') THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN status IN ('pending','pending_payment') THEN 1 ELSE 0 END) AS pending_bookings,
        SUM(CASE WHEN status IN ('cancelled','refunded','partially_refunded') THEN 1 ELSE 0 END) AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN total_mad ELSE 0 END), 0) AS gross_revenue_mad,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN commission_mad ELSE 0 END), 0) AS commission_mad,
        COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN partner_net_mad ELSE 0 END), 0) AS net_revenue_mad
       FROM bookings
       WHERE partner_id = ?`
    )
    .get(partnerId);

  const propertyCount = (
    db.prepare(`SELECT COUNT(*) AS cnt FROM properties WHERE partner_id = ?`).get(partnerId) as { cnt: number }
  ).cnt;

  const totalUnits = (
    db
      .prepare(
        `SELECT COALESCE(SUM(rt.total_units), 0) AS units
         FROM room_types rt JOIN properties p ON p.id = rt.property_id
         WHERE p.partner_id = ?`
      )
      .get(partnerId) as { units: number }
  ).units;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingArrivals = db
    .prepare(
      `SELECT b.*, p.title AS property_title, rt.name AS room_name
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN room_types rt ON rt.id = b.room_type_id
       WHERE b.partner_id = ? AND b.status IN ('confirmed','pending') AND b.check_in >= ?
       ORDER BY b.check_in ASC
       LIMIT 10`
    )
    .all(partnerId, today);

  const upcomingDepartures = db
    .prepare(
      `SELECT b.*, p.title AS property_title, rt.name AS room_name
       FROM bookings b
       JOIN properties p ON p.id = b.property_id
       JOIN room_types rt ON rt.id = b.room_type_id
       WHERE b.partner_id = ? AND b.status = 'confirmed' AND b.check_out >= ?
       ORDER BY b.check_out ASC
       LIMIT 10`
    )
    .all(partnerId, today);

  const payableSummary = db
    .prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN entry_type = 'partner_payable' AND direction = 'credit' THEN amount_mad ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN entry_type IN ('partner_payable','payout') AND direction = 'debit' THEN amount_mad ELSE 0 END), 0) AS available_balance_mad,
        COALESCE(SUM(CASE WHEN entry_type = 'payout' AND direction = 'debit' THEN amount_mad ELSE 0 END), 0) AS total_paid_out_mad
       FROM ledger_entries
       WHERE partner_id = ?`
    )
    .get(partnerId);

  return NextResponse.json({
    partner: ctx.partner,
    stats,
    propertyCount,
    totalUnits,
    upcomingArrivals,
    upcomingDepartures,
    payableSummary,
  });
}

export async function POST(req: Request) {
  ensureSeeded();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM partners WHERE user_id = ?`).get(user.id);
  if (existing) return NextResponse.json({ error: "Partner profile already exists" }, { status: 409 });

  const businessName = sanitizeString(body.businessName, 120);
  const city = sanitizeString(body.city || "Marrakech", 80);
  if (!businessName) return NextResponse.json({ error: "Business name is required" }, { status: 400 });

  const res = db
    .prepare(
      `INSERT INTO partners (user_id, business_name, ice_number, contact_email, contact_phone, city, rib_iban, verification_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      user.id,
      businessName,
      sanitizeString(body.taxIdIce || "", 40),
      user.email,
      user.phone || "+212600000000",
      city,
      sanitizeString(body.ribIban || "", 60)
    );

  if (user.role === "traveler") {
    db.prepare(`UPDATE users SET role = 'partner_owner', updated_at = datetime('now') WHERE id = ?`).run(user.id);
  }
  logAudit(user.id, "partner.onboarded", "partner", Number(res.lastInsertRowid), { businessName, city });
  return NextResponse.json({ id: Number(res.lastInsertRowid), verification_status: "pending" }, { status: 201 });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const body = await req.json();
  const db = getDb();
  db.prepare(
    `UPDATE partners
     SET business_name = COALESCE(?, business_name),
         contact_phone = COALESCE(?, contact_phone),
         address = COALESCE(?, address),
         bank_name = COALESCE(?, bank_name),
         rib_iban = COALESCE(?, rib_iban),
         payout_schedule = COALESCE(?, payout_schedule),
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    body.business_name ?? null,
    body.contact_phone ?? null,
    body.address ?? null,
    body.bank_name ?? null,
    body.rib_iban ?? null,
    body.payout_schedule ?? null,
    ctx.partner.id
  );
  return NextResponse.json({ ok: true });
}
