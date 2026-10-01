import { revalidatePath } from "next/cache";

import { isUploadableDocumentType } from "@/features/documents/document-types";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/server/auth/guards";
import { uploadLoadDocument } from "@/server/documents/document.service";
import { UserFacingError } from "@/server/errors";
import { canWriteDocumentType } from "@/server/permissions/document-access";

// Multipart overhead allowance on top of the file-size limit.
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_NOTES_LENGTH = 500;

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Upload POD / COD / other documents to a load (multipart/form-data: file, type, notes).
export async function POST(request: Request, { params }: RouteContext<"/api/loads/[id]/documents">) {
  const user = await getCurrentUser();
  if (!user) return json(401, { ok: false, message: "Your session has expired. Please sign in again." });

  const { maxDocumentSizeBytes, MAX_DOCUMENT_SIZE_MB } = getEnv();
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > maxDocumentSizeBytes + MULTIPART_OVERHEAD_BYTES) {
    return json(413, { ok: false, message: `Files must be ${MAX_DOCUMENT_SIZE_MB} MB or smaller.` });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, message: "The upload could not be read. Please try again." });
  }

  const type = form.get("type");
  const file = form.get("file");
  const notesValue = form.get("notes");
  if (typeof type !== "string" || !isUploadableDocumentType(type)) {
    return json(400, { ok: false, message: "Choose a document type." });
  }
  if (!canWriteDocumentType(user.role, type)) {
    return json(403, { ok: false, message: "You do not have permission to upload this document type." });
  }
  if (!(file instanceof File)) return json(400, { ok: false, message: "Choose a file to upload." });

  const notes =
    typeof notesValue === "string" && notesValue.trim() ? notesValue.trim().slice(0, MAX_NOTES_LENGTH) : null;
  const { id: loadId } = await params;

  try {
    const document = await uploadLoadDocument(
      { loadId, type, originalFilename: file.name, data: new Uint8Array(await file.arrayBuffer()), notes },
      user,
    );
    revalidatePath(`/loads/${loadId}`);
    revalidatePath("/documents");
    return json(201, { ok: true, message: "Document uploaded.", document });
  } catch (error) {
    if (error instanceof UserFacingError) return json(400, { ok: false, message: error.message });
    logger.error("Document upload failed", error, { loadId });
    return json(500, { ok: false, message: "The upload failed. Please try again." });
  }
}
