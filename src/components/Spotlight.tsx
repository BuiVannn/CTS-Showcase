"use client";

import dynamic from "next/dynamic";
import { Sparkles, Rotate3d } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import SectionReveal from "./SectionReveal";

// WebGL viewer is client-only and lazy-loaded so three.js stays out of the
// initial bundle and never runs during SSR.
const RobotViewer = dynamic(() => import("./RobotViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--coral)]" />
    </div>
  ),
});

export default function Spotlight() {
  const { t } = useLocale();

  return (
    <section className="section overflow-hidden">
      <div className="container-x">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <SectionReveal>
            <span className="eyebrow">{t(ui.spotlight.eyebrow)}</span>
            <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              {t(ui.spotlight.lead)}
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--gradient-soft)] px-4 py-2 text-xs font-medium text-coral-ink">
              <Rotate3d size={14} />
              {t(ui.spotlight.hint)}
            </div>
          </SectionReveal>

          {/* 3D stage */}
          <SectionReveal delay={0.1}>
            <div className="glass-strong relative overflow-hidden p-3">
              {/* soft radial glow ground */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 55% at 50% 60%, rgba(251,90,120,0.16), transparent 70%), radial-gradient(55% 50% at 50% 40%, rgba(142,141,245,0.16), transparent 70%)",
                }}
              />
              <div className="relative aspect-square w-full sm:aspect-[4/3] lg:aspect-square">
                <RobotViewer />
              </div>
              <div className="glass-strong pointer-events-none absolute right-5 top-5 flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-semibold text-ink">
                <Sparkles size={14} className="text-coral-ink" />
                PTalk
              </div>
            </div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
