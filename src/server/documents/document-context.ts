import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { COMPANY_DEFAULT_PDF_LOGO } from "@/config/company-defaults";
import type { CompanySettings } from "@/generated/prisma/client";
import { formatDateOnly, todayDateOnly } from "@/lib/dates";
import { detectFileType } from "@/lib/storage/file-types";
import { logger } from "@/lib/logger";
import type { DocumentContext } from "@/lib/pdf/mappings/common";
import { addressLines } from "@/lib/pdf/mappings/common";
import type { PdfCompany, PdfLogo } from "@/lib/pdf/types";
import { readStoredFile } from "@/server/storage/file-storage";

function toPdfLogo(data: Buffer): PdfLogo | null {
  const type = detectFileType(data.subarray(0, 16));
  if (type?.mimeType === "image/png") return { data, format: "png" };
  if (type?.mimeType === "image/jpeg") return { data, format: "jpg" };
  return null;
}

async function loadUploadedLogo(storageKey: string | null): Promise<PdfLogo | null> {
  if (!storageKey) return null;
  try {
    const data = await readStoredFile(storageKey);
    return data ? toPdfLogo(data) : null;
  } catch (error) {
    // A missing/corrupt logo must never block document generation.
    logger.warn("Company logo could not be loaded for PDF", { error: String(error) });
    return null;
  }
}

// The bundled brand emblem never changes at runtime: read it once per server process.
let defaultLogo: Promise<PdfLogo | null> | undefined;

function loadDefaultLogo(): Promise<PdfLogo | null> {
  defaultLogo ??= readFile(path.join(process.cwd(), COMPANY_DEFAULT_PDF_LOGO))
    .then(toPdfLogo)
    .catch((error: unknown) => {
      logger.warn("Bundled brand logo could not be loaded for PDF", { error: String(error) });
      defaultLogo = undefined;
      return null;
    });
  return defaultLogo;
}

// Uploaded logo (Settings → Company) first, then the official emblem.
async function loadLogo(storageKey: string | null): Promise<PdfLogo | null> {
  return (await loadUploadedLogo(storageKey)) ?? (await loadDefaultLogo());
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

export async function buildDocumentContext(settings: CompanySettings): Promise<DocumentContext> {
  return {
    company: await toPdfCompany(settings),
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
