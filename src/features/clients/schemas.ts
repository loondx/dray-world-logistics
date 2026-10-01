import { z } from "zod";

import { addressFields } from "@/lib/validation/address";
import {
  optionalEmail,
  optionalLongText,
  optionalPhone,
  optionalText,
  requiredText,
} from "@/lib/validation/fields";

export const clientSchema = z.object({
  companyName: requiredText("Company name", 200),
  contactName: optionalText(120),
  email: optionalEmail,
  phone: optionalPhone,
  ...addressFields,
  mcNumber: optionalText(30),
  dotNumber: optionalText(30),
  notes: optionalLongText,
});

export type ClientInput = z.infer<typeof clientSchema>;
