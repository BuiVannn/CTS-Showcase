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
  const cls = f.classification?.toLowerCase() ?? null;
  const gen = f.genre?.toLowerCase() ?? null;
  const tg = f.tag?.toLowerCase() ?? null;
  return games.filter((g) => {
    if (q) {
      const hay = `${g.title} ${g.tagline ?? ""} ${g.author} ${g.genre ?? ""} ${(g.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (cls && (g.classification ?? "").toLowerCase() !== cls) return false;
    if (gen && (g.genre ?? "").toLowerCase() !== gen) return false;
    if (tg && !(g.tags ?? []).some((t) => t.toLowerCase() === tg)) return false;
    return true;
  });
}

export function deriveFacets(games: CatalogGame[]): { classifications: string[]; genres: string[]; tags: string[] } {
  const dedup = (vals: string[]) => {
    const seen = new Map<string, string>(); // lowercased key → first-seen display value
    for (const v of vals) {
      const k = v.toLowerCase();
      if (!seen.has(k)) seen.set(k, v);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  };
  const classifications: string[] = [];
  const genres: string[] = [];
  const tags: string[] = [];
  for (const g of games) {
    if (g.classification) classifications.push(g.classification);
    if (g.genre) genres.push(g.genre);
    for (const t of g.tags ?? []) if (t) tags.push(t);
  }
  return { classifications: dedup(classifications), genres: dedup(genres), tags: dedup(tags) };
}
