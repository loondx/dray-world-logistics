import { CircleCheck, Mail, MapPin, Phone } from "lucide-react";

import { QuoteForm } from "@/components/marketing/quote-form";
import { Reveal } from "@/components/marketing/reveal";
import { isDatabaseEnabled } from "@/lib/database-enabled";
import { WHY_POINTS } from "@/config/marketing-content";
import type { PublicCompanyProfile } from "@/server/services/company-settings.service";

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function QuoteSection({ company }: { company: PublicCompanyProfile }) {
  const cityLine = [`${company.city}, ${company.stateProvince}`, company.postalCode]
    .filter(Boolean)
    .join(" ");
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

          <h3 className="mt-7 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Talk to our team
          </h3>
          <ul className="mt-3 grid gap-3">
            {company.contacts.map((person) => (
              <li
                key={person.email}
                className="rounded-[0.9rem] bg-white p-4 shadow-[0_0_0_1px_rgb(15_22_49/0.08)]"
              >
                <p className="font-semibold text-brand-navy">{person.name}</p>
                <p className="text-xs font-medium tracking-wide text-brand-blue uppercase">{person.title}</p>
                <div className="mt-3 grid gap-1.5 text-sm">
                  <a
                    href={telHref(person.phone)}
                    className="flex items-center gap-2 text-slate-700 hover:text-brand-blue"
                    aria-label={`Call ${person.name}, ${person.phoneLabel.toLowerCase()} ${person.phone}`}
                  >
                    <Phone className="size-4 shrink-0 text-brand-blue" aria-hidden="true" />
                    <span>
                      <span className="text-slate-500">{person.phoneLabel}: </span>
                      {person.phone}
                    </span>
                  </a>
                  <a
                    href={`mailto:${person.email}`}
                    className="flex items-center gap-2 break-all text-slate-700 hover:text-brand-blue"
                  >
                    <Mail className="size-4 shrink-0 text-brand-blue" aria-hidden="true" />
                    {person.email}
                  </a>
                </div>
              </li>
            ))}
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
