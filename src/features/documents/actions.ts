"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { failure, success, validationFailure, type ActionResult } from "@/lib/forms/action-result";
import { requiredText } from "@/lib/validation/fields";
import { safeAction } from "@/server/actions/safe-action";
import { AuthorizationError, requirePermission, requireUser } from "@/server/auth/guards";
import { deleteLoadDocument, generateLoadDocument } from "@/server/documents/document.service";
import { canWriteDocumentType } from "@/server/permissions/document-access";

import { DOCUMENT_TYPE_LABELS, isGeneratedDocumentType } from "./document-types";

export type GeneratedDocumentResult = {
  id: string;
  filename: string;
  version: number | null;
  label: string;
  viewUrl: string;
  downloadUrl: string;
};

export async function generateDocumentAction(
  loadId: string,
  type: string,
): Promise<ActionResult<GeneratedDocumentResult>> {
  return safeAction(
    "generateDocument",
    async () => {
      const user = await requireUser();
      if (!isGeneratedDocumentType(type)) return failure("Unknown document type.");
      if (!canWriteDocumentType(user.role, type)) throw new AuthorizationError();

      const document = await generateLoadDocument(loadId, type, user);
      revalidatePath(`/loads/${loadId}`);
      revalidatePath("/documents");
      const base = `/api/documents/${document.id}/download`;
      return success(
        {
          id: document.id,
          filename: document.filename,
          version: document.version,
          label: DOCUMENT_TYPE_LABELS[type],
          viewUrl: `${base}?disposition=inline`,
          downloadUrl: base,
        },
        "Document generated successfully.",
      );
    },
    "The document could not be generated. Please try again.",
  );
}

const deleteSchema = z.object({ reason: requiredText("Reason", 300) });

export async function deleteDocumentAction(
  documentId: string,
  formData: FormData,
): Promise<ActionResult<null>> {
  return safeAction("deleteDocument", async () => {
    const user = await requirePermission("documents:delete");
    const parsed = deleteSchema.safeParse({ reason: formData.get("reason") });
    if (!parsed.success) return validationFailure(parsed.error);

    const { loadId } = await deleteLoadDocument(documentId, parsed.data.reason, user);
    revalidatePath(`/loads/${loadId}`);
    revalidatePath("/documents");
    return success(null, "Document removed.");
  });
}
