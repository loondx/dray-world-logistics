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
import { COMPANY_DEFAULTS } from "@/config/company-defaults";
import { getPublicCompanyProfile } from "@/server/services/company-settings.service";

const DESCRIPTION =
  "Global freight connections, handled and delivered across the USA and Canada. Containerized logistics from port to final delivery: import/export containers, port transportation, drayage, yard, rail/intermodal, OTR, FTL and LTL.";

export const metadata: Metadata = {
  title: { absolute: `${COMPANY_DEFAULTS.displayName} | Containerized Logistics, Port to Door` },
  description: DESCRIPTION,
  openGraph: { title: COMPANY_DEFAULTS.displayName, description: DESCRIPTION, type: "website" },
};

export default async function HomePage() {
  const company = await getPublicCompanyProfile();

  // Structured data from confirmed company details only.
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.legalName,
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
