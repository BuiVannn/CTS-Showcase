"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AmbientField from "@/components/fx/AmbientField";
import EmptyState from "@/components/ui/EmptyState";
import GameCard from "@/components/games/GameCard";
import GameFilters from "@/components/games/GameFilters";
import { filterGames, deriveFacets, EMPTY_FILTER, type GameFilterState } from "@/lib/game-filter";

export default function GameHubView({ games }: { games: CatalogGame[] }) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<GameFilterState>(EMPTY_FILTER);
  const facets = useMemo(() => deriveFacets(games), [games]);
  const filtered = useMemo(() => filterGames(games, filter), [games, filter]);

  return (
    <section className="section relative overflow-hidden pt-28">
      <AmbientField tone="warm" />
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-draw">{t(ui.games.breadcrumb)}</span>
            <h1 className="text-section mt-3 text-ink">{t(ui.games.hubTitle)}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{t(ui.games.hubLead)}</p>
            <p className="mt-2 font-mono text-xs text-dim">{t(ui.games.gamesCount).replace("{n}", String(games.length))}</p>
          </div>
          <Link href="/games/submit" className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-blue hover:text-blue">
            + Đăng game của bạn
          </Link>
        </div>

        <div className="mt-8">
          <GameFilters facets={facets} state={filter} onChange={setFilter} />
        </div>

        {filtered.length > 0 ? (
          <Stagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <StaggerItem key={g.id}><GameCard game={g} /></StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mt-12">
            <EmptyState title={t(ui.games.noResults)} icon={<Gamepad2 size={28} aria-hidden />}>
              <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className="text-sm text-blue hover:underline">
                {t(ui.games.clearFilters)}
              </button>
            </EmptyState>
          </div>
        )}
      </Container>
    </section>
  );
}
