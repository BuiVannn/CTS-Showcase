"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { usePointerFine } from "@/lib/usePointerFine";

const HOVER_SELECTOR = 'a, button, [role="button"], [data-cursor]';

/**
 * Custom cursor: a dot tracking the pointer 1:1 and an outline ring that trails
 * with smoothing. Over interactive targets the ring grows; elements with a
 * `data-cursor="…"` attribute show that label inside the ring. Position is
 * written to transforms in a single rAF loop — never React state. Active only
 * on fine-pointer, non-reduced-motion devices; otherwise renders nothing and
 * leaves the native cursor alone.
 */
export default function CustomCursor() {
  const reduce = useReducedMotionSafe();
  const fine = usePointerFine();
  const enabled = fine && !reduce;

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("cursor-none");

    let dotX = window.innerWidth / 2;
    let dotY = window.innerHeight / 2;
    let ringX = dotX;
    let ringY = dotY;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dotX = e.clientX;
      dotY = e.clientY;
      const target = e.target as Element | null;
      const hit = target?.closest?.(HOVER_SELECTOR) ?? null;
      setHovering(!!hit);                       // event handler, not effect body
      setLabel(hit?.getAttribute("data-cursor") || null);
    };
    const tick = () => {
      ringX += (dotX - ringX) * 0.18;
      ringY += (dotY - ringY) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      root.classList.remove("cursor-none");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-blue"
        style={{ transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)" }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full border border-blue text-blue transition-[width,height,background-color] duration-200 ${
          hovering ? "h-12 w-12 bg-blue/10" : "h-8 w-8"
        }`}
        style={{ transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)" }}
      >
        {label && <span className="text-[0.6rem] font-semibold">{label}</span>}
      </div>
    </>
  );
}
