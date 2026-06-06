"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { staggerContainer, fadeUpItem } from "@/lib/motion";
import FloatingShape from "./FloatingShape";

const container = staggerContainer;
const item = fadeUpItem;

const FLOAT_TAGS = ["Robotics", "VR", "AI Voice", "STEM"];

export default function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { t } = useLocale();

  const goShowcase = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo("#showcase", { offset: -90 });
    else document.querySelector("#showcase")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      {/* Floating glass tag chips — ambient soft-futurism motion */}
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
          <FloatingShape
            className="absolute left-[8%] top-[26%]"
            amplitude={16}
            duration={7}
          >
            <span className="glass-strong rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-muted">
              {FLOAT_TAGS[0]}
            </span>
          </FloatingShape>
          <FloatingShape
            className="absolute right-[10%] top-[32%]"
            amplitude={20}
            duration={9}
            delay={1}
          >
            <span className="glass-strong rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-muted">
              {FLOAT_TAGS[1]}
            </span>
          </FloatingShape>
          <FloatingShape
            className="absolute left-[14%] bottom-[22%]"
            amplitude={18}
            duration={8}
            delay={0.5}
          >
            <span className="glass-strong rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-muted">
              {FLOAT_TAGS[2]}
            </span>
          </FloatingShape>
          <FloatingShape
            className="absolute right-[14%] bottom-[26%]"
            amplitude={14}
            duration={7.5}
            delay={1.4}
          >
            <span className="glass-strong rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-muted">
              {FLOAT_TAGS[3]}
            </span>
          </FloatingShape>
        </div>
      )}

      <motion.div
        variants={reduce ? undefined : container}
        initial={reduce ? false : "hidden"}
        animate={reduce ? undefined : "show"}
        className="container-x relative z-10 w-full text-center"
      >
        {/* Eyebrow */}
        <motion.div variants={reduce ? undefined : item} className="mb-7 flex justify-center">
          <span className="glass-strong inline-flex items-center gap-2.5 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-muted">
            <span className="h-2 w-2 rounded-full bg-[var(--gradient-accent)]" />
            {t(site.hero.eyebrow)}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={reduce ? undefined : item}
          className="text-hero text-gradient"
        >
          {site.hero.headline}
        </motion.h1>

        {/* Location */}
        <motion.p
          variants={reduce ? undefined : item}
          className="font-display mt-2 text-base font-medium tracking-[0.2em] text-dim sm:text-lg"
        >
          {t(site.hero.location)}
        </motion.p>

        {/* Subtitle */}
        <motion.p
          variants={reduce ? undefined : item}
          className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
        >
          {t(site.hero.subtitle)}
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={reduce ? undefined : item}
          className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button onClick={goShowcase} className="btn-gradient group">
            {t(ui.hero.exploreCta)}
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
          <button onClick={() => router.push("/vr-tour")} className="btn-glass">
            <Play size={16} />
            {t(ui.hero.vrCta)}
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          variants={reduce ? undefined : item}
          className="mt-16 flex flex-col items-center gap-1.5 text-dim"
        >
          <span className="text-[0.65rem] font-medium tracking-[0.35em] uppercase">
            {t(ui.hero.scroll)}
          </span>
          {reduce ? (
            <ChevronDown size={18} />
          ) : (
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={18} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
