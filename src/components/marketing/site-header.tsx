"use client";

import { ArrowRight, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { BrandEmblem, BrandWordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { PublicCompanyProfile } from "@/server/services/company-settings.service";

// `section` is the landing-page section that marks the link as current while in view.
const LINKS = [
  { href: "/#journey", label: "Journey", section: "journey" },
  { href: "/#services", label: "Services", section: "services" },
  { href: "/#coverage", label: "Coverage", section: "coverage" },
  { href: "/#process", label: "How it works", section: "process" },
  { href: "/#contact", label: "Contact", section: "quote" },
] as const;

type Section = (typeof LINKS)[number]["section"];

/** The section whose top has passed 35% of the viewport (null above the first one). */
function currentSection(): Section | null {
  let current: Section | null = null;
  for (const link of LINKS) {
    const el = document.getElementById(link.section);
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = link.section;
  }
  return current;
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function SiteHeader({ company }: { company: PublicCompanyProfile }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<Section | null>(null);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 12);
    setActive(currentSection());
  });
  const place = `${company.city}, ${company.stateProvince}`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-lg focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Contact bar (desktop): folds away once the page scrolls. */}
      <div
        className={cn(
          "hidden overflow-hidden bg-brand-navy text-xs text-white/75 transition-[max-height] duration-300 lg:block",
          scrolled ? "max-h-0" : "max-h-9",
        )}
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-6 px-6">
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 text-brand-cyan" aria-hidden="true" />
            {place} · Containerized logistics across the USA &amp; Canada
          </p>
          <div className="flex items-center gap-5">
            {company.phone ? (
              <a href={telHref(company.phone)} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="size-3.5 text-brand-cyan" aria-hidden="true" />
                {company.phone}
              </a>
            ) : null}
            {company.email ? (
              <a href={`mailto:${company.email}`} className="flex items-center gap-1.5 hover:text-white">
                <Mail className="size-3.5 text-brand-cyan" aria-hidden="true" />
                {company.email}
              </a>
            ) : null}
            <Link href="/login" className="hover:text-white">
              Staff login
            </Link>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "border-b transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-slate-200/80 bg-white/95 shadow-sm backdrop-blur"
            : "border-transparent bg-white/0",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            aria-label={`${company.displayName}, home`}
            className="rounded outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2.5">
              <BrandEmblem priority className="h-10 sm:h-11" />
              <BrandWordmark name={company.displayName} />
            </span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active === link.section ? "location" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none hover:text-brand-navy focus-visible:ring-2 focus-visible:ring-ring",
                  "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-brand-cyan after:transition-transform",
                  active === link.section ? "text-brand-navy after:scale-x-100" : "text-slate-600",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Button asChild size="sm" className="hidden h-10 px-4 sm:inline-flex">
              <Link href="/#quote">
                Get a quote <ArrowRight />
              </Link>
            </Button>
            {company.phone ? (
              <Button asChild variant="ghost" size="icon" className="size-11 lg:hidden">
                <a href={telHref(company.phone)} aria-label={`Call ${company.phone}`}>
                  <Phone />
                </a>
              </Button>
            ) : null}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm gap-0">
                <div className="border-b px-5 pt-5 pb-4">
                  <SheetTitle className="text-left text-brand-navy">{company.displayName}</SheetTitle>
                  <SheetDescription className="text-left">{place} · USA &amp; Canada</SheetDescription>
                </div>
                <nav aria-label="Mobile" className="grid gap-0.5 px-3 py-4">
                  {LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={active === link.section ? "location" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-lg px-3 text-base font-medium hover:bg-slate-100",
                        active === link.section ? "bg-slate-100 text-brand-navy" : "text-slate-700",
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto grid gap-2 border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button asChild size="lg" className="h-12">
                    <Link href="/#quote" onClick={() => setOpen(false)}>
                      Get a quote <ArrowRight />
                    </Link>
                  </Button>
                  {company.phone ? (
                    <Button asChild size="lg" variant="outline" className="h-12">
                      <a href={telHref(company.phone)}>
                        <Phone /> Call {company.phone}
                      </a>
                    </Button>
                  ) : null}
                  {company.email ? (
                    <Button asChild size="lg" variant="outline" className="h-12">
                      <a href={`mailto:${company.email}`}>
                        <Mail /> Email us
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild size="lg" variant="ghost" className="h-11">
                    <Link href="/login">Staff login</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
