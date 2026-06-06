import type { Variants } from "motion/react";

/** Shared cubic-bezier easing (typed as a 4-tuple for Motion). */
export const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

/** Staggered fade-up container/item variants used for grouped reveals. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.15 } },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};
