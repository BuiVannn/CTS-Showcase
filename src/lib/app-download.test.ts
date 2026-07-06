import { describe, it, expect } from "vitest";
import { downloadApiHref, resolveDownload, describeDownload, badgeSrc } from "./app-download";
import type { EcosystemApp } from "@/content/types";

const app = (downloads: EcosystemApp["downloads"]) => ({ slug: "x", downloads } as EcosystemApp);

describe("downloadApiHref", () => {
  it("build đúng route trung gian", () => {
    expect(downloadApiHref("kidmentor", "android")).toBe("/api/download/kidmentor?platform=android");
  });
});

describe("resolveDownload", () => {
  it("available + target → ok", () => {
    const r = resolveDownload(app({ android: { status: "available", kind: "apk", target: "/d/k.apk" } }), "android");
    expect(r).toEqual({ ok: true, target: "/d/k.apk" });
  });
  it("thiếu app → no-platform", () => {
    expect(resolveDownload(undefined, "android")).toEqual({ ok: false, reason: "no-platform" });
  });
  it("thiếu platform → no-platform", () => {
    expect(resolveDownload(app({ ios: { status: "soon" } }), "android")).toEqual({ ok: false, reason: "no-platform" });
  });
  it("soon → not-available", () => {
    expect(resolveDownload(app({ android: { status: "soon" } }), "android")).toEqual({ ok: false, reason: "not-available" });
  });
  it("available nhưng thiếu target → no-target", () => {
    expect(resolveDownload(app({ android: { status: "available", kind: "apk" } }), "android")).toEqual({ ok: false, reason: "no-target" });
  });
});

describe("describeDownload", () => {
  it("undefined / soon → soon", () => {
    expect(describeDownload(undefined)).toEqual({ mode: "soon" });
    expect(describeDownload({ status: "soon" })).toEqual({ mode: "soon" });
  });
  it("play/appstore → official", () => {
    expect(describeDownload({ status: "available", kind: "play" })).toEqual({ mode: "official", store: "play" });
    expect(describeDownload({ status: "available", kind: "appstore" })).toEqual({ mode: "official", store: "appstore" });
  });
  it("testflight → testflight", () => {
    expect(describeDownload({ status: "available", kind: "testflight" })).toEqual({ mode: "testflight" });
  });
  it("apk → mode apk kèm meta", () => {
    expect(describeDownload({ status: "available", kind: "apk", version: "1.0.0", updatedAt: "2026-07-06" }))
      .toEqual({ mode: "apk", version: "1.0.0", updatedAt: "2026-07-06", size: undefined });
  });
});

describe("badgeSrc", () => {
  it("map store+locale+theme → path asset", () => {
    expect(badgeSrc("play", "vi", "light")).toBe("/img/badges/google-play-black-vi.svg");
    expect(badgeSrc("appstore", "en", "dark")).toBe("/img/badges/app-store-white-en.svg");
  });
});
