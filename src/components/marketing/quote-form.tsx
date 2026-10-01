"use client";

import { CheckCircle2, ChevronDown, Phone, Send } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { Field, TextField } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { useActionForm } from "@/components/forms/use-action-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EQUIPMENT_OPTIONS, QUOTE_SERVICE_OPTIONS } from "@/config/marketing-content";
import { submitQuoteRequestAction } from "@/features/quotes/actions";
import { HONEYPOT_FIELD } from "@/features/quotes/schemas";

const control = "[&_input]:h-11 [&_select]:h-11";

/**
 * The website quote request: two short steps (shipment, contact) and an optional panel for
 * equipment, loads, ready date and notes. A direct call link shows when a phone is set.
 */
export function QuoteForm({ phone }: { phone?: string | null }) {
  const [sent, setSent] = useState(false);
  const { pending, onSubmit, fieldError } = useActionForm(submitQuoteRequestAction, {
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
        role="status"
      >
        <CheckCircle2 className="size-12 text-emerald-600" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-brand-navy">Request received</h3>
        <p className="max-w-sm text-slate-600">
          Thank you. Our team will review your shipment and get back to you with a quote.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
      <h3 className="text-xl font-semibold text-brand-navy">Get a quote</h3>
      <p className="mt-1 text-sm text-slate-500">Takes about a minute. Fields marked * are required.</p>

      <form onSubmit={onSubmit} noValidate className="relative mt-6 grid gap-6">
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input type="hidden" name="kind" value="QUOTE" />

        <Step n={1} title="Your shipment">
          <Field label="Service" required error={fieldError("serviceType")} className={control}>
            {(props) => (
              <NativeSelect {...props} name="serviceType" defaultValue="">
                <option value="" disabled>
                  Choose a service
                </option>
                {QUOTE_SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            )}
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Pickup from"
              name="origin"
              placeholder="Port, city or postal code"
              error={fieldError("origin")}
              className={control}
            />
            <TextField
              label="Deliver to"
              name="destination"
              placeholder="City or postal code"
              error={fieldError("destination")}
              className={control}
            />
          </div>
        </Step>

        <Step n={2} title="Your details">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Name"
              name="name"
              required
              autoComplete="name"
              error={fieldError("name")}
              className={control}
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              error={fieldError("email")}
              className={control}
            />
            <TextField
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              error={fieldError("phone")}
              className={control}
            />
            <TextField
              label="Company"
              name="company"
              autoComplete="organization"
              error={fieldError("company")}
              className={control}
            />
          </div>
        </Step>

        <details
          className="group rounded-xl border border-slate-200 px-4 py-3"
          open={Boolean(fieldError("equipment") || fieldError("loadCount") || fieldError("readyDate"))}
        >
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-sm font-medium text-brand-navy">
            More details (optional)
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Equipment" error={fieldError("equipment")} className={control}>
              {(props) => (
                <NativeSelect {...props} name="equipment" defaultValue="">
                  <option value="">Select…</option>
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>
            <TextField
              label="Loads"
              name="loadCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              placeholder="1"
              error={fieldError("loadCount")}
              className={control}
            />
            <TextField
              label="Ready date"
              name="readyDate"
              type="date"
              error={fieldError("readyDate")}
              className={control}
            />
            <label className="grid gap-1.5 text-xs font-medium text-foreground/80 sm:col-span-3">
              Notes
              <Textarea name="message" rows={3} placeholder="Weight, commodity, hazmat, appointment times…" />
            </label>
          </div>
        </details>

        <SubmitButton pending={pending} pendingLabel="Sending…" size="lg" className="h-12 text-base">
          <Send /> Get my quote
        </SubmitButton>
        <p className="-mt-2 text-center text-xs text-slate-500">
          We only use your details to answer this request. See our{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-brand-navy">
            Privacy Policy
          </Link>
          .
        </p>
      </form>

      {phone ? (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-brand-navy hover:bg-slate-50"
        >
          <Phone className="size-4 text-brand-blue" aria-hidden="true" />
          Prefer to talk? Call {phone}
        </a>
      ) : null}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-navy">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-navy text-xs text-white">
          {n}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
