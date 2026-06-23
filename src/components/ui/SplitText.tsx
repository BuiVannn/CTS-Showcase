"use client";

import { Fragment } from "react";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
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

const wordClip = {
  hidden: { y: "120%" },
  show: { y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function SplitText({
  segments,
  className,
  delayChildren = 0.05,
  clip = false,
}: {
  segments: SplitSegment[];
  className?: string;
  delayChildren?: number;
  clip?: boolean;
}) {
  const reduce = useReducedMotionSafe();
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
          {clip ? (
            <span className="inline-block overflow-hidden align-bottom">
              <motion.span aria-hidden className={`inline-block ${item.className ?? ""}`} variants={wordClip}>
                {item.w}
              </motion.span>
            </span>
          ) : (
            <motion.span aria-hidden className={`inline-block ${item.className ?? ""}`} variants={word}>
              {item.w}
            </motion.span>
          )}
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </motion.span>
  );
}
