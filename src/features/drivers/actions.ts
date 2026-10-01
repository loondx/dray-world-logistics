"use server";

import { revalidatePath } from "next/cache";

import { formDataToObject, success, validationFailure, type ActionResult } from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { requirePermission } from "@/server/auth/guards";
import { createDriver, setDriverActive, updateDriver } from "@/server/services/driver.service";

import { driverSchema } from "./schemas";

export type SavedDriver = {
  id: string;
  carrierId: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
};

function toSaved(driver: SavedDriver): SavedDriver {
  const { id, carrierId, firstName, lastName, phone, truckNumber, trailerNumber } = driver;
  return { id, carrierId, firstName, lastName, phone, truckNumber, trailerNumber };
}

function revalidateDriverPages(carrierId: string) {
  revalidatePath("/drivers");
  revalidatePath(`/carriers/${carrierId}`);
}

export async function createDriverAction(formData: FormData): Promise<ActionResult<SavedDriver>> {
  return safeAction("createDriver", async () => {
    const user = await requirePermission("masterdata:write");
    const parsed = driverSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    const driver = await createDriver(parsed.data, user.id);
    revalidateDriverPages(driver.carrierId);
    return success(toSaved(driver), "Driver saved.");
  });
}

export async function updateDriverAction(id: string, formData: FormData): Promise<ActionResult<SavedDriver>> {
  return safeAction("updateDriver", async () => {
    const user = await requirePermission("masterdata:write");
    const parsed = driverSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);

    const driver = await updateDriver(id, parsed.data, user.id);
    revalidateDriverPages(driver.carrierId);
    return success(toSaved(driver), "Driver updated.");
  });
}

export async function setDriverActiveAction(id: string, active: boolean): Promise<ActionResult<null>> {
  return safeAction("setDriverActive", async () => {
    const user = await requirePermission("masterdata:write");
    await setDriverActive(id, active, user.id);
    revalidatePath("/drivers");
    return success(null, active ? "Driver reactivated." : "Driver deactivated.");
  });
}
