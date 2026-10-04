import { beforeEach, describe, expect, it } from "vitest";

import { todayDateOnly } from "@/lib/dates";
import { db } from "@/lib/db";
import { getAttentionItems, getUpcomingSchedule } from "@/server/services/dashboard.service";
import { createLoad } from "@/server/services/load.service";

import { resetDatabase } from "../support/db";
import { createTestClient, createTestUser, loadInput } from "../support/factories";

const DAY_MS = 24 * 60 * 60 * 1000;

// Date-only string relative to today ("2026-10-04"), as the load form submits it.
function day(offset: number): string {
  return new Date(todayDateOnly().getTime() + offset * DAY_MS).toISOString().slice(0, 10);
}

async function newLoad(values: Record<string, string>) {
  const user = await createTestUser();
  const client = await createTestClient();
  return createLoad(loadInput({ clientId: client.id, loadDate: day(0), ...values }), {
    userId: user.id,
    canWriteRates: true,
  });
}

beforeEach(async () => {
  await resetDatabase();
});

describe("dashboard schedule", () => {
  it("lists this week's pickups and deliveries by day, then time", async () => {
    const late = await newLoad({ pickupDate: day(0), pickupTimeFrom: "14:00", deliveryDate: day(1) });
    const early = await newLoad({ pickupDate: day(0), pickupTimeFrom: "08:00", deliveryDate: day(9) });
    const completed = await newLoad({ pickupDate: day(0), deliveryDate: day(0) });
    await db.load.update({ where: { id: completed.id }, data: { status: "COMPLETED" } });

    const events = await getUpcomingSchedule();

    expect(events.map((event) => [event.loadNumber, event.kind])).toEqual([
      [early.loadNumber, "Pickup"],
      [late.loadNumber, "Pickup"],
      [late.loadNumber, "Delivery"],
    ]);
    expect(events[0]?.carrierName).toBeNull();
  });
});

describe("dashboard attention items", () => {
  it("flags loads not started, without a carrier, or past their delivery date", async () => {
    const noCarrier = await newLoad({ pickupDate: day(1), deliveryDate: day(2) });
    const notStarted = await newLoad({ pickupDate: day(-2), deliveryDate: day(3) });
    const pastDelivery = await newLoad({ pickupDate: day(-4), deliveryDate: day(-1) });
    await db.load.update({ where: { id: pastDelivery.id }, data: { status: "IN_PROGRESS" } });

    const items = await getAttentionItems({ showQuotes: true });
    const byId = new Map(items.map((item) => [item.id, item]));

    expect(byId.get("no-carrier")?.loads.map((load) => load.id)).toEqual(
      expect.arrayContaining([noCarrier.id, notStarted.id]),
    );
    expect(byId.get("late")?.loads.map((load) => load.id)).toEqual([notStarted.id]);
    expect(byId.get("past-delivery")?.loads.map((load) => load.id)).toEqual([pastDelivery.id]);
    // Nothing to act on → the item is left out rather than shown as 0.
    expect(byId.has("quotes")).toBe(false);
  });
});
