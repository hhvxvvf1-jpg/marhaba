import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://marhaba.ma";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/search", "/destinations/", "/properties/"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
