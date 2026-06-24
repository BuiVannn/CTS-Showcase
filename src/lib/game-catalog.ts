import "server-only";
import type { Localized } from "@/content/types";
import { getGames } from "@/content/games";
import { getGamesStore } from "@/lib/games-db";

const GAMES_ORIGIN = process.env.GAMES_ORIGIN || "https://games.ctslab.net";

export interface CatalogGame {
  id: string;
  slug: string;
  title: string;
  author: string;
  year?: number;
  cover?: string;
  tags?: string[];
  blurb?: Localized;
  source: "lab" | "user";
  embedUrl: string;
  sandboxed: boolean;
}

export function getCatalog(): CatalogGame[] {
  const lab: CatalogGame[] = getGames().map((g) => ({
    id: g.id, slug: g.slug, title: g.title, author: g.author, year: g.year,
    cover: g.cover, tags: g.tags, blurb: g.blurb,
    source: "lab", embedUrl: g.embedPath, sandboxed: false,
  }));
  const user: CatalogGame[] = getGamesStore().listPublished().map((g) => ({
    id: g.id, slug: g.slug, title: g.title, author: g.author,
    year: g.created_at ? new Date(g.created_at).getFullYear() : undefined,
    cover: g.cover ?? undefined, tags: ["Unity", "WebGL"],
    source: "user", embedUrl: `${GAMES_ORIGIN}/${g.slug}/index.html`, sandboxed: true,
  }));
  return [...lab, ...user];
}

export function getCatalogGame(slug: string): CatalogGame | undefined {
  return getCatalog().find((g) => g.slug === slug);
}
