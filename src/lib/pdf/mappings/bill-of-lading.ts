import { driverFullName } from "@/lib/labels/people";

import type { BillOfLadingDTO } from "../types";
import {
  addressLines,
  buildStops,
  equipmentLabel,
  fields,
  formatMiles,
  formatWeight,
  joinReferences,
  splitLines,
  type DocumentContext,
} from "./common";
import type { BillOfLadingSource } from "./selects";

export const BILL_OF_LADING_TITLE = "BILL OF LADING";

export function bolNumber(loadNumber: number): string {
  return `BOL-${loadNumber}`;
}

// Maps a rate-free load selection to the bill of lading.
export function toBillOfLadingDTO(load: BillOfLadingSource, context: DocumentContext): BillOfLadingDTO {
  const { client, carrier } = load;
  const weight = formatWeight(load.weight, load.weightUnit);

  return {
    kind: "BOL",
    meta: {
      title: BILL_OF_LADING_TITLE,
      loadNumber: load.loadNumber,
      documentDate: context.documentDate,
      generatedBy: context.generatedBy,
    },
    company: context.company,
    summary: fields([
      ["BOL #", bolNumber(load.loadNumber)],
      ["Load #", load.loadNumber],
      ["Date", context.documentDate],
      ["Weight", weight],
      ["Commodity", load.commodity],
      ["Pieces", load.pieces],
      ["Distance", formatMiles(load.miles)],
      ["Container #", load.containerNumber],
      ["Seal #", load.sealNumber],
    ]),
    customer: {
      name: client.companyName,
      addressLines: addressLines(client),
      phone: client.phone,
      details: fields([
        ["Primary Contact", client.contactName],
        ["Phone", client.phone],
        ["Ref #", load.customerReference],
      ]),
    },
    carrier: carrier
      ? {
          name: carrier.legalName,
          addressLines: [],
          phone: carrier.phone,
          details: fields([
            ["MC Number", carrier.mcNumber],
            ["DOT Number", carrier.dotNumber],
            ["Driver", load.driver ? driverFullName(load.driver) : null],
            ["Truck #", load.truckNumber],
            ["Trailer #", load.trailerNumber],
          ]),
        }
      : { name: "Carrier not assigned", addressLines: [], phone: null, details: [] },
    stops: buildStops(
      load,
      joinReferences([
        ["Container #", load.containerNumber],
        ["Seal #", load.sealNumber],
        ["Booking #", load.bookingNumber],
      ]),
    ),
    cargo:
      [
        load.pieces ? `${load.pieces} pcs` : null,
        load.commodity,
        weight,
        equipmentLabel(load.equipmentType, load.equipmentSize),
      ]
        .filter(Boolean)
        .join(" · ") || null,
    specialInstructions: load.specialInstructions,
    instructions: context.settings.bolInstructions,
    terms: splitLines(context.settings.bolTerms),
  };
}
