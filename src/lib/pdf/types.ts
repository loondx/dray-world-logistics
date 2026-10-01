// Data Transfer Objects for generated PDFs.
//
// PDF templates receive ONLY these objects — never Prisma models. Each DTO is
// built by an explicit mapping from a query that selects only the fields that
// document may show (see ./mappings). All values are pre-formatted strings.
//
//   CarrierRateConfirmationDTO   carrier rate only   — never client rate, margin, client identity, internal notes
//   ShipperRateConfirmationDTO   client rate only    — never carrier rate, carrier identity, margin, internal notes
//   BillOfLadingDTO              no rates at all     — never internal notes

export type PdfLogo = { data: Buffer; format: "png" | "jpg" };

export type PdfCompany = {
  name: string;
  addressLines: string[];
  mcNumber: string | null;
  dotNumber: string | null;
  phone: string | null;
  email: string | null;
  logo: PdfLogo | null;
};

export type PdfField = { label: string; value: string };

export type PdfParty = {
  name: string;
  addressLines: string[];
  phone: string | null;
  details: PdfField[];
};

export type PdfStop = {
  sequence: number;
  action: "Pickup" | "Delivery";
  appointment: string;
  locationName: string;
  addressLines: string[];
  contact: string | null;
  appointmentNumber: string | null;
  references: string | null;
  instructions: string | null;
};

export type PdfPayItem = {
  description: string;
  notes: string;
  quantity: string;
  rate: string;
  amount: string;
};

export type PdfDocumentMeta = {
  title: string;
  loadNumber: number;
  documentDate: string;
  generatedBy: string;
};

export type CarrierRateConfirmationDTO = {
  kind: "CARRIER_RATE_CONFIRMATION";
  meta: PdfDocumentMeta;
  company: PdfCompany;
  summary: PdfField[];
  carrier: PdfParty;
  driver: PdfField[];
  stops: PdfStop[];
  payItems: PdfPayItem[];
  total: string;
  specialInstructions: string | null;
  terms: string[];
  contactLine: string | null;
};

export type ShipperRateConfirmationDTO = {
  kind: "SHIPPER_RATE_CONFIRMATION";
  meta: PdfDocumentMeta;
  company: PdfCompany;
  summary: PdfField[];
  customer: PdfParty;
  stops: PdfStop[];
  payItems: PdfPayItem[];
  total: string;
  specialInstructions: string | null;
  terms: string[];
  paymentInstructions: string | null;
  contactLine: string | null;
};

export type BillOfLadingDTO = {
  kind: "BOL";
  meta: PdfDocumentMeta;
  company: PdfCompany;
  summary: PdfField[];
  customer: PdfParty;
  carrier: PdfParty;
  stops: PdfStop[];
  cargo: string | null;
  specialInstructions: string | null;
  instructions: string | null;
  terms: string[];
};

export type GeneratedDocumentDTO = CarrierRateConfirmationDTO | ShipperRateConfirmationDTO | BillOfLadingDTO;
