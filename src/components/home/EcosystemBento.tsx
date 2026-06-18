"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ecosystem } from "@/content/ecosystem";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";

export default function EcosystemBento() {
  const { t } = useLocale();
  return (
    <section className="section">
      <Container>
        <SectionHeader
          eyebrow={t(ui.ecosystem.eyebrow)}
          title={t(ui.ecosystem.title)}
          cta={{ label: t(ui.nav.viewAll), href: "/products" }}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Gamehub feature card */}
          <Link href="/games" className="sm:col-span-2 lg:col-span-1">
            <Card variant="feature" className="h-full">
              <span className="absolute right-4 top-4">
                <Badge tone="red">{t(ui.home.comingSoon)}</Badge>
              </span>
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 bg-surface"
              >
                <Gamepad2 size={18} />
              </div>
              <h3 className="text-display text-base text-ink">{t(ui.home.gamehubName)}</h3>
              <p className="mt-2 text-sm text-ink-2">{t(ui.home.gamehubBlurb)}</p>
            </Card>
          </Link>

          {/* Ecosystem apps */}
          {ecosystem.map((app) => (
            <Link key={app.id} href="/products">
              <Card className="h-full">
                <h3 className="text-display text-base text-ink">{app.name}</h3>
                <p className="mt-2 text-sm text-ink-2">{t(app.excerpt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t(app.tags).slice(0, 3).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
