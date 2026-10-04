import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { calculateMargin } from "@/lib/money";
import { changeLoadStatus, createLoad, deleteLoad, updateLoad } from "@/server/services/load.service";
import { createClient } from "@/server/services/client.service";
import { createCarrier } from "@/server/services/carrier.service";
import { createDriver } from "@/server/services/driver.service";
import { clientSchema } from "@/features/clients/schemas";
import { carrierSchema } from "@/features/carriers/schemas";
import { driverSchema } from "@/features/drivers/schemas";

import { resetDatabase } from "../support/db";
import { createTestCarrier, createTestClient, createTestUser, loadInput } from "../support/factories";

beforeEach(resetDatabase);

describe("master data", () => {
  it("creates a client, carrier and driver with audit entries", async () => {
    const user = await createTestUser();
    const client = await createClient(
      clientSchema.parse({ companyName: "ABC Logistics", email: "OPS@ABC.TEST" }),
      user.id,
    );
    const carrier = await createCarrier(
      carrierSchema.parse({ legalName: "Virdi Trucking", mcNumber: "MC008850" }),
      user.id,
    );
    const driver = await createDriver(
      driverSchema.parse({ carrierId: carrier.id, firstName: "Sam", phone: "555" }),
      user.id,
    );

    expect(client.email).toBe("ops@abc.test");
    expect(client.contactName).toBeNull(); // blank optional fields are stored as NULL
    expect(driver.carrierId).toBe(carrier.id);
    const actions = (await db.auditLog.findMany()).map((entry) => entry.action).sort();
    expect(actions).toEqual(["CARRIER_CREATED", "CLIENT_CREATED", "DRIVER_CREATED"]);
  });

  it("refuses drivers for archived carriers", async () => {
    const user = await createTestUser();
    const carrier = await createTestCarrier();
    await db.carrier.update({ where: { id: carrier.id }, data: { status: "ARCHIVED" } });
    await expect(
      createDriver(driverSchema.parse({ carrierId: carrier.id, firstName: "X" }), user.id),
    ).rejects.toThrow(/active carriers/);
  });
});

describe("load creation", () => {
  it("assigns sequential load numbers starting at 100001", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const first = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    const second = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    expect(first.loadNumber).toBe(100001);
    expect(second.loadNumber).toBe(100002);
  });

  it("never duplicates load numbers under concurrent creation", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const loads = await Promise.all(
      Array.from({ length: 12 }, () =>
        createLoad(loadInput({ clientId: client.id }), { userId: user.id, canWriteRates: true }),
      ),
    );
    const numbers = loads.map((load) => load.loadNumber);
    expect(new Set(numbers).size).toBe(12);
  });

  it("writes the load, initial status history and audit entry together", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const carrier = await createTestCarrier();
    const load = await createLoad(
      loadInput({
        clientId: client.id,
        carrierId: carrier.id,
        driverId: carrier.drivers[0]?.id ?? "",
        clientRate: "2,450.50",
        carrierRate: "1850",
      }),
      { userId: user.id, canWriteRates: true },
    );

    const stored = await db.load.findUniqueOrThrow({
      where: { id: load.id },
      include: { statusHistory: true },
    });
    expect(stored.status).toBe("CREATED"); // every load starts as Created, carrier or not
    expect(stored.containerNumber).toBe("ABCU1234567");
    expect(stored.clientRate?.toString()).toBe("2450.5");
    expect(calculateMargin(stored.clientRate, stored.carrierRate)?.toFixed(2)).toBe("600.50");
    expect(stored.pickupDate?.toISOString()).toBe("2026-10-02T00:00:00.000Z"); // date-only, no time-zone shift
    expect(stored.statusHistory).toHaveLength(1);
    expect(stored.statusHistory[0]).toMatchObject({
      previousStatus: null,
      newStatus: "CREATED",
      changedById: user.id,
    });
    expect(await db.auditLog.count({ where: { action: "LOAD_CREATED", entityId: load.id } })).toBe(1);
  });

  it("rolls everything back when the load is invalid (no orphan history/audit)", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const carrierA = await createTestCarrier();
    const carrierB = await createTestCarrier();
    await expect(
      createLoad(
        loadInput({ clientId: client.id, carrierId: carrierA.id, driverId: carrierB.drivers[0]?.id ?? "" }),
        {
          userId: user.id,
          canWriteRates: true,
        },
      ),
    ).rejects.toThrow(/does not belong/);
    expect(await db.load.count()).toBe(0);
    expect(await db.loadStatusHistory.count()).toBe(0);
    expect(await db.auditLog.count({ where: { action: "LOAD_CREATED" } })).toBe(0);
  });

  it("rejects archived clients", async () => {
    const user = await createTestUser();
    const client = await createTestClient({ status: "ARCHIVED" });
    await expect(
      createLoad(loadInput({ clientId: client.id }), { userId: user.id, canWriteRates: true }),
    ).rejects.toThrow(/archived/);
  });

  it("ignores rates from users without financials:write", async () => {
    const user = await createTestUser("READ_ONLY");
    const client = await createTestClient();
    const load = await createLoad(loadInput({ clientId: client.id, clientRate: "999", carrierRate: "500" }), {
      userId: user.id,
      canWriteRates: false,
    });
    const stored = await db.load.findUniqueOrThrow({ where: { id: load.id } });
    expect(stored.clientRate).toBeNull();
    expect(stored.carrierRate).toBeNull();
  });
});

