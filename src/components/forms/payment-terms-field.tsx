"use client";

import { Field } from "@/components/forms/field";
import { NativeSelect } from "@/components/forms/native-select";

// Standard net terms. A value saved earlier that is not in the list (e.g. 20) stays selectable.
const STANDARD_TERMS = [0, 7, 10, 15, 30, 45, 60, 90] as const;

function label(days: number): string {
  return days === 0 ? "Due on receipt" : `Net ${days}`;
}

export function PaymentTermsField({
  name,
  label: fieldLabel,
  emptyLabel,
  hint,
  defaultValue,
  error,
  className,
}: {
  name: string;
  label: string;
  emptyLabel: string;
  hint?: string;
  defaultValue: number | null | undefined;
  error?: string;
  className?: string;
}) {
  const options: number[] = [...STANDARD_TERMS];
  if (defaultValue != null && !options.includes(defaultValue)) {
    options.push(defaultValue);
    options.sort((a, b) => a - b);
  }
  return (
    <Field label={fieldLabel} hint={hint} error={error} className={className}>
      {(props) => (
        <NativeSelect {...props} name={name} defaultValue={defaultValue?.toString() ?? ""}>
          <option value="">{emptyLabel}</option>
          {options.map((days) => (
            <option key={days} value={days}>
              {label(days)}
            </option>
          ))}
        </NativeSelect>
      )}
    </Field>
  );
}
