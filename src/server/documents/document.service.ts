import "server-only";

import { documentFilename, type GeneratedDocumentType } from "@/features/documents/document-types";
import { renderPdf } from "@/lib/pdf/render";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import type { SessionUser } from "@/server/auth/session";
import { getCompanySettings } from "@/server/services/company-settings.service";

import { buildDocumentContext } from "./document-context";
import { buildDocumentDTO } from "./document-dtos";

// Builds a load document from the load's current data and returns the PDF bytes.
// Nothing is stored: the file goes straight to the browser. The audit log records
// who downloaded which document and when.
export async function renderLoadDocument(
  loadId: string,
  type: GeneratedDocumentType,
  user: SessionUser,
): Promise<{ pdf: Buffer; filename: string }> {
  const context = await buildDocumentContext(await getCompanySettings());
  const dto = await buildDocumentDTO(type, loadId, context);
  const pdf = await renderPdf(dto);
  await recordAudit({
    action: AUDIT_ACTIONS.DOCUMENT_GENERATED,
    entityType: AUDIT_ENTITIES.LOAD,
    entityId: loadId,
    userId: user.id,
    metadata: { loadNumber: dto.meta.loadNumber, type },
  });
  return { pdf, filename: documentFilename(type, dto.meta.loadNumber) };
}
