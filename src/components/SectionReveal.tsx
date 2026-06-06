"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger index — multiplies the entrance delay. */
  delay?: number;
  /** Travel distance in px (default 28). */
  y?: number;
  as?: "div" | "li" | "section";
}

/**
 * Scroll-triggered fade + rise. Honors prefers-reduced-motion
 * (renders final state, no transition).
 */
export default function SectionReveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  as = "div",
}: SectionRevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: EASE,
      }}
    >
      {children}
    </MotionTag>
  );
}
