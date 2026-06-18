"use client";

import type { ReactNode } from "react";
import Image from "next/image";

export default function HoverPreview({
  src,
  alt,
  ratio = "16 / 9",
  overlay,
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  overlay: ReactNode;
  className?: string;
}) {
  return (
    <div
      tabIndex={0}
      className={`group/hp relative w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface outline-none ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 ease-out group-hover/hp:scale-105 group-focus-within/hp:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4 opacity-0 translate-y-2 transition duration-300 group-hover/hp:opacity-100 group-hover/hp:translate-y-0 group-focus-within/hp:opacity-100 group-focus-within/hp:translate-y-0">
        {overlay}
      </div>
    </div>
  );
}
