import "server-only";

import { randomBytes } from "node:crypto";

import type { CompanyDetailsInput, DocumentTermsInput } from "@/features/settings/schemas";
import { db } from "@/lib/db";
import { detectFileType } from "@/lib/storage/file-types";
import { companyAssetKey } from "@/lib/storage/paths";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/server/audit/audit-actions";
import { recordAudit } from "@/server/audit/audit.service";
import { UserFacingError } from "@/server/errors";
import { deleteStoredFile, writeStoredFile } from "@/server/storage/file-storage";

import { getCompanySettings } from "./company-settings.service";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

async function updateSettings(
  data: Partial<CompanyDetailsInput & DocumentTermsInput & { logoStorageKey: string | null }>,
  userId: string,
  section: string,
): Promise<void> {
  const current = await getCompanySettings();
  await db.$transaction(async (tx) => {
    await tx.companySettings.update({ where: { id: current.id }, data: { ...data, updatedById: userId } });
    await recordAudit(
      {
        action: AUDIT_ACTIONS.COMPANY_SETTINGS_UPDATED,
        entityType: AUDIT_ENTITIES.COMPANY_SETTINGS,
        entityId: current.id,
        userId,
        metadata: { section, fields: Object.keys(data) },
      },
      tx,
    );
  });
}

export function updateCompanyDetails(input: CompanyDetailsInput, userId: string) {
  return updateSettings(input, userId, "company");
}

export function updateDocumentTerms(input: DocumentTermsInput, userId: string) {
  return updateSettings(input, userId, "documents");
}

// Stores a PNG/JPG logo under a new random name; the previous file is removed after the switch.
export async function replaceCompanyLogo(data: Uint8Array, userId: string): Promise<void> {
  if (data.byteLength === 0) throw new UserFacingError("The selected file is empty.");
  if (data.byteLength > MAX_LOGO_BYTES) throw new UserFacingError("The logo must be 2 MB or smaller.");
  const type = detectFileType(data.subarray(0, 16));
  if (type?.mimeType !== "image/png" && type?.mimeType !== "image/jpeg") {
    throw new UserFacingError("The logo must be a PNG or JPG image.");
  }

  const previous = (await getCompanySettings()).logoStorageKey;
  const storageKey = companyAssetKey(`logo-${randomBytes(8).toString("hex")}.${type.extension}`);
  await writeStoredFile(storageKey, data);
  try {
    await updateSettings({ logoStorageKey: storageKey }, userId, "logo");
  } catch (error) {
    await deleteStoredFile(storageKey);
    throw error;
  }
  if (previous) await deleteStoredFile(previous).catch(() => undefined);
}

export async function removeCompanyLogo(userId: string): Promise<void> {
  const previous = (await getCompanySettings()).logoStorageKey;
  if (!previous) return;
  await updateSettings({ logoStorageKey: null }, userId, "logo");
  await deleteStoredFile(previous).catch(() => undefined);
}

// ── Load number sequence ────────────────────────────────────

export async function getNextLoadNumber(): Promise<number> {
  const rows = await db.$queryRaw<{ last_value: bigint; is_called: boolean }[]>`
    SELECT last_value, is_called FROM "Load_loadNumber_seq"`;
  const row = rows[0];
  if (!row) throw new Error("Load number sequence is missing.");
  return Number(row.last_value) + (row.is_called ? 1 : 0);
}

// Moves the sequence forward only (numbers are never reused or lowered).
export async function setNextLoadNumber(next: number, userId: string): Promise<void> {
  const current = await getNextLoadNumber();
  const highest = await db.load.aggregate({ _max: { loadNumber: true } });
  const minimum = Math.max(current, (highest._max.loadNumber ?? 0) + 1);
  if (next < minimum) {
    throw new UserFacingError(
      `The next load number must be ${minimum} or higher (numbers are never reused).`,
    );
  }
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT setval('"Load_loadNumber_seq"', ${next}, false)`;
    await recordAudit(
      {
        action: AUDIT_ACTIONS.COMPANY_SETTINGS_UPDATED,
        entityType: AUDIT_ENTITIES.COMPANY_SETTINGS,
        entityId: "load-number-sequence",
        userId,
        metadata: { section: "loadNumber", from: current, to: next },
      },
      tx,
    );
  });
}
