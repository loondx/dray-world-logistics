import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/server/auth/guards";
import { getDocumentForDownload } from "@/server/documents/document.service";
import { canViewDocumentType } from "@/server/permissions/document-access";
import { openStoredFileStream } from "@/server/storage/file-storage";

const SERVABLE_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function jsonError(status: number, message: string) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

// RFC 6266 / 5987: ASCII fallback plus UTF-8 filename.
function contentDisposition(kind: "inline" | "attachment", filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// 1. authenticate  2. authorize  3. look up by database id  4. path derived server-side
// and verified under the storage root (inside openStoredFileStream)  5. stream.
export async function GET(request: Request, { params }: RouteContext<"/api/documents/[id]/download">) {
  const user = await getCurrentUser();
  if (!user) return jsonError(401, "Authentication required.");

  const { id } = await params;
  const document = await getDocumentForDownload(id);
  if (!document) return jsonError(404, "Document not found.");
  if (!canViewDocumentType(user.role, document.type))
    return jsonError(403, "You do not have access to this document.");
  if (!SERVABLE_MIME_TYPES.has(document.mimeType)) return jsonError(415, "Unsupported document type.");

  let file;
  try {
    file = await openStoredFileStream(document.storageKey);
  } catch (error) {
    logger.error("Document storage path rejected", error, { documentId: document.id });
    return jsonError(404, "Document not found.");
  }
  if (!file) {
    logger.error("Document file missing from storage", undefined, { documentId: document.id });
    return jsonError(404, "The document file is missing. Please contact an administrator.");
  }

  const disposition =
    new URL(request.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";
  return new Response(file.stream, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": contentDisposition(disposition, document.originalFilename),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
