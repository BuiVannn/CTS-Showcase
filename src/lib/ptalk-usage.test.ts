import { describe, it, expect } from "vitest";
import { todayKey, remaining, DAILY_LIMIT, createUsageStore } from "./ptalk-usage";

describe("todayKey (Asia/Ho_Chi_Minh, UTC+7)", () => {
  it("rolls to the next day after 17:00 UTC", () => {
    expect(todayKey(new Date("2026-06-23T10:00:00Z"))).toBe("2026-06-23");
    expect(todayKey(new Date("2026-06-23T17:30:00Z"))).toBe("2026-06-24");
  });
});

describe("remaining", () => {
  it("never goes below zero", () => {
    expect(remaining(0)).toBe(DAILY_LIMIT);
    expect(remaining(DAILY_LIMIT + 5)).toBe(0);
  });
});

describe("usage store", () => {
  it("counts per user and per day, isolated", () => {
    const s = createUsageStore(":memory:");
    expect(s.getUsage("u1", "2026-06-23")).toBe(0);
    expect(s.incrementUsage("u1", "2026-06-23")).toBe(1);
    expect(s.incrementUsage("u1", "2026-06-23")).toBe(2);
    expect(s.getUsage("u1", "2026-06-23")).toBe(2);
    expect(s.getUsage("u2", "2026-06-23")).toBe(0); // other user isolated
    expect(s.getUsage("u1", "2026-06-24")).toBe(0); // other day isolated
  });
});
