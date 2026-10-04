import { z } from "zod";

import { EQUIPMENT_OPTIONS, QUOTE_SERVICE_OPTIONS } from "@/config/marketing-content";
import {
  optionalDateOnly,
  optionalEmail,
  optionalPhone,
  optionalText,
  requiredText,
} from "@/lib/validation/fields";

// Hidden field humans never fill in; bots usually do.
export const HONEYPOT_FIELD = "company_website";

export const quoteRequestSchema = z.object({
  kind: z.literal("QUOTE"),
  name: requiredText("Your name", 120),
  company: optionalText(200),
  email: z
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: optionalPhone,
  serviceType: z.enum(QUOTE_SERVICE_OPTIONS, { error: "Choose a service." }),
  origin: optionalText(200),
  destination: optionalText(200),
  equipment: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .enum(EQUIPMENT_OPTIONS, { error: "Choose the equipment from the list." })
      .optional()
      .transform((value) => value ?? null),
  ),
  loadCount: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce
      .number({ error: "Enter a whole number." })
      .int("Enter a whole number.")
      .min(1, "At least 1.")
      .max(999, "Up to 999. Tell us more in the notes.")
      .optional()
      .transform((value) => value ?? null),
  ),
  readyDate: optionalDateOnly,
  message: optionalText(2000),
});

// Older clients may omit `kind`; it is always a quote request. (Call-back requests were
// retired from the website; earlier ones remain in the database and the dashboard.)
export const leadRequestSchema = z.preprocess(
  (value) => (value && typeof value === "object" ? { ...value, kind: "QUOTE" } : value),
  quoteRequestSchema,
);

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type LeadRequestInput = z.infer<typeof leadRequestSchema>;

// Lead entered by staff (phone call, email, walk-in). Only a name and one way to reach
// the person are required; everything else is optional and mirrors the website form.
export const staffLeadSchema = z
  .object({
    name: requiredText("Name", 120),
    company: optionalText(200),
    email: optionalEmail,
    phone: optionalPhone,
    serviceType: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(QUOTE_SERVICE_OPTIONS, { error: "Choose a service from the list." })
        .optional()
        .transform((value) => value ?? null),
    ),
    origin: optionalText(200),
    destination: optionalText(200),
    equipment: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(EQUIPMENT_OPTIONS, { error: "Choose the equipment from the list." })
        .optional()
        .transform((value) => value ?? null),
    ),
    loadCount: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.coerce
        .number({ error: "Enter a whole number." })
        .int("Enter a whole number.")
        .min(1, "At least 1.")
        .max(999, "Up to 999.")
        .optional()
        .transform((value) => value ?? null),
    ),
    readyDate: optionalDateOnly,
    message: optionalText(2000),
  })
  .refine((lead) => lead.email || lead.phone, {
    message: "Enter a phone number or an email.",
    path: ["phone"],
  });

export type StaffLeadInput = z.infer<typeof staffLeadSchema>;
