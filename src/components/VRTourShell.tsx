"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

/**
 * Fullscreen VR tour chrome: a slim top bar (Back + label) above the tour
 * iframe. The bar sits OUTSIDE the iframe so it never overlaps the tour's own
 * sidebar / toggle / header controls — the iframe fills the area below it.
 */
export default function VRTourShell() {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* Top chrome bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-bg px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card px-4 py-2 text-sm font-medium text-ink shadow-[var(--shadow-sm)] transition-colors hover:text-blue"
        >
          <ArrowLeft size={15} />
          {t(ui.vrTour.back)}
        </Link>
        <span className="eyebrow ml-1 hidden sm:inline-flex">{t(ui.vrTour.eyebrow)}</span>
      </header>

      {/* Tour viewport */}
      <div className="relative flex-1">
        {/* Loading shell — sits behind the iframe (z-0), revealed until it paints */}
        <motion.div
          className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={reduce ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm text-ink-2">{t(ui.vrTour.loading)}</p>
          <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-border border-t-blue" />
        </motion.div>

        <iframe
          src="/vr-tour/tour.html"
          title="PTIT Virtual Tour"
          className="absolute inset-0 z-10 h-full w-full border-0"
          allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer"
          allowFullScreen
        />
      </div>
    </div>
  );
}
