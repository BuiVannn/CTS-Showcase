"use client";

import { Download, Check, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getProduct } from "@/content/products";
import { APP_ICONS } from "@/lib/app-icons";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MediaFrame from "@/components/ui/MediaFrame";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import SectionGlow from "@/components/ui/SectionGlow";

export default function ProductDetail({ slug }: { slug: string }) {
  const { t, locale } = useLocale();
  const p = getProduct(slug);
  if (!p) return null; // the route already guards with notFound()
  const Icon = APP_ICONS[p.icon] ?? APP_ICONS.mic;

  return (
    <article className="relative overflow-hidden pt-28 pb-20 lg:pt-32">
      <SectionGlow />
      <Container>
        <Breadcrumb
          items={[
            { label: "CTS Lab", href: "/" },
            { label: locale === "vi" ? "Sản phẩm" : "Products", href: "/products" },
            { label: p.name },
          ]}
        />

        <div className="mt-10 grid items-start gap-12 lg:grid-cols-2">
          {/* Media with a soft brand glow halo */}
          <Reveal direction="right">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-full opacity-70 blur-3xl"
                style={{ background: "radial-gradient(55% 55% at 50% 50%, var(--blue-soft), transparent 70%)" }}
              />
              <MediaFrame src={p.image.src} alt={t(p.image.alt)} ratio="4 / 3" className="shadow-[var(--shadow-lg)]" />
            </div>
          </Reveal>

          {/* Content */}
          <div>
            <Reveal>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] text-blue"
                  style={{ background: "var(--blue-soft)" }}
                >
                  <Icon size={22} />
                </span>
                <span className="eyebrow">{t(p.categoryLabel)} · {p.year}</span>
              </div>
              <h1 className="text-section mt-4 text-ink">{p.name}</h1>
            </Reveal>

            <Reveal delay={0.08}>
              <p className="mt-5 text-base leading-relaxed text-ink-2">{t(p.description)}</p>
            </Reveal>

            <Reveal delay={0.12}>
              <h2 className="font-mono mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-dim">
                {locale === "vi" ? "Tính năng chính" : "Key features"}
              </h2>
            </Reveal>
            <Stagger className="mt-3 space-y-2.5">
              {t(p.features).map((f) => (
                <StaggerItem key={f}>
                  <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3 text-sm leading-relaxed text-ink-2 shadow-[var(--shadow-sm)] transition-colors hover:border-blue">
                    <Check size={16} className="mt-0.5 shrink-0 text-blue" /> {f}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal delay={0.1}>
              <div className="mt-6 flex flex-wrap gap-2">
                {t(p.tags).map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <div className="mt-8 flex flex-wrap gap-3">
                {p.downloadHref !== "#" && (
                  <Button href={p.downloadHref} variant="blue">
                    <Download size={16} /> {t(ui.products.download)}
                  </Button>
                )}
                <Button href="/products" variant={p.downloadHref !== "#" ? "ghost" : "blue"}>
                  {t(ui.products.backCta)} <ArrowRight size={16} />
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </article>
  );
}
