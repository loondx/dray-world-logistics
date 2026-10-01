"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject, success, validationFailure, type ActionResult } from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { requirePermission } from "@/server/auth/guards";
import { createClient, setClientStatus, updateClient } from "@/server/services/client.service";

import { clientSchema } from "./schemas";

export type SavedClient = { id: string; companyName: string };

export async function createClientAction(formData: FormData): Promise<ActionResult<SavedClient>> {
  return safeAction("createClient", async () => {
    const user = await requirePermission("masterdata:write");
    const parsed = clientSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    const client = await createClient(parsed.data, user.id);
    revalidatePath("/clients");
    return success({ id: client.id, companyName: client.companyName }, "Client saved.");
  });
}

export async function updateClientAction(id: string, formData: FormData): Promise<ActionResult<SavedClient>> {
  return safeAction("updateClient", async () => {
    const user = await requirePermission("masterdata:write");
    const parsed = clientSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    const client = await updateClient(id, parsed.data, user.id);
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return success({ id: client.id, companyName: client.companyName }, "Client updated.");
  });
}

export async function setClientArchivedAction(id: string, archived: boolean): Promise<ActionResult<null>> {
  return safeAction("setClientArchived", async () => {
    const user = await requirePermission("masterdata:write");
    await setClientStatus(id, archived ? "ARCHIVED" : "ACTIVE", user.id);
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return success(null, archived ? "Client archived." : "Client restored.");
  });
}
