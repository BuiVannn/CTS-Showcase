import type { ReactNode } from "react";

type Tone = "red" | "blue" | "neutral";

const tones: Record<Tone, string> = {
  red: "bg-red text-white",
  blue: "bg-blue text-white",
  neutral: "bg-surface text-ink-2 border border-border",
};

export default function Badge({
  tone = "red",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`font-mono inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
