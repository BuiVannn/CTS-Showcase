"use client";

import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { team } from "@/content/team";
import { ui } from "@/content/ui";
import { sso } from "@/content/sso";
import Container from "@/components/ui/Container";
import StatBand from "@/components/ui/StatBand";

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
        <StatBand items={stats} />
        <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-7 sm:p-10">
          <span className="eyebrow">{t(sso.caption)}</span>
          <h2 className="text-section mt-3 text-ink">{t(sso.title)}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(sso.description)}</p>
        </div>
      </Container>
    </section>
  );
}
