"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { showcase } from "@/content/showcase";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import SectionHeader from "./SectionHeader";
import SectionReveal from "./SectionReveal";

export default function ShowcaseSection() {
  const { t } = useLocale();

  return (
    <section id="showcase" className="section">
      <div className="container-x">
        <SectionHeader
          eyebrow={ui.showcase.eyebrow}
          title={ui.showcase.title}
          lead={ui.showcase.lead}
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {showcase.map((item, i) => {
            const spanLast =
              showcase.length % 2 !== 0 && i === showcase.length - 1;
            return (
              <SectionReveal
                key={item.id}
                delay={(i % 2) * 0.08}
                className={spanLast ? "lg:col-span-2" : ""}
              >
                <article className="glass lift group h-full overflow-hidden">
                  <div
                    className={`relative overflow-hidden ${
                      spanLast ? "h-72 sm:h-96" : "h-64 sm:h-72"
                    }`}
                  >
                    <Image
                      src={item.image.src}
                      alt={t(item.image.alt)}
                      fill
                      sizes={spanLast ? "100vw" : "(max-width: 1024px) 100vw, 50vw"}
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/10 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-[var(--radius-pill)] bg-[var(--gradient-accent)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-white shadow-[var(--shadow-sm)]">
                      {t(item.category)}
                    </span>
                  </div>
                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted sm:text-[0.95rem]">
                      {t(item.description)}
                    </p>
                  </div>
                </article>
              </SectionReveal>
            );
          })}
        </div>

        {/* Demo video */}
        <SectionReveal className="mt-6">
          <div className="glass overflow-hidden p-2">
            <div className="relative aspect-video overflow-hidden rounded-[calc(var(--radius-lg)-0.5rem)] bg-ink/90">
              <iframe
                src={site.videoUrl}
                title={`${site.siteNameShort} — ${t(ui.showcase.watchDemo)}`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-white/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-coral-ink backdrop-blur">
                <Play size={12} />
                {t(ui.showcase.watchDemo)}
              </span>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
