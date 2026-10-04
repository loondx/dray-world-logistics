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

// Maps a rate-free, client-free load selection to the bill of lading (carrier and driver only).
export function toBillOfLadingDTO(load: BillOfLadingSource, context: DocumentContext): BillOfLadingDTO {
  const { carrier } = load;
  const weight = formatWeight(load.weight, load.weightUnit);

  return {
    kind: "BOL",
    meta: {
      title: BILL_OF_LADING_TITLE,
      loadNumber: load.loadNumber,
      documentDate: context.documentDate,
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
    carrier: carrier
      ? {
          name: carrier.legalName,
          addressLines: addressLines(carrier),
          phone: carrier.phone,
          details: fields([
            ["MC Number", carrier.mcNumber],
            ["DOT Number", carrier.dotNumber],
            ["Primary Contact", carrier.contactPerson],
          ]),
        }
      : { name: "Carrier not assigned", addressLines: [], phone: null, details: [] },
    driver: fields([
      ["Driver", load.driver ? driverFullName(load.driver) : null],
      ["Cell", load.driver?.phone],
      ["Truck #", load.truckNumber],
      ["Trailer #", load.trailerNumber],
    ]),
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
