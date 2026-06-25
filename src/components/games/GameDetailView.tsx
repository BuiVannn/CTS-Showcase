"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Play, Video } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import Reveal from "@/components/ui/Reveal";
import AmbientField from "@/components/fx/AmbientField";
import GameCover from "@/components/games/GameCover";
import GameEmbed from "@/components/games/GameEmbed";
import MessageContent from "@/components/home/MessageContent";

const PRIMARY = "inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90";
const SECONDARY = "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue";

export default function GameDetailView({ game }: { game: CatalogGame }) {
  const { t } = useLocale();
  const badges = [game.releaseStatus, game.classification, game.projectType].filter(Boolean) as string[];
  const isExternal = game.projectType === "external" && !!game.externalUrl;

  return (
    <>
      <section className="section relative overflow-hidden pt-28 pb-0">
        <AmbientField tone="warm" />
        <Container>
          <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: t(ui.games.breadcrumb), href: "/games" }, { label: game.title }]} />
          <Link href="/games" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-blue">
            <ArrowLeft size={15} /> {t(ui.games.backToHub)}
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-[var(--shadow-lg)]">
                <GameCover game={game} />
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => <Badge key={b} tone="neutral"><span className="capitalize">{b.replace(/_/g, " ")}</span></Badge>)}
                </div>
              )}
              <h1 className="text-section mt-3 text-ink">{game.title}</h1>
              {game.tagline && <p className="mt-2 text-lg leading-relaxed text-ink-2">{game.tagline}</p>}
              <p className="mt-3 text-sm text-dim">{t(ui.games.by)} {game.author}{game.year ? ` · ${game.year}` : ""}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {isExternal ? (
                  <a href={game.externalUrl} target="_blank" rel="noopener noreferrer" className={PRIMARY}><ExternalLink size={16} /> {t(ui.games.openLink)}</a>
                ) : (
                  <a href="#play" className={PRIMARY}><Play size={16} /> {t(ui.games.play)}</a>
                )}
                {game.videoUrl && <a href={game.videoUrl} target="_blank" rel="noopener noreferrer" className={SECONDARY}><Video size={16} /> {t(ui.games.watchVideo)}</a>}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section pt-12">
        <Container>
          {!isExternal && (
            <div id="play" className="scroll-mt-24">
              <GameEmbed src={game.embedUrl} title={game.title} />
              <p className="mt-3 text-xs text-dim">{t(ui.games.heavyNote)}</p>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <h2 className="text-display text-xl text-ink">{t(ui.games.about)}</h2>
              {game.description
                ? <div className="mt-3"><MessageContent content={game.description} /></div>
                : <p className="mt-3 text-sm text-dim">{t(ui.games.noDescription)}</p>}
            </Reveal>

            <aside className="space-y-4">
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-display text-sm text-ink">{t(ui.games.info)}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <MetaRow label={t(ui.games.creator)} value={game.author} />
                  {game.genre && <MetaRow label={t(ui.games.genre)} value={game.genre} />}
                  {game.classification && <MetaRow label={t(ui.games.classification)} value={game.classification} />}
                  {game.releaseStatus && <MetaRow label={t(ui.games.releaseStatus)} value={game.releaseStatus.replace(/_/g, " ")} />}
                </dl>
                {game.tags && game.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">{game.tags.map((tg) => <Tag key={tg}>{tg}</Tag>)}</div>
                )}
              </div>

              {(game.externalUrl || game.videoUrl) && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
                  <h3 className="text-display text-sm text-ink">{t(ui.games.links)}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {game.externalUrl && <li><a href={game.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue hover:underline"><ExternalLink size={14} /> {t(ui.games.openLink)}</a></li>}
                    {game.videoUrl && <li><a href={game.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue hover:underline"><Video size={14} /> {t(ui.games.watchVideo)}</a></li>}
                  </ul>
                </div>
              )}

              <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-5 text-center">
                <p className="text-sm text-dim">{t(ui.games.comingSoonComments)}</p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-dim">{label}</dt>
      <dd className="text-right capitalize text-ink-2">{value}</dd>
    </div>
  );
}
