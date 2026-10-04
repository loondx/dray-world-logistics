import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { COMPANY_DEFAULT_PDF_LOGO } from "@/config/company-defaults";
import type { DocumentContext } from "@/lib/pdf/mappings/common";
import { toBillOfLadingDTO } from "@/lib/pdf/mappings/bill-of-lading";
import { toCarrierRateConfirmationDTO } from "@/lib/pdf/mappings/carrier-rate-confirmation";
import { paymentTermsLabel, resolvePaymentTermsDays, toInvoiceDTO } from "@/lib/pdf/mappings/invoice";
import { toShipperRateConfirmationDTO } from "@/lib/pdf/mappings/shipper-rate-confirmation";
import { renderPdf } from "@/lib/pdf/render";
import type { GeneratedDocumentDTO } from "@/lib/pdf/types";

import {
  bolSource,
  carrierSource,
  CARRIER_RATE,
  CLIENT_RATE,
  documentContext,
  invoiceSource,
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

describe("client rate confirmation DTO", () => {
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

  it("shows the carrier and driver but no client details", () => {
    const json = serialized(dto);
    expect(Object.keys(dto)).not.toContain("client");
    expect(dto.carrier.name).toBe("Northern Haul Transport (Sample)");
    expect(dto.driver).toContainEqual({ label: "Driver", value: "Chris Taylor" });
    expect(json).not.toContain("Atlantic Imports");
    expect(json).not.toContain("PO-99812");
  });

  it("uses the load number as the BOL number", () => {
    expect(dto.summary[0]).toEqual({ label: "BOL #", value: "BOL-100001" });
  });

  it("describes the cargo", () => {
    expect(dto.cargo).toContain("18 pcs");
    expect(dto.cargo).toContain("27,650 lbs");
  });
});

describe("client invoice DTO", () => {
  const dto = toInvoiceDTO(invoiceSource, documentContext);

  it("bills the client rate plus every extra charge", () => {
    expect(dto.lines.map((line) => [line.description, line.amount])).toEqual([
      ["Drayage freight", "2,475.55"],
      ["Chassis", "85.00"],
      ["Detention", "120.50"],
    ]);
    expect(dto.total).toBe("$2,681.05");
  });

  it("numbers the invoice by load and dates it with the payment terms", () => {
    expect(dto.invoiceNumber).toBe("INV-100001");
    expect(dto.terms).toBe("Net 30");
    expect(dto.dueDate).toBe("10/31/2026");
    expect(dto.termsSentence).toBe("Payment is due within 30 days of the invoice date.");
    expect(dto.billTo.name).toBe("Atlantic Imports (Sample)");
  });

  it("never contains the carrier rate, carrier, driver or margin", () => {
    const json = serialized(dto);
    for (const value of CARRIER_RATE_FORMATTED) expect(json).not.toContain(value);
    expect(json).not.toContain("Northern Haul");
    expect(json).not.toContain("Chris Taylor");
    expect(json.toLowerCase()).not.toContain("margin");
  });

  it("falls back to Net 15 when no terms are configured", () => {
    const noTerms = toInvoiceDTO(invoiceSource, {
      ...documentContext,
      settings: { ...documentContext.settings, invoicePaymentTermsDays: null },
    });
    expect(noTerms.terms).toBe("Net 15");
    expect(noTerms.dueDate).toBe("10/16/2026");
  });

  it("shows each number once: no repeated subtotal rows", () => {
    expect(Object.keys(dto)).not.toContain("subtotal");
  });
});

describe("payment terms", () => {
  it("prefers the client's terms over the company default", () => {
    expect(resolvePaymentTermsDays(15, 30)).toBe(15);
    expect(resolvePaymentTermsDays(null, 30)).toBe(30);
    expect(resolvePaymentTermsDays(0, 30)).toBe(0);
    expect(resolvePaymentTermsDays(null, null)).toBe(15);
  });

  it("labels the terms", () => {
    expect(paymentTermsLabel(0)).toBe("Due on receipt");
    expect(paymentTermsLabel(45)).toBe("Net 45");
  });
});

describe("PDF rendering", () => {
  // Render with the bundled brand emblem, as production does when no logo is uploaded.
  const branded: DocumentContext = {
    ...documentContext,
    company: {
      ...documentContext.company,
      logo: { data: readFileSync(path.join(process.cwd(), COMPANY_DEFAULT_PDF_LOGO)), format: "png" },
    },
  };
  const cases: [string, GeneratedDocumentDTO][] = [
    ["carrier-rate-confirmation", toCarrierRateConfirmationDTO(carrierSource, branded)],
    ["shipper-rate-confirmation", toShipperRateConfirmationDTO(shipperSource, branded)],
    ["bol", toBillOfLadingDTO(bolSource, branded)],
    ["invoice", toInvoiceDTO(invoiceSource, branded)],
    ["carrier-rate-confirmation-no-logo", toCarrierRateConfirmationDTO(carrierSource, documentContext)],
  ];

  it("never carries the generating user's name", () => {
    for (const [, dto] of cases) expect(Object.keys(dto.meta)).not.toContain("generatedBy");
  });

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
