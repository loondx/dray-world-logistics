import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { toBillOfLadingDTO } from "@/lib/pdf/mappings/bill-of-lading";
import { toCarrierRateConfirmationDTO } from "@/lib/pdf/mappings/carrier-rate-confirmation";
import { toShipperRateConfirmationDTO } from "@/lib/pdf/mappings/shipper-rate-confirmation";
import { renderPdf } from "@/lib/pdf/render";
import type { GeneratedDocumentDTO } from "@/lib/pdf/types";

import {
  bolSource,
  carrierSource,
  CARRIER_RATE,
  CLIENT_RATE,
  documentContext,
  shipperSource,
} from "../fixtures/document-sources";

// Set PDF_OUTPUT_DIR to write the rendered files for manual visual review.
const outputDir = process.env.PDF_OUTPUT_DIR;

function serialized(dto: GeneratedDocumentDTO): string {
  return JSON.stringify(dto);
}

const CLIENT_RATE_FORMATTED = ["2475.55", "2,475.55"];
const CARRIER_RATE_FORMATTED = ["1850.25", "1,850.25"];

describe("carrier load confirmation DTO", () => {
  const dto = toCarrierRateConfirmationDTO(carrierSource, documentContext);

  it("contains the carrier rate", () => {
    expect(dto.total).toBe("$1,850.25");
    expect(dto.payItems[0]?.amount).toBe("1,850.25");
  });

  it("never contains the client rate, client identity or margin", () => {
    const json = serialized(dto);
    for (const value of CLIENT_RATE_FORMATTED) expect(json).not.toContain(value);
    expect(json).not.toContain("Atlantic Imports");
    expect(json).not.toContain("PO-99812");
    expect(json.toLowerCase()).not.toContain("margin");
    expect(Object.keys(dto)).not.toContain("clientRate");
  });

  it("maps carrier, driver and stops", () => {
    expect(dto.carrier.name).toBe("Northern Haul Transport (Sample)");
    expect(dto.driver).toContainEqual({ label: "Driver", value: "Chris Taylor" });
    expect(dto.stops.map((s) => s.action)).toEqual(["Pickup", "Delivery"]);
    expect(dto.stops[0]?.appointment).toBe("10/02/2026 08:00 - 16:00");
    expect(dto.summary).toContainEqual({ label: "Container #", value: "OOLU6201801" });
  });
});

describe("customer rate confirmation DTO", () => {
  const dto = toShipperRateConfirmationDTO(shipperSource, documentContext);

  it("contains the client rate", () => {
    expect(dto.total).toBe("$2,475.55");
  });

  it("never contains the carrier rate, carrier or driver", () => {
    const json = serialized(dto);
    for (const value of CARRIER_RATE_FORMATTED) expect(json).not.toContain(value);
    expect(json).not.toContain("Northern Haul");
    expect(json).not.toContain("Chris Taylor");
    expect(json.toLowerCase()).not.toContain("margin");
    expect(Object.keys(dto)).not.toContain("carrierRate");
    expect(Object.keys(dto)).not.toContain("carrier");
  });
});

describe("bill of lading DTO", () => {
  const dto = toBillOfLadingDTO(bolSource, documentContext);

  it("contains no rates at all", () => {
    const json = serialized(dto);
    for (const value of [...CLIENT_RATE_FORMATTED, ...CARRIER_RATE_FORMATTED])
      expect(json).not.toContain(value);
  });

  it("uses the load number as the BOL number", () => {
    expect(dto.summary[0]).toEqual({ label: "BOL #", value: "BOL-100001" });
  });

  it("describes the cargo", () => {
    expect(dto.cargo).toContain("18 pcs");
    expect(dto.cargo).toContain("27,650 lbs");
  });
});

describe("PDF rendering", () => {
  const cases: [string, GeneratedDocumentDTO][] = [
    ["carrier-rate-confirmation", toCarrierRateConfirmationDTO(carrierSource, documentContext)],
    ["shipper-rate-confirmation", toShipperRateConfirmationDTO(shipperSource, documentContext)],
    ["bol", toBillOfLadingDTO(bolSource, documentContext)],
  ];

  it.each(cases)("renders %s as a valid PDF", async (name, dto) => {
    const pdf = await renderPdf(dto);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.subarray(-6).toString("latin1")).toContain("%%EOF");
    expect(pdf.byteLength).toBeGreaterThan(2000);
    expect(pdf.toString("latin1")).toMatch(/\/Type\s*\/Page\b/);
    if (outputDir) {
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(path.join(outputDir, `${name}.pdf`), pdf);
    }
  });
});

// Keep fixture constants referenced so the leak checks above stay meaningful.
expect(CLIENT_RATE).not.toBe(CARRIER_RATE);
