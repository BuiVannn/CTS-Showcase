"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { getGames } from "@/content/games";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import GameCover from "@/components/games/GameCover";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AmbientField from "@/components/fx/AmbientField";

export default function GameHubView() {
  const { t } = useLocale();
  const games = getGames();

  return (
    <section className="section relative overflow-hidden pt-28">
      <AmbientField tone="warm" />
      <Container>
        <span className="eyebrow eyebrow-draw">{t(ui.games.breadcrumb)}</span>
        <h1 className="text-section mt-3 text-ink">{t(ui.games.hubTitle)}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{t(ui.games.hubLead)}</p>

        <Stagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <StaggerItem key={g.id}>
              <Link
                href={`/games/${g.slug}`}
                className="group block rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:border-blue"
              >
                <div className="relative">
                  <GameCover game={g} />
                  {g.tags && g.tags.length > 0 && (
                    <span className="absolute left-2 top-2">
                      <Badge tone="neutral">{g.tags.join(" · ")}</Badge>
                    </span>
                  )}
                </div>
                <h2 className="text-display mt-3 text-lg text-ink">{g.title}</h2>
                <p className="mt-1 text-sm text-ink-2">{t(ui.games.by)} {g.author} · {g.year}</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
