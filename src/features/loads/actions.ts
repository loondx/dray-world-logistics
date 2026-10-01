"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject, success, validationFailure, type ActionResult } from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { can, requirePermission } from "@/server/auth/guards";
import { changeLoadStatus, createLoad, updateLoad } from "@/server/services/load.service";

import { loadSchema, statusChangeSchema } from "./schemas";
import { LOAD_STATUS_LABELS } from "./status";

export type SavedLoad = { id: string; loadNumber: number };

export async function createLoadAction(formData: FormData): Promise<ActionResult<SavedLoad>> {
  return safeAction(
    "createLoad",
    async () => {
      const user = await requirePermission("loads:write");
      const parsed = loadSchema.safeParse(formDataToObject(formData));
      if (!parsed.success) return validationFailure(parsed.error);

      const load = await createLoad(parsed.data, {
        userId: user.id,
        canWriteRates: can(user, "financials:write"),
      });
      revalidatePath("/loads");
      revalidatePath("/dashboard");
      return success(load, `Load #${load.loadNumber} created.`);
    },
    "Unable to save load. Please verify the highlighted fields and try again.",
  );
}

export async function updateLoadAction(id: string, formData: FormData): Promise<ActionResult<SavedLoad>> {
  return safeAction(
    "updateLoad",
    async () => {
      const user = await requirePermission("loads:write");
      const parsed = loadSchema.safeParse(formDataToObject(formData));
      if (!parsed.success) return validationFailure(parsed.error);

      const load = await updateLoad(id, parsed.data, {
        userId: user.id,
        canWriteRates: can(user, "financials:write"),
      });
      revalidatePath("/loads");
      revalidatePath(`/loads/${id}`);
      return success(load, `Load #${load.loadNumber} updated.`);
    },
    "Unable to save load. Please verify the highlighted fields and try again.",
  );
}

export async function changeLoadStatusAction(
  loadId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  return safeAction("changeLoadStatus", async () => {
    const user = await requirePermission("loads:write");
    const parsed = statusChangeSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    await changeLoadStatus(loadId, parsed.data.status, parsed.data.notes, user.id);
    revalidatePath("/loads");
    revalidatePath(`/loads/${loadId}`);
    revalidatePath("/dashboard");
    return success(null, `Status changed to ${LOAD_STATUS_LABELS[parsed.data.status]}.`);
  });
}
