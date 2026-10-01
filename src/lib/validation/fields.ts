import { z } from "zod";

import { isValidTime, parseDateOnly } from "@/lib/dates";
import { normalizeMoneyInput } from "@/lib/money";

// Reusable field schemas. Inputs arrive as strings from FormData; blank optional
// values become null so the database never stores empty strings.

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export function requiredText(label: string, max = 200) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

export function optionalText(max = 200) {
  return z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .max(max, `Must be ${max} characters or fewer.`)
      .optional()
      .transform((value) => value ?? null),
  );
}

export const optionalLongText = optionalText(4000);

export const optionalEmail = z.preprocess(
  blankToUndefined,
  z
    .email("Enter a valid email address.")
    .max(254)
    .optional()
    .transform((value) => value?.toLowerCase() ?? null),
);

export const optionalPhone = optionalText(40);

export const optionalId = z.preprocess(
  blankToUndefined,
  z
    .string()
    .max(64)
    .optional()
    .transform((value) => value ?? null),
);

export function requiredId(label: string) {
  return z
    .string({ error: `Select a ${label}.` })
    .min(1, `Select a ${label}.`)
    .max(64);
}

export const optionalMoney = z.preprocess(
  blankToUndefined,
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return null;
      const normalized = normalizeMoneyInput(value);
      if (normalized === undefined) {
        ctx.addIssue({ code: "custom", message: "Enter an amount like 1850 or 1850.00." });
        return z.NEVER;
      }
      return normalized;
    }),
);

export const optionalPositiveInt = z.preprocess(
  blankToUndefined,
  z.coerce
    .number({ error: "Enter a whole number." })
    .int("Enter a whole number.")
    .min(0, "Must be zero or more.")
    .max(1_000_000, "Value is too large.")
    .optional()
    .transform((value) => value ?? null),
);

// Weight etc.: up to 2 decimals, kept as a string for Decimal columns.
export const optionalDecimal = z.preprocess(
  (value) => (typeof value === "string" ? blankToUndefined(value.replace(/,/g, "")) : value),
  z
    .string()
    .regex(/^\d{1,9}(\.\d{1,2})?$/, "Enter a number like 27650 or 27650.5.")
    .optional()
    .transform((value) => value ?? null),
);

export function requiredDateOnly(label: string) {
  return z.string({ error: `${label} is required.` }).transform((value, ctx) => {
    const date = parseDateOnly(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: `${label} is required.` });
      return z.NEVER;
    }
    return date;
  });
}

export const optionalDateOnly = z.preprocess(
  blankToUndefined,
  z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return null;
      const date = parseDateOnly(value);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date." });
        return z.NEVER;
      }
      return date;
    }),
);

export const optionalTime = z.preprocess(
  blankToUndefined,
  z
    .string()
    .refine(isValidTime, "Enter a time like 08:00.")
    .optional()
    .transform((value) => value ?? null),
);
