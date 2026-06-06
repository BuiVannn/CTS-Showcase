"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

/** Localized overlay for the VR tour route: loading shell + a back button. */
export default function VRTourShell() {
  const { t } = useLocale();

  return (
    <>
      {/* Loading shell — sits behind the iframe (z-0), revealed until it paints */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="eyebrow">{t(ui.vrTour.eyebrow)}</span>
        <p className="text-sm text-muted">{t(ui.vrTour.loading)}</p>
        <span className="mt-2 inline-block h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--coral)]" />
      </div>

      {/* Back button — floats above the iframe */}
      <Link
        href="/"
        className="glass-strong absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-ink transition-colors hover:text-coral-ink"
      >
        <ArrowLeft size={15} />
        {t(ui.vrTour.back)}
      </Link>
    </>
  );
}
