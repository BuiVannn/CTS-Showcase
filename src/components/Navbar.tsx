"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Download } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import DownloadDropdown from "./DownloadDropdown";
interface NavbarProps {
  siteName?: string;
  showSectionLinks?: boolean;
}

export default function Navbar({ siteName = "Creative Technologies and Simulation Lab", showSectionLinks = true }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileDownloadOpen, setMobileDownloadOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use Lenis scroll event (throttled via RAF) instead of raw window scroll
    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ scroll }: { scroll: number }) => {
        setScrolled(scroll > 50);
      };
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }
    // Fallback if Lenis not ready yet
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      if (linksRef.current) {
        const links = linksRef.current.querySelectorAll(".nav-link");
        gsap.from(links, {
          opacity: 0,
          y: -10,
          duration: 0.5,
          stagger: 0.08,
          delay: 0.5,
          ease: "power3.out",
        });


      }
    },
    { scope: navRef }
  );

  const router = useRouter();

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    const target = document.querySelector(id);
    if (!target) {
      // Target section isn't on this route — navigate to the home page anchor.
      router.push(`/${id}`);
      return;
    }

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(id, { offset: -80 });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { id: "#home", label: "Home" },
    { id: "#showcase", label: "Showcase" },
    { id: "#products", label: "Products" },
    { id: "#team", label: "Team" },
    { id: "#contact", label: "Contact" },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[rgba(255,255,255,0.8)] backdrop-blur-xl border-b border-[var(--border)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/img/cts-logo.jpg"
              alt="CTS Lab Logo"
              className="w-14 h-14 object-contain rounded-lg"
            />
            <span className="text-sm font-semibold tracking-widest uppercase font-[family-name:var(--font-display)] text-[var(--ink)] transition-colors duration-300 group-hover:text-[var(--red-dark)]">
              {siteName}
            </span>
          </Link>

          {/* Desktop links */}
          <div ref={linksRef} className="hidden lg:flex items-center gap-1">
            {showSectionLinks &&
              navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="nav-link px-4 py-2 text-xs font-medium tracking-widest uppercase transition-colors duration-300 text-[var(--text-muted)] hover:text-[var(--red-dark)]"
                >
                  {link.label}
                </button>
              ))}

            {/* Download CTA with dropdown */}
            <div className="ml-2">
              <DownloadDropdown />
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-500 ${
          mobileOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[rgba(255,255,255,0.95)] backdrop-blur-xl border-t border-[var(--border)] px-6 py-4 space-y-1">
          {showSectionLinks &&
            navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="block w-full text-left px-4 py-3 text-sm font-medium tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--red-dark)] transition-colors"
              >
                {link.label}
              </button>
            ))}

          {/* Download — expandable */}
          <button
            onClick={() => setMobileDownloadOpen(!mobileDownloadOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium tracking-widest uppercase text-[var(--red)] hover:text-[var(--red-dark)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Download size={14} />
              Download
            </span>
            <X
              size={14}
              className={`transition-transform duration-300 ${mobileDownloadOpen ? "rotate-0" : "rotate-45"}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              mobileDownloadOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <DownloadDropdown
              variant="mobile"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>

          {showSectionLinks && (
            <button
              onClick={() => scrollTo("#contact")}
              className="block w-full text-left px-4 py-3 text-sm font-medium tracking-widest uppercase text-[var(--red)] hover:text-[var(--red-dark)] transition-colors"
            >
              Get in Touch
            </button>
          )}
          <Link
            href="/vr-tour"
            className="block w-full text-left px-4 py-3 text-sm font-medium tracking-widest uppercase text-[var(--red)] hover:text-[var(--red-dark)] transition-colors"
          >
            🎥 VR Tour
          </Link>
        </div>
      </div>
    </nav>
  );
}
