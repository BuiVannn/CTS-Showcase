import { describe, it, expect } from "vitest";
import { scrambleText } from "./scramble";

describe("scrambleText", () => {
  it("returns the target when fully revealed", () => {
    expect(scrambleText("PTalk", 5, 0)).toBe("PTalk");
    expect(scrambleText("PTalk", 99, 0)).toBe("PTalk");
  });
  it("preserves length and spaces", () => {
    const out = scrambleText("PTIT VR", 0, 3);
    expect(out).toHaveLength(7);
    expect(out[4]).toBe(" "); // space position preserved
  });
  it("reveals the prefix verbatim", () => {
    const out = scrambleText("PTalk", 2, 7);
    expect(out.slice(0, 2)).toBe("PT");
  });
  it("is deterministic for the same inputs", () => {
    expect(scrambleText("PTalk", 1, 42)).toBe(scrambleText("PTalk", 1, 42));
  });
  it("uses only charset characters for scrambled positions", () => {
    const charset = "AB";
    const out = scrambleText("XYZ", 0, 1, charset);
    for (const ch of out) expect(charset.includes(ch)).toBe(true);
  });
});
