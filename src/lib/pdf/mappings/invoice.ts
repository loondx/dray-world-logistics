import { DEFAULT_INVOICE_PAYMENT_TERMS_DAYS } from "@/config/company-defaults";
import { LOAD_TYPE_LABELS } from "@/features/loads/equipment";
import { formatDateOnly } from "@/lib/dates";
import { formatCityState } from "@/lib/labels/people";
import { formatAmount, formatMoney, sumMoney } from "@/lib/money";

import type { InvoiceDTO } from "../types";
import {
  addressLines,
  equipmentLabel,
  fields,
  formatWeight,
  splitLines,
  type DocumentContext,
} from "./common";
import type { InvoiceSource } from "./selects";

export const INVOICE_TITLE = "INVOICE";

const DAY_MS = 24 * 60 * 60 * 1000;

// One invoice per load, numbered like the BOL: INV-100001. Revisions are new versions
// of the same invoice (v2, v3 …), so the number the client books never changes.
export function invoiceNumber(loadNumber: number): string {
  return `INV-${loadNumber}`;
}

// Client override first, then the company setting, then the standard Net 15.
export function resolvePaymentTermsDays(clientDays: number | null, companyDays: number | null): number {
  return clientDays ?? companyDays ?? DEFAULT_INVOICE_PAYMENT_TERMS_DAYS;
}

export function paymentTermsLabel(days: number): string {
  return days === 0 ? "Due on receipt" : `Net ${days}`;
}

// The terms in one plain sentence (the terms label and due date are printed above it).
export function paymentTermsSentence(days: number): string {
  return days === 0
    ? "Payment is due on receipt of this invoice."
    : `Payment is due within ${days} days of the invoice date.`;
}

type LoadMoney = {
  clientRate: InvoiceSource["clientRate"];
  charges: { amount: InvoiceSource["clientRate"] }[];
};

// Client rate + every extra charge: what the client is invoiced for this load.
export function invoiceTotal(load: LoadMoney) {
  return sumMoney([load.clientRate, ...load.charges.map((charge) => charge.amount)]);
}

function stopLine(date: Date | null, name: string | null, city: string | null, state: string | null) {
  const place = [name, formatCityState(city, state)].filter(Boolean).join(", ");
  return [date ? formatDateOnly(date) : null, place || null].filter(Boolean).join(" · ") || null;
}

// Maps a client-scoped load selection to the client invoice.
// The source type has no carrier, driver, carrier rate or internal notes.
export function toInvoiceDTO(load: InvoiceSource, context: DocumentContext): InvoiceDTO {
  const { client } = load;
  const termsDays = resolvePaymentTermsDays(
    client.paymentTermsDays,
    context.settings.invoicePaymentTermsDays,
  );
  const dueDate = formatDateOnly(new Date(context.issueDate.getTime() + termsDays * DAY_MS));
  const origin = formatCityState(load.pickupCity, load.pickupStateProvince) || load.pickupLocationName;
  const destination =
    formatCityState(load.deliveryCity, load.deliveryStateProvince) || load.deliveryLocationName;
  const total = formatMoney(invoiceTotal(load), "$0.00");

  return {
    kind: "INVOICE",
    meta: {
      title: INVOICE_TITLE,
      loadNumber: load.loadNumber,
      documentDate: context.documentDate,
    },
    company: context.company,
    invoiceNumber: invoiceNumber(load.loadNumber),
    invoiceDate: context.documentDate,
    terms: paymentTermsLabel(termsDays),
    termsSentence: paymentTermsSentence(termsDays),
    dueDate,
    billTo: {
      name: client.companyName,
      addressLines: addressLines(client),
      contactLines: [client.contactName ? `Attn: ${client.contactName}` : null, client.email].filter(
        (line): line is string => Boolean(line),
      ),
    },
    shipment: fields([
      ["Load #", load.loadNumber],
      ["Client Ref #", load.customerReference],
      ["Container #", load.containerNumber],
      ["Booking #", load.bookingNumber],
      ["Equipment", equipmentLabel(load.equipmentType, load.equipmentSize)],
      ["Commodity", load.commodity],
      ["Weight", formatWeight(load.weight, load.weightUnit)],
      [
        "Pickup",
        stopLine(load.pickupDate, load.pickupLocationName, load.pickupCity, load.pickupStateProvince),
      ],
      [
        "Delivery",
        stopLine(load.deliveryDate, load.deliveryLocationName, load.deliveryCity, load.deliveryStateProvince),
      ],
    ]),
    lines: [
      {
        description: `${LOAD_TYPE_LABELS[load.type]} freight`,
        details: [origin, destination].every(Boolean) ? `${origin} to ${destination}` : "Transportation",
        amount: formatAmount(load.clientRate, "0.00"),
      },
      ...load.charges.map((charge) => ({
        description: charge.description,
        details: "Additional charge",
        amount: formatAmount(charge.amount, "0.00"),
      })),
    ],
    total,
    paymentInstructions: context.settings.paymentInstructions,
    businessNumber: context.settings.businessNumber,
    dunsNumber: context.settings.dunsNumber,
    notes: splitLines(context.settings.invoiceNotes),
  };
}
