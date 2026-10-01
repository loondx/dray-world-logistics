"use client";

import { ArrowRight } from "lucide-react";

/**
 * "Get a quote" for one service: jumps to the quote form with that service already chosen.
 * A plain #quote link underneath, so it still works before hydration.
 */
export function QuoteThisLink({ option, label }: { option: string; label: string }) {
  return (
    <a
      href="#quote"
      onClick={() => {
        const select = document.querySelector<HTMLSelectElement>('select[name="serviceType"]');
        if (select) select.value = option;
      }}
      className="mt-5 inline-flex min-h-11 items-center gap-1.5 self-start rounded-md text-sm font-semibold text-brand-blue outline-none hover:text-brand-navy focus-visible:ring-2 focus-visible:ring-ring"
    >
      Get a quote <span className="sr-only">for {label}</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </a>
  );
}
