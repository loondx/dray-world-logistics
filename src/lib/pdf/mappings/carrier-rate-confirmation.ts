import { formatAmount, formatMoney } from "@/lib/money";
import { driverFullName } from "@/lib/labels/people";

import type { CarrierRateConfirmationDTO } from "../types";
import {
  addressLines,
  buildStops,
  contactLine,
  equipmentLabel,
  fields,
  formatMiles,
  formatWeight,
  joinReferences,
  splitLines,
  type DocumentContext,
} from "./common";
import type { CarrierRateConfirmationSource } from "./selects";

export const CARRIER_RATE_CONFIRMATION_TITLE = "LOAD CONFIRMATION";

// Maps a carrier-scoped load selection to the carrier load confirmation.
// The source type has no client, client rate or internal notes, so they cannot leak here.
export function toCarrierRateConfirmationDTO(
  load: CarrierRateConfirmationSource,
  context: DocumentContext,
): CarrierRateConfirmationDTO {
  const carrier = load.carrier;
  const rate = formatAmount(load.carrierRate, "0.00");

  return {
    kind: "CARRIER_RATE_CONFIRMATION",
    meta: {
      title: CARRIER_RATE_CONFIRMATION_TITLE,
      loadNumber: load.loadNumber,
      documentDate: context.documentDate,
      generatedBy: context.generatedBy,
    },
    company: context.company,
    summary: fields([
      ["Load #", load.loadNumber],
      ["Date", context.documentDate],
      ["Equipment", equipmentLabel(load.equipmentType, load.equipmentSize)],
      ["Weight", formatWeight(load.weight, load.weightUnit)],
      ["Commodity", load.commodity],
      ["Distance", formatMiles(load.miles)],
      ["Container #", load.containerNumber],
      ["Booking #", load.bookingNumber],
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
            ["Email", carrier.email],
          ]),
        }
      : { name: "Carrier not assigned", addressLines: [], phone: null, details: [] },
    driver: fields([
      ["Driver", load.driver ? driverFullName(load.driver) : "Driver not set"],
      ["Cell", load.driver?.phone],
      ["Truck #", load.truckNumber],
      ["Trailer #", load.trailerNumber],
    ]),
    stops: buildStops(
      load,
      joinReferences([
        ["Container #", load.containerNumber],
        ["Seal #", load.sealNumber],
      ]),
    ),
    payItems: [{ description: "Flat Rate", notes: "", quantity: "1", rate, amount: rate }],
    total: formatMoney(load.carrierRate, "$0.00"),
    specialInstructions: load.specialInstructions,
    terms: splitLines(context.settings.carrierTerms),
    contactLine: contactLine(context.settings),
  };
}
