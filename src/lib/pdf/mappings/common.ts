import { formatAppointment } from "@/lib/dates";
export { formatMiles, formatWeight } from "@/lib/labels/units";

import type { PdfCompany, PdfField, PdfStop } from "../types";

// Everything a mapping needs besides the load itself. Built on the server from
// CompanySettings and the current user.
export type DocumentContext = {
  company: PdfCompany;
  generatedBy: string;
  documentDate: string;
  settings: {
    carrierTerms: string | null;
    shipperTerms: string | null;
    bolTerms: string | null;
    bolInstructions: string | null;
    paymentInstructions: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
  };
};

type AddressSource = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  country: string | null;
};

export function addressLines(address: AddressSource): string[] {
  const cityLine = [[address.city, address.stateProvince].filter(Boolean).join(", "), address.postalCode]
    .filter(Boolean)
    .join(" ");
  return [address.addressLine1, address.addressLine2, cityLine, address.country].filter(
    (line): line is string => Boolean(line),
  );
}

// Multi-line settings text → bullet list (strips "-", "•", "1." prefixes).
export function splitLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

// Drops empty values so documents never show blank label rows.
export function fields(entries: [label: string, value: string | number | null | undefined][]): PdfField[] {
  return entries
    .filter(
      (entry): entry is [string, string | number] =>
        entry[1] !== null && entry[1] !== undefined && entry[1] !== "",
    )
    .map(([label, value]) => ({ label, value: String(value) }));
}

type StopSource = {
  [
    K in `${"pickup" | "delivery"}${
      | "LocationName"
      | "AddressLine1"
      | "AddressLine2"
      | "City"
      | "StateProvince"
      | "PostalCode"
      | "Country"
      | "TimeFrom"
      | "TimeTo"
      | "AppointmentNumber"
      | "Contact"
      | "Notes"}`
  ]: string | null;
} & { pickupDate: Date | null; deliveryDate: Date | null };

export function buildStops(source: StopSource, references: string | null): PdfStop[] {
  const stop = (prefix: "pickup" | "delivery", sequence: number): PdfStop => ({
    sequence,
    action: prefix === "pickup" ? "Pickup" : "Delivery",
    appointment: formatAppointment(
      source[`${prefix}Date`],
      source[`${prefix}TimeFrom`],
      source[`${prefix}TimeTo`],
    ),
    locationName: source[`${prefix}LocationName`] ?? "To be advised",
    addressLines: addressLines({
      addressLine1: source[`${prefix}AddressLine1`],
      addressLine2: source[`${prefix}AddressLine2`],
      city: source[`${prefix}City`],
      stateProvince: source[`${prefix}StateProvince`],
      postalCode: source[`${prefix}PostalCode`],
      country: source[`${prefix}Country`],
    }),
    contact: source[`${prefix}Contact`],
    appointmentNumber: source[`${prefix}AppointmentNumber`],
    references,
    instructions: source[`${prefix}Notes`],
  });
  return [stop("pickup", 1), stop("delivery", 2)];
}

export function equipmentLabel(type: string | null, size: string | null): string | null {
  return [size, type].filter(Boolean).join(" ") || null;
}

export function joinReferences(entries: [label: string, value: string | null | undefined][]): string | null {
  const parts = entries.filter(([, value]) => Boolean(value)).map(([label, value]) => `${label} ${value}`);
  return parts.length ? parts.join("   ") : null;
}

export function contactLine(settings: DocumentContext["settings"]): string | null {
  const parts = [settings.contactPhone, settings.contactEmail].filter(Boolean);
  return parts.length
    ? `Please call immediately with any questions, concerns, or problems: ${parts.join(" · ")}`
    : null;
}
