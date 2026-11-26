import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";

export async function GET() {
  ensureSeeded();
  const db = getDb();

  const destinations = db
    .prepare(
      `SELECT d.*,
              (SELECT COUNT(*) FROM properties p WHERE p.city = d.name AND p.status = 'active') AS property_count
       FROM destinations d
       ORDER BY d.featured_order ASC`
    )
    .all();

  const featured = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.status = 'active' AND p.featured = 1
       ORDER BY p.rating_avg DESC, p.id ASC
       LIMIT 12`
    )
    .all();

  const popularStays = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.status = 'active' AND p.marketplace_type = 'stay'
       ORDER BY p.featured DESC, p.rating_avg DESC, p.base_price_mad ASC
       LIMIT 12`
    )
    .all();

  const cars = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.status = 'active' AND p.marketplace_type = 'car'
       ORDER BY p.featured DESC, p.base_price_mad ASC
       LIMIT 10`
    )
    .all();

  const experiences = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.status = 'active' AND p.marketplace_type IN ('exp', 'food')
       ORDER BY p.rating_avg DESC, p.id ASC
       LIMIT 10`
    )
    .all();

  const promotions = db
    .prepare(
      `SELECT code, name, discount_pct, discount_fixed_mad, min_booking_mad, valid_to, category_filter
       FROM promotions
       WHERE is_active = 1 AND valid_to >= date('now')
       ORDER BY discount_pct DESC`
    )
    .all();

  const cmsBlocks = db.prepare(`SELECT key, title, title_fr, title_ar, content_json FROM cms_blocks WHERE is_active = 1`).all();

  return NextResponse.json({
    destinations,
    featured,
    popularStays,
    cars,
    experiences,
    promotions,
    cmsBlocks,
  });
}
