"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import type { PointerEvent, ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees (default 9). */
  max?: number;
}

/** Pointer-driven 3D tilt — the lightweight replacement for the 3D model. */
export default function TiltCard({
  children,
  className = "",
  max = 9,
}: TiltCardProps) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), {
    stiffness: 150,
    damping: 18,
  });

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    px.set(0.5);
    py.set(0.5);
  };

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1100,
      }}
    >
      {children}
    </motion.div>
  );
}
