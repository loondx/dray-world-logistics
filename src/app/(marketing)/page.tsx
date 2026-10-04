import type { Metadata } from "next";

import { JourneySpine } from "@/components/marketing/journey/journey-spine";
import { Journey3D } from "@/components/marketing/journey/scene/journey-3d";
import { CoverageSection } from "@/components/marketing/sections/coverage-section";
import { HeroSection } from "@/components/marketing/sections/hero-section";
import { ProcessSection } from "@/components/marketing/sections/process-section";
import { QuoteSection } from "@/components/marketing/sections/quote-section";
import { ServicesSection } from "@/components/marketing/sections/services-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { COMPANY_CONTACTS, COMPANY_DEFAULTS } from "@/config/company-defaults";
import { SITE_DESCRIPTION } from "@/config/marketing-content";
import { siteUrl } from "@/lib/site-url";
import { pageSocialMetadata } from "@/lib/social-metadata";
import { getPublicCompanyProfile } from "@/server/services/company-settings.service";

const TITLE = `${COMPANY_DEFAULTS.displayName} | Containerized Logistics, Port to Door`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: SITE_DESCRIPTION,
  ...pageSocialMetadata(TITLE, SITE_DESCRIPTION, "/"),
};

export default async function HomePage() {
  const company = await getPublicCompanyProfile();

  // Structured data (Google, link previews) from confirmed company details only.
  const url = siteUrl().toString();
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
    url,
    logo: new URL("/icon.png", url).toString(),
    description: SITE_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      streetAddress: [company.addressLine1, company.addressLine2].filter(Boolean).join(", "),
      addressLocality: company.city,
      addressRegion: company.stateProvince,
      postalCode: company.postalCode,
      addressCountry: company.country,
    },
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.email ? { email: company.email } : {}),
    ...(COMPANY_DEFAULTS.dunsNumber ? { duns: COMPANY_DEFAULTS.dunsNumber } : {}),
    identifier: [
      company.mcNumber ? { "@type": "PropertyValue", propertyID: "MC", value: company.mcNumber } : null,
      company.dotNumber ? { "@type": "PropertyValue", propertyID: "USDOT", value: company.dotNumber } : null,
      company.scacCode ? { "@type": "PropertyValue", propertyID: "SCAC", value: company.scacCode } : null,
    ].filter(Boolean),
    areaServed: ["US", "CA"],
    contactPoint: COMPANY_CONTACTS.map((person) => ({
      "@type": "ContactPoint",
      name: person.name,
      contactType: person.title,
      telephone: person.phone,
      email: person.email,
      areaServed: ["US", "CA"],
      availableLanguage: "English",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output; "<" escaped so it can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }}
      />
      <SiteHeader company={company} />
      <main id="main" className="relative flex-1">
        <JourneySpine />
        <HeroSection />
        <Journey3D />
        <ServicesSection />
        <CoverageSection />
        <ProcessSection />
        <QuoteSection company={company} />
      </main>
      <SiteFooter company={company} />
    </>
  );
}
