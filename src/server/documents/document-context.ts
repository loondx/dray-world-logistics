import "server-only";

import type { CompanySettings } from "@/generated/prisma/client";
import { formatDateOnly, todayDateOnly } from "@/lib/dates";
import { detectFileType } from "@/lib/storage/file-types";
import { logger } from "@/lib/logger";
import type { DocumentContext } from "@/lib/pdf/mappings/common";
import { addressLines } from "@/lib/pdf/mappings/common";
import type { PdfCompany, PdfLogo } from "@/lib/pdf/types";
import { readStoredFile } from "@/server/storage/file-storage";

async function loadLogo(storageKey: string | null): Promise<PdfLogo | null> {
  if (!storageKey) return null;
  try {
    const data = await readStoredFile(storageKey);
    if (!data) return null;
    const type = detectFileType(data.subarray(0, 16));
    if (type?.mimeType === "image/png") return { data, format: "png" };
    if (type?.mimeType === "image/jpeg") return { data, format: "jpg" };
    return null;
  } catch (error) {
    // A missing/corrupt logo must never block document generation.
    logger.warn("Company logo could not be loaded for PDF", { error: String(error) });
    return null;
  }
}

export async function toPdfCompany(settings: CompanySettings): Promise<PdfCompany> {
  return {
    name: settings.legalName,
    addressLines: addressLines(settings),
    mcNumber: settings.mcNumber,
    dotNumber: settings.dotNumber,
    phone: settings.phone,
    email: settings.email,
    logo: await loadLogo(settings.logoStorageKey),
  };
}

export async function buildDocumentContext(
  settings: CompanySettings,
  generatedBy: string,
): Promise<DocumentContext> {
  return {
    company: await toPdfCompany(settings),
    generatedBy,
    documentDate: formatDateOnly(todayDateOnly()),
    settings: {
      carrierTerms: settings.carrierTerms,
      shipperTerms: settings.shipperTerms,
      bolTerms: settings.bolTerms,
      bolInstructions: settings.bolInstructions,
      paymentInstructions: settings.paymentInstructions,
      contactPhone: settings.operationsPhone ?? settings.phone,
      contactEmail: settings.operationsEmail ?? settings.email,
    },
  };
}
