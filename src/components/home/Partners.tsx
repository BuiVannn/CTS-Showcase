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
        <Stagger className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-5">
          {partners.map((p) => (
            <StaggerItem key={p.name}>
              <a
                href={p.url}
                target={p.url.startsWith("http") ? "_blank" : undefined}
                rel={p.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-display text-base font-semibold text-dim transition-colors hover:text-ink sm:text-lg"
              >
                {p.name}
              </a>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
