import { ArrowRight, CircleCheck, Mail, MapPin, Phone } from "lucide-react";

import { QuoteForm } from "@/components/marketing/quote-form";
import { Reveal } from "@/components/marketing/reveal";
import { isDatabaseEnabled } from "@/lib/database-enabled";
import { WHY_POINTS } from "@/config/marketing-content";
import type { PublicCompanyProfile } from "@/server/services/company-settings.service";

export function QuoteSection({ company }: { company: PublicCompanyProfile }) {
  const cityLine = [`${company.city}, ${company.stateProvince}`, company.postalCode]
    .filter(Boolean)
    .join(" ");
  const tel = company.phone ? `tel:${company.phone.replace(/[^\d+]/g, "")}` : null;
  return (
    <section id="quote" aria-labelledby="quote-title" className="scroll-mt-16 bg-[#eef4fb]">
      <div
        id="contact"
        className="mx-auto grid max-w-7xl scroll-mt-20 gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14"
      >
        <Reveal>
          <p className="freight-eyebrow">Your next move starts here</p>
          <h2 id="quote-title" className="freight-heading mt-3">
            Let&apos;s move your freight.
          </h2>
          <p className="mt-4 max-w-md text-base text-slate-600 sm:text-lg">
            Tell us what needs to move and where. We&apos;ll come back to you with a clear, all-in quote.
          </p>

          <ul className="mt-7 grid gap-2.5">
            {tel ? (
              <li>
                <a href={tel} className="contact-option">
                  <Phone className="size-5 text-brand-blue" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-brand-navy">Call us</span>
                    <span className="block text-sm break-all text-slate-500">{company.phone}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 text-slate-400" aria-hidden="true" />
                </a>
              </li>
            ) : null}
            {company.email ? (
              <li>
                <a href={`mailto:${company.email}`} className="contact-option">
                  <Mail className="size-5 text-brand-blue" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-brand-navy">Email us</span>
                    <span className="block text-sm break-all text-slate-500">{company.email}</span>
                  </span>
                  <ArrowRight className="ml-auto size-4 text-slate-400" aria-hidden="true" />
                </a>
              </li>
            ) : null}
          </ul>

          <ul className="mt-8 grid gap-2.5">
            {WHY_POINTS.slice(0, 3).map((point) => (
              <li key={point.title} className="flex items-center gap-3 font-medium text-brand-navy">
                <CircleCheck className="size-5 shrink-0 text-brand-blue" aria-hidden="true" />
                {point.title}
              </li>
            ))}
          </ul>

          <address className="mt-8 flex gap-3 border-t border-slate-300/70 pt-6 text-sm not-italic">
            <MapPin className="mt-0.5 size-5 shrink-0 text-brand-blue" aria-hidden="true" />
            <span>
              <span className="block font-semibold text-brand-navy">{company.legalName}</span>
              <span className="text-slate-600">
                {company.addressLine1}
                {company.addressLine2 ? `, ${company.addressLine2}` : ""}, {cityLine}, {company.country}
              </span>
            </span>
          </address>
        </Reveal>
        <Reveal delay={0.08}>
          {isDatabaseEnabled() ? (
            <QuoteForm phone={company.phone} />
          ) : (
            <div className="rounded-lg bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-brand-navy">Quote requests</h3>
              <p className="mt-3 text-slate-600">
                Online quote requests are temporarily unavailable. Please check back soon.
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
