"use client";

import { useLocale } from "@/lib/locale";
import type { Localized } from "@/content/types";
import SectionReveal from "./SectionReveal";

interface SectionHeaderProps {
  eyebrow: Localized;
  title: Localized;
  lead?: Localized;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const { t } = useLocale();
  const centered = align === "center";

  return (
    <SectionReveal
      className={`${centered ? "mx-auto text-center" : ""} max-w-2xl ${className}`}
    >
      <span className={`eyebrow ${centered ? "justify-center" : ""}`}>{t(eyebrow)}</span>
      <h2 className="text-section mt-4 text-ink">{t(title)}</h2>
      {lead && (
        <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">{t(lead)}</p>
      )}
    </SectionReveal>
  );
}
