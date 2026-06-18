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
                  className="text-display inline-flex items-center rounded-[var(--radius-pill)] border border-border bg-card px-5 py-2.5 text-sm font-semibold text-ink-2 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-0.5 hover:border-blue hover:text-ink sm:text-base"
                >
                  {p.name}
                </a>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
