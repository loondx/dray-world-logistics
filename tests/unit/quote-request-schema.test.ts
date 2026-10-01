import { describe, expect, it } from "vitest";

import { leadRequestSchema } from "@/features/quotes/schemas";

describe("website lead requests", () => {
  it("treats a submission without `kind` as a quote request", () => {
    const parsed = leadRequestSchema.safeParse({
      name: "Alex",
      email: "Alex@Example.com",
      serviceType: "Drayage",
      origin: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("alex@example.com");
      expect(parsed.data.origin).toBeNull();
    }
  });

  it("requires an email for quotes", () => {
    const parsed = leadRequestSchema.safeParse({ kind: "QUOTE", name: "Alex", serviceType: "Drayage" });
    expect(parsed.success).toBe(false);
  });

  it("no longer accepts call-back requests from the website", () => {
    const parsed = leadRequestSchema.safeParse({ kind: "CALLBACK", name: "Sam", phone: "(905) 555-0142" });
    expect(parsed.success).toBe(false);
  });

  it("captures optional shipment details and rejects values outside the form's lists", () => {
    const base = { name: "Alex", email: "alex@example.com", serviceType: "Drayage" };
    const parsed = leadRequestSchema.safeParse({
      ...base,
      equipment: "40' high cube",
      loadCount: "3",
      readyDate: "2026-10-15",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.equipment).toBe("40' high cube");
      expect(parsed.data.loadCount).toBe(3);
      expect(parsed.data.readyDate?.toISOString().slice(0, 10)).toBe("2026-10-15");
    }
    const blank = leadRequestSchema.safeParse({ ...base, equipment: "", loadCount: "", readyDate: "" });
    expect(blank.success && blank.data.equipment === null && blank.data.loadCount === null).toBe(true);
    expect(leadRequestSchema.safeParse({ ...base, equipment: "Spaceship" }).success).toBe(false);
    expect(leadRequestSchema.safeParse({ ...base, loadCount: "0" }).success).toBe(false);
  });
});
