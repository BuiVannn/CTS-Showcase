import type { ReactNode } from "react";

type Variant = "standard" | "feature";

const variants: Record<Variant, string> = {
  standard: "bg-card",
  feature: "bg-gradient-to-br from-card to-surface",
};

export default function Card({
  variant = "standard",
  className = "",
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-[var(--radius-lg)] border border-border ${variants[variant]} p-5 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue ${className}`}
    >
      {children}
    </div>
  );
}
