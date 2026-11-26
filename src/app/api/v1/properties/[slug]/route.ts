import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  ensureSeeded();
  const { slug } = await params;
  const db = getDb();

  const property = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name, pa.city AS partner_city, pa.verification_status AS partner_verified
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.slug = ? OR CAST(p.id AS TEXT) = ?`
    )
    .get(slug, slug) as Record<string, unknown> | undefined;

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const rooms = db
    .prepare(`SELECT * FROM room_types WHERE property_id = ? AND status = 'active' ORDER BY base_price_mad ASC`)
    .all(property.id as number);

  const pricingRules = db
    .prepare(`SELECT * FROM pricing_rules WHERE property_id = ? AND is_active = 1`)
    .all(property.id as number);

  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name AS author_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.property_id = ? AND r.status = 'published'
       ORDER BY r.created_at DESC`
    )
    .all(property.id as number);

  const similar = db
    .prepare(
      `SELECT id, slug, title, title_fr, title_ar, category, marketplace_type, city, base_price_mad, unit_type, rating_avg, review_count, images_json, verified
       FROM properties
       WHERE status = 'active' AND id != ? AND (city = ? OR marketplace_type = ?)
       ORDER BY (city = ?) DESC, rating_avg DESC
       LIMIT 4`
    )
    .all(property.id as number, property.city as string, property.marketplace_type as string, property.city as string);

  return NextResponse.json({
    property,
    rooms,
    pricingRules,
    reviews,
    similar,
  });
}
