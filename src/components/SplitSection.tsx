"use client";

import Image from "next/image";
import { KeyRound } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { sso } from "@/content/sso";
import SectionReveal from "./SectionReveal";

export default function SplitSection() {
  const { t } = useLocale();

  return (
    <section className="section">
      <div className="container-x">
        <SectionReveal>
          <div className="glass-strong grid grid-cols-1 items-center gap-8 overflow-hidden p-7 sm:p-10 lg:grid-cols-2 lg:gap-12 lg:p-14">
            {/* Text */}
            <div>
              <span className="eyebrow">{t(sso.eyebrow)}</span>
              <h2 className="text-section mt-4 text-ink">{t(sso.title)}</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
                {t(sso.description)}
              </p>
              <div className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-white/60 px-4 py-2 text-xs font-semibold text-coral-ink">
                <KeyRound size={14} />
                {t(sso.caption)}
              </div>
            </div>

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--gradient-soft)]">
              <Image
                src={sso.image}
                alt={t(sso.title)}
                fill
                sizes="(max-width: 1024px) 90vw, 45vw"
                className="object-contain p-8"
              />
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
