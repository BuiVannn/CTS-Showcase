import { describe, it, expect } from "vitest";
import { mapLabGame, mapUserGame } from "./game-catalog-map";
import type { Game } from "@/content/types";
import type { DbGame } from "@/lib/games-db";

const lab: Game = {
  id: "g", slug: "g", title: "G", author: "A", year: 2024, embedPath: "/games/g/index.html",
  tags: ["Unity"], tagline: { en: "EN", vi: "VI tagline" }, description: { en: "e", vi: "v desc" },
  classification: "game", projectType: "web", releaseStatus: "released", genre: "Puzzle",
};

describe("mapLabGame", () => {
  it("maps lab fields (VI prose, same-origin, not sandboxed)", () => {
    const c = mapLabGame(lab);
    expect(c.source).toBe("lab");
    expect(c.sandboxed).toBe(false);
    expect(c.embedUrl).toBe("/games/g/index.html");
    expect(c.tagline).toBe("VI tagline");
    expect(c.description).toBe("v desc");
    expect(c.classification).toBe("game");
    expect(c.genre).toBe("Puzzle");
  });
});

describe("mapUserGame", () => {
  it("maps DB fields (CSV tags, cross-origin, sandboxed)", () => {
    const db: DbGame = {
      id: "1", slug: "u", title: "U", author: "B", cover: null, status: "published",
      created_at: "2026-06-24T00:00:00Z", owner_id: "x", owner_email: null,
      tagline: "tag", description: "**md**", genre: "Action", tags: "a, b ,c",
      project_type: "web", release_status: "in_dev", classification: "demo",
    };
    const c = mapUserGame(db);
    expect(c.source).toBe("user");
    expect(c.sandboxed).toBe(true);
    expect(c.embedUrl).toContain("/u/index.html");
    expect(c.tags).toEqual(["a", "b", "c"]);
    expect(c.tagline).toBe("tag");
    expect(c.projectType).toBe("web");
    expect(c.releaseStatus).toBe("in_dev");
  });
});
