"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

interface FloatingShapeProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Vertical travel in px (default 14). */
  amplitude?: number;
  /** Loop duration in seconds (default 6). */
  duration?: number;
  delay?: number;
}

/** Gentle infinite bob — the ambient "soft futurism" motion. */
export default function FloatingShape({
  children,
  className = "",
  style,
  amplitude = 14,
  duration = 6,
  delay = 0,
}: FloatingShapeProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
