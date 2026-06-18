import { describe, it, expect } from "vitest";
import { splitWords } from "./text";

describe("splitWords", () => {
  it("splits on whitespace preserving order", () => {
    expect(splitWords("Meet PTalk now")).toEqual(["Meet", "PTalk", "now"]);
  });
  it("collapses extra whitespace and trims", () => {
    expect(splitWords("  a   b ")).toEqual(["a", "b"]);
  });
  it("returns an empty array for blank input", () => {
    expect(splitWords("   ")).toEqual([]);
  });
});
