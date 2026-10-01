import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory stand-in for the Vercel Blob SDK.
const store = new Map<string, { data: Uint8Array<ArrayBuffer>; contentType: string }>();
const putCalls: { pathname: string; options: Record<string, unknown> }[] = [];

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (pathname: string, body: Buffer, options: Record<string, unknown>) => {
    if (store.has(pathname) && !options.allowOverwrite) throw new Error("exists");
    putCalls.push({ pathname, options });
    store.set(pathname, { data: new Uint8Array(body), contentType: String(options.contentType) });
    return { pathname };
  }),
  get: vi.fn(async (pathname: string) => {
    const blob = store.get(pathname);
    if (!blob) return null;
    return {
      statusCode: 200,
      stream: new Blob([blob.data]).stream(),
      blob: { size: blob.data.byteLength, contentType: blob.contentType },
    };
  }),
  del: vi.fn(async (pathname: string) => {
    store.delete(pathname);
  }),
}));

describe("Vercel Blob document storage", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("STORAGE_DRIVER", "blob");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
    store.clear();
    putCalls.length = 0;
  });
  afterEach(() => vi.unstubAllEnvs());

  it("stores documents privately under their storage key and reads them back", async () => {
    const storage = await import("@/server/storage/file-storage");
    const bytes = new TextEncoder().encode("%PDF-1.7 test");
    await storage.writeStoredFile("loads/100001/generated/bol.pdf", bytes);

    expect(putCalls[0]).toMatchObject({
      pathname: "loads/100001/generated/bol.pdf",
      options: {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/pdf",
      },
    });
    expect(Buffer.from((await storage.readStoredFile("loads/100001/generated/bol.pdf"))!).toString()).toBe(
      "%PDF-1.7 test",
    );
    const opened = await storage.openStoredFileStream("loads/100001/generated/bol.pdf");
    expect(opened?.size).toBe(bytes.byteLength);

    await storage.deleteStoredFile("loads/100001/generated/bol.pdf");
    expect(await storage.readStoredFile("loads/100001/generated/bol.pdf")).toBeNull();
  });

  it("rejects unsafe keys before they reach the store", async () => {
    const storage = await import("@/server/storage/file-storage");
    await expect(storage.writeStoredFile("loads/../secrets.pdf", new Uint8Array([1]))).rejects.toThrow();
    expect(putCalls).toHaveLength(0);
  });
});
