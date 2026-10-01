import { describe, expect, it } from "vitest";

import { PERMISSIONS, hasPermission } from "@/server/permissions/permissions";

describe("permissions", () => {
  it("grants ADMIN every permission", () => {
    for (const permission of PERMISSIONS) expect(hasPermission("ADMIN", permission)).toBe(true);
  });

  it("keeps READ_ONLY users away from writes and financials", () => {
    expect(hasPermission("READ_ONLY", "loads:read")).toBe(true);
    expect(hasPermission("READ_ONLY", "loads:write")).toBe(false);
    expect(hasPermission("READ_ONLY", "financials:read")).toBe(false);
    expect(hasPermission("READ_ONLY", "documents:delete")).toBe(false);
  });

  it("restricts company settings to ADMIN", () => {
    for (const role of ["OPERATIONS", "DISPATCHER", "ACCOUNTING", "READ_ONLY"] as const) {
      expect(hasPermission(role, "settings:manage")).toBe(false);
    }
  });
});
