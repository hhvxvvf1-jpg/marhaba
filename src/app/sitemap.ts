import type { MetadataRoute } from "next";
import { getDb } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { ESIM_PACKAGES } from "@/lib/services-catalog";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  ensureSeeded();
  const db = getDb();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://marhaba.ma";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/services`, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/esim`, changeFrequency: "daily", priority: 0.85 },
    { url: `${baseUrl}/planner`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/partner`, changeFrequency: "weekly", priority: 0.7 },
    ...ESIM_PACKAGES.map((pkg) => ({
      url: `${baseUrl}/esim/${pkg.code}`,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  ];

  const destinations = db.prepare(`SELECT slug FROM destinations`).all() as Array<{ slug: string }>;
  const destRoutes: MetadataRoute.Sitemap = destinations.map((d) => ({
    url: `${baseUrl}/destinations/${d.slug}`,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  const properties = db.prepare(`SELECT slug, updated_at FROM properties WHERE status = 'active'`).all() as Array<{
    slug: string;
    updated_at: string;
  }>;
  const propRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
    url: `${baseUrl}/properties/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...destRoutes, ...propRoutes];
}
