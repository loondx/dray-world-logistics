import { z } from "zod";

import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-policy";
import { UserRole } from "@/generated/prisma/enums";
import {
  optionalEmail,
  optionalLongText,
  optionalPhone,
  optionalText,
  requiredText,
} from "@/lib/validation/fields";

export const companyDetailsSchema = z.object({
  legalName: requiredText("Legal name", 200),
  displayName: requiredText("Display name", 200),
  addressLine1: requiredText("Address", 200),
  addressLine2: optionalText(200),
  city: requiredText("City", 100),
  stateProvince: requiredText("Province / state", 50),
  postalCode: requiredText("Postal code", 20),
  country: requiredText("Country", 60),
  phone: optionalPhone,
  operationsPhone: optionalPhone,
  email: optionalEmail,
  operationsEmail: optionalEmail,
  website: optionalText(200),
  mcNumber: optionalText(30),
  dotNumber: optionalText(30),
  businessNumber: optionalText(40),
});

export type CompanyDetailsInput = z.infer<typeof companyDetailsSchema>;

export const documentTermsSchema = z.object({
  carrierTerms: optionalLongText,
  shipperTerms: optionalLongText,
  bolInstructions: optionalLongText,
  bolTerms: optionalLongText,
  paymentInstructions: optionalLongText,
});

export type DocumentTermsInput = z.infer<typeof documentTermsSchema>;

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  .max(512);

export const newUserSchema = z.object({
  name: requiredText("Name", 120),
  email: z
    .email("Enter a valid email address.")
    .max(254)
    .transform((value) => value.toLowerCase()),
  role: z.enum(UserRole),
  password,
});

export type NewUserInput = z.infer<typeof newUserSchema>;

export const resetPasswordSchema = z.object({ password });

export const loadNumberSchema = z.object({
  nextLoadNumber: z.coerce
    .number({ error: "Enter a whole number." })
    .int("Enter a whole number.")
    .min(1, "Enter a positive number.")
    .max(2_000_000_000, "Number is too large."),
});
