"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

interface AboutSectionProps {
  mission?: string;
  description?: string;
}

export default function AboutSection({
  mission = "Pioneering the future of STEM education through innovative research, cutting-edge technology, and hands-on learning experiences.",
  description,
}: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // About container reveal
      const container = sectionRef.current.querySelector(".about-container");
      if (container) {
        gsap.fromTo(
          container,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Quote reveal
      if (quoteRef.current) {
        gsap.fromTo(
          quoteRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: quoteRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Description reveal
      if (descRef.current) {
        gsap.fromTo(
          descRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: descRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Red line reveal
      const line = sectionRef.current.querySelector(".about-line");
      if (line) {
        gsap.fromTo(
          line,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.8,
            ease: "power3.inOut",
            scrollTrigger: {
              trigger: line,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="about" className="section-spacing relative">
      <div className="about-container mx-auto max-w-4xl px-6 lg:px-8 text-center">
        {/* Red accent line */}
        <div className="about-line accent-line-short mx-auto mb-12 origin-center" />

        {/* Mission quote */}
        <div ref={quoteRef} className="opacity-0">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-[family-name:var(--font-display)] text-[var(--ink)] leading-relaxed tracking-tight">
            &ldquo;{mission}&rdquo;
          </p>
        </div>

        {/* Description */}
        {description && (
          <p
            ref={descRef}
            className="mt-8 text-base text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed opacity-0"
          >
            {description}
          </p>
        )}

        {/* Signature-style element */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-[var(--border-red)]" />
          <span className="text-xs tracking-[0.3em] uppercase text-[var(--text-dim)]">
            CTS Lab, PTIT
          </span>
          <div className="h-px w-12 bg-[var(--border-red)]" />
        </div>
      </div>
    </section>
  );
}
