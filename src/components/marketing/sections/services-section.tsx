import {
  Anchor,
  Boxes,
  Container,
  Earth,
  Forklift,
  Route,
  Ship,
  TrainFront,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import { QuoteThisLink } from "@/components/marketing/sections/quote-this-link";
import { SERVICE_QUOTE_OPTION, SERVICES, type ServiceKey } from "@/config/marketing-content";

const ICONS: Record<ServiceKey, LucideIcon> = {
  drayage: Container,
  "import-export": Ship,
  ftl: Truck,
  ltl: Boxes,
  otr: Route,
  intermodal: TrainFront,
  port: Anchor,
  yard: Forklift,
  "cross-border": Earth,
};

// Every service the company offers, each with a one-click way to ask for a quote on it.
export function ServicesSection() {
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-16 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="freight-eyebrow">Services</p>
          <h2 id="services-title" className="freight-heading mt-3">
            Every leg of the move. <span className="text-brand-blue">One team.</span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            From the vessel to your dock: containers, rail, truckload and cross-border freight across the USA
            and Canada, planned and dispatched by one team.
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
          {SERVICES.map((service, i) => {
            const Icon = ICONS[service.key];
            return (
              <li key={service.key} id={`service-${service.key}`} className="scroll-mt-24">
                <Reveal delay={(i % 3) * 0.05} className="h-full">
                  <article className="service-card group">
                    <span className="service-icon" aria-hidden="true">
                      <Icon className="size-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-brand-navy">{service.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{service.summary}</p>
                    <QuoteThisLink option={SERVICE_QUOTE_OPTION[service.key]} label={service.name} />
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
