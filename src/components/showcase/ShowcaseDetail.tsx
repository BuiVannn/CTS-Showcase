"use client";

import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getShowcaseItem } from "@/content/showcase";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MediaFrame from "@/components/ui/MediaFrame";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import SectionGlow from "@/components/ui/SectionGlow";

export default function ShowcaseDetail({ id }: { id: string }) {
  const { t, locale } = useLocale();
  const s = getShowcaseItem(id);
  if (!s) return null; // the route already guards with notFound()

  const meta = [t(s.category), "STEM", "CTS Lab"];

  return (
    <article className="relative overflow-hidden pt-28 pb-20 lg:pt-32">
      <SectionGlow />
      <Container>
        <Breadcrumb
          items={[
            { label: "CTS Lab", href: "/" },
            { label: locale === "vi" ? "Sản phẩm nổi bật" : "Showcase", href: "/" },
            { label: s.title },
          ]}
        />

        <div className="mt-10 grid items-center gap-12 lg:grid-cols-2">
          {/* Media with a soft brand glow halo */}
          <Reveal direction="right">
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-6 -z-10 rounded-full opacity-70 blur-3xl"
                style={{ background: "radial-gradient(55% 55% at 50% 50%, var(--blue-soft), transparent 70%)" }}
              />
              <MediaFrame src={s.image.src} alt={t(s.image.alt)} ratio="4 / 3" className="shadow-[var(--shadow-lg)]" />
            </div>
          </Reveal>

          {/* Content */}
          <div>
            <Reveal>
              <span className="eyebrow">{locale === "vi" ? "Sản phẩm nổi bật" : "Featured build"}</span>
              <h1 className="text-section mt-4 text-ink">{s.title}</h1>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-5 flex flex-wrap gap-2">
                {meta.map((m) => (
                  <Badge key={m} tone="neutral">{m}</Badge>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-6 text-base leading-relaxed text-ink-2">{t(s.description)}</p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/products" variant="blue">
                  {t(ui.hero.exploreCta)} <ArrowRight size={16} />
                </Button>
                <Button href="/" variant="ghost">
                  <ArrowLeft size={16} /> {locale === "vi" ? "Về trang chủ" : "Back home"}
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </article>
  );
}
