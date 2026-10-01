// The ONLY place company details appear in source code. They seed the
// CompanySettings database row the first time it is read; after that, staff
// edit them in Settings → Company, and every page / PDF reads the database row.
//
// Address confirmed by the client (province ON = Ontario, Canada).
// Unknown details (phone, email, MC/DOT numbers, terms, payment instructions)
// are left empty rather than invented — staff fill them in under Settings.
export const COMPANY_DEFAULTS = {
  legalName: "DRAY-WORLD LOGISTICS INC",
  displayName: "DRAY-WORLD LOGISTICS INC",
  addressLine1: "9 Nom Crescent Unit 2",
  addressLine2: null,
  city: "Markham",
  stateProvince: "ON",
  postalCode: "L3S 2B3",
  country: "Canada",
} as const;
