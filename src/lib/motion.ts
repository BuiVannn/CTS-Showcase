import type { Variants, Transition } from "motion/react";

/** Shared cubic-bezier easing (typed as a 4-tuple for Motion). */
export const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];
export const DURATION = 0.7;

const base: Transition = { duration: DURATION, ease: EASE };

/** Fade + rise from `distance` px below. */
export function fadeUp(distance = 24): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    show: { opacity: 1, y: 0, transition: base },
  };
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: base },
};

/** Container that staggers its children's reveal. */
export function staggerContainer(stagger = 0.08, delayChildren = 0.05): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

/** Default child variant used by Stagger / StaggerItem. */
export const fadeUpItem: Variants = fadeUp(24);
