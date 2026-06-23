"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { scrambleText } from "@/lib/scramble";

/**
 * Reveals a short label with a terminal-style scramble when it enters view.
 * Reserved for tiny mono labels (never body copy). Under reduced motion the
 * final text shows immediately.
 */
export default function Scramble({
  text,
  className,
  durationMs = 700,
}: {
  text: string;
  className?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotionSafe();
  // animated scramble frame; only used when !reduce && inView
  const [frame, setFrame] = useState<string | null>(null);

  useEffect(() => {
    if (reduce || !inView) return;
    let raf = 0;
    let f = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const reveal = Math.floor(p * text.length);
      setFrame(p < 1 ? scrambleText(text, reveal, f) : text);
      f++;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, text, durationMs]);

  // Under reduced motion (or before entering view) show the final text directly
  // without routing through setState-in-effect.
  const display = reduce || !inView ? text : frame ?? text;

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
