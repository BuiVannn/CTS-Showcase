import { describe, it, expect } from "vitest";
import { createGamesStore } from "./games-db";

describe("games store", () => {
  it("inserts, lists published, gets, and removes", () => {
    const s = createGamesStore(":memory:");
    expect(s.listPublished()).toEqual([]);
    s.insert({ id: "1", slug: "a", title: "A", author: "x", cover: null, status: "published", created_at: "2026-06-24T00:00:00Z", owner_id: null, owner_email: null });
    expect(s.exists("a")).toBe(true);
    expect(s.get("a")?.title).toBe("A");
    expect(s.listPublished()).toHaveLength(1);
    s.remove("a");
    expect(s.exists("a")).toBe(false);
  });
});

describe("games store — owner + status (slice 2b)", () => {
  function seed() {
    const s = createGamesStore(":memory:");
    const base = { author: "x", cover: null, created_at: "2026-06-24T00:00:00Z" };
    s.insert({ id: "1", slug: "a", title: "A", status: "pending", owner_id: "u1", owner_email: "u1@x", ...base });
    s.insert({ id: "2", slug: "b", title: "B", status: "published", owner_id: "u1", owner_email: "u1@x", ...base });
    s.insert({ id: "3", slug: "c", title: "C", status: "pending", owner_id: "u2", owner_email: "u2@x", ...base });
    return s;
  }
  it("lists by status", () => {
    expect(seed().listByStatus("pending").map((g) => g.slug).sort()).toEqual(["a", "c"]);
  });
  it("lists + counts by owner", () => {
    const s = seed();
    expect(s.listByOwner("u1").map((g) => g.slug).sort()).toEqual(["a", "b"]);
    expect(s.countByOwner("u1")).toBe(2);
    expect(s.countByOwner("u1", "pending")).toBe(1);
  });
  it("sets status", () => {
    const s = seed();
    s.setStatus("a", "published");
    expect(s.get("a")?.status).toBe("published");
  });
});

describe("games store — metadata update (redesign A)", () => {
  it("updates only whitelisted fields, leaves others intact", () => {
    const s = createGamesStore(":memory:");
    s.insert({ id: "1", slug: "a", title: "A", author: "x", cover: null, status: "published", created_at: "2026-06-24T00:00:00Z", owner_id: "u1", owner_email: "u1@x" });
    s.update("a", { tagline: "Quick game", genre: "Puzzle", project_type: "web", evil: "DROP" } as never);
    const g = s.get("a")!;
    expect(g.tagline).toBe("Quick game");
    expect(g.genre).toBe("Puzzle");
    expect(g.project_type).toBe("web");
    expect(g.title).toBe("A"); // untouched
    expect((g as unknown as Record<string, unknown>).evil).toBeUndefined(); // non-column ignored
  });
});
