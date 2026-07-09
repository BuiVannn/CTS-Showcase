"use client";

import { useLocale } from "@/lib/locale";
import { getDownloadApps, getVrDevices } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AppDownload from "@/components/products/AppDownload";
import type { EcosystemApp } from "@/content/types";

function Group({ heading, lead, apps }: { heading: string; lead: string; apps: EcosystemApp[] }) {
  if (apps.length === 0) return null;
  return (
    <div className="mt-12 first:mt-10">
      <Reveal>
        <div className="flex items-center gap-3">
          <h2 className="text-display text-lg text-ink">{heading}</h2>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>
        <p className="mt-1 text-sm text-ink-2">{lead}</p>
      </Reveal>
      <Stagger className="mt-5 flex flex-col gap-3">
        {apps.map((app) => (
          <StaggerItem key={app.id}>
            <AppDownload app={app} variant="row" />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

export default function DownloadCenter() {
  const { t } = useLocale();
  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.products.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.download.centerTitle)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.download.centerIntro)}</p>
        </Reveal>
        <Group heading={t(ui.download.mobileGroup)} lead={t(ui.download.mobileGroupLead)} apps={getDownloadApps()} />
        <Group heading={t(ui.download.vrGroup)} lead={t(ui.download.vrGroupLead)} apps={getVrDevices()} />
      </Container>
    </section>
  );
}
