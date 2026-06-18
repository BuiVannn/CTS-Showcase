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

type CommonProps = { variant?: Variant; size?: Size; className?: string; children: ReactNode };
type ButtonAsButton = CommonProps & { href?: never } & ComponentPropsWithoutRef<"button">;
type ButtonAsLink = CommonProps & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href">;
export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button(props: ButtonProps) {
  const { variant = "blue", size = "md", className = "", children, ...rest } = props;
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if ("href" in rest && rest.href) {
    const { href, ...anchorRest } = rest as { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href">;
    return (
      <Link href={href} className={cls} {...anchorRest}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...(rest as ComponentPropsWithoutRef<"button">)}>
      {children}
    </button>
  );
}
