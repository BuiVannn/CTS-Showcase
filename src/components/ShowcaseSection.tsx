"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Play } from "lucide-react";

interface FlagshipApp {
  id: string;
  title: string;
  category: string;
  description: string;
  image?: { url: string; alt?: string };
}

interface ShowcaseSectionProps {
  flagshipApps?: FlagshipApp[];
  videoUrl?: string;
}

const placeholderApps: FlagshipApp[] = [
  {
    id: "robot-clover",
    title: "Robot Clover",
    category: "Robotics",
    description:
      "A compact line-following robot equipped with precision optical sensors. Students program its path, test on the track, and debug in real time — learning the fundamental principle that machines only work flawlessly when human logic is set up correctly.",
    image: { url: "/img/clover_bot.jpg", alt: "Robot Clover" },
  },
  {
    id: "smart-arm",
    title: "Smart Arm",
    category: "Engineering",
    description:
      "A servo-driven robotic arm that draws geometric designs on paper based on programmed coordinates. Every deviation in logic is immediately exposed by a misplaced line — training spatial thinking and meticulous precision in every decision.",
    image: { url: "/img/pcar.jpg", alt: "Smart Arm" },
  },
  {
    id: "pcar",
    title: "PCar",
    category: "AI Voice",
    description:
      "A voice-controlled autonomous car that responds entirely to spoken commands — no remote controller needed. Students must speak clearly and decisively: 'forward', 'turn left', 'stop' — transforming their voice into control and building awareness of how language drives machines.",
    image: { url: "/img/pcar.jpg", alt: "PCar" },
  },
  {
    id: "vex",
    title: "VEX Robotics",
    category: "Competition",
    description:
      "An international-standard robotics platform where students design mechanisms, assemble hardware, write autonomous code, and compete under strict time limits. Through breakdowns, sweat, and hard-won victories, they learn strategic thinking, teamwork, and the discipline of real engineering.",
    image: { url: "/img/vex.jpg", alt: "VEX Robotics" },
  },
  {
    id: "vr",
    title: "VR Lab",
    category: "Immersive",
    description:
      "Fully immersive 3D environments that transform abstract lessons into vivid experiences — from walking through the historic Ba Dinh Square in 1945, to detailed frog dissection in Biology, to visualizing complex geometric transformations in Mathematics.",
    image: { url: "/img/vr.jpg", alt: "VR Lab" },
  },
];

export default function ShowcaseSection({
  flagshipApps,
  videoUrl,
}: ShowcaseSectionProps) {
  const apps =
    flagshipApps && flagshipApps.length > 0 ? flagshipApps : placeholderApps;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Section title
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

      // Flagship app cards
      const cards = sectionRef.current.querySelectorAll(".showcase-card");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
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

      // Video area
      const video = sectionRef.current.querySelector(".showcase-video");
      if (video) {
        gsap.fromTo(
          video,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: video,
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
    <section
      ref={sectionRef}
      id="showcase"
      className="section-spacing relative bg-[var(--bg-soft)]"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-16">
          <span className="text-label mb-4 block">Featured</span>
          <h2 className="text-section font-[family-name:var(--font-display)] text-[var(--ink)]">
            Showcase
          </h2>
          <div className="accent-line-short mt-4" />
        </div>

        {/* Flagship apps — 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {apps.map((app, index) => (
            <div
              key={app.id}
              className={`showcase-card surface-card group cursor-pointer overflow-hidden${
                apps.length % 2 !== 0 && index === apps.length - 1
                  ? " lg:col-start-1 lg:col-end-3 lg:mx-auto lg:max-w-[calc(50%-0.75rem)]"
                  : ""
              }`}
            >
              {/* Image area */}
              <div className="relative h-72 sm:h-80 lg:h-96 overflow-hidden">
                {app.image?.url ? (
                  <Image
                    src={app.image.url}
                    alt={app.image.alt || app.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    loading="lazy"
                    className="object-cover will-change-transform transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="placeholder-image w-full h-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-[var(--text-dim)] font-[family-name:var(--font-display)] tracking-widest uppercase">
                      {app.title}
                    </span>
                  </div>
                )}

                {/* Overlay gradient — fades image into the card surface */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/15 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase text-white bg-[var(--red)] rounded-full shadow-[var(--shadow-1)]">
                    {app.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[var(--ink)] font-[family-name:var(--font-display)] mb-2 group-hover:text-[var(--red)] transition-colors duration-150">
                  {app.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {app.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Video showcase */}
        <div className="showcase-video surface-card overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 group cursor-pointer">
            {videoUrl ? (
              <iframe
                src={videoUrl}
                title="CTS Lab Showcase Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                {/* Placeholder thumbnail */}
                <div className="absolute inset-0 bg-[url('/img/Logo_PTIT_University.png')] bg-cover bg-center opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Play button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/80 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-110 transition-all duration-500">
                    <Play
                      size={28}
                      className="text-white ml-1"
                    />
                  </div>
                  <span className="text-xs tracking-[0.3em] uppercase text-white/70 font-[family-name:var(--font-display)]">
                    Watch Demo
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
