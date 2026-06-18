"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Play } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import Button from "./ui/Button";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ scroll }: { scroll: number }) => setScrolled(scroll > 40);
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }
    const handle = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const reduce = useReducedMotion();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-border bg-bg/80 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/img/cts-logo.jpg" alt="CTS Lab" width={64} height={64} className="h-12 w-12 rounded-[10px] object-contain" />
          <span className="text-display text-base font-bold tracking-tight">
            <span className="text-red">CTS</span> <span className="text-ink">LAB</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {site.nav.map((link) => {
            const active = isActive(link.id);
            return (
              <Link
                key={link.id}
                href={link.id}
                className={`relative rounded-[var(--radius-pill)] px-3.5 py-2 text-[0.82rem] font-medium transition-colors ${
                  active ? "text-blue" : "text-ink-2 hover:text-ink"
                }`}
              >
                {t(link.label)}
                {active && (
                  <motion.span
                    layoutId={reduce ? undefined : "nav-underline"}
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-blue"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <ThemeToggle />
          <Button href="/vr-tour" variant="ghost" size="sm">
            <Play size={14} /> {t(ui.hero.vrCta)}
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <LanguageToggle />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`overflow-hidden border-border bg-bg transition-all duration-300 lg:hidden ${mobileOpen ? "max-h-96 border-b" : "max-h-0"}`}>
        <div className="container-x space-y-1 py-3">
          {site.nav.map((link) => (
            <Link
              key={link.id}
              href={link.id}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition-colors ${
                isActive(link.id) ? "bg-surface text-blue" : "text-ink-2 hover:bg-surface hover:text-ink"
              }`}
            >
              {t(link.label)}
            </Link>
          ))}
          <Button href="/vr-tour" variant="ghost" className="mt-2 w-full" onClick={() => setMobileOpen(false)}>
            <Play size={14} /> {t(ui.hero.vrCta)}
          </Button>
        </div>
      </div>
    </header>
  );
}
