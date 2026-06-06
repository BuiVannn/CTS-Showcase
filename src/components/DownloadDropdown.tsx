"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mic, Paintbrush, Film, Music, ChevronRight, Download } from "lucide-react";
import { ecosystem } from "@/content/ecosystem";
import { ui } from "@/content/ui";
import { useLocale } from "@/lib/locale";
import { EASE } from "@/lib/motion";
import type { IconKey } from "@/content/types";

const ICONS: Record<IconKey, typeof Mic> = {
  mic: Mic,
  paintbrush: Paintbrush,
  film: Film,
  music: Music,
};

interface DownloadDropdownProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function DownloadDropdown({
  variant = "desktop",
  onNavigate,
}: DownloadDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { t } = useLocale();

  useEffect(() => {
    if (variant !== "desktop") return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [variant]);

  // ── Mobile: inline list ──
  if (variant === "mobile") {
    return (
      <div className="space-y-1">
        {ecosystem.map((app) => {
          const Icon = ICONS[app.icon];
          return (
            <Link
              key={app.id}
              href={`/products#${app.slug}`}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/60 hover:text-ink"
            >
              <span className="text-coral-ink">
                <Icon size={17} />
              </span>
              {app.name}
            </Link>
          );
        })}
        <Link
          href="/products"
          onClick={onNavigate}
          className="flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-semibold text-coral-ink transition-colors hover:text-coral"
        >
          {t(ui.nav.viewAll)}
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  // ── Desktop: dropdown ──
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3.5 py-2 text-[0.78rem] font-medium text-muted transition-colors duration-300 hover:bg-white/60 hover:text-ink"
      >
        <Download size={14} />
        {t(ui.nav.download)}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="glass-strong absolute right-0 top-full mt-3 w-80 overflow-hidden p-2"
          >
            {ecosystem.map((app) => {
              const Icon = ICONS[app.icon];
              return (
                <Link
                  key={app.id}
                  href={`/products#${app.slug}`}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-[var(--radius-md)] px-3 py-3 transition-colors hover:bg-white/70"
                >
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--gradient-soft)] text-coral-ink transition-colors group-hover:text-coral">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-ink">
                      {app.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {t(app.excerpt)}
                    </p>
                  </div>
                </Link>
              );
            })}
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-between rounded-[var(--radius-md)] border-t border-[var(--border)] px-3 py-2.5 text-xs font-semibold text-coral-ink transition-colors hover:text-coral"
            >
              {t(ui.nav.viewAll)}
              <ChevronRight size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
