import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { enumerateNights } from "@/lib/booking-engine";
import { requirePartnerContext } from "@/lib/partner-helper";

const BulkCalendarSchema = z.object({
  roomTypeId: z.number().int().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  availableUnits: z.number().int().min(0).max(200).nullable().optional(),
  priceOverrideMad: z.number().min(50).max(50000).nullable().optional(),
  minStay: z.number().int().min(1).max(30).optional().default(1),
  isBlackout: z.boolean().optional().default(false),
  note: z.string().max(150).optional().default(""),
});

export async function GET(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const url = new URL(req.url);
  const roomTypeId = Number(url.searchParams.get("roomTypeId"));
  const startDate = url.searchParams.get("startDate") || new Date().toISOString().slice(0, 10);
  const daysCount = Math.min(35, Math.max(7, Number(url.searchParams.get("days") || 21)));

  const db = getDb();
  const room = db
    .prepare(
      `SELECT rt.*, p.title AS property_title
       FROM room_types rt
       JOIN properties p ON p.id = rt.property_id
       WHERE rt.id = ? AND p.partner_id = ?`
    )
    .get(roomTypeId, ctx.partner.id) as { id: number; total_units: number; base_price_mad: number; name: string; property_title: string } | undefined;

  if (!room) return NextResponse.json({ error: "Room type not found" }, { status: 404 });

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(start.getTime() + daysCount * 86400000);
  const endDate = end.toISOString().slice(0, 10);
  const dates = enumerateNights(startDate, endDate);

  const overrides = db
    .prepare(`SELECT * FROM availability_overrides WHERE room_type_id = ? AND date >= ? AND date < ?`)
    .all(room.id, startDate, endDate) as Array<{
    date: string;
    available_units: number | null;
    price_override_mad: number | null;
    min_stay: number;
    is_blackout: number;
    note: string;
  }>;
  const ovMap = new Map(overrides.map((o) => [o.date, o]));

  const bookings = db
    .prepare(
      `SELECT check_in, check_out, units_booked FROM bookings
       WHERE room_type_id = ? AND check_in < ? AND check_out > ?
         AND status IN ('confirmed','pending','pending_payment')`
    )
    .all(room.id, endDate, startDate) as Array<{ check_in: string; check_out: string; units_booked: number }>;

  const calendar = dates.map((d) => {
    const ov = ovMap.get(d);
    const total = ov && ov.available_units !== null ? ov.available_units : room.total_units;
    const booked = bookings.filter((b) => b.check_in <= d && b.check_out > d).reduce((s, b) => s + b.units_booked, 0);
    return {
      date: d,
      totalUnits: total,
      bookedUnits: booked,
      remainingUnits: Math.max(0, total - booked),
      priceMad: ov && ov.price_override_mad !== null ? ov.price_override_mad : room.base_price_mad,
      minStay: ov?.min_stay ?? 1,
      isBlackout: Boolean(ov?.is_blackout),
      note: ov?.note || "",
    };
  });

  return NextResponse.json({ room, calendar });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const body = await req.json();
  const parsed = BulkCalendarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid calendar update payload" }, { status: 400 });
  }

  const db = getDb();
  const room = db
    .prepare(
      `SELECT rt.id FROM room_types rt JOIN properties p ON p.id = rt.property_id
       WHERE rt.id = ? AND p.partner_id = ?`
    )
    .get(parsed.data.roomTypeId, ctx.partner.id);
  if (!room) return NextResponse.json({ error: "Room type not found" }, { status: 404 });

  // Include endDate by advancing +1 day for enumerateNights
  const endInclusive = new Date(`${parsed.data.endDate}T00:00:00Z`);
  endInclusive.setUTCDate(endInclusive.getUTCDate() + 1);
  const dates = enumerateNights(parsed.data.startDate, endInclusive.toISOString().slice(0, 10));

  const stmt = db.prepare(
    `INSERT INTO availability_overrides (room_type_id, date, available_units, price_override_mad, min_stay, is_blackout, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(room_type_id, date) DO UPDATE SET
       available_units = excluded.available_units,
       price_override_mad = excluded.price_override_mad,
       min_stay = excluded.min_stay,
       is_blackout = excluded.is_blackout,
       note = excluded.note`
  );

  const tx = db.transaction(() => {
    for (const d of dates) {
      stmt.run(
        parsed.data.roomTypeId,
        d,
        parsed.data.availableUnits ?? null,
        parsed.data.priceOverrideMad ?? null,
        parsed.data.minStay,
        parsed.data.isBlackout ? 1 : 0,
        parsed.data.note
      );
    }
  });
  tx();

  return NextResponse.json({ ok: true, daysUpdated: dates.length });
}
