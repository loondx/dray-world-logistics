import type { DocumentType } from "@/generated/prisma/enums";

// Documents are generated on demand from the load and downloaded straight to the
// browser. Nothing is stored on the server. (Older stored documents stay in the
// database and storage but are no longer shown.)
export const GENERATED_DOCUMENT_TYPES = [
  "CARRIER_RATE_CONFIRMATION",
  "SHIPPER_RATE_CONFIRMATION",
  "BOL",
  "INVOICE",
] as const satisfies readonly DocumentType[];

export type GeneratedDocumentType = (typeof GENERATED_DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<GeneratedDocumentType, string> = {
  CARRIER_RATE_CONFIRMATION: "Carrier Load Confirmation",
  SHIPPER_RATE_CONFIRMATION: "Client Rate Confirmation",
  BOL: "Bill of Lading",
  INVOICE: "Invoice",
};

// Documents that contain rates: only users with `financials:read` may open them.
export const FINANCIAL_DOCUMENT_TYPES: readonly DocumentType[] = [
  "CARRIER_RATE_CONFIRMATION",
  "SHIPPER_RATE_CONFIRMATION",
  "INVOICE",
];

// URL segment per document: /api/loads/<id>/documents/<slug>
export const DOCUMENT_URL_SLUGS: Record<GeneratedDocumentType, string> = {
  CARRIER_RATE_CONFIRMATION: "carrier-confirmation",
  SHIPPER_RATE_CONFIRMATION: "client-confirmation",
  BOL: "bol",
  INVOICE: "invoice",
};

export function documentTypeFromSlug(slug: string): GeneratedDocumentType | null {
  return GENERATED_DOCUMENT_TYPES.find((type) => DOCUMENT_URL_SLUGS[type] === slug) ?? null;
}

export function documentDownloadPath(loadId: string, type: GeneratedDocumentType): string {
  return `/api/loads/${encodeURIComponent(loadId)}/documents/${DOCUMENT_URL_SLUGS[type]}`;
}

// Downloaded file name. The BOL and invoice carry their document numbers.
export function documentFilename(type: GeneratedDocumentType, loadNumber: number): string {
  switch (type) {
    case "CARRIER_RATE_CONFIRMATION":
      return `${loadNumber}-carrier-load-confirmation.pdf`;
    case "SHIPPER_RATE_CONFIRMATION":
      return `${loadNumber}-client-rate-confirmation.pdf`;
    case "BOL":
      return `BOL-${loadNumber}.pdf`;
    case "INVOICE":
      return `INV-${loadNumber}.pdf`;
  }
}
