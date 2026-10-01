import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { GET as downloadRoute } from "@/app/api/documents/[id]/download/route";
import { POST as uploadRoute } from "@/app/api/loads/[id]/documents/route";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { createSession } from "@/server/auth/session";
import {
  deleteLoadDocument,
  generateLoadDocument,
  uploadLoadDocument,
} from "@/server/documents/document.service";
import { createLoad } from "@/server/services/load.service";
import type { SessionUser } from "@/server/auth/session";

import { resetDatabase } from "../support/db";
import { createTestCarrier, createTestClient, createTestUser, loadInput } from "../support/factories";
import { cookieJar } from "../support/next-headers-mock";

const PDF_BYTES = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF");
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

async function loadWithParties(user: SessionUser) {
  const client = await createTestClient();
  const carrier = await createTestCarrier();
  return createLoad(
    loadInput({
      clientId: client.id,
      carrierId: carrier.id,
      driverId: carrier.drivers[0]?.id ?? "",
      clientRate: "2475.55",
      carrierRate: "1850.25",
    }),
    { userId: user.id, canWriteRates: true },
  );
}

async function signIn(user: SessionUser) {
  cookieJar.clear();
  await createSession(user.id, null);
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(async () => {
  await resetDatabase();
  // Load numbers restart at 100001 each test, so stored files must be cleared too.
  rmSync(path.join(getEnv().documentStorageRoot, "loads"), { recursive: true, force: true });
  cookieJar.clear();
});

describe("document generation", () => {
  it("generates all three documents to private storage with versioned names", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);

    const carrierDoc = await generateLoadDocument(load.id, "CARRIER_RATE_CONFIRMATION", user);
    const shipperDoc = await generateLoadDocument(load.id, "SHIPPER_RATE_CONFIRMATION", user);
    const bol = await generateLoadDocument(load.id, "BOL", user);

    expect(carrierDoc.filename).toBe("100001-carrier-rate-confirmation-v1.pdf");
    expect(shipperDoc.filename).toBe("100001-shipper-rate-confirmation-v1.pdf");
    expect(bol.filename).toBe("100001-bol-v1.pdf");

    const stored = await db.document.findUniqueOrThrow({ where: { id: carrierDoc.id } });
    expect(stored.storageKey).toBe("loads/100001/generated/100001-carrier-rate-confirmation-v1.pdf");
    const file = path.join(getEnv().documentStorageRoot, stored.storageKey);
    expect(readFileSync(file).subarray(0, 5).toString()).toBe("%PDF-");
    expect(stored.storageKey.startsWith("public")).toBe(false);
    expect(await db.auditLog.count({ where: { action: "DOCUMENT_GENERATED" } })).toBe(3);
  });

  it("creates a new version on regeneration and keeps the previous one", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const v1 = await generateLoadDocument(load.id, "CARRIER_RATE_CONFIRMATION", user);
    await db.load.update({ where: { id: load.id }, data: { carrierRate: "1900.00" } });
    const v2 = await generateLoadDocument(load.id, "CARRIER_RATE_CONFIRMATION", user);

    expect([v1.version, v2.version]).toEqual([1, 2]);
    const docs = await db.document.findMany({ where: { loadId: load.id }, orderBy: { version: "asc" } });
    expect(docs).toHaveLength(2);
    for (const doc of docs)
      expect(existsSync(path.join(getEnv().documentStorageRoot, doc.storageKey))).toBe(true);
  });

  it("never reuses a version number after a document is deleted", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const v1 = await generateLoadDocument(load.id, "BOL", user);
    await deleteLoadDocument(v1.id, "wrong data", user);
    const v2 = await generateLoadDocument(load.id, "BOL", user);
    expect(v2.version).toBe(2);
  });

  it("refuses the carrier confirmation without a carrier rate", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const carrier = await createTestCarrier();
    const load = await createLoad(loadInput({ clientId: client.id, carrierId: carrier.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    await expect(generateLoadDocument(load.id, "CARRIER_RATE_CONFIRMATION", user)).rejects.toThrow(
      /carrier rate/,
    );
    expect(await db.document.count()).toBe(0);
  });
});

