import { ArrowRight, ArrowUp, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { BrandEmblem, BrandWordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/config/marketing-content";
import type { PublicCompanyProfile } from "@/server/services/company-settings.service";

const COMPANY_LINKS = [
  { href: "/#journey", label: "The journey" },
  { href: "/#services", label: "All services" },
  { href: "/#coverage", label: "Coverage" },
  { href: "/#process", label: "How it works" },
  { href: "/#quote", label: "Get a quote" },
] as const;

const heading = "text-xs font-semibold tracking-[0.16em] text-white uppercase";
const link =
  "rounded-sm transition-colors outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand-cyan";

export function SiteFooter({ company }: { company: PublicCompanyProfile }) {
  const regulatory = [
    company.mcNumber ? `MC ${company.mcNumber}` : null,
    company.dotNumber ? `USDOT ${company.dotNumber}` : null,
    company.scacCode ? `SCAC ${company.scacCode}` : null,
  ].filter(Boolean);
  return (
    <footer className="relative bg-brand-navy pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white/75">
      {/* The route ends here: a thin cyan line closing the journey. */}
      <div aria-hidden="true" className="h-1 bg-gradient-to-r from-brand-teal via-brand-cyan to-brand-blue" />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.45fr_1fr_0.8fr_1.1fr] lg:gap-10">
        <div>
          {/* The artwork is drawn for light backgrounds: emblem on a compact white tile,
              company name as live text. */}
          <Link
            href="/"
            aria-label={`${company.displayName}, home`}
            className="group flex w-fit items-center gap-3.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          >
            <span className="rounded-2xl bg-white px-2.5 py-2 shadow-lg shadow-black/20 transition-transform group-hover:-translate-y-0.5">
              <BrandEmblem className="h-11" />
            </span>
            <BrandWordmark name={company.displayName} inverted />
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            Global freight connections, handled and delivered across the USA and Canada, from the port to your
            door.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-white/55">
            <MapPin className="size-3.5 text-brand-cyan" aria-hidden="true" />
            Based in {company.city}, {company.stateProvince} · Serving the USA &amp; Canada
          </p>
        </div>

        <nav aria-label="Services">
          <h2 className={heading}>Services</h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {SERVICES.map((service) => (
              <li key={service.key}>
                <Link href={`/#service-${service.key}`} className={link}>
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className={heading}>Company</h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {COMPANY_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/login" className={link}>
                Staff login
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className={heading}>Contact</h2>
          <address className="mt-4 grid gap-3 text-sm leading-relaxed not-italic">
            <p className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-cyan" aria-hidden="true" />
              <span>
                {company.legalName}
                <br />
                {company.addressLine1}
                {company.addressLine2 ? `, ${company.addressLine2}` : ""}
                <br />
                {company.city}, {company.stateProvince} {company.postalCode}, {company.country}
              </span>
            </p>
            {company.phone ? (
              <a
                href={`tel:${company.phone.replace(/[^\d+]/g, "")}`}
                className={`flex items-center gap-2.5 break-all ${link}`}
              >
                <Phone className="size-4 shrink-0 text-brand-cyan" aria-hidden="true" />
                {company.phone}
              </a>
            ) : null}
            {company.email ? (
              <a href={`mailto:${company.email}`} className={`flex items-center gap-2.5 break-all ${link}`}>
                <Mail className="size-4 shrink-0 text-brand-cyan" aria-hidden="true" />
                {company.email}
              </a>
            ) : null}
          </address>
          <Button asChild size="lg" className="mt-6 h-11 bg-brand-cyan px-5 text-brand-navy hover:bg-white">
            <Link href="/#quote">
              Get a quote <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 border-t border-white/10 px-4 pt-6 text-xs text-white/50 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {company.legalName}. All rights reserved.
          {regulatory.length ? <span className="ml-2">· {regulatory.join(" · ")}</span> : null}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/privacy" className={link}>
              Privacy Policy
            </Link>
            <Link href="/terms" className={link}>
              Terms of Use
            </Link>
          </nav>
          <a href="#main" className={`flex items-center gap-1.5 ${link}`}>
            Back to top <ArrowUp className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
