"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown, ArrowRight, Play } from "lucide-react";
import { gsap } from "@/lib/gsap";

interface HeroProps {
  headline?: string;
  subtitle?: string;
  badge?: string;
}

export default function Hero({
  headline = "CTS LAB",
  subtitle = "Hanoi - Vietnam",
  badge = "Posts & Telecommunications Institute of Technology",
}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const tl = gsap.timeline({ delay: 0.3 });

      // Red accent line
      if (lineRef.current) {
        tl.fromTo(
          lineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 1, ease: "power3.inOut" }
        );
      }

      // Badge
      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.5"
        );
      }

      // Headline — letter-by-letter reveal
      if (headlineRef.current) {
        const chars = headlineRef.current.querySelectorAll(".char");
        if (chars.length > 0) {
          tl.fromTo(
            chars,
            { opacity: 0, y: 60, rotateX: -60 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.8,
              stagger: 0.03,
              ease: "power3.out",
            },
            "-=0.3"
          );
        }
      }

      // Subtitle
      if (subtitleRef.current) {
        tl.fromTo(
          subtitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          "-=0.3"
        );
      }

      // CTA buttons with experimental entrance
      if (ctaRef.current) {
        const buttons = ctaRef.current.querySelectorAll(".hero-cta-btn");
        tl.fromTo(
          buttons,
          {
            opacity: 0,
            y: 30,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.7)",
          },
          "-=0.2"
        );
      }

      // Scroll indicator
      if (scrollRef.current) {
        tl.fromTo(
          scrollRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          "-=0.1"
        );

        gsap.to(scrollRef.current, {
          y: 10,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
        });
      }

      // Parallax — hero content fades on scroll
      gsap.to(".hero-content-wrapper", {
        opacity: 0,
        y: -80,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "center top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Background glows parallax
      gsap.to(".hero-glow", {
        y: -120,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    },
    { scope: sectionRef }
  );

  const renderHeadline = (text: string) => {
    return text.split("").map((char, i) => (
      <span
        key={i}
        className="char inline-block"
        style={{ transformOrigin: "center bottom" }}
      >
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#111111] to-[#1a0000]"
    >
      {/* Red glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="hero-glow absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-[#dc2626]/20 blur-[120px]" />
        <div className="hero-glow absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-[#dc2626]/12 blur-[100px]" />
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#111111] to-transparent z-10" />

      <div className="hero-content-wrapper relative z-20 mx-auto max-w-7xl px-6 lg:px-8 w-full text-center">
        {/* Red accent line */}
        <div
          ref={lineRef}
          className="accent-line-short mx-auto mb-8 origin-left"
        />

        {/* Badge */}
        <div ref={badgeRef} className="mb-6 opacity-0">
          <span className="text-label">{badge}</span>
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-hero font-[family-name:var(--font-space-grotesk)] text-white mb-6"
          style={{ perspective: "1000px" }}
        >
          {renderHeadline(headline)}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-12 tracking-wide opacity-0"
        >
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={() => {
              const lenis = (window as any).__lenis;
              if (lenis) {
                lenis.scrollTo("#showcase");
              } else {
                document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="hero-cta-btn group relative px-8 py-4 border border-[#dc2626] text-[#dc2626] font-medium tracking-wider uppercase text-sm rounded-sm overflow-hidden btn-outline"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Ecosystem
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </button>

          <button
            onClick={() => {
              window.location.href = "/vr-tour";
            }}
            className="hero-cta-btn group relative px-8 py-4 border border-[#dc2626] text-[#dc2626] font-medium tracking-wider uppercase text-sm rounded-sm overflow-hidden btn-outline"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Play size={16} />
              VR Tour
            </span>
          </button>
        </div>

        {/* Scroll indicator */}
        <div ref={scrollRef} className="flex flex-col items-center gap-2 opacity-0">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-400">
            Scroll
          </span>
          <ChevronDown size={20} className="text-zinc-400" />
        </div>
      </div>
    </section>
  );
}
