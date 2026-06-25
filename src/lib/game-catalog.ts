import "server-only";
import { getGames } from "@/content/games";
import { getGamesStore } from "@/lib/games-db";
import { mapLabGame, mapUserGame } from "@/lib/game-catalog-map";

export type { CatalogGame } from "@/lib/game-catalog-map";

export function getCatalog() {
  return [...getGames().map(mapLabGame), ...getGamesStore().listPublished().map(mapUserGame)];
}

export function getCatalogGame(slug: string) {
  return getCatalog().find((g) => g.slug === slug);
}
