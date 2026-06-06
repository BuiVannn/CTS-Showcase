"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Mic, Paintbrush, Film, Music, MessageCircle, ChevronRight } from "lucide-react";

interface DownloadApp {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

const downloadApps: DownloadApp[] = [
  {
    id: "ptalk",
    name: "PTalk",
    description: "AI voice assistant for speaking practice & curriculum-aligned learning",
    icon: <Mic size={18} />,
    href: "/products#ptalk",
  },
  {
    id: "viet-creative",
    name: "VietCreative",
    description: "Vietnamese lessons, AI tutor, and smart drawing — all in one tablet app",
    icon: <Paintbrush size={18} />,
    href: "/products#viet-creative",
  },
  {
    id: "vision-tale",
    name: "Vision Tale",
    description: "AI filmmaking tool — write scripts, design characters, render videos",
    icon: <Film size={18} />,
    href: "/products#vision-tale",
  },
  {
    id: "unilearn",
    name: "Unilearn",
    description: "Dual-module AI for math problem-solving and music composition",
    icon: <Music size={18} />,
    href: "/products#unilearn",
  },
];

interface DownloadDropdownProps {
  /** Render as mobile inline list instead of desktop dropdown */
  variant?: "desktop" | "mobile";
  /** Called when a link is clicked (e.g. to close mobile menu) */
  onNavigate?: () => void;
}

export default function DownloadDropdown({
  variant = "desktop",
  onNavigate,
}: DownloadDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (variant !== "desktop") return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [variant]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Animate menu items on open
  useGSAP(
    () => {
      if (!menuRef.current || !open) return;
      const items = menuRef.current.querySelectorAll(".download-item");
      gsap.fromTo(
        items,
        { opacity: 0, y: -8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.06,
          ease: "power3.out",
        }
      );
    },
    { scope: menuRef, dependencies: [open] }
  );

  // ── Mobile variant: inline list ──
  if (variant === "mobile") {
    return (
      <div className="space-y-1 pl-4">
        {downloadApps.map((app) => (
          <Link
            key={app.id}
            href={app.href}
            onClick={onNavigate}
            className="download-item flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
          >
            <span className="text-[var(--red)]">{app.icon}</span>
            <span>{app.name}</span>
          </Link>
        ))}
        <Link
          href="/products"
          onClick={onNavigate}
          className="download-item flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--red)] hover:text-[var(--red-dark)] transition-colors"
        >
          View All Products
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  // ── Desktop variant: dropdown ──
  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="nav-link px-4 py-2 text-xs font-medium tracking-widest uppercase text-[var(--red)] hover:text-[var(--red-dark)] transition-colors duration-300 flex items-center gap-1.5"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Download
        <ChevronRight
          size={12}
          className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-3)] rounded-[var(--radius-md)] overflow-hidden z-50"
        >
          <div className="p-2">
            {downloadApps.map((app) => (
              <Link
                key={app.id}
                href={app.href}
                onClick={() => setOpen(false)}
                className="download-item flex items-start gap-3 px-3 py-3 rounded-[var(--radius-sm)] hover:bg-[var(--red-softer)] transition-colors group"
              >
                <span className="flex-shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center bg-[var(--red-soft)] text-[var(--red)] rounded-[var(--radius-sm)] group-hover:bg-[var(--red)] group-hover:text-white transition-colors">
                  {app.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)] font-[family-name:var(--font-display)] group-hover:text-[var(--red)] transition-colors">
                    {app.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">
                    {app.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer link */}
          <div className="border-t border-[var(--border)] px-2 py-2">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="download-item flex items-center justify-between px-3 py-2 text-xs font-medium tracking-wider uppercase text-[var(--red)] hover:text-[var(--red-dark)] transition-colors"
            >
              View All Products
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
