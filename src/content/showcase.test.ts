import { describe, it, expect } from "vitest";
import { showcase, getShowcaseItem } from "./showcase";

describe("getShowcaseItem", () => {
  it("finds a build by id", () => {
    expect(getShowcaseItem("robot-clover")?.title).toBe("Robot Clover");
  });
  it("returns undefined for an unknown id", () => {
    expect(getShowcaseItem("nope")).toBeUndefined();
  });
  it("every showcase build has a unique id", () => {
    const ids = showcase.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
