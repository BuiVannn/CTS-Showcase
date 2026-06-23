import { describe, it, expect } from "vitest";
import { deviceMailto } from "./device-mailto";

describe("deviceMailto", () => {
  it("builds a mailto with the encoded subject", () => {
    const href = deviceMailto("info@ctslab.net", "Đặt thiết bị:", "KidMentor");
    expect(href).toBe(
      "mailto:info@ctslab.net?subject=" + encodeURIComponent("Đặt thiết bị: KidMentor")
    );
  });
  it("encodes spaces in the subject", () => {
    expect(deviceMailto("a@b.com", "Device order:", "KidMentor")).toContain("subject=Device%20order%3A%20KidMentor");
  });
  it("trims a missing prefix cleanly", () => {
    expect(deviceMailto("a@b.com", "", "KidMentor")).toBe("mailto:a@b.com?subject=KidMentor");
  });
});
