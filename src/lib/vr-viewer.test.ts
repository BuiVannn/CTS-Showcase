import { describe, it, expect } from "vitest";
import {
  parseViewerMessage,
  CAMPUS_MODE,
  CIE_MODE,
  CIE_TOUR_SRC,
  CAMPUS_TOUR_SRC,
} from "./vr-viewer";

const ORIGIN = "http://localhost:3001";

describe("parseViewerMessage", () => {
  it("returns CIE_MODE for a valid cts-vr-load message from the same origin", () => {
    const data = { type: "cts-vr-load", src: CIE_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toEqual(CIE_MODE);
  });

  it("returns CAMPUS_MODE when asked to load the campus tour", () => {
    const data = { type: "cts-vr-load", src: CAMPUS_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toEqual(CAMPUS_MODE);
  });

  it("rejects a message from a different origin", () => {
    const data = { type: "cts-vr-load", src: CIE_TOUR_SRC };
    expect(parseViewerMessage(data, "https://evil.example", ORIGIN)).toBeNull();
  });

  it("rejects a message with the wrong type", () => {
    const data = { type: "something-else", src: CIE_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toBeNull();
  });

  it("rejects an unknown src", () => {
    const data = { type: "cts-vr-load", src: "/vr-tour/hack.html" };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toBeNull();
  });

  it("rejects non-object payloads", () => {
    expect(parseViewerMessage(null, ORIGIN, ORIGIN)).toBeNull();
    expect(parseViewerMessage("cts-vr-load", ORIGIN, ORIGIN)).toBeNull();
  });
});
