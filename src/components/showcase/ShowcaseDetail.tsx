"use client";

import { useLocale } from "@/lib/locale";
import { getShowcaseItem } from "@/content/showcase";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MediaFrame from "@/components/ui/MediaFrame";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";

export default function ShowcaseDetail({ id }: { id: string }) {
  const { t, locale } = useLocale();
  const s = getShowcaseItem(id);
  if (!s) return null; // the route already guards with notFound()
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb
          items={[
            { label: "CTS Lab", href: "/" },
            { label: locale === "vi" ? "Sản phẩm nổi bật" : "Showcase", href: "/" },
            { label: s.title },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <Reveal direction="right">
            <MediaFrame src={s.image.src} alt={t(s.image.alt)} ratio="4 / 3" />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <Badge tone="neutral">{t(s.category)}</Badge>
              <h1 className="text-section mt-3 text-ink">{s.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-ink-2">{t(s.description)}</p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
