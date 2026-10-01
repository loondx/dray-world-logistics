import { describe, expect, it } from "vitest";

import { formatAppointment, formatDateOnly, parseDateOnly, todayDateOnly } from "@/lib/dates";
import { calculateMargin, formatMoney, marginPercent, normalizeMoneyInput, sumMoney } from "@/lib/money";
import { detectFileType, sanitizeDisplayFilename } from "@/lib/storage/file-types";
import { buildStorageKey, resolveStoragePath, StoragePathError } from "@/lib/storage/paths";

describe("money", () => {
  it("normalises user input", () => {
    expect(normalizeMoneyInput("$1,850")).toBe("1850.00");
    expect(normalizeMoneyInput(" 1850.5 ")).toBe("1850.50");
    expect(normalizeMoneyInput("")).toBeNull();
    expect(normalizeMoneyInput("12.345")).toBeUndefined();
    expect(normalizeMoneyInput("-5")).toBeUndefined();
    expect(normalizeMoneyInput("abc")).toBeUndefined();
  });

  it("calculates margin with exact decimal arithmetic", () => {
    // 0.1 + 0.2 style float errors must not happen.
    expect(calculateMargin("1000.30", "999.10")?.toFixed(2)).toBe("1.20");
    expect(calculateMargin("2475.55", "1850.25")?.toFixed(2)).toBe("625.30");
    expect(calculateMargin("100", null)).toBeNull();
    expect(calculateMargin("800", "1000")?.toFixed(2)).toBe("-200.00");
    expect(marginPercent("2000", "1500")?.toFixed(1)).toBe("25.0");
    expect(sumMoney(["0.10", "0.20", null]).toFixed(2)).toBe("0.30");
  });

  it("formats USD", () => {
    expect(formatMoney("1850")).toBe("$1,850.00");
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney("1234567.89")).toBe("$1,234,567.89");
  });
});

describe("date-only handling", () => {
  it("parses and formats without time-zone shifts", () => {
    const date = parseDateOnly("2026-12-31");
    expect(date?.toISOString()).toBe("2026-12-31T00:00:00.000Z");
    expect(formatDateOnly(date)).toBe("12/31/2026");
  });

  it("rejects impossible dates", () => {
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("2026-13-01")).toBeNull();
    expect(parseDateOnly("10/01/2026")).toBeNull();
  });

  it("uses the company time zone for 'today'", () => {
    // 02:00 UTC on Oct 2 is still Oct 1 in Toronto.
    expect(formatDateOnly(todayDateOnly(new Date("2026-10-02T02:00:00Z")))).toBe("10/01/2026");
  });

  it("formats appointment windows", () => {
    expect(formatAppointment(parseDateOnly("2026-12-26"), "08:00", "16:00")).toBe("12/26/2026 08:00 - 16:00");
    expect(formatAppointment(null, null, null)).toBe("TBD");
  });
});

describe("storage paths", () => {
  const root = "/data/dray-world/documents";

  it("builds keys from safe segments only", () => {
    expect(buildStorageKey("loads", "100001", "generated", "100001-bol-v1.pdf")).toBe(
      "loads/100001/generated/100001-bol-v1.pdf",
    );
    for (const bad of ["..", "../x", "a/b", "", ".hidden", "a\\b"]) {
      expect(() => buildStorageKey("loads", bad)).toThrow(StoragePathError);
    }
  });

  it("never resolves outside the storage root", () => {
    expect(resolveStoragePath(root, "loads/1/x.pdf")).toBe(`${root}/loads/1/x.pdf`);
    for (const bad of [
      "../x",
      "loads/../../x",
      "/etc/passwd",
      "",
      "a\0b",
      "loads/../../../../etc/passwd",
      ".",
    ]) {
      expect(() => resolveStoragePath(root, bad)).toThrow(StoragePathError);
    }
  });
});

describe("file type detection", () => {
  it("recognises PDF, JPEG and PNG by content", () => {
    expect(detectFileType(new TextEncoder().encode("%PDF-1.7"))?.mimeType).toBe("application/pdf");
    expect(detectFileType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mimeType).toBe("image/jpeg");
    expect(detectFileType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mimeType).toBe(
      "image/png",
    );
    expect(detectFileType(new Uint8Array([0x4d, 0x5a]))).toBeNull();
  });

  it("sanitises display names", () => {
    expect(sanitizeDisplayFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeDisplayFilename('C:\\Users\\x\\"pod".pdf')).toBe("pod.pdf");
    expect(sanitizeDisplayFilename("")).toBe("document");
  });
});
