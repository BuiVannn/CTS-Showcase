"use client";

import { useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/experimentalAnimations";

/**
 * Adds a magnetic hover effect to a button element.
 * The button subtly follows the cursor on hover and springs back on leave.
 *
 * Usage:
 *   const btnRef = useMagneticButton({ strength: 0.3 });
 *   <button ref={btnRef}>Click me</button>
 */
export function useMagneticButton({
  strength = 0.25,
  scale = 1.05,
}: {
  /** How strongly the button follows the cursor (0–1) */
  strength?: number;
  /** Scale factor on hover */
  scale?: number;
} = {}) {
  const btnRef = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const btn = btnRef.current;
      if (!btn || prefersReducedMotion()) return;

      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(btn, {
        x: deltaX,
        y: deltaY,
        scale,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    [strength, scale]
  );

  const handleMouseLeave = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;

    gsap.to(btn, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "back.out(1.4)",
      overwrite: "auto",
    });
  }, []);

  useGSAP(
    () => {
      const btn = btnRef.current;
      if (!btn) return;

      btn.addEventListener("mousemove", handleMouseMove);
      btn.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        btn.removeEventListener("mousemove", handleMouseMove);
        btn.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { dependencies: [handleMouseMove, handleMouseLeave] }
  );

  return btnRef;
}
