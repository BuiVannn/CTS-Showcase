"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({
  children,
  className = "",
}: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current || !scrollRef.current) return;

      const scrollWidth = scrollRef.current.scrollWidth;
      const viewWidth = containerRef.current.offsetWidth;
      const distance = scrollWidth - viewWidth;

      if (distance <= 0) return;

      const tween = gsap.to(scrollRef.current, {
        x: -distance,
        ease: "none",
      });

      ScrollTrigger.create({
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        end: () => `+=${distance}`,
        animation: tween,
        invalidateOnRefresh: true,
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div
        ref={scrollRef}
        className="flex will-change-transform"
        style={{ width: "max-content" }}
      >
        {children}
      </div>
    </div>
  );
}
