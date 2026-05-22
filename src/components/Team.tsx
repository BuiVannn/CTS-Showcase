"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Mail, Globe } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: { url: string; alt?: string };
  social?: {
    linkedin?: string;
    github?: string;
    email?: string;
    website?: string;
  };
  highlight?: boolean;
}

interface TeamProps {
  members?: TeamMember[];
}

const placeholderTeam: TeamMember[] = [
  { id: "1", name: "Mr.Pham Vu Minh Tu", role: "", image: { url: "/img/thayTu.png", alt: "Mr.Pham Vu Minh Tu" } },
  { id: "2", name: "Mr.Vu Huu Tien", role: "", image: { url: "/img/thayTien.png", alt: "Mr.Vu Huu Tien" } },
  { id: "3", name: "Mr.Nguyen Xuan Nam", role: "", image: { url: "/img/anhNam.jpg", alt: "Mr.Nguyen Xuan Nam" } },
  { id: "4", name: "Mr.Nguyen Hoang Quoc Quyen", role: "" },
  { id: "5", name: "Mr.Nguyen Thanh Trung", role: "", image: { url: "/img/anhTrung.jpg", alt: "Mr.Nguyen Thanh Trung" } },
  { id: "6", name: "Mr.Nguyen Trung Nam", role: "", image: { url: "/img/namBu.jpg", alt: "Mr.Nguyen Trung Nam" } },
  { id: "7", name: "Mr.Bui Mau Van", role: "", image: { url: "/img/vanBui.jpg", alt: "Mr.Bui Mau Van" } },
  { id: "8", name: "Mr.Vu Hung Anh", role: "", image: { url: "/img/hungAnh.jpg", alt: "Mr.Vu Hung Anh" } },
  { id: "9", name: "Mr.Pham Tuan Anh", role: "", image: { url: "/img/tuanAnh.jpg", alt: "Mr.Pham Tuan Anh" } },
  { id: "10", name: "Mr.Luong Son Tung", role: "", image: { url: "/img/tung.jpg", alt: "Mr.Luong Son Tung" } },
  { id: "11", name: "Mr.Pham Quoc Viet", role: "", image: { url: "/img/viet.jpg", alt: "Mr.Pham Quoc Viet" } },
];

export default function Team({ members }: TeamProps) {
  const data = members && members.length > 0 ? members : placeholderTeam;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Section title
      const title = sectionRef.current.querySelector(".section-title");
      if (title) {
        gsap.from(title, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: title,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Team cards with fade-in
      const cards = sectionRef.current.querySelectorAll(".team-card");

      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="team" className="section-spacing relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="section-title mb-16">
          <span className="text-label mb-4 block">The People</span>
          <h2 className="text-section font-[family-name:var(--font-space-grotesk)] text-[#111111]">
            THE TEAM
          </h2>
          <div className="accent-line-short mt-4" />
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {data.map((member) => (
            <div
              key={member.id}
              className={`team-card group relative ${
                member.highlight ? "lg:col-span-1" : ""
              }`}
            >
              {/* Photo area */}
              <div className="relative h-80 overflow-hidden mb-4 bg-[#f3f4f6] border border-black/5">
                {member.image?.url ? (
                  <img
                    src={member.image.url}
                    alt={member.image.alt || member.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="placeholder-image w-full h-full flex items-center justify-center">
                    <span className="text-6xl font-bold text-black/5 font-[family-name:var(--font-space-grotesk)]">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Highlight accent */}
                {member.highlight && (
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-[#dc2626]" />
                )}

                {/* Social overlay on hover */}
                {member.social && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    <div className="flex gap-3">
                      {member.social.linkedin && (
                        <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#dc2626] transition-colors" title="LinkedIn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                      {member.social.github && (
                        <a href={member.social.github} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#dc2626] transition-colors" title="GitHub">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                        </a>
                      )}
                      {member.social.email && (
                        <a href={`mailto:${member.social.email}`} className="text-zinc-400 hover:text-[#dc2626] transition-colors">
                          <Mail size={16} />
                        </a>
                      )}
                      {member.social.website && (
                        <a href={member.social.website} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-[#dc2626] transition-colors">
                          <Globe size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-base font-semibold text-[#111111] font-[family-name:var(--font-space-grotesk)]">
                {member.name}
              </h3>
              {member.role && (
                <p className="text-xs tracking-widest uppercase text-[#dc2626] mt-1">
                  {member.role}
                </p>
              )}
              {member.bio && (
                <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                  {member.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
