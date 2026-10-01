import "server-only";

import { del, get, put } from "@vercel/blob";
import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { getEnv } from "@/lib/env";
import { buildStorageKey, resolveStoragePath } from "@/lib/storage/paths";

// Private document storage. Keys are built server-side (lib/storage/paths) and are the
// same for both drivers:
// - "local": files under DOCUMENT_STORAGE_PATH (Docker / self-hosting).
// - "blob":  a private Vercel Blob store; blobs are never public and are only served
//            through the authorised download route.
// Both refuse to overwrite an existing key (no silent replacement of history).

const isBlobStorage = () => getEnv().storageDriver === "blob";

/** Re-validates a key before it reaches Blob (the local driver checks via resolveStoragePath). */
function blobPathname(storageKey: string): string {
  return buildStorageKey(...storageKey.split("/"));
}

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function absolutePath(storageKey: string): string {
  return resolveStoragePath(getEnv().documentStorageRoot, storageKey);
}

// Local writes go via a temp file + rename so a crash never leaves a half-written document.
export async function writeStoredFile(storageKey: string, data: Uint8Array): Promise<void> {
  if (isBlobStorage()) {
    const pathname = blobPathname(storageKey);
    const extension = pathname.split(".").pop()?.toLowerCase() ?? "";
    await put(pathname, Buffer.from(data), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: CONTENT_TYPES[extension] ?? "application/octet-stream",
    });
    return;
  }

  const target = absolutePath(storageKey);
  await mkdir(path.dirname(target), { recursive: true, mode: 0o750 });

  const exists = await stat(target).then(
    () => true,
    () => false,
  );
  if (exists) throw new Error("Refusing to overwrite an existing stored file.");

  const temp = `${target}.${randomBytes(6).toString("hex")}.tmp`;
  const handle = await open(temp, "wx", 0o640);
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temp, target);
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  if (isBlobStorage()) {
    await del(blobPathname(storageKey));
    return;
  }
  await rm(absolutePath(storageKey), { force: true });
}

export async function openStoredFileStream(
  storageKey: string,
): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null> {
  if (isBlobStorage()) {
    const result = await get(blobPathname(storageKey), { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    return { stream: result.stream, size: result.blob.size };
  }

  const target = absolutePath(storageKey);
  const info = await stat(target).catch(() => null);
  if (!info?.isFile()) return null;
  const nodeStream = createReadStream(target);
  return { stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>, size: info.size };
}

export async function readStoredFile(storageKey: string): Promise<Buffer | null> {
  if (isBlobStorage()) {
    const file = await openStoredFileStream(storageKey);
    return file ? Buffer.from(await new Response(file.stream).arrayBuffer()) : null;
  }

  const target = absolutePath(storageKey);
  const handle = await open(target, "r").catch(() => null);
  if (!handle) return null;
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}
