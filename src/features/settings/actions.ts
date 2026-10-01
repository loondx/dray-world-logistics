"use server";

import { revalidatePath } from "next/cache";

import {
  failure,
  formDataToObject,
  success,
  validationFailure,
  type ActionResult,
} from "@/lib/forms/action-result";
import { safeAction } from "@/server/actions/safe-action";
import { requirePermission } from "@/server/auth/guards";
import {
  removeCompanyLogo,
  replaceCompanyLogo,
  setNextLoadNumber,
  updateCompanyDetails,
  updateDocumentTerms,
} from "@/server/services/settings.service";
import { createUser, resetUserPassword, setUserActive } from "@/server/services/user-admin.service";

import {
  companyDetailsSchema,
  documentTermsSchema,
  loadNumberSchema,
  newUserSchema,
  resetPasswordSchema,
} from "./schemas";

// Company details appear on every page and PDF.
function revalidateEverywhere() {
  revalidatePath("/", "layout");
}

export async function updateCompanyDetailsAction(formData: FormData): Promise<ActionResult<null>> {
  return safeAction("updateCompanyDetails", async () => {
    const user = await requirePermission("settings:manage");
    const parsed = companyDetailsSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    await updateCompanyDetails(parsed.data, user.id);
    revalidateEverywhere();
    return success(null, "Company details saved.");
  });
}

export async function updateDocumentTermsAction(formData: FormData): Promise<ActionResult<null>> {
  return safeAction("updateDocumentTerms", async () => {
    const user = await requirePermission("settings:manage");
    const parsed = documentTermsSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    await updateDocumentTerms(parsed.data, user.id);
    revalidatePath("/settings");
    return success(null, "Document terms saved. New documents will use them.");
  });
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult<null>> {
  return safeAction("uploadLogo", async () => {
    const user = await requirePermission("settings:manage");
    const file = formData.get("logo");
    if (!(file instanceof File) || file.size === 0)
      return failure("Choose a PNG or JPG file.", { logo: ["Choose a PNG or JPG file."] });
    await replaceCompanyLogo(new Uint8Array(await file.arrayBuffer()), user.id);
    revalidatePath("/settings");
    return success(null, "Logo updated. It will appear on newly generated documents.");
  });
}

export async function removeLogoAction(): Promise<ActionResult<null>> {
  return safeAction("removeLogo", async () => {
    const user = await requirePermission("settings:manage");
    await removeCompanyLogo(user.id);
    revalidatePath("/settings");
    return success(null, "Logo removed.");
  });
}

export async function setNextLoadNumberAction(formData: FormData): Promise<ActionResult<null>> {
  return safeAction("setNextLoadNumber", async () => {
    const user = await requirePermission("settings:manage");
    const parsed = loadNumberSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    await setNextLoadNumber(parsed.data.nextLoadNumber, user.id);
    revalidatePath("/settings");
    return success(null, `The next load will be #${parsed.data.nextLoadNumber}.`);
  });
}

export async function createUserAction(formData: FormData): Promise<ActionResult<null>> {
  return safeAction("createUser", async () => {
    const user = await requirePermission("settings:manage");
    const parsed = newUserSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    await createUser(parsed.data, user.id);
    revalidatePath("/settings");
    return success(null, `User ${parsed.data.email} created. Share the password securely.`);
  });
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<ActionResult<null>> {
  return safeAction("setUserActive", async () => {
    const user = await requirePermission("settings:manage");
    await setUserActive(userId, active, user.id);
    revalidatePath("/settings");
    return success(null, active ? "User reactivated." : "User deactivated and signed out.");
  });
}

export async function resetUserPasswordAction(
  userId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  return safeAction("resetUserPassword", async () => {
    const user = await requirePermission("settings:manage");
    const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) return validationFailure(parsed.error);
    await resetUserPassword(userId, parsed.data.password, user.id);
    revalidatePath("/settings");
    return success(null, "Password reset. The user was signed out everywhere.");
  });
}
