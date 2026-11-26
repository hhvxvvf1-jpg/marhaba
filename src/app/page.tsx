import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { HomeClient } from "@/components/HomeClient";
import type { PropertyItem } from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  ensureSeeded();
  const db = getDb();

  const destinations = db
    .prepare(
      `SELECT d.*, COUNT(p.id) AS property_count
       FROM destinations d
       LEFT JOIN properties p ON LOWER(p.city) = LOWER(d.name) AND p.status = 'active'
       GROUP BY d.id
       ORDER BY d.featured_order ASC, property_count DESC`
    )
    .all() as Array<{
    id: number;
    slug: string;
    name: string;
    name_fr: string;
    name_ar: string;
    region: string;
    image_url: string;
    property_count: number;
  }>;

  const featuredStays = db
    .prepare(
      `SELECT * FROM properties WHERE status = 'active' AND marketplace_type = 'stay' ORDER BY featured DESC, rating_avg DESC, id ASC`
    )
    .all() as PropertyItem[];

  const cars = db
    .prepare(
      `SELECT * FROM properties WHERE status = 'active' AND marketplace_type = 'car' ORDER BY rating_avg DESC, base_price_mad DESC LIMIT 6`
    )
    .all() as PropertyItem[];

  const experiences = db
    .prepare(
      `SELECT * FROM properties WHERE status = 'active' AND marketplace_type = 'exp' ORDER BY rating_avg DESC LIMIT 6`
    )
    .all() as PropertyItem[];

  const dining = db
    .prepare(
      `SELECT * FROM properties WHERE status = 'active' AND marketplace_type = 'food' ORDER BY rating_avg DESC LIMIT 6`
    )
    .all() as PropertyItem[];

  const promotions = db
    .prepare(`SELECT id, code, name, discount_pct, discount_fixed_mad, min_booking_mad FROM promotions WHERE is_active = 1`)
    .all() as Array<{ id: number; code: string; name: string; discount_pct: number; discount_fixed_mad: number; min_booking_mad: number }>;

  return (
    <HomeClient
      destinations={destinations}
      featuredStays={featuredStays}
      cars={cars}
      experiences={experiences}
      dining={dining}
      promotions={promotions}
    />
  );
}
