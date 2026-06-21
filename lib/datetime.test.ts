import { describe, expect, it } from "vitest";
import {
  formatIndianDate,
  formatIndianTime,
  indianDateTimeToUtcIso,
  parseStoredUtcDate,
} from "./datetime";

describe("datetime IST helpers", () => {
  it("converts IST input to UTC ISO", () => {
    expect(indianDateTimeToUtcIso("2026-06-21T20:00")).toBe("2026-06-21T14:30:00.000Z");
  });

  it("parses naive UTC strings from the API", () => {
    const parsed = parseStoredUtcDate("2026-06-21T14:30:00");
    expect(parsed.toISOString()).toBe("2026-06-21T14:30:00.000Z");
  });

  it("formats stored UTC as Indian time", () => {
    expect(formatIndianTime("2026-06-21T14:30:00Z")).toMatch(/8:00\s?pm/i);
    expect(formatIndianDate("2026-06-21T14:30:00Z")).toContain("21");
  });
});
