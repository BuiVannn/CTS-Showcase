"use client";

import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function HomeCTA() {
  const { t } = useLocale();
  return (
    <section className="section">
      <Container>
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center sm:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-70"
            style={{ background: "radial-gradient(120% 90% at 50% 0%, var(--blue-soft), transparent 60%)" }}
          />
          <span className="eyebrow">{t(ui.home.ctaEyebrow)}</span>
          <h2 className="text-section mx-auto mt-3 max-w-2xl text-ink">{t(ui.contact.heading)}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-2">{t(ui.contact.blurb)}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${site.contact.email}`}
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-[0.9rem] font-semibold text-white transition duration-200 hover:brightness-110"
            >
              {t(ui.home.ctaButton)}
            </a>
            <Button href="/products" variant="ghost">
              {t(ui.products.title)}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
