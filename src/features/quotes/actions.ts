"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { QuoteRequestStatus } from "@/generated/prisma/enums";
import {
  failure,
  formDataToObject,
  success,
  validationFailure,
  type ActionResult,
} from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { requirePermission } from "@/server/auth/guards";
import { setQuoteRequestStatus, submitQuoteRequest } from "@/server/services/quote.service";

import { HONEYPOT_FIELD, leadRequestSchema } from "./schemas";

// PUBLIC action (no login): website quote request; validated, throttled, honeypot-protected.
export async function submitQuoteRequestAction(formData: FormData): Promise<ActionResult<null>> {
  return safeAction(
    "submitQuoteRequest",
    async () => {
      const values = formDataToObject(formData);
      if (values[HONEYPOT_FIELD]) {
        // Pretend success so bots don't learn anything.
        return success(null);
      }
      const parsed = leadRequestSchema.safeParse(values);
      if (!parsed.success) return validationFailure(parsed.error);
      await submitQuoteRequest(parsed.data);
      revalidatePath("/quotes");
      return success(null, "Thank you. Your request is in and we'll get back to you shortly.");
    },
    "We couldn't send your request right now. Please try again or contact us directly.",
  );
}

const statusSchema = z.enum(QuoteRequestStatus);

export async function setQuoteStatusAction(id: string, status: string): Promise<ActionResult<null>> {
  return safeAction("setQuoteStatus", async () => {
    await requirePermission("quotes:write");
    const parsed = statusSchema.safeParse(status);
    if (!parsed.success) return failure("Unknown status.");
    await setQuoteRequestStatus(id, parsed.data);
    revalidatePath("/quotes");
    return success(null, "Quote request updated.");
  });
}
