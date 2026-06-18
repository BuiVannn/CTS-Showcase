"use client";

import { useLocale } from "@/lib/locale";
import type { Locale } from "@/content/types";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "vi", label: "VI" },
  { code: "en", label: "EN" },
];

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`inline-flex items-center rounded-[var(--radius-pill)] border border-border bg-surface p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLocale(opt.code)}
            aria-pressed={active}
            className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide transition-colors duration-200 ${
              active ? "bg-blue text-white" : "text-ink-2 hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
