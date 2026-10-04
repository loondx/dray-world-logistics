import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { COMPANY_DEFAULTS } from "@/config/company-defaults";
import { SITE_TAGLINE } from "@/config/marketing-content";

// Link preview shown when the site is shared (WhatsApp, iMessage, LinkedIn, Facebook, X …).
// Built at build time from the confirmed company details. Kept large and high-contrast so
// it still reads as a small thumbnail on a phone.
export const alt = `${COMPANY_DEFAULTS.displayName}: ${SITE_TAGLINE} Call ${COMPANY_DEFAULTS.phone}.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#18234a";
const CYAN = "#1aa6d6";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "src/assets/brand/dray-world-logo.png"), "base64");
  const registrations = [
    `MC ${COMPANY_DEFAULTS.mcNumber}`,
    `USDOT ${COMPANY_DEFAULTS.dotNumber}`,
    `SCAC ${COMPANY_DEFAULTS.scacCode}`,
  ].join("   ·   ");

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#ffffff" }}>
      {/* The logo needs a light background. */}
      <div
        style={{
          display: "flex",
          width: 470,
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <img src={`data:image/png;base64,${logo}`} width={390} height={242} alt="" />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          padding: "0 64px",
          background: NAVY,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", width: 72, height: 6, background: CYAN, marginBottom: 28 }} />
        <div style={{ display: "flex", fontSize: 54, lineHeight: 1.05 }}>{COMPANY_DEFAULTS.displayName}</div>
        {/* One sentence per line so the break never falls mid-phrase. */}
        <div
          style={{ display: "flex", flexDirection: "column", fontSize: 30, marginTop: 18, color: "#c9d3ea" }}
        >
          {SITE_TAGLINE.split(/(?<=\.) /).map((sentence) => (
            <div key={sentence} style={{ display: "flex" }}>
              {sentence}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 40, marginTop: 40 }}>Call {COMPANY_DEFAULTS.phone}</div>
        <div style={{ display: "flex", fontSize: 28, marginTop: 8, color: CYAN }}>
          {COMPANY_DEFAULTS.website}
        </div>
        <div style={{ display: "flex", fontSize: 22, marginTop: 36, color: "#c9d3ea" }}>{registrations}</div>
      </div>
    </div>,
    size,
  );
}
