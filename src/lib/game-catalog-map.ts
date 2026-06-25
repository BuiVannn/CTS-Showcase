import type { Localized } from "@/content/types";
import type { Game } from "@/content/types";
import type { DbGame } from "@/lib/games-db";

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
  tagline?: string;
  description?: string;
  classification?: string;
  projectType?: string;
  releaseStatus?: string;
  genre?: string;
  externalUrl?: string;
  videoUrl?: string;
}

export function mapLabGame(g: Game): CatalogGame {
  return {
    id: g.id, slug: g.slug, title: g.title, author: g.author, year: g.year,
    cover: g.cover, tags: g.tags, blurb: g.blurb,
    source: "lab", embedUrl: g.embedPath, sandboxed: false,
    tagline: g.tagline?.vi, description: g.description?.vi,
    classification: g.classification, projectType: g.projectType,
    releaseStatus: g.releaseStatus, genre: g.genre,
    externalUrl: g.externalUrl, videoUrl: g.videoUrl,
  };
}

export function mapUserGame(g: DbGame): CatalogGame {
  return {
    id: g.id, slug: g.slug, title: g.title, author: g.author,
    year: g.created_at ? new Date(g.created_at).getFullYear() : undefined,
    cover: g.cover ?? undefined,
    tags: g.tags ? g.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
    source: "user", embedUrl: `${GAMES_ORIGIN}/${g.slug}/index.html`, sandboxed: true,
    tagline: g.tagline ?? undefined, description: g.description ?? undefined,
    classification: g.classification ?? undefined, projectType: g.project_type ?? undefined,
    releaseStatus: g.release_status ?? undefined, genre: g.genre ?? undefined,
    externalUrl: g.external_url ?? undefined, videoUrl: g.video_url ?? undefined,
  };
}
