import type { ReactNode } from "react";

export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 text-[0.6rem] text-ink-2">
      {children}
    </span>
  );
}
