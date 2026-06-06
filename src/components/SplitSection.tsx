"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface SplitSectionProps {
  leftTitle?: string;
  leftDescription?: string;
}

export default function SplitSection({
  leftTitle = "One Account",
  leftDescription = "Access all our applications with a single account. Sign in once and seamlessly navigate across Kid Mentor, Elder Care, P-Assistant, and more.",
}: SplitSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const panels = sectionRef.current.querySelectorAll(".split-panel");
      panels.forEach((panel, i) => {
        gsap.fromTo(
          panel,
          { opacity: 0, x: i === 0 ? -40 : 40 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: panel,
              start: "top 80%",
              once: true,
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="section-spacing relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Text */}
          <div className="split-panel py-16 lg:py-24">
            <span className="text-label mb-4 block">Identity</span>
            <h2 className="text-section font-[family-name:var(--font-display)] text-[var(--ink)] mb-6">
              {leftTitle}
            </h2>
            <p className="text-[var(--text-muted)] leading-relaxed max-w-md mb-8">
              {leftDescription}
            </p>
          </div>

          {/* Right — Image */}
          <div className="split-panel h-64 sm:h-80 bg-[var(--bg-soft)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-2)] overflow-hidden relative group">
            <img
              src="/img/1account.png"
              alt="One Account"
              className="absolute inset-0 w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)]/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="text-xs tracking-widest uppercase text-[var(--text-dim)]">
                Single Sign-On
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
