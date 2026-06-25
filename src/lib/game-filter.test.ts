import { describe, it, expect } from "vitest";
import { filterGames, deriveFacets, EMPTY_FILTER } from "./game-filter";
import type { CatalogGame } from "@/lib/game-catalog-map";

function g(p: Partial<CatalogGame>): CatalogGame {
  return { id: p.slug ?? "x", slug: p.slug ?? "x", title: p.title ?? "T", author: p.author ?? "A", source: "user", embedUrl: "u", sandboxed: true, ...p };
}
const games: CatalogGame[] = [
  g({ slug: "a", title: "Alpha", tagline: "a puzzle", author: "Lan", classification: "game", genre: "Puzzle", tags: ["Unity"] }),
  g({ slug: "b", title: "Beta", author: "Minh", classification: "app", genre: "Tool", tags: ["Web"] }),
  g({ slug: "c", title: "Gamma", tagline: "learn math", author: "Lan", classification: "game", genre: "Educational", tags: ["Unity", "Math"] }),
];

describe("filterGames", () => {
  it("empty filter returns all", () => {
    expect(filterGames(games, EMPTY_FILTER)).toHaveLength(3);
  });
  it("query matches title/tagline/author (case-insensitive)", () => {
    expect(filterGames(games, { ...EMPTY_FILTER, query: "puzzle" }).map((x) => x.slug)).toEqual(["a"]);
    expect(filterGames(games, { ...EMPTY_FILTER, query: "lan" }).map((x) => x.slug)).toEqual(["a", "c"]);
  });
  it("classification + genre exact; tag membership; combined AND", () => {
    expect(filterGames(games, { ...EMPTY_FILTER, classification: "game" }).map((x) => x.slug)).toEqual(["a", "c"]);
    expect(filterGames(games, { ...EMPTY_FILTER, genre: "Tool" }).map((x) => x.slug)).toEqual(["b"]);
    expect(filterGames(games, { ...EMPTY_FILTER, tag: "Math" }).map((x) => x.slug)).toEqual(["c"]);
    expect(filterGames(games, { ...EMPTY_FILTER, classification: "game", tag: "Math" }).map((x) => x.slug)).toEqual(["c"]);
  });
});

describe("deriveFacets", () => {
  it("returns distinct sorted values, drops empties", () => {
    const f = deriveFacets(games);
    expect(f.classifications).toEqual(["app", "game"]);
    expect(f.genres).toEqual(["Educational", "Puzzle", "Tool"]);
    expect(f.tags).toEqual(["Math", "Unity", "Web"]);
  });
});
