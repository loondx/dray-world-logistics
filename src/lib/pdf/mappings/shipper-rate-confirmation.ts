import { formatAmount, formatMoney } from "@/lib/money";

import type { ShipperRateConfirmationDTO } from "../types";
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
import type { ShipperRateConfirmationSource } from "./selects";

export const SHIPPER_RATE_CONFIRMATION_TITLE = "CLIENT RATE CONFIRMATION";

// Maps a client-scoped load selection to the client rate confirmation.
// The source type has no carrier, driver, carrier rate or internal notes.
export function toShipperRateConfirmationDTO(
  load: ShipperRateConfirmationSource,
  context: DocumentContext,
): ShipperRateConfirmationDTO {
  const client = load.client;
  const rate = formatAmount(load.clientRate, "0.00");

  return {
    kind: "SHIPPER_RATE_CONFIRMATION",
    meta: {
      title: SHIPPER_RATE_CONFIRMATION_TITLE,
      loadNumber: load.loadNumber,
      documentDate: context.documentDate,
    },
    company: context.company,
    summary: fields([
      ["Load #", load.loadNumber],
      ["Date", context.documentDate],
      ["Client Ref #", load.customerReference],
      ["Equipment", equipmentLabel(load.equipmentType, load.equipmentSize)],
      ["Weight", formatWeight(load.weight, load.weightUnit)],
      ["Commodity", load.commodity],
      ["Distance", formatMiles(load.miles)],
      ["Container #", load.containerNumber],
      ["Booking #", load.bookingNumber],
    ]),
    client: {
      name: client.companyName,
      addressLines: addressLines(client),
      phone: client.phone,
      details: fields([
        ["Primary Contact", client.contactName],
        ["Phone", client.phone],
        ["Email", client.email],
      ]),
    },
    stops: buildStops(
      load,
      joinReferences([
        ["Container #", load.containerNumber],
        ["Ref #", load.customerReference],
      ]),
    ),
    payItems: [
      { description: "Flat Rate", notes: "All-in transportation charge", quantity: "1", rate, amount: rate },
    ],
    total: formatMoney(load.clientRate, "$0.00"),
    specialInstructions: load.specialInstructions,
    terms: splitLines(context.settings.shipperTerms),
    paymentInstructions: context.settings.paymentInstructions,
    contactLine: contactLine(context.settings),
  };
}
