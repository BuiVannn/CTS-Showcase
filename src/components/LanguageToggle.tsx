"use client";

import { useLocale } from "@/lib/locale";
import type { Locale } from "@/content/types";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "vi", label: "VI" },
];

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={`relative inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--border-strong)] bg-[var(--glass-bg-strong)] p-0.5 backdrop-blur-md ${className}`}
      role="group"
      aria-label="Language"
    >
      {OPTIONS.map((opt) => {
        const active = locale === opt.code;
        return (
          <button
            key={opt.code}
            onClick={() => setLocale(opt.code)}
            aria-pressed={active}
            className={`relative z-10 rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide transition-colors duration-300 ${
              active ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            {active && (
              <span className="absolute inset-0 -z-10 rounded-[var(--radius-pill)] bg-[var(--gradient-accent)] shadow-[var(--shadow-sm)]" />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
