"use client";

import Image from "next/image";
import { Sparkles, MousePointer2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import SectionReveal from "./SectionReveal";
import TiltCard from "./TiltCard";

// Replaces the old 50MB 3D robot stage with a GPU-cheap pointer-tilt poster.
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
              <MousePointer2 size={14} />
              {t(ui.spotlight.hint)}
            </div>
          </SectionReveal>

          {/* Tilt poster */}
          <SectionReveal delay={0.1}>
            <TiltCard className="relative mx-auto max-w-md">
              <div className="glass-strong overflow-hidden p-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[calc(var(--radius-lg)-0.5rem)]">
                  <Image
                    src="/img/clover_bot.jpg"
                    alt="Robot Clover"
                    fill
                    sizes="(max-width: 1024px) 90vw, 40vw"
                    className="object-cover"
                    style={{ transform: "translateZ(40px)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Floating badge lifted in 3D space */}
              <div
                className="glass-strong absolute -right-4 -top-4 flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-semibold text-ink"
                style={{ transform: "translateZ(70px)" }}
              >
                <Sparkles size={14} className="text-coral-ink" />
                Robot Clover
              </div>
            </TiltCard>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
