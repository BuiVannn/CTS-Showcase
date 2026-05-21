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
    id: "pcar",
    title: "PCar",
    category: "Robotics",
    description:
      "An autonomous robotic car platform for STEM education and research. Programmable control, sensor integration, and real-time navigation.",
    image: { url: "/img/pcar.jpg", alt: "PCar" },
  },
  {
    id: "vex",
    title: "Vex",
    category: "Engineering",
    description:
      "VEX robotics competition platform empowering students to design, build, and program competitive robots.",
    image: { url: "/img/vex.jpg", alt: "Vex" },
  },
  {
    id: "vr",
    title: "VR",
    category: "Immersive",
    description:
      "Immersive virtual reality experiences for education, training, and interactive simulations.",
    image: { url: "/img/vr.jpg", alt: "VR" },
  },
  {
    id: "clover-bot",
    title: "Clover Bot",
    category: "AI",
    description:
      "Intelligent chatbot powered by advanced NLP. Automates customer support, FAQ handling, and conversational workflows.",
    image: { url: "/img/clover_bot.jpg", alt: "Clover Bot" },
  },
  {
    id: "ptalk",
    title: "PTalk",
    category: "Communication",
    description:
      "Unified communication platform connecting teams and communities. Real-time messaging, voice, and video in a single ecosystem.",
    image: { url: "/img/ptalk.jpg", alt: "PTalk" },
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
    <section ref={sectionRef} id="showcase" className="section-spacing relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-16">
          <span className="text-label mb-4 block">Featured</span>
          <h2 className="text-section font-[family-name:var(--font-space-grotesk)] text-[#111111]">
            SHOWCASE
          </h2>
          <div className="accent-line-short mt-4" />
        </div>

        {/* Flagship apps — 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {apps.map((app, index) => (
            <div
              key={app.id}
              className={`showcase-card editorial-card group cursor-pointer overflow-hidden${
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
                  <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                    <span className="text-4xl font-bold text-zinc-300 font-[family-name:var(--font-space-grotesk)] tracking-widest uppercase">
                      {app.title}
                    </span>
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />

                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase text-white bg-[#dc2626]">
                    {app.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] font-[family-name:var(--font-space-grotesk)] mb-2 group-hover:text-[#dc2626] transition-colors duration-150">
                  {app.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {app.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Video showcase */}
        <div className="showcase-video editorial-card overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-zinc-900 to-zinc-800 group cursor-pointer">
            {videoUrl ? (
              <iframe
                src={videoUrl}
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
                  <span className="text-xs tracking-[0.3em] uppercase text-white/70 font-[family-name:var(--font-space-grotesk)]">
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
