import type { DocumentType } from "@/generated/prisma/enums";
import { FINANCIAL_DOCUMENT_TYPES } from "@/features/documents/document-types";

import { hasPermission } from "./permissions";

type Role = Parameters<typeof hasPermission>[0];

// Rate confirmations and invoices reveal rates, so they additionally need financials:read.
export function canViewDocumentType(role: Role, type: DocumentType): boolean {
  if (!hasPermission(role, "documents:read")) return false;
  return !FINANCIAL_DOCUMENT_TYPES.includes(type) || hasPermission(role, "financials:read");
}

export function canWriteDocumentType(role: Role, type: DocumentType): boolean {
  if (!hasPermission(role, "documents:write")) return false;
  return !FINANCIAL_DOCUMENT_TYPES.includes(type) || hasPermission(role, "financials:read");
}
