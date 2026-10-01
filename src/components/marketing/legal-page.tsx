import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import type { PublicCompanyProfile } from "@/server/services/company-settings.service";

// Shared layout for the public legal pages (privacy, terms).
export function LegalPage({
  company,
  title,
  updated,
  intro,
  children,
}: {
  company: PublicCompanyProfile;
  title: string;
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader company={company} />
      <main id="main" className="flex-1 bg-white">
        <div className="hero-sky border-b border-slate-200/70">
          <div className="mx-auto max-w-3xl px-4 pt-28 pb-10 sm:px-6 sm:pt-32">
            <p className="freight-eyebrow">Legal</p>
            <h1 className="freight-heading mt-3">{title}</h1>
            <p className="mt-3 text-sm text-slate-500">Last updated: {updated}</p>
            <div className="mt-5 text-base text-slate-700 sm:text-lg">{intro}</div>
          </div>
        </div>
        <article className="legal-prose mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">{children}</article>
        <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
          <Link href="/" className="text-sm font-semibold text-brand-blue hover:underline">
            ← Back to {company.displayName}
          </Link>
        </div>
      </main>
      <SiteFooter company={company} />
    </>
  );
}

/** Contact lines for the legal pages, from the company profile only. */
export function CompanyContact({ company }: { company: PublicCompanyProfile }) {
  return (
    <address className="not-italic">
      <strong>{company.legalName}</strong>
      <br />
      {company.addressLine1}
      {company.addressLine2 ? `, ${company.addressLine2}` : ""}
      <br />
      {company.city}, {company.stateProvince} {company.postalCode}, {company.country}
      {company.email ? (
        <>
          <br />
          Email: <a href={`mailto:${company.email}`}>{company.email}</a>
        </>
      ) : null}
      {company.phone ? (
        <>
          <br />
          Phone: <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`}>{company.phone}</a>
        </>
      ) : null}
    </address>
  );
}
