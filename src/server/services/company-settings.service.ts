import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { COMPANY_DEFAULTS } from "@/config/company-defaults";
import type { CompanySettings } from "@/generated/prisma/client";
import { db } from "@/lib/db";

const COMPANY_SETTINGS_ID = "company";

// Returns the singleton company profile, creating it from the supplied defaults
// on first use. Cached per request. Always read at request time (never baked in
// at build time) because staff can edit it in Settings.
export const getCompanySettings = cache(async (): Promise<CompanySettings> => {
  await connection();
  const existing = await db.companySettings.findUnique({ where: { id: COMPANY_SETTINGS_ID } });
  if (existing) return existing;

  // Upsert (not create) so two concurrent first requests cannot collide.
  return db.companySettings.upsert({
    where: { id: COMPANY_SETTINGS_ID },
    update: {},
    create: { id: COMPANY_SETTINGS_ID, ...COMPANY_DEFAULTS },
  });
});

// Public, non-sensitive subset suitable for the marketing site header/footer.
export type PublicCompanyProfile = Pick<
  CompanySettings,
  | "legalName"
  | "displayName"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "stateProvince"
  | "postalCode"
  | "country"
  | "phone"
  | "email"
  | "website"
  | "mcNumber"
  | "dotNumber"
>;

export async function getPublicCompanyProfile(): Promise<PublicCompanyProfile> {
  const s = await getCompanySettings();
  return {
    legalName: s.legalName,
    displayName: s.displayName,
    addressLine1: s.addressLine1,
    addressLine2: s.addressLine2,
    city: s.city,
    stateProvince: s.stateProvince,
    postalCode: s.postalCode,
    country: s.country,
    phone: s.phone,
    email: s.email,
    website: s.website,
    // Public carrier registrations (shown as trust signals when set).
    mcNumber: s.mcNumber,
    dotNumber: s.dotNumber,
  };
}
