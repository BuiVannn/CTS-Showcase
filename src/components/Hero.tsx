"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { ChevronDown, ArrowRight, Play } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/experimentalAnimations";

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
  const router = useRouter();

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Respect reduced motion: reveal everything statically, no timelines.
      if (prefersReducedMotion()) {
        gsap.set([badgeRef.current, subtitleRef.current, scrollRef.current], {
          opacity: 1,
          y: 0,
        });
        return;
      }

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

      // CTA buttons with springy entrance
      if (ctaRef.current) {
        const buttons = ctaRef.current.querySelectorAll(".hero-cta-btn");
        tl.fromTo(
          buttons,
          { opacity: 0, y: 30, scale: 0.9 },
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

      // Parallax — hero content drifts up on scroll
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

      // Decorative atmosphere parallax
      gsap.to(".hero-decor", {
        y: -90,
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

  // Renders the headline char-by-char; colors the final word PTIT red.
  const renderHeadline = (text: string) => {
    const words = text.split(" ");
    return words.map((word, wi) => {
      const isLast = wi === words.length - 1;
      return (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split("").map((char, ci) => (
            <span
              key={ci}
              className="char inline-block"
              style={{
                transformOrigin: "center bottom",
                color: isLast ? "var(--red)" : undefined,
              }}
            >
              {char}
            </span>
          ))}
          {!isLast && <span className="char inline-block">&nbsp;</span>}
        </span>
      );
    });
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Bright decorative atmosphere — soft red wash + PTIT orbit motif */}
      <div className="hero-decor pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[680px] w-[900px] max-w-[140vw] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, var(--red-soft), transparent 70%)",
          }}
        />
        <div
          className="orbit-ring left-1/2 top-1/2 h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: 0.55 }}
        />
        <div
          className="orbit-ring left-1/2 top-1/2 h-[88vmin] w-[88vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: 0.4 }}
        />
      </div>

      <div className="hero-content-wrapper relative z-10 mx-auto max-w-7xl px-6 lg:px-8 w-full text-center">
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
          className="text-hero font-[family-name:var(--font-display)] text-[var(--ink)] mb-6"
          style={{ perspective: "1000px" }}
        >
          {renderHeadline(headline)}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-lg sm:text-xl text-[var(--text-muted)] max-w-xl mx-auto mb-12 tracking-wide opacity-0"
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
              const lenis = (
                window as unknown as { __lenis?: { scrollTo: (t: string) => void } }
              ).__lenis;
              if (lenis) {
                lenis.scrollTo("#showcase");
              } else {
                document
                  .querySelector("#showcase")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="hero-cta-btn group btn-primary px-8 py-4 font-medium tracking-wider uppercase text-sm"
          >
            <span className="flex items-center gap-2">
              Explore Ecosystem
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </span>
          </button>

          <button
            onClick={() => {
              router.push("/vr-tour");
            }}
            className="hero-cta-btn group relative px-8 py-4 border border-[var(--red)] text-[var(--red-dark)] font-medium tracking-wider uppercase text-sm overflow-hidden btn-outline"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Play size={16} />
              VR Tour
            </span>
          </button>
        </div>

        {/* Scroll indicator */}
        <div ref={scrollRef} className="flex flex-col items-center gap-2 opacity-0">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-dim)]">
            Scroll
          </span>
          <ChevronDown size={20} className="text-[var(--text-dim)]" />
        </div>
      </div>
    </section>
  );
}
