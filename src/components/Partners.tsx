"use client";

import Image from "next/image";
import { useLocale } from "@/lib/locale";
import { partners } from "@/content/partners";
import { ui } from "@/content/ui";
import SectionHeader from "./SectionHeader";
import SectionReveal from "./SectionReveal";

export default function Partners() {
  const { t } = useLocale();

  return (
    <section className="section">
      <div className="container-x">
        <SectionHeader
          eyebrow={ui.partners.eyebrow}
          title={ui.partners.title}
          align="center"
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner, i) => (
            <SectionReveal key={partner.name} delay={(i % 6) * 0.05}>
              <a
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass lift group flex h-24 items-center justify-center px-4 text-center"
              >
                {partner.logo ? (
                  <Image
                    src={partner.logo.src}
                    alt={t(partner.logo.alt)}
                    width={120}
                    height={40}
                    className="h-9 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
                  />
                ) : (
                  <span className="font-display text-sm font-semibold text-muted transition-colors group-hover:text-ink">
                    {partner.name}
                  </span>
                )}
              </a>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
