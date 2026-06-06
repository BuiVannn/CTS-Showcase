"use client";

import Link from "next/link";
import {
  Mic,
  Paintbrush,
  Film,
  Music,
  Shield,
  Check,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ecosystem } from "@/content/ecosystem";
import { sso } from "@/content/sso";
import { ui } from "@/content/ui";
import type { IconKey } from "@/content/types";
import SectionReveal from "./SectionReveal";

const ICONS: Record<IconKey, typeof Mic> = {
  mic: Mic,
  paintbrush: Paintbrush,
  film: Film,
  music: Music,
};

export default function ProductsView() {
  const { t } = useLocale();

  return (
    <main className="relative">
      {/* Hero banner */}
      <section className="pt-32 lg:pt-40">
        <div className="container-x">
          <SectionReveal>
            <span className="eyebrow">{t(ui.products.eyebrow)}</span>
            <h1 className="text-section mt-4 text-gradient">{t(ui.products.title)}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              {t(ui.products.intro)}
            </p>
          </SectionReveal>
        </div>
      </section>

      {/* SSO banner */}
      <section className="pt-12 lg:pt-16">
        <div className="container-x">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--gradient-accent)] px-7 py-10 shadow-[var(--shadow-coral)] sm:px-12 lg:py-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/20 blur-3xl"
              />
              <div className="relative flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-10">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white/20 text-white">
                  <Shield size={28} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
                    {t(sso.bannerTitle)}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
                    {t(sso.bannerDescription)}
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Download cards */}
      <section className="py-16 lg:py-24">
        <div className="container-x">
          <SectionReveal>
            <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {t(ui.products.downloadHeading)}
            </h2>
          </SectionReveal>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ecosystem.map((app, i) => {
              const Icon = ICONS[app.icon];
              return (
                <SectionReveal key={app.id} delay={(i % 3) * 0.07}>
                  <article
                    id={app.slug}
                    className="glass flex h-full scroll-mt-28 flex-col p-6"
                  >
                    <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--gradient-soft)] text-coral-ink">
                      <Icon size={26} />
                    </span>
                    <h3 className="font-display text-xl font-semibold text-ink">
                      {app.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {t(app.description)}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {t(app.features).map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm text-muted">
                          <Check size={15} className="mt-0.5 flex-shrink-0 text-coral-ink" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={app.downloadHref}
                      className="btn-glass mt-6 w-full justify-center"
                    >
                      {t(ui.products.download)}
                      <ArrowRight size={15} />
                    </a>
                  </article>
                </SectionReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Back to home */}
      <section className="pb-24 lg:pb-32">
        <div className="container-x text-center">
          <p className="text-sm text-muted">{t(ui.products.backText)}</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-coral-ink transition-colors hover:text-coral"
          >
            {t(ui.products.backCta)}
            <ChevronRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
