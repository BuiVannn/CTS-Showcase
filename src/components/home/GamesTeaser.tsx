"use client";

import { Gamepad2, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import AmbientField from "@/components/fx/AmbientField";
import ParticleNetwork from "@/components/fx/ParticleNetwork";

export default function GamesTeaser() {
  const { t } = useLocale();
  return (
    <section className="section">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-8 sm:p-12">
            <AmbientField tone="warm" />
            <ParticleNetwork tone="warm" />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="eyebrow eyebrow-draw" style={{ color: "var(--red)" }}>{t(ui.gamesTeaser.eyebrow)}</span>
                <h2 className="text-section mt-3 text-ink">{t(ui.gamesTeaser.title)}</h2>
                <p className="mt-3 text-base leading-relaxed text-ink-2">{t(ui.gamesTeaser.lead)}</p>
              </div>
              <Magnetic>
                <Button href="/games" variant="red">
                  <Gamepad2 size={16} /> {t(ui.gamesTeaser.cta)} <ArrowRight size={16} />
                </Button>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
