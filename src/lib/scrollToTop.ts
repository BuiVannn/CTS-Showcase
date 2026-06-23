import { getLenis } from "./lenis";

/**
 * Scroll the page to the very top. Uses the shared Lenis instance for a smooth
 * glide when present; falls back to the native API. Pass `instant` (e.g. under
 * reduced motion) to jump without animation.
 */
export function scrollToTop(instant = false): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(0, { immediate: instant });
    return;
  }
  window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
}
