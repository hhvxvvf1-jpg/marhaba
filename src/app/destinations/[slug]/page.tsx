import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { DestinationClient } from "@/components/DestinationClient";
import type { PropertyItem } from "@/components/PropertyCard";
import { findMoroccanCity } from "@/lib/morocco-cities";

export const dynamic = "force-dynamic";

interface DestRecord {
  slug: string;
  name: string;
  name_fr: string;
  name_ar: string;
  region: string;
  summary: string;
  summary_fr: string;
  summary_ar: string;
  image_url: string;
  seo_title?: string;
  seo_description?: string;
}

function getDestinationOrCity(slug: string): DestRecord | null {
  const db = getDb();
  const dbDest = db.prepare(`SELECT * FROM destinations WHERE slug = ?`).get(slug) as DestRecord | undefined;
  if (dbDest) return dbDest;

  const city = findMoroccanCity(slug);
  if (!city) return null;
  return {
    slug: city.slug,
    name: city.name,
    name_fr: city.nameFr,
    name_ar: city.nameAr,
    region: city.region,
    summary: `Explore stays, riads, desert camps, rental cars, and local experiences in ${city.name} (${city.region}, Morocco).`,
    summary_fr: `Découvrez les séjours, riads, locations de voitures et expériences à ${city.nameFr} (${city.region}, Maroc).`,
    summary_ar: `اكتشف الإقامات والرياضات وتأجير السيارات والتجارب في ${city.nameAr} (${city.region}، المغرب).`,
    image_url: "/images/hero-morocco.jpg",
    seo_title: `${city.name} Hotels, Riads & Experiences | MARHABA`,
    seo_description: `Book verified stays, cars, dining, and tours in ${city.name} (${city.region}), Morocco with MARHABA.`,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  ensureSeeded();
  const { slug } = await params;
  const dest = getDestinationOrCity(slug);
  if (!dest) return { title: "Destination | MARHABA" };
  return {
    title: dest.seo_title || `${dest.name} Hotels, Riads & Experiences | MARHABA`,
    description: dest.seo_description || dest.summary,
    openGraph: {
      title: dest.seo_title || `Explore ${dest.name} (${dest.region}) on MARHABA`,
      description: dest.seo_description || dest.summary,
      images: [dest.image_url],
    },
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  ensureSeeded();
  const { slug } = await params;
  const db = getDb();

  const dest = getDestinationOrCity(slug);
  if (!dest) notFound();

  let items = db
    .prepare(`SELECT * FROM properties WHERE status = 'active' AND LOWER(city) = LOWER(?) ORDER BY featured DESC, rating_avg DESC`)
    .all(dest.name) as PropertyItem[];

  if (items.length === 0) {
    items = db
      .prepare(`SELECT * FROM properties WHERE status = 'active' AND LOWER(region) = LOWER(?) ORDER BY featured DESC, rating_avg DESC`)
      .all(dest.region) as PropertyItem[];
  }

  const allDestinations = db
    .prepare(`SELECT slug, name, name_fr, name_ar, region, image_url FROM destinations ORDER BY id ASC`)
    .all() as Array<{ slug: string; name: string; name_fr: string; name_ar: string; region: string; image_url: string }>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: dest.name,
    description: dest.summary,
    image: dest.image_url,
    containedInPlace: {
      "@type": "Country",
      name: "Morocco",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DestinationClient destination={dest} items={items} allDestinations={allDestinations} />
    </>
  );
}
