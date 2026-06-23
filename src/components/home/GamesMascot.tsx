"use client";

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { usePointerFine } from "@/lib/usePointerFine";

/**
 * Small decorative robot for the Games area. Idle bob via CSS; pupils follow
 * the cursor (computed in a single rAF off a plain pointer ref — no per-move
 * React state). Static and bob-free under reduced motion.
 */
export default function GamesMascot() {
  const reduce = useReducedMotionSafe();
  const fine = usePointerFine();
  const rootRef = useRef<SVGSVGElement>(null);
  const leftRef = useRef<SVGCircleElement>(null);
  const rightRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (reduce || !fine) return;
    const pointer = { x: 0, y: 0, seen: false };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    };
    const aim = (pupil: SVGCircleElement | null, cx: number, cy: number) => {
      if (!pupil) return;
      const svg = rootRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      // socket center in viewport coords (svg is 120x120 viewBox)
      const sx = r.left + (cx / 120) * r.width;
      const sy = r.top + (cy / 120) * r.height;
      const a = Math.atan2(pointer.y - sy, pointer.x - sx);
      const max = 3; // px of travel inside the eye (viewBox units)
      pupil.setAttribute("cx", String(cx + Math.cos(a) * max));
      pupil.setAttribute("cy", String(cy + Math.sin(a) * max));
    };
    const tick = () => {
      if (pointer.seen) { aim(leftRef.current, 48, 54); aim(rightRef.current, 72, 54); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, [reduce, fine]);

  return (
    <svg
      ref={rootRef}
      aria-hidden
      viewBox="0 0 120 120"
      className="h-20 w-20 shrink-0 text-blue"
      style={{ animation: reduce ? undefined : "mascot-bob 2.8s ease-in-out infinite" }}
    >
      {/* antenna */}
      <line x1="60" y1="20" x2="60" y2="34" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="17" r="4" fill="var(--red)" />
      {/* head */}
      <rect x="32" y="34" width="56" height="44" rx="12" fill="var(--card)" stroke="currentColor" strokeWidth="3" />
      {/* eyes (sockets) */}
      <circle cx="48" cy="54" r="9" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <circle cx="72" cy="54" r="9" fill="#fff" stroke="currentColor" strokeWidth="2" />
      {/* pupils */}
      <circle ref={leftRef} cx="48" cy="54" r="4" fill="currentColor" />
      <circle ref={rightRef} cx="72" cy="54" r="4" fill="currentColor" />
      {/* mouth */}
      <rect x="48" y="66" width="24" height="4" rx="2" fill="currentColor" />
      {/* body hint */}
      <rect x="42" y="82" width="36" height="18" rx="6" fill="var(--card)" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
