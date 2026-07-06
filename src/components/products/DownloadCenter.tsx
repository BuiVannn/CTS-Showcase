"use client";

import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AppDownload from "@/components/products/AppDownload";

export default function DownloadCenter() {
  const { t } = useLocale();
  const apps = getProducts();
  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.products.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.download.centerTitle)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.download.centerIntro)}</p>
        </Reveal>
        <Stagger className="mt-10 flex flex-col gap-3">
          {apps.map((app) => (
            <StaggerItem key={app.id}>
              <AppDownload app={app} variant="row" />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
