import type { DocumentSource, DocumentType } from "@/generated/prisma/enums";

// Serializable document row passed from Server to Client Components.
export type DocumentRow = {
  id: string;
  type: DocumentType;
  source: DocumentSource;
  version: number | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  notes: string | null;
  createdAt: string;
  createdByName: string;
  canView: boolean;
};

export function documentUrls(id: string) {
  const base = `/api/documents/${id}/download`;
  return { viewUrl: `${base}?disposition=inline`, downloadUrl: base };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
