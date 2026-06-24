"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Tag from "@/components/ui/Tag";
import GameEmbed from "@/components/games/GameEmbed";

export default function GamePlayView({ game }: { game: CatalogGame }) {
  const { t } = useLocale();
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: t(ui.games.breadcrumb), href: "/games" }, { label: game.title }]} />
        <Link href="/games" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-blue">
          <ArrowLeft size={15} /> {t(ui.games.backToHub)}
        </Link>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <GameEmbed src={game.embedUrl} title={game.title} />
            <p className="mt-3 text-xs text-dim">{t(ui.games.heavyNote)}</p>
          </div>
          <aside>
            <h1 className="text-section text-ink">{game.title}</h1>
            <p className="mt-1 text-sm text-dim">{t(ui.games.by)} {game.author}{game.year ? ` · ${game.year}` : ""}</p>
            {game.blurb && <p className="mt-4 text-base leading-relaxed text-ink-2">{t(game.blurb)}</p>}
            {game.tags && game.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">{game.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
            )}
            <p className="mt-5 text-sm text-ink-2">{t(ui.games.fullscreenHint)}</p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
