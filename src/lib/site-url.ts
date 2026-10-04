import { COMPANY_DEFAULTS } from "@/config/company-defaults";

// Absolute base URL for share links, canonical URLs, the sitemap and robots.txt.
// APP_URL (the deployed URL) wins; otherwise the company's own website.
export function siteUrl(): URL {
  const configured = process.env.APP_URL?.trim();
  return new URL(configured || `https://${COMPANY_DEFAULTS.website}`);
}
