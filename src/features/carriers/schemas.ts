import { z } from "zod";

import { addressFields } from "@/lib/validation/address";
import {
  optionalDateOnly,
  optionalEmail,
  optionalLongText,
  optionalPhone,
  optionalText,
  requiredText,
} from "@/lib/validation/fields";

export const carrierSchema = z.object({
  legalName: requiredText("Carrier legal name", 200),
  dba: optionalText(200),
  mcNumber: optionalText(30),
  dotNumber: optionalText(30),
  contactPerson: optionalText(120),
  phone: optionalPhone,
  email: optionalEmail,
  ...addressFields,
  insuranceCompany: optionalText(200),
  insurancePolicyNumber: optionalText(100),
  insuranceExpiry: optionalDateOnly,
  notes: optionalLongText,
});

export type CarrierInput = z.infer<typeof carrierSchema>;
