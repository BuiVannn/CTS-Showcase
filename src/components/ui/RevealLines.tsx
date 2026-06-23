"use client";

import { motion } from "motion/react";
import { EASE, staggerContainer } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

const line = {
  hidden: { y: "110%" },
  show: { y: 0, transition: { duration: 0.7, ease: EASE } },
};

/**
 * Body/lead reveal: each line rises behind a clip mask as it enters view.
 * Lines are separated by "\n". Never scrambles or animates per character so
 * the text stays readable. Plain render under reduced motion.
 */
export default function RevealLines({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotionSafe();
  const lines = text.split("\n");
  if (reduce) return <p className={className}>{text}</p>;
  return (
    <motion.p
      className={className}
      variants={staggerContainer(0.12, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {lines.map((ln, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span className="block" variants={line}>
            {ln}
          </motion.span>
        </span>
      ))}
    </motion.p>
  );
}
