import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { logAudit } from "@/lib/auth";
import { requirePartnerContext } from "@/lib/partner-helper";
import { sanitizeString } from "@/lib/security";

const CreatePropertySchema = z.object({
  title: z.string().min(3).max(120),
  category: z.enum(["hotel", "riad", "resort", "apartment", "villa", "guesthouse", "car", "experience", "restaurant"]),
  city: z.string().min(2).max(60),
  address: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  basePriceMad: z.number().min(50).max(50000),
  cancellationPolicy: z.enum(["flexible", "moderate", "strict"]).default("flexible"),
  amenities: z.array(z.string()).default(["Wi-Fi", "Air conditioning"]),
  roomName: z.string().min(2).max(100).default("Standard Suite"),
  totalUnits: z.number().int().min(1).max(200).default(3),
  maxAdults: z.number().int().min(1).max(16).default(2),
});

export async function GET() {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const db = getDb();
  const properties = db
    .prepare(`SELECT * FROM properties WHERE partner_id = ? ORDER BY created_at DESC`)
    .all(ctx.partner.id) as Array<Record<string, unknown>>;

  const enriched = properties.map((p) => ({
    ...p,
    rooms: db.prepare(`SELECT * FROM room_types WHERE property_id = ?`).all(p.id),
  }));

  return NextResponse.json({ properties: enriched });
}

export async function POST(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner || !ctx.user) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const body = await req.json();
  const parsed = CreatePropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid property fields", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const mType =
    parsed.data.category === "car"
      ? "car"
      : parsed.data.category === "experience"
      ? "exp"
      : parsed.data.category === "restaurant"
      ? "food"
      : "stay";

  const slug =
    parsed.data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.floor(1000 + Math.random() * 9000);

  const res = db
    .prepare(
      `INSERT INTO properties (
        partner_id, slug, title, title_fr, title_ar, category, marketplace_type,
        city, region, country, address, latitude, longitude, star_rating,
        description, description_fr, description_ar, amenities_json, images_json,
        cancellation_policy, base_price_mad, unit_type, verified, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Morocco', 'Morocco', ?, 31.6295, -7.9811, 4, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending_approval')`
    )
    .run(
      ctx.partner.id,
      slug,
      sanitizeString(parsed.data.title, 120),
      sanitizeString(parsed.data.title, 120),
      sanitizeString(parsed.data.title, 120),
      parsed.data.category,
      mType,
      sanitizeString(parsed.data.city, 60),
      sanitizeString(parsed.data.address, 200),
      sanitizeString(parsed.data.description, 2000),
      sanitizeString(parsed.data.description, 2000),
      sanitizeString(parsed.data.description, 2000),
      JSON.stringify(parsed.data.amenities),
      JSON.stringify(["/images/listings/room-suite.jpg", "/images/hero-morocco.jpg"]),
      parsed.data.cancellationPolicy,
      parsed.data.basePriceMad,
      mType === "car" ? "day" : mType === "stay" ? "night" : "pers"
    );

  const propId = Number(res.lastInsertRowid);
  db.prepare(
    `INSERT INTO room_types (property_id, name, name_fr, name_ar, max_adults, total_units, base_price_mad, amenities_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    propId,
    sanitizeString(parsed.data.roomName, 100),
    sanitizeString(parsed.data.roomName, 100),
    sanitizeString(parsed.data.roomName, 100),
    parsed.data.maxAdults,
    parsed.data.totalUnits,
    parsed.data.basePriceMad,
    JSON.stringify(parsed.data.amenities)
  );

  logAudit(ctx.user.id, "partner.property_created", "property", propId, { title: parsed.data.title });
  return NextResponse.json({ id: propId, slug, status: "pending_approval" }, { status: 201 });
}

export async function PATCH(req: Request) {
  ensureSeeded();
  const ctx = await requirePartnerContext();
  if (ctx.error || !ctx.partner) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const body = await req.json();
  const db = getDb();

  if (body.roomTypeId) {
    const room = db
      .prepare(
        `SELECT rt.id FROM room_types rt JOIN properties p ON p.id = rt.property_id
         WHERE rt.id = ? AND p.partner_id = ?`
      )
      .get(Number(body.roomTypeId), ctx.partner.id);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    db.prepare(
      `UPDATE room_types
       SET total_units = COALESCE(?, total_units),
           base_price_mad = COALESCE(?, base_price_mad),
           weekend_price_mad = COALESCE(?, weekend_price_mad)
       WHERE id = ?`
    ).run(body.totalUnits ?? null, body.basePriceMad ?? null, body.weekendPriceMad ?? null, Number(body.roomTypeId));
    return NextResponse.json({ ok: true });
  }

  const propId = Number(body.propertyId);
  const prop = db.prepare(`SELECT id FROM properties WHERE id = ? AND partner_id = ?`).get(propId, ctx.partner.id);
  if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  db.prepare(
    `UPDATE properties
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         base_price_mad = COALESCE(?, base_price_mad),
         cancellation_policy = COALESCE(?, cancellation_policy),
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(body.title ?? null, body.description ?? null, body.basePriceMad ?? null, body.cancellationPolicy ?? null, propId);

  return NextResponse.json({ ok: true });
}
