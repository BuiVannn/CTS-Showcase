import { describe, it, expect } from "vitest";
import { normalizeMath } from "./normalize-math";

describe("normalizeMath", () => {
  it("converts display delimiters \\[ \\] to $$", () => {
    expect(normalizeMath("\\[ x^2 \\]")).toBe("$$ x^2 $$");
  });
  it("converts inline delimiters \\( \\) to $", () => {
    expect(normalizeMath("\\(3x+5\\)")).toBe("$3x+5$");
  });
  it("leaves plain text and emoji untouched", () => {
    expect(normalizeMath("Chào em 🌼 **đậm**")).toBe("Chào em 🌼 **đậm**");
  });
});
