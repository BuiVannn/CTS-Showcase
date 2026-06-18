"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { showcase } from "@/content/showcase";
import { ui } from "@/content/ui";
import { EASE } from "@/lib/motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import MediaFrame from "@/components/ui/MediaFrame";

// Distinct-image builds (Smart Arm reuses pcar.jpg — omitted to avoid a duplicate cover).
const FEATURED = ["robot-clover", "pcar", "vex", "vr"];

export default function ShowcaseSection() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const items = showcase.filter((s) => FEATURED.includes(s.id));
  return (
    <section className="section bg-surface">
      <Container>
        <span className="eyebrow">{t(ui.showcase.eyebrow)}</span>
        <h2 className="text-section mt-2 text-ink">{t(ui.showcase.title)}</h2>
        <p className="mt-3 mb-9 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.showcase.lead)}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s, i) => (
            <motion.div
              key={s.id}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: EASE, delay: reduce ? 0 : i * 0.07 }}
            >
              <Card className="h-full">
                <MediaFrame src={s.image.src} alt={t(s.image.alt)} className="mb-4" />
                <Badge tone="neutral">{t(s.category)}</Badge>
                <h3 className="text-display mt-3 text-base text-ink">{s.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{t(s.description)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
