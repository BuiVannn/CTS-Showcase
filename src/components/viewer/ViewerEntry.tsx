"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

export interface ViewerEntryProps {
  variant: "hero" | "loader";
  title: string;
  lead: string;
  meta: string;
  ready: boolean;
  onEnter: () => void;
}

export default function ViewerEntry({ variant, title, lead, meta, ready, onEnter }: ViewerEntryProps) {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  if (variant === "loader") {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-bg/80 backdrop-blur-sm">
        <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-border border-t-blue" />
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-2">{meta}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-bg px-6 text-center"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-2">{meta}</span>
      <h1 className="text-display text-4xl font-extrabold text-ink sm:text-5xl">{title}</h1>
      <p className="max-w-sm text-base leading-relaxed text-ink-2">{lead}</p>

      {/* progress shimmer until the tour iframe has loaded */}
      <div className="relative mt-1 h-[3px] w-56 overflow-hidden rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--blue), var(--red))" }}
          animate={ready || reduce ? { width: "100%", left: 0 } : { left: ["-33%", "100%"] }}
          transition={ready || reduce ? { duration: 0.3 } : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <button
        type="button"
        onClick={onEnter}
        disabled={!ready}
        className="group mt-3 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, var(--blue), var(--red))" }}
      >
        {t(ui.vrTour.enter)}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}
