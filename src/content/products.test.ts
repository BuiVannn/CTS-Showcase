import { describe, it, expect } from "vitest";
import { getProducts, getProduct } from "./products";

describe("getProducts", () => {
  it("returns all ecosystem products", () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(4);
  });
});

describe("getProduct", () => {
  it("finds a product by slug", () => {
    expect(getProduct("ptalk")?.name).toBe("PTalk");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getProduct("does-not-exist")).toBeUndefined();
  });
});
