import type { ReactNode } from "react";

export default function EmptyState({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-8 py-16 text-center">
      {icon && <div className="text-dim">{icon}</div>}
      <h2 className="text-display text-xl text-ink">{title}</h2>
      {children}
    </div>
  );
}
