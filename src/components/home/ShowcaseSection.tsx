"use client";

import { Play } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { showcase } from "@/content/showcase";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import HoverPreview from "@/components/ui/HoverPreview";

const FEATURED = ["robot-clover", "pcar", "vex", "vr"];

export default function ShowcaseSection() {
  const { t } = useLocale();
  const items = showcase.filter((s) => FEATURED.includes(s.id));
  return (
    <section className="section bg-surface">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.showcase.eyebrow)}</span>
          <h2 className="text-section mt-2 text-ink">{t(ui.showcase.title)}</h2>
          <p className="mt-3 mb-9 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.showcase.lead)}</p>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <StaggerItem key={s.id}>
              <div className="h-full rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)]">
                <HoverPreview
                  src={s.image.src}
                  alt={t(s.image.alt)}
                  overlay={
                    <p className="line-clamp-3 text-xs leading-relaxed text-white">{t(s.description)}</p>
                  }
                />
                <div className="px-1.5 pb-1">
                  <Badge tone="neutral">{t(s.category)}</Badge>
                  <h3 className="text-display mt-2 text-base text-ink">{s.title}</h3>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Demo video (re-added from the old site) */}
        <Reveal className="mt-6">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-2">
            <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-ink/90">
              <iframe
                src={site.videoUrl}
                title={`${site.siteNameShort} — ${t(ui.showcase.watchDemo)}`}
                className="h-full w-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-white/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-red backdrop-blur">
                <Play size={12} />
                {t(ui.showcase.watchDemo)}
              </span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
