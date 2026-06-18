"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import MediaFrame from "@/components/ui/MediaFrame";

export default function ProductsGrid() {
  const { t } = useLocale();
  const products = getProducts();
  return (
    <section className="section pt-28">
      <Container>
        <span className="eyebrow">{t(ui.products.eyebrow)}</span>
        <h1 className="text-section mt-2 text-ink">{t(ui.products.title)}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.products.intro)}</p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`}>
              <Card className="h-full">
                <MediaFrame src={p.image.src} alt={t(p.image.alt)} className="mb-4" />
                <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
                <h2 className="text-display mt-3 text-base text-ink">{p.name}</h2>
                <p className="mt-2 text-sm text-ink-2">{t(p.excerpt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t(p.tags).slice(0, 3).map((tag) => (
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
