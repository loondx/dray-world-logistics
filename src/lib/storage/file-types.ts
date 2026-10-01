// Upload allow-list. The browser-supplied MIME type and extension are never
// trusted: the file's leading bytes ("magic numbers") decide the real type.

export type AllowedFileType = { mimeType: string; extension: string };

const SIGNATURES: { bytes: number[]; type: AllowedFileType }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], type: { mimeType: "application/pdf", extension: "pdf" } }, // %PDF-
  { bytes: [0xff, 0xd8, 0xff], type: { mimeType: "image/jpeg", extension: "jpg" } },
  {
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    type: { mimeType: "image/png", extension: "png" },
  },
];

export const ACCEPTED_UPLOAD_EXTENSIONS = ".pdf,.jpg,.jpeg,.png";
export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png";

export function detectFileType(header: Uint8Array): AllowedFileType | null {
  const match = SIGNATURES.find(({ bytes }) => bytes.every((byte, index) => header[index] === byte));
  return match?.type ?? null;
}

// Keeps the original name for display/download only (never used as a path).
export function sanitizeDisplayFilename(name: string, fallback = "document"): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "")
    .trim()
    .slice(0, 180);
  return cleaned || fallback;
}
