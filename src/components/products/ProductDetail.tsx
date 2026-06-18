"use client";

import { Download, Check } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getProduct } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MediaFrame from "@/components/ui/MediaFrame";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Reveal from "@/components/ui/Reveal";

export default function ProductDetail({ slug }: { slug: string }) {
  const { t, locale } = useLocale();
  const p = getProduct(slug);
  if (!p) return null; // the route already guards with notFound()
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb
          items={[
            { label: "CTS Lab", href: "/" },
            { label: locale === "vi" ? "Sản phẩm" : "Products", href: "/products" },
            { label: p.name },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <Reveal direction="right">
            <MediaFrame src={p.image.src} alt={t(p.image.alt)} />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
              <h1 className="text-section mt-3 text-ink">{p.name}</h1>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">{t(p.description)}</p>
              <ul className="mt-6 space-y-2">
                {t(p.features).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-blue" /> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-2">
                {t(p.tags).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
              {p.downloadHref !== "#" && (
                <div className="mt-7">
                  <Button href={p.downloadHref} variant="blue">
                    <Download size={16} /> {t(ui.products.download)}
                  </Button>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
