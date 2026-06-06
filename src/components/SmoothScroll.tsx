"use client";

import { useEffect } from "react";
import { createLenis, destroyLenis } from "@/lib/lenis";

/** Lenis smooth-scroll driver (RAF loop, no GSAP). */
export default function SmoothScroll() {
  useEffect(() => {
    // Respect reduced motion — skip the smoothing layer entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = createLenis();
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      destroyLenis();
    };
  }, []);

  return null;
}
