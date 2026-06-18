"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  const spring = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });
  const scaleX = reduce ? scrollYProgress : spring;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, var(--blue), var(--red))" }}
    />
  );
}
