import { describe, it, expect } from "vitest";
import { nextStatusOnEdit } from "./game-status";

describe("nextStatusOnEdit", () => {
  it("published: metadata-only stays published; new build → pending", () => {
    expect(nextStatusOnEdit("published", "keep", false)).toBe("published");
    expect(nextStatusOnEdit("published", "keep", true)).toBe("pending");
    expect(nextStatusOnEdit("published", "pending", false)).toBe("published"); // metadata edit stays live
  });
  it("draft/rejected → submit goes pending; save-draft stays draft (even with new build)", () => {
    expect(nextStatusOnEdit("draft", "draft", false)).toBe("draft");
    expect(nextStatusOnEdit("draft", "draft", true)).toBe("draft");
    expect(nextStatusOnEdit("draft", "pending", false)).toBe("pending");
    expect(nextStatusOnEdit("rejected", "pending", false)).toBe("pending");
  });
  it("pending edits stay pending", () => {
    expect(nextStatusOnEdit("pending", "keep", false)).toBe("pending");
  });
});
