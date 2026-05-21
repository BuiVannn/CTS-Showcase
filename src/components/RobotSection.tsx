"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ZoomIn, ZoomOut } from "lucide-react";
import dynamic from "next/dynamic";
import type { RobotModelHandle } from "./RobotModel";

const RobotViewer = dynamic(() => import("./RobotModel"), { ssr: false });

export default function RobotSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const robotRef = useRef<RobotModelHandle>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Section title reveal
      const title = sectionRef.current.querySelector(".section-title");
      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: title,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Robot viewer reveal
      const viewer = sectionRef.current.querySelector(".robot-viewer");
      if (viewer) {
        gsap.fromTo(
          viewer,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: viewer,
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
    <section ref={sectionRef} className="section-spacing relative bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-12 text-center">
          <span className="text-label mb-4 block">Interactive</span>
          <h2 className="text-section font-[family-name:var(--font-space-grotesk)] text-white">
            3D SHOWCASE
          </h2>
          <div className="accent-line-short mx-auto mt-4" />
          <p className="text-zinc-400 mt-4 max-w-lg mx-auto text-sm">
            Drag to rotate • Use buttons to zoom
          </p>
        </div>

        {/* Robot 3D viewer */}
        <div className="robot-viewer relative mx-auto max-w-5xl aspect-[16/10] rounded-lg overflow-hidden border border-[#dc2626]/20 bg-[#111111]">
          <RobotViewer ref={robotRef} />

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => robotRef.current?.zoomIn()}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-[#dc2626]/80 hover:border-[#dc2626] transition-all duration-200"
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => robotRef.current?.zoomOut()}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-[#dc2626]/80 hover:border-[#dc2626] transition-all duration-200"
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
