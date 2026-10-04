// The ONLY place company details appear in source code. They seed the
// CompanySettings database row the first time it is read; after that, staff
// edit them in Settings → Company, and every page / PDF reads the database row.
//
// Address, contacts and registrations confirmed by the client (province ON = Ontario,
// Canada). Unknown details (terms, payment instructions, business number) are left empty
// rather than invented: staff fill them in under Settings.
// `pnpm company:defaults` copies these into the Settings row where a field is still empty.
export const COMPANY_DEFAULTS = {
  legalName: "DRAY-WORLD LOGISTICS INC",
  displayName: "DRAY-WORLD LOGISTICS INC",
  addressLine1: "9 Nom Crescent Unit 2",
  addressLine2: null,
  city: "Markham",
  stateProvince: "ON",
  postalCode: "L3S 2B3",
  country: "Canada",
  // Main line: Administration & Support (see COMPANY_CONTACTS).
  phone: "548-488-1984",
  email: "ops@dray-world.com",
  website: "dray-world.com",
  // Registrations (supplied 2026-10-04).
  mcNumber: "1551033",
  dotNumber: "4078507",
  scacCode: "DRBO",
  dunsNumber: "209238475",
} as const;

// Invoice payment terms when neither the client nor Settings sets any: Net 15
// (confirmed by the client on 2026-10-04).
export const DEFAULT_INVOICE_PAYMENT_TERMS_DAYS = 15;

// People the website lists under "Talk to our team", in display order. Supplied by the
// client on 2026-10-04.
export type CompanyContact = {
  name: string;
  title: string;
  phone: string;
  phoneLabel: string;
  email: string;
};

export const COMPANY_CONTACTS: readonly CompanyContact[] = [
  {
    name: "TJ Singh",
    title: "Administration & Support",
    phone: "548-488-1984",
    phoneLabel: "Phone",
    email: "ops@dray-world.com",
  },
  {
    name: "Rex Martin",
    title: "Operations Manager",
    phone: "825-824-0911",
    phoneLabel: "Direct line",
    email: "adm@dray-world.com",
  },
];

// Official brand emblem (globe, plane, ship, truck) printed on generated PDFs when no
// logo has been uploaded in Settings → Company. Path is relative to the project root;
// next.config.ts traces it into the server bundle.
export const COMPANY_DEFAULT_PDF_LOGO = "src/assets/brand/dray-world-mark.png";
