"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import AmbientField from "@/components/fx/AmbientField";
import ParticleNetwork from "@/components/fx/ParticleNetwork";
import { Play, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { EASE } from "@/lib/motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SplitText from "@/components/ui/SplitText";
import RevealLines from "@/components/ui/RevealLines";
import Magnetic from "@/components/ui/Magnetic";
import Scramble from "@/components/ui/Scramble";

export default function HomeHero() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Multi-layer parallax (disabled under reduced motion via the conditional styles below).
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const yCard = useTransform(scrollYProgress, [0, 1], [0, -30]);

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section ref={ref} className="relative overflow-hidden pt-24 pb-20 lg:pt-28 lg:pb-28">
      <AmbientField tone="cool" />
      <ParticleNetwork tone="cool" />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          {/* Left — copy */}
          <motion.div style={reduce ? undefined : { y: yCopy }}>
            <motion.span {...rise(0)} className="eyebrow">
              {t(ui.home.heroEyebrow)}
            </motion.span>
            <h1 className="text-hero mt-5 text-ink">
              <SplitText
                clip
                segments={[
                  { text: t(ui.home.heroLead) },
                  { text: t(ui.home.heroKw1), className: "text-red" },
                  { text: t(ui.home.heroKw2), className: "text-red" },
                  { text: t(ui.home.heroTail) },
                ]}
              />
            </h1>
            <RevealLines className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg" text={t(site.hero.subtitle)} delay={0.12} />
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
              className="group block rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-[var(--shadow-lg)] transition-transform duration-300 hover:-translate-y-1 sm:p-7"
              data-cursor="Xem"
            >
              <div className="relative h-56 overflow-hidden rounded-[var(--radius-md)] border border-border sm:h-64 lg:h-80">
                <Image src="/img/vr.jpg" alt={t(ui.home.vrCardTitle)} fill sizes="(max-width: 1024px) 100vw, 52vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-red shadow-[var(--shadow-md)]">
                    <Play size={24} className="ml-0.5" />
                  </span>
                </span>
                <span className="font-mono absolute bottom-3 left-3.5 text-[0.6rem] tracking-wider text-white/90">PTIT · VR</span>
              </div>
              <div className="font-mono mt-5 text-[0.7rem] tracking-wider text-blue">{"// "}<Scramble text={t(ui.home.vrCardLabel)} /></div>
              <h2 className="text-display mt-1.5 text-xl text-ink sm:text-2xl">{t(ui.home.vrCardTitle)}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-2 sm:text-base">{t(ui.home.vrCardBlurb)}</p>
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
