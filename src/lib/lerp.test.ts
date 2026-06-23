import { describe, it, expect } from "vitest";
import { lerp } from "./lerp";

describe("lerp", () => {
  it("returns a at t=0", () => expect(lerp(0, 10, 0)).toBe(0));
  it("returns b at t=1", () => expect(lerp(0, 10, 1)).toBe(10));
  it("interpolates the midpoint at t=0.5", () => expect(lerp(0, 10, 0.5)).toBe(5));
  it("works with negative ranges", () => expect(lerp(-4, 4, 0.5)).toBe(0));
});
