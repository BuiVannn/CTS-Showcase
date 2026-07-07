import { describe, it, expect } from "vitest";
import { ecosystem } from "./ecosystem";

describe("ecosystem downloads", () => {
  it("mọi app đều khai báo downloads cho cả android & ios", () => {
    for (const app of ecosystem) {
      expect(app.downloads?.android, app.name).toBeDefined();
      expect(app.downloads?.ios, app.name).toBeDefined();
    }
  });
  it("platform available phải có kind và target", () => {
    for (const app of ecosystem) {
      for (const pd of [app.downloads?.android, app.downloads?.ios]) {
        if (pd?.status === "available") {
          expect(pd.kind, app.name).toBeTruthy();
          expect(pd.target, app.name).toBeTruthy();
        }
      }
    }
  });
  it("đúng 2 app dùng APK trực tiếp cho Android (KidMentor, PTalk Signature)", () => {
    const apk = ecosystem
      .filter((a) => a.downloads?.android?.kind === "apk")
      .map((a) => a.id)
      .sort();
    expect(apk).toEqual(["kidmentor", "ptalk-signature"]);
  });
  it("Unilearn có sẵn trên cả hai store (Play + App Store)", () => {
    const uni = ecosystem.find((a) => a.id === "unilearn");
    expect(uni?.downloads?.android).toMatchObject({ status: "available", kind: "play" });
    expect(uni?.downloads?.ios).toMatchObject({ status: "available", kind: "appstore" });
    expect(uni?.downloads?.android?.target).toContain("play.google.com");
    expect(uni?.downloads?.ios?.target).toContain("apps.apple.com");
  });
  it("Vision Tale đã được gỡ khỏi hệ sinh thái", () => {
    expect(ecosystem.some((a) => a.id === "vision-tale")).toBe(false);
  });
});
