"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import GameCover from "@/components/games/GameCover";

export default function GameCard({ game }: { game: CatalogGame }) {
  const { t } = useLocale();
  const badge = game.releaseStatus ?? game.classification;
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:border-blue"
    >
      <div className="relative">
        <GameCover game={game} />
        {badge && (
          <span className="absolute left-2 top-2">
            <Badge tone="neutral"><span className="capitalize">{badge.replace(/_/g, " ")}</span></Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-display line-clamp-1 text-lg text-ink">{game.title}</h2>
        {game.tagline && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{game.tagline}</p>}
        {(game.genre || (game.tags && game.tags.length > 0)) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {game.genre && <Tag>{game.genre}</Tag>}
            {game.tags?.slice(0, 3).map((tg) => <Tag key={tg}>{tg}</Tag>)}
          </div>
        )}
        <p className="mt-3 text-xs text-dim">{t(ui.games.by)} {game.author}{game.year ? ` · ${game.year}` : ""}</p>
      </div>
    </Link>
  );
}
