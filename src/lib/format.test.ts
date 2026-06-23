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
  it("parses a comma-grouped number, stripping commas", () => {
    expect(parseCountValue("10,000+")).toEqual({ target: 10000, pad: 0, suffix: "+", raw: "10,000+" });
  });
});

describe("formatCount", () => {
  it("rounds and pads", () => {
    expect(formatCount(4.6, 2, "")).toBe("05");
  });
  it("appends the suffix", () => {
    expect(formatCount(164, 0, "+")).toBe("164+");
  });
  it("groups thousands when not zero-padded", () => {
    expect(formatCount(10000, 0, "+")).toBe("10,000+");
    expect(formatCount(3521, 0, "")).toBe("3,521");
  });
  it("keeps zero-padding without grouping", () => {
    expect(formatCount(7, 2, "")).toBe("07");
  });
});
