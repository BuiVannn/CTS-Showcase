"use client";

import { Bot, Boxes, Sparkles, Gamepad2 } from "lucide-react";
import { motion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { EASE, staggerContainer } from "@/lib/motion";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const ICONS = { robot: Bot, vr: Boxes, ai: Sparkles, games: Gamepad2 } as const;

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function WhatWeDo() {
  const { t } = useLocale();
  const pillars = ui.whatWeDo.pillars;
  return (
    <section className="section">
      <Container>
        <SectionHeader eyebrow={t(ui.whatWeDo.eyebrow)} title={t(ui.whatWeDo.title)} />
        <motion.div
          className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {pillars.map((p) => {
            const Icon = ICONS[p.key as keyof typeof ICONS] ?? Sparkles;
            const warm = p.key === "games";
            return (
              <motion.div
                key={p.key}
                variants={card}
                className="group relative bg-card p-7 transition-transform duration-300 hover:-translate-y-1"
              >
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-border"
                  style={{ background: warm ? "var(--red-soft)" : "var(--blue-soft)", color: warm ? "var(--red)" : "var(--blue)" }}
                >
                  <Icon size={20} />
                </span>
                <h3 className="text-display mt-4 text-lg text-ink">{t(p.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{t(p.desc)}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
