import { existsSync, rmSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { GET as downloadRoute } from "@/app/api/loads/[id]/documents/[type]/route";
import { db } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { createSession } from "@/server/auth/session";
import type { SessionUser } from "@/server/auth/session";
import { buildDocumentContext } from "@/server/documents/document-context";
import { buildBillOfLadingDTO, buildInvoiceDTO } from "@/server/documents/document-dtos";
import { getCompanySettings } from "@/server/services/company-settings.service";
import { addLoadCharge, removeLoadCharge } from "@/server/services/load-charge.service";
import { createLoad } from "@/server/services/load.service";

import { resetDatabase } from "../support/db";
import { createTestCarrier, createTestClient, createTestUser, loadInput } from "../support/factories";
import { cookieJar } from "../support/next-headers-mock";

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

function download(loadId: string, slug: string, query = "") {
  return downloadRoute(new Request(`http://localhost/api/loads/${loadId}/documents/${slug}${query}`), {
    params: Promise.resolve({ id: loadId, type: slug }),
  });
}

const storageLoadsDir = () => path.join(getEnv().documentStorageRoot, "loads");

beforeEach(async () => {
  await resetDatabase();
  rmSync(storageLoadsDir(), { recursive: true, force: true });
  cookieJar.clear();
});

describe("document download (generated on demand, never stored)", () => {
  it("requires sign-in", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    cookieJar.clear();
    const response = await download(load.id, "bol");
    expect(response.status).toBe(401);
  });

  it("streams each PDF with its document name and stores nothing", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    await signIn(user);

    const expected: [string, string][] = [
      ["carrier-confirmation", "100001-carrier-load-confirmation.pdf"],
      ["client-confirmation", "100001-client-rate-confirmation.pdf"],
      ["bol", "BOL-100001.pdf"],
      ["invoice", "INV-100001.pdf"],
    ];
    for (const [slug, filename] of expected) {
      const response = await download(load.id, slug);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(`attachment; filename="${filename}"`);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      const bytes = Buffer.from(await response.arrayBuffer());
      expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    }

    expect(await db.document.count()).toBe(0);
    expect(existsSync(storageLoadsDir())).toBe(false);
    expect(await db.auditLog.count({ where: { action: "DOCUMENT_GENERATED", entityId: load.id } })).toBe(4);
  });

  it("opens inline for viewing", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    await signIn(user);
    const response = await download(load.id, "invoice", "?disposition=inline");
    expect(response.headers.get("Content-Disposition")).toMatch(/^inline; filename="INV-100001.pdf"/);
  });

  it("hides rate documents from users without financial access", async () => {
    const owner = await createTestUser();
    const load = await loadWithParties(owner);
    const viewer = await createTestUser("READ_ONLY");
    await signIn(viewer);

    expect((await download(load.id, "invoice")).status).toBe(403);
    expect((await download(load.id, "carrier-confirmation")).status).toBe(403);
    expect((await download(load.id, "bol")).status).toBe(200);
  });

  it("explains why a document cannot be built yet", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const load = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    await signIn(user);

    const response = await download(load.id, "carrier-confirmation");
    expect(response.status).toBe(409);
    expect(await response.text()).toMatch(/Assign a carrier/);
  });

  it("returns 404 for an unknown document", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    await signIn(user);
    expect((await download(load.id, "secret-file")).status).toBe(404);
  });
});

describe("document contents", () => {
  it("builds the bill of lading without any client details", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const client = await db.client.findFirstOrThrow();
    await db.load.update({ where: { id: load.id }, data: { customerReference: "PO-CLIENT-REF" } });

    const dto = await buildBillOfLadingDTO(load.id, await buildDocumentContext(await getCompanySettings()));
    const json = JSON.stringify(dto);

    expect(json).not.toContain(client.companyName);
    expect(json).not.toContain("PO-CLIENT-REF");
    expect(dto.carrier.name).not.toBe("Carrier not assigned");
  });

  it("invoices extra charges with the client's payment terms and no carrier rate", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const client = await db.client.findFirstOrThrow();
    await db.client.update({ where: { id: client.id }, data: { paymentTermsDays: 15 } });
    await addLoadCharge(load.id, { description: "Chassis", amount: "85.00" }, user.id);

    const dto = await buildInvoiceDTO(load.id, await buildDocumentContext(await getCompanySettings()));
    expect(dto.total).toBe("$2,560.55");
    expect(dto.terms).toBe("Net 15");
    expect(JSON.stringify(dto)).not.toContain("1,850.25");
  });

  it("refuses an invoice without a client rate", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const load = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    await expect(
      buildInvoiceDTO(load.id, await buildDocumentContext(await getCompanySettings())),
    ).rejects.toThrow(/client rate/);
  });

  it("audits added and removed charges", async () => {
    const user = await createTestUser();
    const load = await loadWithParties(user);
    const charge = await addLoadCharge(load.id, { description: "Detention", amount: "120.50" }, user.id);
    await removeLoadCharge(charge.id, user.id);

    expect(await db.loadCharge.count()).toBe(0);
    const actions = await db.auditLog.findMany({ where: { entityId: load.id }, select: { action: true } });
    expect(actions.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["LOAD_CHARGE_ADDED", "LOAD_CHARGE_REMOVED"]),
    );
  });
});
