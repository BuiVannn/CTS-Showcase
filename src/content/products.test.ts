import { describe, it, expect } from "vitest";
import { getProducts, getProduct } from "./products";

describe("getProducts", () => {
  it("returns all ecosystem products", () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(7);
  });
});

describe("getProduct", () => {
  it("finds a product by slug", () => {
    expect(getProduct("ptalk")?.name).toBe("PTalk");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getProduct("does-not-exist")).toBeUndefined();
  });
  it("includes the three new apps with logos", () => {
    const slugLogoMap: Record<string, string> = {
      kidmentor: "/img/logos/logo_kidmentor.png",
      "ptalk-signature": "/img/logos/logo_ptalk_signature.png",
      "p-connect": "/img/logos/logo_p_connect.png",
    };
    for (const [slug, expectedLogo] of Object.entries(slugLogoMap)) {
      const app = getProduct(slug);
      expect(app, `missing app: ${slug}`).toBeDefined();
      expect(app?.logo).toBe(expectedLogo);
    }
  });
  it("marks KidMentor as having a physical device", () => {
    expect(getProduct("kidmentor")?.device).toBe(true);
  });
});
