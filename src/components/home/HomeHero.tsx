"use client";

import { Play } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function HomeHero() {
  const { t } = useLocale();
  return (
    <section className="relative pt-32 pb-20">
      <Container>
        <span className="eyebrow">{t(site.hero.eyebrow)}</span>
        <h1 className="text-hero mt-5 text-ink">
          {t(ui.home.heroWord1)} {t(ui.home.heroWord2)}{" "}
          <span className="text-ink">{t(ui.home.heroWordAccent)}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
          {t(site.hero.subtitle)}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/products" variant="blue">{t(ui.hero.exploreCta)}</Button>
          <Button href="/vr-tour" variant="red"><Play size={16} /> {t(ui.hero.vrCta)}</Button>
        </div>
      </Container>
    </section>
  );
}
