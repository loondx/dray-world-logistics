import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

// Public website: indexable. Private portal and API: never crawled.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/login",
        "/dashboard",
        "/loads",
        "/clients",
        "/carriers",
        "/drivers",
        "/quotes",
        "/settings",
      ],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
