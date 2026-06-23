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
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduce || !inView) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(text);
      return;
    }
    let raf = 0;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const reveal = Math.floor(p * text.length);
      setDisplay(scrambleText(text, reveal, frame));
      frame++;
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, text, durationMs]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
