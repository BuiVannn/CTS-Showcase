"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Menu, X, Play } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { useLocale } from "@/lib/locale";
import { EASE } from "@/lib/motion";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import DownloadDropdown from "./DownloadDropdown";
import LanguageToggle from "./LanguageToggle";

interface NavbarProps {
  showSectionLinks?: boolean;
}

export default function Navbar({ showSectionLinks = true }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const reduce = useReducedMotion();
  const { t } = useLocale();

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

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const target = document.querySelector(id);
    if (!target) {
      router.push(`/${id}`);
      return;
    }
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(id, { offset: -90 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={reduce ? false : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="container-x pt-3 lg:pt-4">
        <div
          className={`flex items-center justify-between gap-4 rounded-[var(--radius-pill)] border border-[var(--glass-border)] bg-[var(--glass-bg-strong)] px-3 py-2 pl-4 backdrop-blur-xl transition-shadow duration-500 ${
            scrolled ? "shadow-[var(--shadow-md)]" : "shadow-[var(--shadow-sm)]"
          }`}
        >
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2.5">
            <Image
              src="/img/cts-logo.jpg"
              alt="CTS Lab"
              width={36}
              height={36}
              className="h-9 w-9 rounded-[12px] object-contain"
            />
            <span className="font-display text-sm font-semibold tracking-tight text-ink transition-colors group-hover:text-coral-ink">
              {site.siteNameShort}
            </span>
          </Link>

          {/* Desktop links */}
          {showSectionLinks && (
            <div className="hidden items-center gap-0.5 lg:flex">
              {site.nav.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="rounded-[var(--radius-pill)] px-3.5 py-2 text-[0.78rem] font-medium text-muted transition-colors duration-300 hover:bg-white/60 hover:text-ink"
                >
                  {t(link.label)}
                </button>
              ))}
            </div>
          )}

          {/* Right cluster */}
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageToggle />
            <DownloadDropdown />
            <Link
              href="/vr-tour"
              className="btn-gradient !px-4 !py-2 !text-[0.78rem]"
            >
              <Play size={14} />
              {t(ui.hero.vrCta)}
            </Link>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageToggle />
            <button
              className="rounded-[var(--radius-pill)] p-2 text-ink"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`overflow-hidden transition-all duration-500 lg:hidden ${
            mobileOpen ? "mt-2 max-h-[34rem] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="glass-strong space-y-1 p-3">
            {showSectionLinks &&
              site.nav.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="block w-full rounded-[var(--radius-md)] px-4 py-3 text-left text-sm font-medium text-muted transition-colors hover:bg-white/60 hover:text-ink"
                >
                  {t(link.label)}
                </button>
              ))}
            <div className="px-1 py-1">
              <DownloadDropdown variant="mobile" onNavigate={() => setMobileOpen(false)} />
            </div>
            <Link
              href="/vr-tour"
              onClick={() => setMobileOpen(false)}
              className="btn-gradient w-full justify-center"
            >
              <Play size={14} />
              {t(ui.hero.vrCta)}
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
