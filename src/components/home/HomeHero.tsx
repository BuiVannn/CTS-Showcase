"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Play, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { EASE } from "@/lib/motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SplitText from "@/components/ui/SplitText";
import Magnetic from "@/components/ui/Magnetic";

export default function HomeHero() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Multi-layer parallax (disabled under reduced motion via the conditional styles below).
  const yGrid = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const yCard = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Tech atmosphere: faint grid + soft brand glows (parallax layers) */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={reduce ? undefined : { opacity: fade }}>
        <motion.div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
            ...(reduce ? {} : { y: yGrid }),
          }}
        />
        <motion.div className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-[90px]" style={{ background: "var(--blue-soft)", ...(reduce ? {} : { y: yGlow }) }} />
        <motion.div className="absolute top-52 -left-12 h-64 w-64 rounded-full blur-[100px]" style={{ background: "var(--red-soft)", ...(reduce ? {} : { y: yGlow }) }} />
      </motion.div>

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left — copy */}
          <motion.div style={reduce ? undefined : { y: yCopy }}>
            <motion.span {...rise(0)} className="eyebrow">
              {t(ui.home.heroEyebrow)}
            </motion.span>
            <h1 className="text-hero mt-5 text-ink">
              <SplitText
                segments={[
                  { text: t(ui.home.heroLead) },
                  { text: t(ui.home.heroKw1), className: "text-red" },
                  { text: t(ui.home.heroKw2), className: "text-red" },
                  { text: t(ui.home.heroTail) },
                ]}
              />
            </h1>
            <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
              {t(site.hero.subtitle)}
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Button href="/products" variant="blue">
                  {t(ui.hero.exploreCta)} <ArrowRight size={16} />
                </Button>
              </Magnetic>
              <Button href="/vr-tour" variant="red">
                <Play size={16} /> {t(ui.hero.vrCta)}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — VR spotlight card (real thumbnail) */}
          <motion.div {...rise(0.16)} style={reduce ? undefined : { y: yCard }} className="relative">
            <span className="font-mono absolute -top-3 right-3 z-10 inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-red px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white">
              ★ {t(ui.home.featured)}
            </span>
            <Link
              href="/vr-tour"
              className="group block rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-lg)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative h-44 overflow-hidden rounded-[var(--radius-md)] border border-border">
                <Image src="/img/vr.jpg" alt={t(ui.home.vrCardTitle)} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-red shadow-[var(--shadow-md)]">
                    <Play size={18} className="ml-0.5" />
                  </span>
                </span>
                <span className="font-mono absolute bottom-2.5 left-3 text-[0.55rem] tracking-wider text-white/90">PTIT · VR</span>
              </div>
              <div className="font-mono mt-4 text-[0.66rem] tracking-wider text-blue">{"// "}{t(ui.home.vrCardLabel)}</div>
              <h2 className="text-display mt-1 text-lg text-ink">{t(ui.home.vrCardTitle)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(ui.home.vrCardBlurb)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue">
                {t(ui.hero.vrCta)}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
