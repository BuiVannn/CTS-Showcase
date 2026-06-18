"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Magnetic from "@/components/ui/Magnetic";

export default function HomeCTA() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  return (
    <section className="section">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center sm:p-16">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{ background: "radial-gradient(120% 90% at 50% 0%, var(--blue-soft), transparent 60%)" }}
              animate={reduce ? undefined : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.04, 1] }}
              transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="eyebrow">{t(ui.home.ctaEyebrow)}</span>
            <h2 className="text-section mx-auto mt-3 max-w-2xl text-ink">{t(ui.contact.heading)}</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-2">{t(ui.contact.blurb)}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Magnetic>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-[0.9rem] font-semibold text-white transition duration-200 hover:brightness-110"
                >
                  {t(ui.home.ctaButton)}
                </a>
              </Magnetic>
              <Button href="/products" variant="ghost">
                {t(ui.products.title)}
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
