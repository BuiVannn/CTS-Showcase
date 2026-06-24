import { describe, it, expect } from "vitest";
import { createGamesStore } from "./games-db";

describe("games store", () => {
  it("inserts, lists published, gets, and removes", () => {
    const s = createGamesStore(":memory:");
    expect(s.listPublished()).toEqual([]);
    s.insert({ id: "1", slug: "a", title: "A", author: "x", cover: null, status: "published", created_at: "2026-06-24T00:00:00Z" });
    expect(s.exists("a")).toBe(true);
    expect(s.get("a")?.title).toBe("A");
    expect(s.listPublished()).toHaveLength(1);
    s.remove("a");
    expect(s.exists("a")).toBe(false);
  });
});
