"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject, success, validationFailure, type ActionResult } from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { requirePermission } from "@/server/auth/guards";
import { addLoadCharge, removeLoadCharge } from "@/server/services/load-charge.service";

import { loadChargeSchema } from "./schemas";

function revalidateLoad(loadId: string) {
  revalidatePath(`/loads/${loadId}`);
  revalidatePath("/dashboard");
}

export async function addLoadChargeAction(loadId: string, formData: FormData): Promise<ActionResult<null>> {
  return safeAction("addLoadCharge", async () => {
    const user = await requirePermission("financials:write");
    const parsed = loadChargeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    await addLoadCharge(loadId, parsed.data, user.id);
    revalidateLoad(loadId);
    return success(null, "Charge added. Regenerate the invoice to include it.");
  });
}

export async function removeLoadChargeAction(chargeId: string): Promise<ActionResult<null>> {
  return safeAction("removeLoadCharge", async () => {
    const user = await requirePermission("financials:write");
    const { loadId } = await removeLoadCharge(chargeId, user.id);
    revalidateLoad(loadId);
    return success(null, "Charge removed.");
  });
}
