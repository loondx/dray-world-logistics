import type { MetadataRoute } from "next";

import { COMPANY_DEFAULTS } from "@/config/company-defaults";
import { SITE_DESCRIPTION } from "@/config/marketing-content";

// "Add to home screen" on phones.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: COMPANY_DEFAULTS.displayName,
    short_name: "DRAY-WORLD",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18234a",
    icons: [
      { src: "/icon.png", type: "image/png", sizes: "256x256" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
