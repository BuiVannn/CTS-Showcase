import { describe, it, expect } from "vitest";
import { getGames, getGame } from "./games";

describe("games content", () => {
  it("lists at least one game", () => {
    expect(getGames().length).toBeGreaterThanOrEqual(1);
  });
  it("resolves the tyrp game with its embed path", () => {
    const g = getGame("tyrp");
    expect(g?.title).toBe("To Your Right Places!");
    expect(g?.embedPath).toBe("/games/tyrp/index.html");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getGame("nope")).toBeUndefined();
  });
});
