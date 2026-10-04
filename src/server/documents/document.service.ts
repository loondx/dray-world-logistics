import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import type { DocumentType } from "@/generated/prisma/enums";
import {
  GENERATED_FILE_SLUGS,
  type GeneratedDocumentType,
  type UploadableDocumentType,
} from "@/features/documents/document-types";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { renderPdf } from "@/lib/pdf/render";
import { detectFileType, sanitizeDisplayFilename } from "@/lib/storage/file-types";
import { loadGeneratedKey, loadUploadKey } from "@/lib/storage/paths";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import type { SessionUser } from "@/server/auth/session";
import { UserFacingError } from "@/server/errors";
import { getCompanySettings } from "@/server/services/company-settings.service";
import { deleteStoredFile, writeStoredFile } from "@/server/storage/file-storage";

import { buildDocumentContext } from "./document-context";
import { buildDocumentDTO } from "./document-dtos";

export type StoredDocumentSummary = {
  id: string;
  type: DocumentType;
  version: number | null;
  filename: string;
};

const TRANSACTION_TIMEOUT_MS = 20_000;

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

// Runs `body` in a transaction; `writeFile` stores the bytes under a key chosen
// inside the transaction. If anything fails after the write, the file is removed
// so no orphan file (or orphan record) is left behind.
async function persistDocument<T>(
  data: Uint8Array,
  body: (tx: Prisma.TransactionClient, writeFile: (storageKey: string) => Promise<void>) => Promise<T>,
): Promise<T> {
  let writtenKey: string | null = null;
  try {
    return await db.$transaction(
      (tx) =>
        body(tx, async (storageKey) => {
          await writeStoredFile(storageKey, data);
          writtenKey = storageKey;
        }),
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  } catch (error) {
    const orphan: string | null = writtenKey;
    if (orphan) {
      await deleteStoredFile(orphan).catch((cleanupError: unknown) =>
        logger.error("Failed to remove orphaned document file", cleanupError, { storageKey: orphan }),
      );
    }
    throw error;
  }
}

// Serialises document writes per load (version numbering, uploads) and confirms it exists.
async function lockLoad(tx: Prisma.TransactionClient, loadId: string): Promise<number> {
  const rows = await tx.$queryRaw<{ loadNumber: number }[]>`
    SELECT "loadNumber" FROM "Load" WHERE "id" = ${loadId} FOR UPDATE`;
  const row = rows[0];
  if (!row) throw new UserFacingError("This load no longer exists.");
  return row.loadNumber;
}

// Generates a NEW version of a load document. Earlier versions are never replaced.
export async function generateLoadDocument(
  loadId: string,
  type: GeneratedDocumentType,
  user: SessionUser,
): Promise<StoredDocumentSummary> {
  const context = await buildDocumentContext(await getCompanySettings());
  const dto = await buildDocumentDTO(type, loadId, context);
  const pdf = await renderPdf(dto);

  return persistDocument(pdf, async (tx, writeFile) => {
    const loadNumber = await lockLoad(tx, loadId);
    // Deleted versions still count, so version numbers are never reused.
    const latest = await tx.document.aggregate({ where: { loadId, type }, _max: { version: true } });
    const version = (latest._max.version ?? 0) + 1;
    const filename = `${loadNumber}-${GENERATED_FILE_SLUGS[type]}-v${version}.pdf`;
    const storageKey = loadGeneratedKey(loadNumber, filename);

    await writeFile(storageKey);
    const document = await tx.document.create({
      data: {
        loadId,
        type,
        source: "GENERATED",
        version,
        storageKey,
        originalFilename: filename,
        mimeType: "application/pdf",
        sizeBytes: pdf.byteLength,
        sha256: sha256(pdf),
        createdById: user.id,
      },
      select: { id: true },
    });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.DOCUMENT_GENERATED,
        entityType: AUDIT_ENTITIES.DOCUMENT,
        entityId: document.id,
        userId: user.id,
        metadata: { loadId, loadNumber, type, version },
      },
      tx,
    );
    return { id: document.id, type, version, filename };
  });
}

export type UploadInput = {
  loadId: string;
  type: UploadableDocumentType;
  originalFilename: string;
  data: Uint8Array;
  notes: string | null;
};

// Validates and stores an uploaded file under a random internal name.
export async function uploadLoadDocument(
  input: UploadInput,
  user: SessionUser,
): Promise<StoredDocumentSummary> {
  const { maxDocumentSizeBytes, MAX_DOCUMENT_SIZE_MB } = getEnv();
  if (input.data.byteLength === 0) throw new UserFacingError("The selected file is empty.");
  if (input.data.byteLength > maxDocumentSizeBytes) {
    throw new UserFacingError(`Files must be ${MAX_DOCUMENT_SIZE_MB} MB or smaller.`);
  }
  const fileType = detectFileType(input.data.subarray(0, 16));
  if (!fileType) throw new UserFacingError("Only PDF, JPG and PNG files can be uploaded.");

  const displayName = sanitizeDisplayFilename(input.originalFilename, `document.${fileType.extension}`);
  const internalName = `${randomBytes(16).toString("hex")}.${fileType.extension}`;

  return persistDocument(input.data, async (tx, writeFile) => {
    const loadNumber = await lockLoad(tx, input.loadId);
    const storageKey = loadUploadKey(loadNumber, internalName);
    await writeFile(storageKey);
    const document = await tx.document.create({
      data: {
        loadId: input.loadId,
        type: input.type,
        source: "UPLOADED",
        version: null,
        storageKey,
        originalFilename: displayName,
        mimeType: fileType.mimeType,
        sizeBytes: input.data.byteLength,
        sha256: sha256(input.data),
        notes: input.notes,
        createdById: user.id,
      },
      select: { id: true },
    });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
        entityType: AUDIT_ENTITIES.DOCUMENT,
        entityId: document.id,
        userId: user.id,
        metadata: { loadId: input.loadId, loadNumber, type: input.type, filename: displayName },
      },
      tx,
    );
    return { id: document.id, type: input.type, version: null, filename: displayName };
  });
}

// Soft delete: the record is hidden but the file and metadata are kept for audit.
export async function deleteLoadDocument(
  documentId: string,
  reason: string,
  user: SessionUser,
): Promise<{ loadId: string }> {
  return db.$transaction(async (tx) => {
    const document = await tx.document.findUnique({
      where: { id: documentId },
      select: { loadId: true, deletedAt: true, type: true, version: true, originalFilename: true },
    });
    if (!document || document.deletedAt) throw new UserFacingError("This document was already removed.");
    await tx.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date(), deletedById: user.id, deleteReason: reason },
    });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.DOCUMENT_DELETED,
        entityType: AUDIT_ENTITIES.DOCUMENT,
        entityId: documentId,
        userId: user.id,
        metadata: {
          loadId: document.loadId,
          type: document.type,
          version: document.version,
          filename: document.originalFilename,
          reason,
        },
      },
      tx,
    );
    return { loadId: document.loadId };
  });
}

// Looked up by database id only; the storage key comes from the database, never the request.
export function getDocumentForDownload(documentId: string) {
  return db.document.findFirst({
    where: { id: documentId, deletedAt: null },
    select: { id: true, type: true, storageKey: true, originalFilename: true, mimeType: true, loadId: true },
  });
}
