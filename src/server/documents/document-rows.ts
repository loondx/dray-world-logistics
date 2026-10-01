import "server-only";

import type { Document } from "@/generated/prisma/client";
import type { DocumentRow } from "@/components/documents/document-list-types";
import { formatTimestamp } from "@/lib/dates";
import type { SessionUser } from "@/server/auth/session";
import { canViewDocumentType } from "@/server/permissions/document-access";
import { getUserNames } from "@/server/services/user.service";

type DocumentRecord = Pick<
  Document,
  | "id"
  | "type"
  | "source"
  | "version"
  | "originalFilename"
  | "mimeType"
  | "sizeBytes"
  | "notes"
  | "createdAt"
  | "createdById"
>;

// Strips storage internals (storageKey, sha256) and resolves display names.
export async function toDocumentRows(documents: DocumentRecord[], user: SessionUser): Promise<DocumentRow[]> {
  const names = await getUserNames(documents.map((document) => document.createdById));
  return documents.map((document) => ({
    id: document.id,
    type: document.type,
    source: document.source,
    version: document.version,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    notes: document.notes,
    createdAt: formatTimestamp(document.createdAt),
    createdByName: (document.createdById && names.get(document.createdById)) || "System",
    canView: canViewDocumentType(user.role, document.type),
  }));
}