describe("uploads", () => {
  it("stores a valid POD under a random internal name, keeping the original name", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const doc = await uploadLoadDocument(
      {
        loadId: load.id,
        type: "POD",
        originalFilename: "../../etc/signed pod.pdf",
        data: PDF_BYTES,
        notes: null,
      },
      user,
    );
    const stored = await db.document.findUniqueOrThrow({ where: { id: doc.id } });
    expect(stored.originalFilename).toBe("signed pod.pdf");
    expect(stored.storageKey).toMatch(/^loads\/100001\/uploads\/[0-9a-f]{32}\.pdf$/);
    expect(stored.mimeType).toBe("application/pdf");
  });

  it("detects the real file type from content, not the name", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const doc = await uploadLoadDocument(
      { loadId: load.id, type: "COD", originalFilename: "scan.pdf", data: PNG_BYTES, notes: null },
      user,
    );
    expect((await db.document.findUniqueOrThrow({ where: { id: doc.id } })).mimeType).toBe("image/png");
  });

  it.each([
    ["an executable", new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), /Only PDF, JPG and PNG/],
    ["a script", new TextEncoder().encode("#!/bin/sh\nrm -rf /"), /Only PDF, JPG and PNG/],
    ["an HTML file", new TextEncoder().encode("<html><script>alert(1)</script>"), /Only PDF, JPG and PNG/],
    ["an empty file", new Uint8Array(), /empty/],
  ])("rejects %s", async (_label, data, message) => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    await expect(
      uploadLoadDocument(
        { loadId: load.id, type: "POD", originalFilename: "x.pdf", data, notes: null },
        user,
      ),
    ).rejects.toThrow(message);
    expect(await db.document.count()).toBe(0);
  });

  it("rejects oversized uploads", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const big = new Uint8Array(getEnv().maxDocumentSizeBytes + 1);
    big.set(PDF_BYTES);
    await expect(
      uploadLoadDocument(
        { loadId: load.id, type: "POD", originalFilename: "big.pdf", data: big, notes: null },
        user,
      ),
    ).rejects.toThrow(/MB or smaller/);
  });

  it("upload route requires authentication and a valid type", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const form = () => {
      const data = new FormData();
      data.set("type", "POD");
      data.set("file", new File([PDF_BYTES], "pod.pdf", { type: "application/pdf" }));
      return data;
    };

    const anonymous = await uploadRoute(
      new Request("http://test/upload", { method: "POST", body: form() }),
      routeContext(load.id),
    );
    expect(anonymous.status).toBe(401);

    await signIn(user);
    const badType = form();
    badType.set("type", "CARRIER_RATE_CONFIRMATION"); // generated types can't be uploaded
    expect(
      (
        await uploadRoute(
          new Request("http://test/upload", { method: "POST", body: badType }),
          routeContext(load.id),
        )
      ).status,
    ).toBe(400);

    const ok = await uploadRoute(
      new Request("http://test/upload", { method: "POST", body: form() }),
      routeContext(load.id),
    );
    expect(ok.status).toBe(201);
  });
});

describe("secure download", () => {
  it("requires authentication", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const doc = await generateLoadDocument(load.id, "BOL", user);
    const response = await downloadRoute(new Request("http://test/dl"), routeContext(doc.id));
    expect(response.status).toBe(401);
  });

  it("streams the PDF to an authorized user", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const doc = await generateLoadDocument(load.id, "BOL", user);
    await signIn(user);
    const response = await downloadRoute(
      new Request("http://test/dl?disposition=inline"),
      routeContext(doc.id),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain('inline; filename="100001-bol-v1.pdf"');
    expect(response.headers.get("cache-control")).toContain("no-store");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe("%PDF-");
  });

  it("hides rate confirmations from users without financial access", async () => {
    const admin = await createTestUser();
    const viewer = await createTestUser("READ_ONLY");
    const load = await loadWithParties(admin);
    const rateCon = await generateLoadDocument(load.id, "CARRIER_RATE_CONFIRMATION", admin);
    const bol = await generateLoadDocument(load.id, "BOL", admin);
    await signIn(viewer);
    expect((await downloadRoute(new Request("http://test/dl"), routeContext(rateCon.id))).status).toBe(403);
    expect((await downloadRoute(new Request("http://test/dl"), routeContext(bol.id))).status).toBe(200);
  });

  it("returns 404 for unknown, deleted, or path-traversal ids and never reads outside storage", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const doc = await generateLoadDocument(load.id, "BOL", user);
    await signIn(user);

    for (const id of ["../../etc/passwd", "..%2F..%2Fetc%2Fpasswd", "does-not-exist"]) {
      expect((await downloadRoute(new Request("http://test/dl"), routeContext(id))).status).toBe(404);
    }

    // Even a tampered storage key in the database cannot escape the storage root.
    await db.document.update({ where: { id: doc.id }, data: { storageKey: "../../../../etc/passwd" } });
    expect((await downloadRoute(new Request("http://test/dl"), routeContext(doc.id))).status).toBe(404);

    await db.document.update({
      where: { id: doc.id },
      data: { storageKey: "loads/100001/generated/100001-bol-v1.pdf" },
    });
    await deleteLoadDocument(doc.id, "test", user);
    expect((await downloadRoute(new Request("http://test/dl"), routeContext(doc.id))).status).toBe(404);
    expect(await db.auditLog.count({ where: { action: "DOCUMENT_DELETED" } })).toBe(1);
  });
});

// Ensure the session cookie name used by the helpers is the one the routes read.
expect(SESSION_COOKIE_NAME).toBeTruthy();
