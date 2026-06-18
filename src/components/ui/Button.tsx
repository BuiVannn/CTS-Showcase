import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "blue" | "red" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition duration-200 active:scale-[0.98]";

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-[0.8rem]",
  md: "px-5 py-2.5 text-[0.9rem]",
};

const variants: Record<Variant, string> = {
  blue: "bg-blue text-white hover:brightness-110",
  red: "bg-red text-white hover:brightness-110 shadow-[var(--shadow-sm)]",
  ghost: "bg-transparent text-ink border border-border hover:bg-surface",
};

type CommonProps = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

export default function Button({
  variant = "blue",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: CommonProps & { href?: string } & ComponentPropsWithoutRef<"button">) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
