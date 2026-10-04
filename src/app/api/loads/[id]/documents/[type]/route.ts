import { documentTypeFromSlug } from "@/features/documents/document-types";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/server/auth/guards";
import { renderLoadDocument } from "@/server/documents/document.service";
import { UserFacingError } from "@/server/errors";
import { canViewDocumentType } from "@/server/permissions/document-access";

function textError(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// RFC 6266 / 5987: ASCII fallback plus UTF-8 filename.
function contentDisposition(kind: "inline" | "attachment", filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// 1. authenticate  2. authorize for this document type  3. build the PDF from the
// load's current data  4. send it. Nothing is written to disk or Blob storage.
export async function GET(request: Request, { params }: RouteContext<"/api/loads/[id]/documents/[type]">) {
  const user = await getCurrentUser();
  if (!user) return textError(401, "Please sign in to download documents.");

  const { id, type: slug } = await params;
  const type = documentTypeFromSlug(slug);
  if (!type) return textError(404, "Unknown document.");
  if (!canViewDocumentType(user.role, type))
    return textError(403, "You do not have access to this document.");

  try {
    const { pdf, filename } = await renderLoadDocument(id, type, user);
    const disposition =
      new URL(request.url).searchParams.get("disposition") === "inline" ? "inline" : "attachment";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": contentDisposition(disposition, filename),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof UserFacingError) return textError(409, error.message);
    logger.error("Document could not be generated", error, { loadId: id, type });
    return textError(500, "The document could not be generated. Please try again.");
  }
}
