"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { scrollToTop } from "@/lib/scrollToTop";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

/**
 * Fixed bottom-right button that appears after the user scrolls past ~1
 * viewport and scrolls back to the top on click. Visibility is a discrete
 * threshold toggle (not per-pixel state). Reduced motion → instant jump.
 */
export default function ScrollToTop() {
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotionSafe();
  const { t } = useLocale();

  useEffect(() => {
    const threshold = () => window.innerHeight * 0.9;
    const apply = (y: number) => setShown(y > threshold());
    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ scroll }: { scroll: number }) => apply(scroll);
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }
    const handle = () => apply(window.scrollY);
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <button
      type="button"
      aria-label={t(ui.nav.backToTop)}
      onClick={() => scrollToTop(reduce)}
      className={`fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-border bg-card text-ink shadow-[var(--shadow-md)] transition-all duration-300 hover:border-blue hover:text-blue ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <ArrowUp size={18} />
    </button>
  );
}
