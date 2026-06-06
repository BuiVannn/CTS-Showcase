"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ExternalLink } from "lucide-react";

interface Partner {
  name: string;
  logo?: { url: string; alt?: string };
  url?: string;
  order?: number;
}

interface PartnersProps {
  heading?: string;
  partners?: Partner[];
}

const placeholderPartners: Partner[] = [
  { name: "PTIT", url: "https://ptit.edu.vn", order: 1 },
  { name: "Ministry of Education", url: "#", order: 2 },
  { name: "Viettel Group", url: "#", order: 3 },
  { name: "FPT Software", url: "#", order: 4 },
  { name: "VNPT", url: "#", order: 5 },
  { name: "UNESCO", url: "#", order: 6 },
];

export default function Partners({
  heading = "Partners & Collaborations",
  partners,
}: PartnersProps) {
  const data = partners && partners.length > 0 ? partners : placeholderPartners;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const title = sectionRef.current.querySelector(".section-title");
      if (title) {
        gsap.from(title, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            once: true,
          },
        });
      }

      const items = sectionRef.current.querySelectorAll(".partner-item");

      gsap.fromTo(
        items,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="section-spacing relative bg-[var(--bg-soft)]">
      {/* Red accent line */}
      <div className="accent-line mb-16" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-12 text-center">
          <span className="text-label mb-4 block">Collaboration</span>
          <h2 className="text-section font-[family-name:var(--font-display)] text-[var(--ink)]">
            {heading}
          </h2>
        </div>

        {/* Partner grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.map((partner, i) => (
            <a
              key={i}
              href={partner.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-item group flex flex-col items-center justify-center p-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-1)] hover:border-[var(--border-red)] hover:shadow-[var(--shadow-red)] hover:-translate-y-1 transition-all duration-500"
            >
              {partner.logo?.url ? (
                <img
                  src={partner.logo.url}
                  alt={partner.logo.alt || partner.name}
                  className="h-10 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              ) : (
                <span className="text-sm font-semibold text-[var(--text-muted)] group-hover:text-[var(--ink)] font-[family-name:var(--font-display)] transition-colors duration-500 text-center">
                  {partner.name}
                </span>
              )}
              <ExternalLink
                size={10}
                className="mt-2 text-[var(--text-dim)] group-hover:text-[var(--red)] transition-colors duration-500"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
