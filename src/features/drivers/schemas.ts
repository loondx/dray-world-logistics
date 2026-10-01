import { z } from "zod";

import {
  optionalEmail,
  optionalLongText,
  optionalPhone,
  optionalText,
  requiredId,
  requiredText,
} from "@/lib/validation/fields";

export const driverSchema = z.object({
  carrierId: requiredId("carrier"),
  firstName: requiredText("First name", 80),
  lastName: optionalText(80),
  phone: optionalPhone,
  email: optionalEmail,
  truckNumber: optionalText(40),
  trailerNumber: optionalText(40),
  notes: optionalLongText,
});

export type DriverInput = z.infer<typeof driverSchema>;
