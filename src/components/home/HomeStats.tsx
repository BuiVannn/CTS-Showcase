"use client";

import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { team } from "@/content/team";
import { ui } from "@/content/ui";
import { sso } from "@/content/sso";
import Container from "@/components/ui/Container";
import StatBand from "@/components/ui/StatBand";
import Reveal from "@/components/ui/Reveal";
import AmbientField from "@/components/fx/AmbientField";
import OneAccountApps from "@/components/home/OneAccountApps";

export default function HomeStats() {
  const { t } = useLocale();
  const stats = [
    { value: String(getProducts().length).padStart(2, "0"), label: t(ui.home.statApps) },
    { value: "164", label: t(ui.home.statScenes) },
    { value: String(team.length), label: t(ui.home.statTeam) },
    { value: "PTIT", label: t(ui.home.statPartner) },
  ];
  return (
    <section className="section pt-0">
      <Container>
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
          <AmbientField tone="cool" />
          <div className="relative">
            <StatBand items={stats} />
          </div>
        </div>
        <Reveal delay={0.1}>
          <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-7 sm:p-10">
            <span className="eyebrow">{t(sso.caption)}</span>
            <h2 className="text-section mt-3 text-ink">{t(sso.title)}</h2>
            <OneAccountApps />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
