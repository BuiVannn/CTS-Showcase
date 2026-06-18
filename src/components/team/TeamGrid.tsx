"use client";

import { useLocale } from "@/lib/locale";
import { team } from "@/content/team";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import MediaFrame from "@/components/ui/MediaFrame";

export default function TeamGrid() {
  const { t } = useLocale();
  return (
    <section className="section pt-28">
      <Container>
        <span className="eyebrow">{t(ui.team.eyebrow)}</span>
        <h1 className="text-section mt-2 text-ink">{t(ui.team.title)}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.team.lead)}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.id} className="rounded-[var(--radius-lg)] border border-border bg-card p-3">
              <MediaFrame src={m.image.src} alt={t(m.image.alt)} ratio="3 / 4" />
              <h2 className="text-display mt-3 text-sm text-ink">{m.name}</h2>
              {m.role && <p className="mt-0.5 text-xs text-ink-2">{t(m.role)}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
