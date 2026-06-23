import { describe, it, expect } from "vitest";
import { particleCount, lineAlpha } from "./particles";

describe("particleCount", () => {
  it("scales with area at the default density", () => {
    // 1280x720 = 921600 / 16000 ≈ 57.6 → 58, under the cap
    expect(particleCount(1280, 720)).toBe(58);
  });
  it("caps large viewports", () => {
    expect(particleCount(4000, 4000, { cap: 70 })).toBe(70);
  });
  it("never returns below the minimum", () => {
    expect(particleCount(200, 200, { min: 12 })).toBe(12);
  });
  it("returns an integer", () => {
    expect(Number.isInteger(particleCount(1000, 800))).toBe(true);
  });
});

describe("lineAlpha", () => {
  it("is 1 at zero distance", () => expect(lineAlpha(0, 120)).toBe(1));
  it("is 0 at/over the max distance", () => {
    expect(lineAlpha(120, 120)).toBe(0);
    expect(lineAlpha(200, 120)).toBe(0);
  });
  it("fades linearly between", () => expect(lineAlpha(60, 120)).toBeCloseTo(0.5));
});
