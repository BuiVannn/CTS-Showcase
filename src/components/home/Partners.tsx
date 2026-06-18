"use client";

import { useLocale } from "@/lib/locale";
import { partners } from "@/content/partners";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function Partners() {
  const { t } = useLocale();
  return (
    <section className="section bg-surface">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.partners.eyebrow)}</span>
          <h2 className="text-section mt-2 text-ink">{t(ui.partners.title)}</h2>
        </Reveal>
        <Stagger className="mt-8 flex flex-wrap gap-3">
          {partners.map((p) => {
            const external = p.url.startsWith("http");
            return (
              <StaggerItem key={p.name}>
                <a
                  href={p.url}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-border bg-card px-4 py-2.5 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-0.5 hover:border-blue"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold text-blue"
                    style={{ background: "var(--blue-soft)" }}
                  >
                    {p.name.charAt(0)}
                  </span>
                  <span className="text-display text-sm font-semibold text-ink-2 transition-colors group-hover:text-ink sm:text-base">
                    {p.name}
                  </span>
                </a>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
