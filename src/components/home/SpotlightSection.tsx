"use client";

import dynamic from "next/dynamic";
import { Sparkles, Rotate3d } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";

// WebGL viewer is client-only and lazy-loaded so three.js stays out of the
// initial bundle and never runs during SSR.
const RobotViewer = dynamic(() => import("./RobotViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-red" />
    </div>
  ),
});

export default function SpotlightSection() {
  const { t } = useLocale();
  return (
    <section className="section overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <Reveal>
            <span className="eyebrow">{t(ui.spotlight.eyebrow)}</span>
            <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg">
              {t(ui.spotlight.lead)}
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red" style={{ background: "var(--red-soft)" }}>
              <Rotate3d size={14} />
              {t(ui.spotlight.hint)}
            </div>
          </Reveal>

          {/* 3D stage */}
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-lg)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 55% at 50% 60%, var(--red-soft), transparent 70%), radial-gradient(55% 50% at 50% 40%, var(--blue-soft), transparent 70%)",
                }}
              />
              <div className="relative aspect-square w-full">
                <RobotViewer />
              </div>
              <div className="pointer-events-none absolute right-5 top-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-[var(--shadow-sm)]">
                <Sparkles size={14} className="text-red" />
                PTalk
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
