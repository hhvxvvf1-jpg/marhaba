import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { requirePartnerContext } from "@/lib/partner-helper";

const RuleSchema = z.object({
  propertyId: z.number().int().positive(),
  name: z.string().min(2).max(100),
  ruleType: z.enum(["seasonal", "weekend", "holiday", "long_stay", "early_bird", "last_minute"]),
  adjustmentPct: z.number().min(-70).max(200).default(0),
  adjustmentFixedMad: z.number().min(-2000).max(5000).default(0),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  minNights: z.number().int().min(1).max(30).nullable().optional(),
  daysBeforeCheckin: z.number().int().min(1).max(365).nullable().optional(),
});

export async function GET() {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const db = getDb();
  const rules = db
    .prepare(
      `SELECT pr.*, p.title AS property_title
       FROM pricing_rules pr
       LEFT JOIN properties p ON p.id = pr.property_id
       WHERE pr.partner_id = ?
       ORDER BY pr.created_at DESC`
    )
    .all(ctx.partner.id);
  return NextResponse.json({ rules });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const body = await req.json();
  const parsed = RuleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid rule data" }, { status: 400 });

  const db = getDb();
  const prop = db.prepare(`SELECT id FROM properties WHERE id = ? AND partner_id = ?`).get(parsed.data.propertyId, ctx.partner.id);
  if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const res = db
    .prepare(
      `INSERT INTO pricing_rules (property_id, partner_id, name, rule_type, adjustment_pct, adjustment_fixed_mad, start_date, end_date, min_nights, days_before_checkin, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    )
    .run(
      parsed.data.propertyId,
      ctx.partner.id,
      parsed.data.name,
      parsed.data.ruleType,
      parsed.data.adjustmentPct,
      parsed.data.adjustmentFixedMad,
      parsed.data.startDate ?? null,
      parsed.data.endDate ?? null,
      parsed.data.minNights ?? null,
      parsed.data.daysBeforeCheckin ?? null
    );
  return NextResponse.json({ id: Number(res.lastInsertRowid), ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  const db = getDb();
  db.prepare(`DELETE FROM pricing_rules WHERE id = ? AND partner_id = ?`).run(id, ctx.partner.id);
  return NextResponse.json({ ok: true });
}
