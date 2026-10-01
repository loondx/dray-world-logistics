"use client";

import { useState } from "react";

import { TextField } from "@/components/forms/field";
import { FormSection } from "@/components/forms/form-section";
import { calculateMargin, formatMoney, marginPercent, normalizeMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";

function safeNormalize(value: string): string | null {
  return normalizeMoneyInput(value) ?? null;
}

// Client rate (what the customer pays) vs carrier rate (what we pay the carrier),
// with live gross margin. These two values never appear on the same external document.
export function RatesSection({
  defaults,
  fieldError,
}: {
  defaults: { clientRate: string; carrierRate: string };
  fieldError: (name: string) => string | undefined;
}) {
  const [clientRate, setClientRate] = useState(defaults.clientRate);
  const [carrierRate, setCarrierRate] = useState(defaults.carrierRate);

  const margin = calculateMargin(safeNormalize(clientRate), safeNormalize(carrierRate));
  const percent = marginPercent(safeNormalize(clientRate), safeNormalize(carrierRate));

  return (
    <FormSection title="Rates (USD)" description="Flat, all-in rates.">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Client rate"
          name="clientRate"
          inputMode="decimal"
          placeholder="0.00"
          value={clientRate}
          onChange={(event) => setClientRate(event.target.value)}
          hint="Shown only on the customer rate confirmation."
          error={fieldError("clientRate")}
        />
        <TextField
          label="Carrier rate"
          name="carrierRate"
          inputMode="decimal"
          placeholder="0.00"
          value={carrierRate}
          onChange={(event) => setCarrierRate(event.target.value)}
          hint="Shown only on the carrier load confirmation."
          error={fieldError("carrierRate")}
        />
      </div>
      <div className="flex items-baseline justify-between rounded-md bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Gross margin</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            margin?.isNegative() ? "text-destructive" : margin ? "text-emerald-700" : "text-muted-foreground",
          )}
        >
          {margin ? formatMoney(margin) : "—"}
          {percent ? <span className="ml-1.5 text-xs font-normal">({percent.toFixed(1)}%)</span> : null}
        </span>
      </div>
    </FormSection>
  );
}
