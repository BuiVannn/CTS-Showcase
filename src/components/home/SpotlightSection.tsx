"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Rotate3d } from "lucide-react";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { activeStepFromProgress } from "@/lib/scrollSteps";
import type { Callout } from "./RobotViewer";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import RevealLines from "@/components/ui/RevealLines";

const RobotViewer = dynamic(() => import("./RobotViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-red" />
    </div>
  ),
});

// Approximate local anchor points on the model (tune visually against robot.glb).
const ANCHORS: [number, number, number][] = [
  [0.0, 1.1, 0.3], // head — voice
  [0.0, 0.1, 0.5], // chest — realtime
  [0.0, -0.9, 0.3], // base — learning
];

function Stage({
  callouts,
  progress,
  activeStep,
  effects,
}: {
  callouts: Callout[];
  progress?: import("motion/react").MotionValue<number>;
  activeStep?: number;
  effects: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-lg)]" data-cursor="Kéo">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 60%, var(--red-soft), transparent 70%), radial-gradient(55% 50% at 50% 40%, var(--blue-soft), transparent 70%)",
        }}
      />
      {/* AR HUD corner frame */}
      <div aria-hidden className="pointer-events-none absolute inset-3 z-10">
        <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-blue/50" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-blue/50" />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-blue/50" />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-blue/50" />
      </div>
      <div className="relative aspect-square w-full">
        <RobotViewer progress={progress} activeStep={activeStep} callouts={callouts} effects={effects} />
      </div>
      <div className="pointer-events-none absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/90 px-3 py-1.5 text-[0.7rem] font-semibold text-ink shadow-[var(--shadow-sm)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" /> LIVE
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-[var(--shadow-sm)]">
        <Sparkles size={14} className="text-red" />
        PTalk
      </div>
    </div>
  );
}

export default function SpotlightSection() {
  const { t } = useLocale();
  const reduce = useReducedMotion() ?? false;
  const steps = ui.spotlight.steps;
  const callouts: Callout[] = steps.map((s, i) => ({ label: t(s.title), anchor: ANCHORS[i] }));

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const [activeStep, setActiveStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveStep(activeStepFromProgress(v, steps.length));
  });

  const pinned = isDesktop && !reduce;

  // ---- Non-pinned fallback (mobile or reduced motion) ----
  if (!pinned) {
    return (
      <section className="section overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <Reveal>
                <span className="eyebrow eyebrow-draw">{t(ui.spotlight.eyebrow)}</span>
                <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
              </Reveal>
              <RevealLines
                text={t(ui.spotlight.lead)}
                className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg"
              />
              <Reveal delay={0.05}>
                <ul className="mt-6 space-y-3">
                  {steps.map((s, i) => (
                    <li key={i} className="flex items-baseline gap-3">
                      <span className="font-mono text-xs text-blue">{String(i + 1).padStart(2, "0")}</span>
                      <span>
                        <span className="text-display text-sm text-ink">{t(s.title)}</span>
                        <span className="ml-2 text-sm text-ink-2">{t(s.desc)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red" style={{ background: "var(--red-soft)" }}>
                  <Rotate3d size={14} />
                  {t(ui.spotlight.hint)}
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <Stage callouts={callouts} effects={false} />
            </Reveal>
          </div>
        </Container>
      </section>
    );
  }

  // ---- Pinned scrollytelling (desktop) ----
  return (
    <section ref={sectionRef} className="relative h-[280vh] overflow-clip">
      <div className="sticky top-0 flex h-screen items-center">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="eyebrow eyebrow-draw">{t(ui.spotlight.eyebrow)}</span>
              <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
              <RevealLines
                text={t(ui.spotlight.lead)}
                className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg"
              />
              <ul className="mt-8 space-y-4">
                {steps.map((s, i) => {
                  const on = i === activeStep;
                  return (
                    <motion.li
                      key={i}
                      animate={{ opacity: on ? 1 : 0.35, x: on ? 0 : -4 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="flex items-start gap-3"
                    >
                      <span className={`mt-1 h-6 w-0.5 rounded-full ${on ? "bg-red" : "bg-border"}`} />
                      <span>
                        <span className="text-display text-base text-ink">{t(s.title)}</span>
                        <span className="block text-sm text-ink-2">{t(s.desc)}</span>
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
              <div className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red" style={{ background: "var(--red-soft)" }}>
                <Rotate3d size={14} />
                {t(ui.spotlight.hint)}
              </div>
            </div>
            <Stage callouts={callouts} progress={scrollYProgress} activeStep={activeStep} effects />
          </div>
        </Container>
      </div>
    </section>
  );
}
