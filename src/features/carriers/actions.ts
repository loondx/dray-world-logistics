"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject, success, validationFailure, type ActionResult } from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { requirePermission } from "@/server/auth/guards";
import { createCarrier, setCarrierStatus, updateCarrier } from "@/server/services/carrier.service";

import { carrierSchema } from "./schemas";

export type SavedCarrier = { id: string; legalName: string; mcNumber: string | null };

export async function createCarrierAction(formData: FormData): Promise<ActionResult<SavedCarrier>> {
  return safeAction("createCarrier", async () => {
    const user = await requirePermission("masterdata:write");
    const parsed = carrierSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    const carrier = await createCarrier(parsed.data, user.id);
    revalidatePath("/carriers");
    return success(
      { id: carrier.id, legalName: carrier.legalName, mcNumber: carrier.mcNumber },
      "Carrier saved.",
    );
  });
}

export async function updateCarrierAction(
  id: string,
  formData: FormData,
): Promise<ActionResult<SavedCarrier>> {
  return safeAction("updateCarrier", async () => {
    const user = await requirePermission("masterdata:write");
    const parsed = carrierSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    const carrier = await updateCarrier(id, parsed.data, user.id);
    revalidatePath("/carriers");
    revalidatePath(`/carriers/${id}`);
    return success(
      { id: carrier.id, legalName: carrier.legalName, mcNumber: carrier.mcNumber },
      "Carrier updated.",
    );
  });
}

export async function setCarrierArchivedAction(id: string, archived: boolean): Promise<ActionResult<null>> {
  return safeAction("setCarrierArchived", async () => {
    const user = await requirePermission("masterdata:write");
    await setCarrierStatus(id, archived ? "ARCHIVED" : "ACTIVE", user.id);
    revalidatePath("/carriers");
    revalidatePath(`/carriers/${id}`);
    return success(null, archived ? "Carrier archived." : "Carrier restored.");
  });
}
