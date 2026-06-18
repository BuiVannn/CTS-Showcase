"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import MediaFrame from "@/components/ui/MediaFrame";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function EcosystemBento() {
  const { t } = useLocale();
  const products = getProducts();
  return (
    <section className="section">
      <Container>
        <SectionHeader
          eyebrow={t(ui.ecosystem.eyebrow)}
          title={t(ui.ecosystem.title)}
          cta={{ label: t(ui.nav.viewAll), href: "/products" }}
        />
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Gamehub feature card */}
          <StaggerItem className="sm:col-span-2 lg:col-span-1">
            <Link href="/games" className="block h-full">
              <Card variant="feature" className="flex h-full flex-col justify-center">
                <span className="absolute right-4 top-4">
                  <Badge tone="red">{t(ui.home.comingSoon)}</Badge>
                </span>
                <div
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-red"
                  style={{ background: "var(--red-soft)" }}
                >
                  <Gamepad2 size={20} />
                </div>
                <h3 className="text-display text-lg text-ink">{t(ui.home.gamehubName)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(ui.home.gamehubBlurb)}</p>
              </Card>
            </Link>
          </StaggerItem>

          {/* Ecosystem apps */}
          {products.map((app) => (
            <StaggerItem key={app.id}>
              <Link href={`/products/${app.slug}`}>
                <Card className="h-full">
                  <MediaFrame src={app.image.src} alt={t(app.image.alt)} className="mb-4" />
                  <Badge tone="neutral">{t(app.categoryLabel)}</Badge>
                  <h3 className="text-display mt-3 text-base text-ink">{app.name}</h3>
                  <p className="mt-2 text-sm text-ink-2">{t(app.excerpt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {t(app.tags).slice(0, 3).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
