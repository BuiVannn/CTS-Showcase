"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface SplitSectionProps {
  leftTitle?: string;
  leftDescription?: string;
  rightTitle?: string;
  rightDescription?: string;
}

export default function SplitSection({
  leftTitle = "ONE ACCOUNT",
  leftDescription = "Access all our applications with a single account. Sign in once and seamlessly navigate across Kid Mentor, Elder Care, P-Assistant, and more.",
  rightTitle = "UNIFIED ECOSYSTEM",
  rightDescription = "Our apps share data intelligently — your preferences, progress, and settings sync across every platform in real time.",
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

      // Center divider
      const divider = sectionRef.current.querySelector(".split-divider");
      if (divider) {
        gsap.fromTo(
          divider,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: 0.8,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: divider,
              start: "top 80%",
              once: true,
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="section-spacing relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative">
          {/* Left panel — One Account */}
          <div className="split-panel py-16 lg:py-24 lg:pr-16">
            <span className="text-label mb-4 block">Identity</span>
            <h2 className="text-section font-[family-name:var(--font-space-grotesk)] text-[#111111] mb-6">
              {leftTitle}
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-md mb-8">
              {leftDescription}
            </p>
            <div className="h-64 sm:h-80 bg-[#f3f4f6] border border-black/5 overflow-hidden relative group">
              <img
                src="/img/1account.png"
                alt="One Account"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs tracking-widest uppercase text-zinc-400">
                  Single Sign-On
                </span>
              </div>
            </div>
          </div>

          {/* Center divider — red line */}
          <div className="split-divider hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-[#dc2626]/30 origin-top" />

          {/* Right panel — Unified Ecosystem */}
          <div className="split-panel py-16 lg:py-24 lg:pl-16">
            <span className="text-label mb-4 block">Ecosystem</span>
            <h2 className="text-section font-[family-name:var(--font-space-grotesk)] text-[#111111] mb-6">
              {rightTitle}
            </h2>
            <p className="text-zinc-500 leading-relaxed max-w-md mb-8">
              {rightDescription}
            </p>
            <div className="h-64 sm:h-80 bg-[#f3f4f6] border border-black/5 overflow-hidden relative group">
              <div className="placeholder-image absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs tracking-widest uppercase text-zinc-400">
                  Connected Apps
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