describe("load updates and status", () => {
  it("audits rate changes with previous and new values", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const load = await createLoad(
      loadInput({ clientId: client.id, clientRate: "1000", carrierRate: "800" }),
      {
        userId: user.id,
        canWriteRates: true,
      },
    );
    await updateLoad(load.id, loadInput({ clientId: client.id, clientRate: "1100", carrierRate: "800" }), {
      userId: user.id,
      canWriteRates: true,
    });
    const changes = await db.auditLog.findMany({
      where: { entityId: load.id, action: { in: ["CLIENT_RATE_CHANGED", "CARRIER_RATE_CHANGED"] } },
    });
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      action: "CLIENT_RATE_CHANGED",
      metadata: { from: "1000", to: "1100.00" },
    });
  });

  it("keeps existing rates when a user without financials:write edits the load", async () => {
    const admin = await createTestUser();
    const viewer = await createTestUser("READ_ONLY");
    const client = await createTestClient();
    const load = await createLoad(
      loadInput({ clientId: client.id, clientRate: "1000", carrierRate: "800" }),
      {
        userId: admin.id,
        canWriteRates: true,
      },
    );
    await updateLoad(load.id, loadInput({ clientId: client.id, commodity: "Tiles" }), {
      userId: viewer.id,
      canWriteRates: false,
    });
    const stored = await db.load.findUniqueOrThrow({ where: { id: load.id } });
    expect(stored.commodity).toBe("Tiles");
    expect(stored.clientRate?.toString()).toBe("1000");
  });

  it("records every status change in the history, in order", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const load = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    await changeLoadStatus(load.id, "IN_PROGRESS", "Dispatched", user.id);
    await changeLoadStatus(load.id, "COMPLETED", null, user.id);

    const history = await db.loadStatusHistory.findMany({
      where: { loadId: load.id },
      orderBy: { createdAt: "asc" },
    });
    expect(history.map((h) => [h.previousStatus, h.newStatus])).toEqual([
      [null, "CREATED"],
      ["CREATED", "IN_PROGRESS"],
      ["IN_PROGRESS", "COMPLETED"],
    ]);
    expect(history[1]?.notes).toBe("Dispatched");
    expect(await db.auditLog.count({ where: { action: "STATUS_CHANGED", entityId: load.id } })).toBe(2);
  });

  it("rejects a no-op status change", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const load = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    await expect(changeLoadStatus(load.id, "CREATED", null, user.id)).rejects.toThrow(/already/);
  });

  it("keeps a load Created when a carrier is added (staff start it themselves)", async () => {
    const user = await createTestUser();
    const client = await createTestClient();
    const carrier = await createTestCarrier();
    const load = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    await updateLoad(load.id, loadInput({ clientId: client.id, carrierId: carrier.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    const stored = await db.load.findUniqueOrThrow({ where: { id: load.id } });
    expect(stored.status).toBe("CREATED");
  });
});

describe("deleting a load", () => {
  async function newLoad() {
    const user = await createTestUser();
    const client = await createTestClient();
    const load = await createLoad(loadInput({ clientId: client.id }), {
      userId: user.id,
      canWriteRates: true,
    });
    return { user, load };
  }

  it("deletes a Created load with no documents and keeps an audit record", async () => {
    const { user, load } = await newLoad();
    await deleteLoad(load.id, user.id);

    expect(await db.load.count({ where: { id: load.id } })).toBe(0);
    expect(await db.loadStatusHistory.count({ where: { loadId: load.id } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: "LOAD_DELETED", entityId: load.id } })).toBe(1);
  });

  it("refuses loads that have started", async () => {
    const { user, load } = await newLoad();
    await changeLoadStatus(load.id, "IN_PROGRESS", null, user.id);
    await expect(deleteLoad(load.id, user.id)).rejects.toThrow(/not started/);
  });

  it("refuses loads with documents, even deleted ones", async () => {
    const { user, load } = await newLoad();
    await db.document.create({
      data: {
        loadId: load.id,
        type: "POD",
        source: "UPLOADED",
        storageKey: `test/${load.id}`,
        originalFilename: "pod.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1,
        sha256: "0",
        deletedAt: new Date(),
      },
    });
    await expect(deleteLoad(load.id, user.id)).rejects.toThrow(/documents/);
  });
});
