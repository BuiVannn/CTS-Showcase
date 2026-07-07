import { describe, it, expect } from "vitest";
import { getProducts, getProduct, getDownloadApps, isDownloadApp } from "./products";

describe("getProducts", () => {
  it("returns all ecosystem products", () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(6);
  });
});

describe("getDownloadApps", () => {
  it("curated order for /download, excludes PTalk (core/device, not a downloadable app)", () => {
    expect(getDownloadApps().map((a) => a.slug)).toEqual([
      "unilearn",
      "viet-creative",
      "kidmentor",
      "ptalk-signature",
      "p-connect",
    ]);
  });
  it("PTalk vẫn là sản phẩm (getProducts) nhưng không có trên /download", () => {
    expect(getProducts().some((a) => a.slug === "ptalk")).toBe(true);
    expect(getDownloadApps().some((a) => a.slug === "ptalk")).toBe(false);
  });
  it("isDownloadApp: PTalk là core (false), app tải được là true", () => {
    expect(isDownloadApp("ptalk")).toBe(false);
    expect(isDownloadApp("unilearn")).toBe(true);
    expect(isDownloadApp("p-connect")).toBe(true);
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
