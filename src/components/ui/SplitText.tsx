"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { splitWords } from "@/lib/text";
import { staggerContainer } from "@/lib/motion";
import { EASE } from "@/lib/motion";

export interface SplitSegment {
  text: string;
  className?: string;
}

const word = {
  hidden: { opacity: 0, y: "0.5em" },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function SplitText({
  segments,
  className,
  delayChildren = 0.05,
}: {
  segments: SplitSegment[];
  className?: string;
  delayChildren?: number;
}) {
  const reduce = useReducedMotion();
  const label = segments.map((s) => s.text).join(" ");

  if (reduce) {
    return (
      <span className={className}>
        {segments.map((s, i) => (
          <Fragment key={i}>
            <span className={s.className}>{s.text}</span>
            {i < segments.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </span>
    );
  }

  const words = segments.flatMap((s) =>
    splitWords(s.text).map((w) => ({ w, className: s.className }))
  );

  return (
    <motion.span
      aria-label={label}
      className={className}
      variants={staggerContainer(0.08, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {words.map((item, i) => (
        <Fragment key={i}>
          <motion.span aria-hidden className={`inline-block ${item.className ?? ""}`} variants={word}>
            {item.w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </motion.span>
  );
}
