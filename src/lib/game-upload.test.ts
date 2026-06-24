import { describe, it, expect } from "vitest";
import { slugify, resolveInside } from "./game-upload";

describe("slugify", () => {
  it("strips Vietnamese diacritics to ascii dashes", () => {
    expect(slugify("Trò Chơi Đố Vui!")).toBe("tro-choi-do-vui");
  });
  it("falls back to 'game' for empty", () => {
    expect(slugify("  ***  ")).toBe("game");
  });
});

describe("resolveInside (path-traversal guard)", () => {
  it("allows paths inside destDir", () => {
    expect(resolveInside("/games/x", "Build/a.data")).toBe("/games/x/Build/a.data");
  });
  it("rejects traversal and absolute paths", () => {
    expect(resolveInside("/games/x", "../evil.txt")).toBeNull();
    expect(resolveInside("/games/x", "/etc/passwd")).toBeNull();
  });
});
