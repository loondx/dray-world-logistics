import { beforeEach, describe, expect, it } from "vitest";

import { staffLeadSchema } from "@/features/quotes/schemas";
import { db } from "@/lib/db";
import {
  countNewQuoteRequests,
  createStaffLead,
  listQuoteRequests,
  submitQuoteRequest,
} from "@/server/services/quote.service";

import { resetDatabase } from "../support/db";
import { createTestUser } from "../support/factories";

beforeEach(resetDatabase);

describe("leads", () => {
  it("keeps website and staff leads together, each marked with its source", async () => {
    const user = await createTestUser();
    await submitQuoteRequest({
      kind: "QUOTE",
      name: "Web Visitor",
      company: null,
      email: "web@example.test",
      phone: null,
      serviceType: "Drayage",
      origin: "Port Newark",
      destination: "Edison, NJ",
      equipment: null,
      loadCount: 2,
      readyDate: null,
      message: null,
    });
    const parsed = staffLeadSchema.parse({ name: "Caller Co", phone: "555-0100", origin: "Toronto" });
    await createStaffLead(parsed, user.id);

    const { items, total } = await listQuoteRequests({ page: 1 });
    expect(total).toBe(2);
    expect(items.map((lead) => [lead.name, lead.source])).toEqual(
      expect.arrayContaining([
        ["Web Visitor", "WEBSITE"],
        ["Caller Co", "STAFF"],
      ]),
    );
    const staff = await db.quoteRequest.findFirstOrThrow({ where: { source: "STAFF" } });
    expect(staff.createdById).toBe(user.id);
    expect(await countNewQuoteRequests()).toBe(2);
  });

  it("searches by name, company, contact details or city", async () => {
    const user = await createTestUser();
    await createStaffLead(
      staffLeadSchema.parse({ name: "Ana", company: "Harbor Foods", email: "ana@hf.test" }),
      user.id,
    );
    await createStaffLead(
      staffLeadSchema.parse({ name: "Ben", phone: "555-0199", destination: "Montreal" }),
      user.id,
    );

    expect((await listQuoteRequests({ page: 1, q: "harbor" })).items.map((lead) => lead.name)).toEqual([
      "Ana",
    ]);
    expect((await listQuoteRequests({ page: 1, q: "montreal" })).items.map((lead) => lead.name)).toEqual([
      "Ben",
    ]);
    expect((await listQuoteRequests({ page: 1, q: "0199" })).total).toBe(1);
  });

  it("requires a name and a phone or email for staff leads", () => {
    expect(staffLeadSchema.safeParse({ name: "No Contact" }).success).toBe(false);
    expect(staffLeadSchema.safeParse({ phone: "555-0100" }).success).toBe(false);
    expect(staffLeadSchema.safeParse({ name: "Ok", email: "ok@example.test" }).success).toBe(true);
  });
});
