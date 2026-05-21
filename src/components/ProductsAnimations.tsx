"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

export default function ProductsAnimations({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!wrapperRef.current) return;

      // Animate section titles
      const titles = wrapperRef.current.querySelectorAll(".products-section-title");
      if (titles.length > 0) {
        gsap.fromTo(
          titles,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: titles[0],
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Animate download cards
      const cards = wrapperRef.current.querySelectorAll(".download-card");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: cards[0],
              start: "top 80%",
              once: true,
            },
          }
        );
      }

      // Animate ecosystem banner
      const banner = wrapperRef.current.querySelector(".ecosystem-banner");
      if (banner) {
        gsap.from(banner, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: banner,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Animate CTA section
      const cta = wrapperRef.current.querySelector(".products-cta");
      if (cta) {
        gsap.fromTo(
          cta,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: cta,
              start: "top 90%",
              once: true,
            },
          }
        );
      }
    },
    { scope: wrapperRef }
  );

  return <div ref={wrapperRef}>{children}</div>;
}
