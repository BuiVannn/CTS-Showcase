"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, Search } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AmbientField from "@/components/fx/AmbientField";
import EmptyState from "@/components/ui/EmptyState";
import GameCard from "@/components/games/GameCard";
import { filterGames, EMPTY_FILTER } from "@/lib/game-filter";

export default function GameHubView({ games }: { games: CatalogGame[] }) {
  const { t } = useLocale();
  const router = useRouter();
  // Next's client Router Cache restores the cached hub tree on back/forward and
  // tab revisits WITHOUT remounting, so a mount-only refresh misses those paths
  // and a newly published/edited game won't appear until a full reload. Refetch
  // server data whenever the hub becomes visible again (revalidate-on-focus).
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "hidden") router.refresh();
    };
    refresh(); // initial mount
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("popstate", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("popstate", refresh);
    };
  }, [router]);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterGames(games, { ...EMPTY_FILTER, query }), [games, query]);

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
          <Link href="/games/studio" className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-blue hover:text-blue">
            + Đăng game của bạn
          </Link>
        </div>

        <div className="relative mt-8 max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(ui.games.searchPlaceholder)}
            aria-label={t(ui.games.searchPlaceholder)}
            className="w-full rounded-[var(--radius-pill)] border border-border bg-card py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-blue"
          />
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
              <button type="button" onClick={() => setQuery("")} className="text-sm text-blue hover:underline">
                {t(ui.games.clearFilters)}
              </button>
            </EmptyState>
          </div>
        )}
      </Container>
    </section>
  );
}
