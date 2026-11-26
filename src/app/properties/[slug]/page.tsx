import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { PropertyDetailClient } from "@/components/PropertyDetailClient";
import type { PropertyItem } from "@/components/PropertyCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  ensureSeeded();
  const { slug } = await params;
  const db = getDb();
  const prop = db.prepare(`SELECT title, city, description, images_json FROM properties WHERE slug = ?`).get(slug) as
    | { title: string; city: string; description: string; images_json: string }
    | undefined;
  if (!prop) return { title: "Property Not Found | MARHABA" };
  let img = "/images/hero-morocco.jpg";
  try {
    const arr = JSON.parse(prop.images_json);
    if (arr?.[0]) img = arr[0];
  } catch {
    // ignore
  }
  return {
    title: `${prop.title} in ${prop.city} | MARHABA`,
    description: prop.description.slice(0, 160),
    openGraph: {
      title: `${prop.title} — ${prop.city}`,
      description: prop.description.slice(0, 160),
      images: [img],
    },
  };
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  ensureSeeded();
  const { slug } = await params;
  const sp = await searchParams;
  const db = getDb();

  const property = db
    .prepare(
      `SELECT p.*, pa.business_name AS partner_name, pa.verification_status AS partner_verified, pa.user_id AS partner_user_id
       FROM properties p
       JOIN partners pa ON pa.id = p.partner_id
       WHERE p.slug = ?`
    )
    .get(slug) as Record<string, unknown> | undefined;

  if (!property) notFound();

  const roomsRaw = db
    .prepare(`SELECT * FROM room_types WHERE property_id = ? AND status = 'active' ORDER BY base_price_mad ASC`)
    .all(property.id) as Array<Record<string, unknown>>;

  const rooms = roomsRaw.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    description: String(r.description || ""),
    max_adults: Number(r.max_adults),
    max_children: Number(r.max_children),
    total_units: Number(r.total_units),
    base_price_mad: Number(r.base_price_mad),
    amenities: JSON.parse(String(r.amenities_json || "[]")) as string[],
  }));

  const reviews = db
    .prepare(
      `SELECT r.*, u.full_name AS author_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.property_id = ? AND r.status = 'published'
       ORDER BY r.created_at DESC`
    )
    .all(property.id) as Array<{
    id: number;
    overall_rating: number;
    comment: string;
    author_name: string;
    partner_reply?: string | null;
    created_at: string;
  }>;

  const similar = db
    .prepare(
      `SELECT * FROM properties WHERE status = 'active' AND city = ? AND id != ? ORDER BY rating_avg DESC LIMIT 3`
    )
    .all(property.city, property.id) as PropertyItem[];

  const today = new Date();
  const defaultIn = new Date(today.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
  const defaultOut = new Date(today.getTime() + 10 * 86400_000).toISOString().slice(0, 10);

  const initialCheckIn = typeof sp.checkIn === "string" && sp.checkIn ? sp.checkIn : defaultIn;
  const initialCheckOut = typeof sp.checkOut === "string" && sp.checkOut ? sp.checkOut : defaultOut;
  const initialAdults = typeof sp.adults === "string" ? Math.max(1, Number(sp.adults) || 2) : 2;
  const initialChildren = typeof sp.children === "string" ? Math.max(0, Number(sp.children) || 0) : 0;
  const initialRoomsCount = typeof sp.rooms === "string" ? Math.max(1, Number(sp.rooms) || 1) : 1;

  const gallery = JSON.parse(String(property.images_json || "[]")) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.title,
    description: property.description,
    image: gallery[0] || "/images/hero-morocco.jpg",
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: property.region,
      addressCountry: "MA",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: property.rating_avg,
      reviewCount: Math.max(1, Number(property.review_count || 1)),
    },
    priceRange: `${property.base_price_mad} MAD`,
  };

  const normalizedProp = {
    ...(property as unknown as PropertyItem),
    description: String(property.description || ""),
    description_fr: String(property.description_fr || ""),
    description_ar: String(property.description_ar || ""),
    amenities: JSON.parse(String(property.amenities_json || "[]")) as string[],
    gallery,
    check_in_time: String(property.check_in_time || "15:00"),
    check_out_time: String(property.check_out_time || "12:00"),
    cancellation_policy: String(property.cancellation_policy || "flexible"),
    partner_name: String(property.partner_name || ""),
    partner_verified: String(property.partner_verified || ""),
    partner_user_id: Number(property.partner_user_id || 0),
    address: String(property.address || ""),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PropertyDetailClient
        property={normalizedProp}
        rooms={rooms}
        reviews={reviews}
        similar={similar}
        initialCheckIn={initialCheckIn}
        initialCheckOut={initialCheckOut}
        initialAdults={initialAdults}
        initialChildren={initialChildren}
        initialRoomsCount={initialRoomsCount}
      />
    </>
  );
}
