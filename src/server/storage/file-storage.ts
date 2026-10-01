import "server-only";

import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { getEnv } from "@/lib/env";
import { resolveStoragePath } from "@/lib/storage/paths";

function absolutePath(storageKey: string): string {
  return resolveStoragePath(getEnv().documentStorageRoot, storageKey);
}

// Writes via a temp file + rename so a crash never leaves a half-written document,
// and refuses to overwrite an existing key (no silent replacement of history).
export async function writeStoredFile(storageKey: string, data: Uint8Array): Promise<void> {
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
  await rm(absolutePath(storageKey), { force: true });
}

export async function openStoredFileStream(
  storageKey: string,
): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null> {
  const target = absolutePath(storageKey);
  const info = await stat(target).catch(() => null);
  if (!info?.isFile()) return null;
  const nodeStream = createReadStream(target);
  return { stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>, size: info.size };
}

export async function readStoredFile(storageKey: string): Promise<Buffer | null> {
  const target = absolutePath(storageKey);
  const handle = await open(target, "r").catch(() => null);
  if (!handle) return null;
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}
