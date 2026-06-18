"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { EASE } from "@/lib/motion";
import { parseCountValue, formatCount } from "@/lib/format";

export default function CountUp({
  value,
  durationMs = 1400,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotionSafe();
  const parts = parseCountValue(value);

  // animated counter value; only used when !reduce and parts.target !== null
  const [animDisplay, setAnimDisplay] = useState(() =>
    parts.target === null ? value : formatCount(0, parts.pad, parts.suffix)
  );

  useEffect(() => {
    if (parts.target === null || reduce || !inView) return;
    const controls = animate(0, parts.target, {
      duration: durationMs / 1000,
      ease: EASE,
      onUpdate: (v) => setAnimDisplay(formatCount(v, parts.pad, parts.suffix)),
    });
    return () => controls.stop();
  }, [inView, reduce, parts.target, parts.pad, parts.suffix, durationMs]);

  // Under reduced motion (or non-numeric value) skip the animation and show
  // the final value directly without routing through setState-in-effect.
  const display =
    parts.target === null || reduce ? value : animDisplay;

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
