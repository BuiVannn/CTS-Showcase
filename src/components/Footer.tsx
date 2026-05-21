"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Mail, MapPin, Phone, Globe } from "lucide-react";

interface FooterProps {
  siteName?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  socialLinks?: {
    github?: string;
    facebook?: string;
    youtube?: string;
    email?: string;
  };
}

export default function Footer({
  siteName = "Creative Technologies and Simulation Lab",
  description = "STEM Innovation Lab at the Posts & Telecommunications Institute of Technology",
  contactEmail = "contact@cts.ptit.edu.vn",
  contactPhone = "+84 xxx xxx xxx",
  contactAddress = "Posts & Telecommunications Institute of Technology, Hanoi, Vietnam",
  socialLinks = {},
}: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!footerRef.current) return;
      const elements = footerRef.current.querySelectorAll(".footer-reveal");

      gsap.fromTo(
        elements,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    },
    { scope: footerRef }
  );

  const currentYear = new Date().getFullYear();

  return (
    <footer ref={footerRef} className="relative bg-[#f9fafb]">
      {/* Red accent line at top */}
      <div className="accent-line" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Brand */}
          <div className="footer-reveal">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/img/cts-logo.jpg"
                alt="CTS Lab Logo"
                className="w-8 h-8 object-contain rounded-sm"
              />
              <span className="text-sm font-semibold tracking-widest uppercase text-[#111111] font-[family-name:var(--font-space-grotesk)]">
                {siteName}
              </span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
              {description}
            </p>
          </div>

          {/* Contact */}
          <div className="footer-reveal">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">
              Contact
            </h3>
            <div className="space-y-3">
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-sm text-zinc-500 hover:text-[#dc2626] transition-colors"
              >
                <Mail size={14} />
                {contactEmail}
              </a>
              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <Phone size={14} />
                {contactPhone}
              </div>
              <div className="flex items-start gap-3 text-sm text-zinc-500">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                {contactAddress}
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="footer-reveal">
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-4">
              Follow Us
            </h3>
            <div className="flex gap-3">
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-black/10 text-zinc-500 hover:border-[#dc2626] hover:text-[#dc2626] transition-all duration-300"
                  title="GitHub"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-black/10 text-zinc-500 hover:border-[#dc2626] hover:text-[#dc2626] transition-all duration-300"
                  title="Facebook"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-black/10 text-zinc-500 hover:border-[#dc2626] hover:text-[#dc2626] transition-all duration-300"
                  title="YouTube"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              )}
              {socialLinks.email && (
                <a
                  href={`mailto:${socialLinks.email}`}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 text-zinc-500 hover:border-[#dc2626] hover:text-[#dc2626] transition-all duration-300"
                >
                  <Mail size={16} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400">
            © {currentYear} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-zinc-700">
            Empowering the next generation of innovators.
          </p>
        </div>
      </div>
    </footer>
  );
}
