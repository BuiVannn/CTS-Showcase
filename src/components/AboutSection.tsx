"use client";

import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import SectionReveal from "./SectionReveal";

export default function AboutSection() {
  const { t } = useLocale();

  return (
    <section id="about" className="section">
      <div className="container-x">
        <SectionReveal className="glass-strong relative mx-auto max-w-4xl overflow-hidden px-7 py-16 text-center sm:px-14 lg:py-20">
          {/* soft corner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(251,90,120,0.45), transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(142,141,245,0.45), transparent 70%)" }}
          />

          <p className="font-display relative text-2xl font-medium leading-snug tracking-tight text-ink sm:text-3xl lg:text-[2.6rem] lg:leading-[1.18]">
            <span className="text-gradient">&ldquo;</span>
            {t(site.mission)}
            <span className="text-gradient">&rdquo;</span>
          </p>

          <div className="relative mt-10 flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[var(--border-strong)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-dim">
              {site.signature}
            </span>
            <span className="h-px w-12 bg-[var(--border-strong)]" />
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
