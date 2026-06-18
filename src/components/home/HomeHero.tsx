"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Play, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { EASE } from "@/lib/motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function HomeHero() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Tech atmosphere: faint grid + soft brand glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
          }}
        />
        <div
          className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-[90px]"
          style={{ background: "var(--blue-soft)" }}
        />
        <div
          className="absolute top-52 -left-12 h-64 w-64 rounded-full blur-[100px]"
          style={{ background: "var(--red-soft)" }}
        />
      </div>

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left — copy */}
          <div>
            <motion.span {...rise(0)} className="eyebrow">
              {t(ui.home.heroEyebrow)}
            </motion.span>
            <motion.h1 {...rise(0.06)} className="text-hero mt-5 text-ink">
              {t(ui.home.heroLead)} <span className="text-red">{t(ui.home.heroKw1)}</span>{" "}
              <span className="text-red">{t(ui.home.heroKw2)}</span> {t(ui.home.heroTail)}
            </motion.h1>
            <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
              {t(site.hero.subtitle)}
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap gap-3">
              <Button href="/products" variant="blue">
                {t(ui.hero.exploreCta)} <ArrowRight size={16} />
              </Button>
              <Button href="/vr-tour" variant="red">
                <Play size={16} /> {t(ui.hero.vrCta)}
              </Button>
            </motion.div>
          </div>

          {/* Right — VR spotlight card */}
          <motion.div {...rise(0.16)} className="relative">
            <span className="font-mono absolute -top-3 right-3 z-10 inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-red px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white">
              ★ {t(ui.home.featured)}
            </span>
            <Link
              href="/vr-tour"
              className="group block rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-lg)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className="relative flex h-44 items-center justify-center gap-5 overflow-hidden rounded-[var(--radius-md)]"
                style={{ background: "linear-gradient(135deg, var(--red), #7a0f14)" }}
              >
                <span className="h-12 w-12 rounded-full bg-white/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]" />
                <span className="h-12 w-12 rounded-full bg-white/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]" />
                <span className="font-mono absolute bottom-2.5 left-3 text-[0.55rem] tracking-wider text-white/80">
                  PTIT · VR
                </span>
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
