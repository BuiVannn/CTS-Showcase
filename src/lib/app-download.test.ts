import { describe, it, expect } from "vitest";
import { downloadApiHref, isPlatform, resolveDownload, describeDownload, badgeSrc } from "./app-download";
import type { EcosystemApp } from "@/content/types";

const app = (downloads: EcosystemApp["downloads"]) => ({ slug: "x", downloads } as EcosystemApp);

describe("downloadApiHref", () => {
  it("build đúng route trung gian", () => {
    expect(downloadApiHref("kidmentor", "android")).toBe("/api/download/kidmentor?platform=android");
  });
});

describe("isPlatform", () => {
  it("nhận android / ios / vr", () => {
    expect(isPlatform("android")).toBe(true);
    expect(isPlatform("ios")).toBe(true);
    expect(isPlatform("vr")).toBe(true);
  });
  it("từ chối giá trị lạ hoặc thiếu", () => {
    expect(isPlatform(null)).toBe(false);
    expect(isPlatform("")).toBe(false);
    expect(isPlatform("windows")).toBe(false);
  });
});

describe("resolveDownload", () => {
  it("available + target → ok", () => {
    const r = resolveDownload(app({ android: { status: "available", kind: "apk", target: "/d/k.apk" } }), "android");
    expect(r).toEqual({ ok: true, target: "/d/k.apk" });
  });
  it("apk tự host + version → gắn ?v= để CDN không phát bản cũ", () => {
    const r = resolveDownload(app({ android: { status: "available", kind: "apk", target: "/downloads/k.apk", version: "1.0.1", updatedAt: "2026-09-20" } }), "android");
    expect(r).toEqual({ ok: true, target: "/downloads/k.apk?v=1.0.1_2026-09-20" });
  });
  it("apk chỉ có version → ?v=version", () => {
    const r = resolveDownload(app({ android: { status: "available", kind: "apk", target: "/downloads/k.apk", version: "2.0" } }), "android");
    expect(r).toEqual({ ok: true, target: "/downloads/k.apk?v=2.0" });
  });
  it("URL tuyệt đối (store) hoặc target đã có query → giữ nguyên", () => {
    const abs = resolveDownload(app({ android: { status: "available", kind: "play", target: "https://play.google.com/x", version: "1" } }), "android");
    expect(abs).toEqual({ ok: true, target: "https://play.google.com/x" });
    const q = resolveDownload(app({ android: { status: "available", kind: "apk", target: "/d/k.apk?x=1", version: "1" } }), "android");
    expect(q).toEqual({ ok: true, target: "/d/k.apk?x=1" });
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
