"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import HoverPreview from "@/components/ui/HoverPreview";

export default function ProductsGrid() {
  const { t } = useLocale();
  const products = getProducts();
  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.products.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.products.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.products.intro)}</p>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <StaggerItem key={p.id}>
              <Link href={`/products/${p.slug}`} className="block h-full">
                <div className="h-full rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue">
                  <HoverPreview
                    src={p.image.src}
                    alt={t(p.image.alt)}
                    overlay={
                      <div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-white">{t(p.excerpt)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t(p.tags).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-[var(--radius-pill)] bg-white/15 px-2 py-0.5 text-[0.6rem] font-medium text-white">{tag}</span>
                          ))}
                        </div>
                      </div>
                    }
                  />
                  <div className="px-1.5 pb-1">
                    <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
                    <h2 className="text-display mt-2 text-base text-ink">{p.name}</h2>
                    <p className="mt-1 text-sm text-ink-2">{t(p.excerpt)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t(p.tags).slice(0, 3).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
