"use client";

import Image from "next/image";
import { useLocale } from "@/lib/locale";
import { team } from "@/content/team";
import { ui } from "@/content/ui";
import SectionHeader from "./SectionHeader";
import SectionReveal from "./SectionReveal";

export default function Team() {
  const { t } = useLocale();

  return (
    <section id="team" className="section">
      <div className="container-x">
        <SectionHeader
          eyebrow={ui.team.eyebrow}
          title={ui.team.title}
          lead={ui.team.lead}
        />

        <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((member, i) => (
            <SectionReveal key={member.id} delay={(i % 4) * 0.06}>
              <figure className="group">
                <div className="glass lift relative aspect-[3/4] overflow-hidden p-0">
                  <Image
                    src={member.image.src}
                    alt={t(member.image.alt)}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4">
                    <span className="font-display text-sm font-semibold text-white drop-shadow-sm sm:text-[0.95rem]">
                      {t(member.image.alt)}
                    </span>
                    {member.role && (
                      <span className="mt-0.5 block text-[0.7rem] font-medium uppercase tracking-wider text-white/80">
                        {t(member.role)}
                      </span>
                    )}
                  </figcaption>
                </div>
              </figure>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
