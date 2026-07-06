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
  it("đúng 2 app có android apk sẵn (KidMentor, PTalk Signature)", () => {
    const ready = ecosystem.filter((a) => a.downloads?.android?.status === "available").map((a) => a.id).sort();
    expect(ready).toEqual(["kidmentor", "ptalk-signature"]);
  });
});
