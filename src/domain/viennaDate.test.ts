import { describe, expect, it } from "vitest";
import { viennaDate } from "./viennaDate";

describe("viennaDate", () => {
  it("formats the date as YYYY-MM-DD (Weekday)", () => {
    expect(viennaDate(new Date("2026-11-13T10:00:00Z"))).toBe("2026-11-13 (Friday)");
  });

  it("stays on the same day just before midnight in Vienna (CET)", () => {
    expect(viennaDate(new Date("2026-11-13T22:59:59Z"))).toBe("2026-11-13 (Friday)");
  });

  it("switches to the next day at midnight in Vienna although UTC is still on the previous day", () => {
    expect(viennaDate(new Date("2026-11-13T23:00:00Z"))).toBe("2026-11-14 (Saturday)");
  });

  it("respects summer time (CEST, UTC+2)", () => {
    expect(viennaDate(new Date("2026-06-30T21:59:00Z"))).toBe("2026-06-30 (Tuesday)");
    expect(viennaDate(new Date("2026-06-30T22:00:00Z"))).toBe("2026-07-01 (Wednesday)");
  });
});
