"use client";

import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  );
}
function YoutubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
}

export default function Footer() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  const socials = [
    site.social.github && { href: site.social.github, label: "GitHub", Icon: GithubIcon },
    site.social.facebook && { href: site.social.facebook, label: "Facebook", Icon: FacebookIcon },
    site.social.youtube && { href: site.social.youtube, label: "YouTube", Icon: YoutubeIcon },
  ].filter(Boolean) as { href: string; label: string; Icon: () => React.JSX.Element }[];

  return (
    <footer className="section pb-12">
      <div className="container-x">
        <div className="rounded-[var(--radius-lg)] border border-border bg-card p-7 shadow-[var(--shadow-sm)] sm:p-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* Brand */}
            <div>
              <Image
                src="/img/cts-logo.png"
                alt="CTS — Creative Technologies & Simulation Lab"
                width={840}
                height={297}
                className="h-12 w-auto object-contain"
              />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">{t(site.footerDescription)}</p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-dim">{t(ui.footer.contact)}</h3>
              <div className="mt-4 space-y-3 text-sm text-ink-2">
                <a href={`mailto:${site.contact.email}`} className="flex items-center gap-3 transition-colors hover:text-blue">
                  <Mail size={14} /> {site.contact.email}
                </a>
                <p className="flex items-center gap-3"><Phone size={14} /> {site.contact.phone}</p>
                <p className="flex items-start gap-3"><MapPin size={14} className="mt-0.5 flex-shrink-0" /> {t(site.contact.address)}</p>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-dim">{t(ui.footer.follow)}</h3>
              <div className="mt-4 flex gap-2.5">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-ink-2 transition-colors hover:border-blue hover:text-blue">
                    <Icon />
                  </a>
                ))}
                <a href={`mailto:${site.social.email}`} title="Email"
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-ink-2 transition-colors hover:border-blue hover:text-blue">
                  <Mail size={16} />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-7 sm:flex-row">
            <p className="text-xs text-dim">© {year} {site.siteNameShort}, PTIT. {t(ui.footer.rights)}</p>
            <p className="text-xs text-ink-2">{t(site.footerTagline)}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
