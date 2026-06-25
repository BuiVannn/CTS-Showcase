import type { CatalogGame } from "@/lib/game-catalog-map";

export interface GameFilterState {
  query: string;
  classification: string | null;
  genre: string | null;
  tag: string | null;
}

export const EMPTY_FILTER: GameFilterState = { query: "", classification: null, genre: null, tag: null };

export function filterGames(games: CatalogGame[], f: GameFilterState): CatalogGame[] {
  const q = f.query.trim().toLowerCase();
  return games.filter((g) => {
    if (q) {
      const hay = `${g.title} ${g.tagline ?? ""} ${g.author}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.classification && g.classification !== f.classification) return false;
    if (f.genre && g.genre !== f.genre) return false;
    if (f.tag && !(g.tags ?? []).includes(f.tag)) return false;
    return true;
  });
}

export function deriveFacets(games: CatalogGame[]): { classifications: string[]; genres: string[]; tags: string[] } {
  const classifications = new Set<string>();
  const genres = new Set<string>();
  const tags = new Set<string>();
  for (const g of games) {
    if (g.classification) classifications.add(g.classification);
    if (g.genre) genres.add(g.genre);
    for (const t of g.tags ?? []) if (t) tags.add(t);
  }
  const sort = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return { classifications: sort(classifications), genres: sort(genres), tags: sort(tags) };
}
