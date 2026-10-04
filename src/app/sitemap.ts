import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

// Public pages only.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: new URL("/", base).toString(), changeFrequency: "monthly", priority: 1 },
    { url: new URL("/privacy", base).toString(), changeFrequency: "yearly", priority: 0.2 },
    { url: new URL("/terms", base).toString(), changeFrequency: "yearly", priority: 0.2 },
  ];
}
