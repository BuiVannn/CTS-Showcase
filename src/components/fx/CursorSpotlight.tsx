"use client";

import { useEffect } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { lerp } from "@/lib/lerp";

/**
 * A soft radial glow that trails the pointer. Writes the smoothed pointer
 * position to CSS vars (--mx/--my) via a single rAF loop — never React state —
 * so it cannot cause render churn or scroll jank. Disabled under reduced
 * motion and on non-fine-pointer (touch) devices.
 */
export default function CursorSpotlight() {
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = document.documentElement;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.3;
    let curX = targetX;
    let curY = targetY;
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        root.style.setProperty("--spot-opacity", "1");
      }
    };
    const onLeave = () => {
      visible = false;
      root.style.setProperty("--spot-opacity", "0");
    };

    const tick = () => {
      curX = lerp(curX, targetX, 0.12);
      curY = lerp(curY, targetY, 0.12);
      root.style.setProperty("--mx", `${curX}px`);
      root.style.setProperty("--my", `${curY}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        opacity: "var(--spot-opacity, 0)",
        transition: "opacity 0.4s ease",
        background:
          "radial-gradient(280px circle at var(--mx) var(--my), color-mix(in srgb, var(--blue) 14%, transparent), color-mix(in srgb, var(--red) 8%, transparent) 40%, transparent 70%)",
      }}
    />
  );
}
