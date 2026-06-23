import { describe, it, expect } from "vitest";
import { isAdminEmail, resolveEnrollUrl } from "./auth-helpers";

describe("isAdminEmail", () => {
  const list = "admin@ctslab.net, owner@ctslab.net";
  it("matches an allowlisted email", () => expect(isAdminEmail("admin@ctslab.net", list)).toBe(true));
  it("is case-insensitive and trims", () => expect(isAdminEmail("  Admin@CTSLab.net ", list)).toBe(true));
  it("rejects a non-allowlisted email", () => expect(isAdminEmail("user@ctslab.net", list)).toBe(false));
  it("rejects null/undefined email", () => {
    expect(isAdminEmail(null, list)).toBe(false);
    expect(isAdminEmail(undefined, list)).toBe(false);
  });
  it("rejects everyone when allowlist is empty/undefined", () => {
    expect(isAdminEmail("admin@ctslab.net", "")).toBe(false);
    expect(isAdminEmail("admin@ctslab.net", undefined)).toBe(false);
  });
});

describe("resolveEnrollUrl", () => {
  it("returns the env value when set", () =>
    expect(resolveEnrollUrl("https://auth.ctslab.net/if/flow/x/")).toBe("https://auth.ctslab.net/if/flow/x/"));
  it("falls back to the default enrollment flow", () =>
    expect(resolveEnrollUrl(undefined)).toBe("https://auth.ctslab.net/if/flow/default-enrollment-flow/"));
});
