import path from "node:path";

// Pure path logic for private document storage. Storage keys are always built
// server-side from database values and are relative to the storage root.

export class StoragePathError extends Error {
  constructor(message = "Invalid storage path.") {
    super(message);
    this.name = "StoragePathError";
  }
}

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// Joins safe segments into a relative storage key ("loads/100001/generated/x.pdf").
export function buildStorageKey(...segments: string[]): string {
  for (const segment of segments) {
    if (!SAFE_SEGMENT.test(segment) || segment.includes("..")) {
      throw new StoragePathError(`Unsafe storage path segment: ${JSON.stringify(segment)}`);
    }
  }
  return segments.join("/");
}

// Resolves a storage key to an absolute path and guarantees it stays inside the root
// (defence in depth against "../", absolute paths and symlink-style tricks in keys).
export function resolveStoragePath(root: string, storageKey: string): string {
  if (!storageKey || storageKey.includes("\0") || path.isAbsolute(storageKey)) {
    throw new StoragePathError();
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, storageKey);
  if (!resolved.startsWith(`${resolvedRoot}${path.sep}`)) throw new StoragePathError();
  return resolved;
}

export function companyAssetKey(filename: string): string {
  return buildStorageKey("company", filename);
}
