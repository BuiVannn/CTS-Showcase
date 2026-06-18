"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { showcase } from "@/content/showcase";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import HoverPreview from "@/components/ui/HoverPreview";
import DemoVideo from "@/components/home/DemoVideo";

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
              <Link
                href={`/showcase/${s.id}`}
                className="block h-full rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue"
              >
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
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Demo video — click-to-play facade so scrolling past stays smooth */}
        <Reveal className="mt-6">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-2">
            <DemoVideo
              videoUrl={site.videoUrl}
              label={t(ui.showcase.watchDemo)}
              title={`${site.siteNameShort} — ${t(ui.showcase.watchDemo)}`}
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
