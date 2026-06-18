import { describe, it, expect } from "vitest";
import { activeStepFromProgress } from "./scrollSteps";

describe("activeStepFromProgress", () => {
  it("maps the start of the range to step 0", () => {
    expect(activeStepFromProgress(0, 3)).toBe(0);
  });
  it("maps the middle of the range to the middle step", () => {
    expect(activeStepFromProgress(0.5, 3)).toBe(1);
  });
  it("clamps the end of the range to the last step", () => {
    expect(activeStepFromProgress(1, 3)).toBe(2);
  });
  it("clamps negative/over-range input", () => {
    expect(activeStepFromProgress(-0.2, 3)).toBe(0);
    expect(activeStepFromProgress(2, 3)).toBe(2);
  });
  it("returns 0 when there are no steps", () => {
    expect(activeStepFromProgress(0.7, 0)).toBe(0);
  });
});
