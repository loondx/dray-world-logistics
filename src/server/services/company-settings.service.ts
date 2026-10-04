import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { COMPANY_CONTACTS, COMPANY_DEFAULTS, type CompanyContact } from "@/config/company-defaults";
import type { CompanySettings } from "@/generated/prisma/client";
import { isDatabaseEnabled } from "@/lib/database-enabled";
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
  | "scacCode"
> & { contacts: readonly CompanyContact[] };

export async function getPublicCompanyProfile(): Promise<PublicCompanyProfile> {
  await connection();
  if (!isDatabaseEnabled()) {
    return {
      legalName: COMPANY_DEFAULTS.legalName,
      displayName: COMPANY_DEFAULTS.displayName,
      addressLine1: COMPANY_DEFAULTS.addressLine1,
      addressLine2: COMPANY_DEFAULTS.addressLine2,
      city: COMPANY_DEFAULTS.city,
      stateProvince: COMPANY_DEFAULTS.stateProvince,
      postalCode: COMPANY_DEFAULTS.postalCode,
      country: COMPANY_DEFAULTS.country,
      phone: COMPANY_DEFAULTS.phone,
      email: COMPANY_DEFAULTS.email,
      website: COMPANY_DEFAULTS.website,
      mcNumber: COMPANY_DEFAULTS.mcNumber,
      dotNumber: COMPANY_DEFAULTS.dotNumber,
      scacCode: COMPANY_DEFAULTS.scacCode,
      contacts: COMPANY_CONTACTS,
    };
  }
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
    // Settings win; until a main phone/email is entered there, use the confirmed defaults.
    phone: s.phone ?? COMPANY_DEFAULTS.phone,
    email: s.email ?? COMPANY_DEFAULTS.email,
    website: s.website,
    // Public carrier registrations (shown as trust signals when set).
    mcNumber: s.mcNumber,
    dotNumber: s.dotNumber,
    scacCode: s.scacCode,
    contacts: COMPANY_CONTACTS,
  };
}
