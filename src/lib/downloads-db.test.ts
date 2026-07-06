import { describe, it, expect } from "vitest";
import { createDownloadsStore } from "./downloads-db";

describe("downloads-db", () => {
  it("increment cộng dồn theo (slug, platform)", () => {
    const s = createDownloadsStore(":memory:");
    s.increment("kidmentor", "android");
    s.increment("kidmentor", "android");
    s.increment("kidmentor", "ios");
    expect(s.getCount("kidmentor", "android")).toBe(2);
    expect(s.getCount("kidmentor", "ios")).toBe(1);
  });
  it("getCount cặp chưa có → 0", () => {
    const s = createDownloadsStore(":memory:");
    expect(s.getCount("nope", "android")).toBe(0);
  });
  it("total cộng tất cả", () => {
    const s = createDownloadsStore(":memory:");
    s.increment("a", "android"); s.increment("b", "ios"); s.increment("b", "ios");
    expect(s.total()).toBe(3);
  });
});
