import { describe, it, expect } from "vitest";
import { parseCountValue, formatCount } from "./format";

describe("parseCountValue", () => {
  it("parses a plain integer", () => {
    expect(parseCountValue("164")).toEqual({ target: 164, pad: 0, suffix: "", raw: "164" });
  });
  it("preserves zero-padding width", () => {
    expect(parseCountValue("05")).toEqual({ target: 5, pad: 2, suffix: "", raw: "05" });
  });
  it("keeps a trailing suffix", () => {
    expect(parseCountValue("164+")).toEqual({ target: 164, pad: 0, suffix: "+", raw: "164+" });
  });
  it("returns null target for non-numeric values", () => {
    expect(parseCountValue("PTIT")).toEqual({ target: null, pad: 0, suffix: "", raw: "PTIT" });
  });
});

describe("formatCount", () => {
  it("rounds and pads", () => {
    expect(formatCount(4.6, 2, "")).toBe("05");
  });
  it("appends the suffix", () => {
    expect(formatCount(164, 0, "+")).toBe("164+");
  });
});
