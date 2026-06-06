"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ecosystem } from "@/content/ecosystem";
import { ui } from "@/content/ui";
import SectionHeader from "./SectionHeader";
import SectionReveal from "./SectionReveal";

export default function ProductShowcase() {
  const { t } = useLocale();

  return (
    <section id="products" className="section">
      <div className="container-x">
        <SectionHeader eyebrow={ui.ecosystem.eyebrow} title={ui.ecosystem.title} />

        {/* SSO badge */}
        <SectionReveal className="mt-7" delay={0.05}>
          <div className="inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-white/60 px-4 py-2.5 backdrop-blur">
            <Shield size={15} className="text-coral-ink" />
            <span className="text-sm text-ink">
              {t(ui.ecosystem.ssoPrefix)}
              <span className="font-semibold text-coral-ink">
                {t(ui.ecosystem.ssoStrong)}
              </span>
            </span>
          </div>
        </SectionReveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ecosystem.map((app, i) => (
            <SectionReveal key={app.id} delay={(i % 4) * 0.07}>
              <article className="glass lift group flex h-full flex-col overflow-hidden">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={app.image.src}
                    alt={t(app.image.alt)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-[var(--radius-pill)] bg-[var(--gradient-accent)] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-white">
                    {t(app.categoryLabel)}
                  </span>
                  <span className="absolute right-3 top-3 rounded-[var(--radius-pill)] bg-white/85 px-2 py-0.5 text-[0.6rem] font-semibold text-ink backdrop-blur">
                    {app.year}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {app.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t(app.excerpt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {t(app.tags).map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/products#${app.slug}`}
                    className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-coral-ink transition-colors hover:text-coral"
                  >
                    {t(ui.ecosystem.learnMore)}
                    <ArrowUpRight
                      size={14}
                      className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </div>
              </article>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
