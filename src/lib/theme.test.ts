import { describe, it, expect } from "vitest";
import { resolveTheme, nextTheme, THEME_STORAGE_KEY } from "./theme";

describe("resolveTheme", () => {
  it("returns dark only for the exact 'dark' string", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });
  it("defaults to light for null, '', or anything else", () => {
    expect(resolveTheme(null)).toBe("light");
    expect(resolveTheme("")).toBe("light");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("DARK")).toBe("light");
  });
});

describe("nextTheme", () => {
  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is the stable cts-theme key", () => {
    expect(THEME_STORAGE_KEY).toBe("cts-theme");
  });
});
