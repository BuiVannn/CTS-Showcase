"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import MediaFrame from "@/components/ui/MediaFrame";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AppDownload from "@/components/products/AppDownload";

export default function DownloadBand() {
  const { t } = useLocale();
  const featured = getProducts().filter(
    (a) => a.downloads?.android?.status === "available" || a.downloads?.ios?.status === "available",
  );
  if (featured.length === 0) return null;

  return (
    <section className="section">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.download.bandTitle)}</span>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <p className="max-w-xl text-sm leading-relaxed text-ink-2">{t(ui.download.bandLead)}</p>
            <Link href="/download" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
              {t(ui.download.viewAll)} <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <Stagger className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featured.map((app) => (
            <StaggerItem key={app.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="w-24 flex-shrink-0"><MediaFrame src={app.image.src} alt={t(app.image.alt)} /></div>
                  <div className="min-w-0">
                    <h3 className="text-display text-base text-ink">{app.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-2">{t(app.excerpt)}</p>
                  </div>
                </div>
                <div className="mt-4"><AppDownload app={app} variant="compact" /></div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
