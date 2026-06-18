"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "motion/react";
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
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const parts = parseCountValue(value);

  const [display, setDisplay] = useState(() =>
    parts.target === null || reduce ? value : formatCount(0, parts.pad, parts.suffix)
  );

  useEffect(() => {
    if (parts.target === null || reduce || !inView) return;
    const controls = animate(0, parts.target, {
      duration: durationMs / 1000,
      ease: EASE,
      onUpdate: (v) => setDisplay(formatCount(v, parts.pad, parts.suffix)),
    });
    return () => controls.stop();
  }, [inView, reduce, parts.target, parts.pad, parts.suffix, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
