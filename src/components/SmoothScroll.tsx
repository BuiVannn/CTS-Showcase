"use client";

import { useEffect } from "react";
import { createLenis, destroyLenis } from "@/lib/lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = createLenis();

    // Keep ScrollTrigger in sync with Lenis scroll events
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's ticker for frame-perfect sync
    gsap.ticker.add((time: number) => {
      lenis.raf(time * 1000);
    });
    // Restore lag smoothing so dropped frames don't accumulate
    gsap.ticker.lagSmoothing(500, 16);

    return () => {
      destroyLenis();
    };
  }, []);

  return null;
}
