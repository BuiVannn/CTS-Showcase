"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Mail, Phone, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import SectionHeader from "./SectionHeader";
import SectionReveal from "./SectionReveal";

type Status = "idle" | "sending" | "success" | "error";

export default function Contact() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const details = [
    { label: ui.contact.emailLabel, value: site.contact.email, href: `mailto:${site.contact.email}`, Icon: Mail },
    { label: ui.contact.phoneLabel, value: site.contact.phone, href: undefined, Icon: Phone },
    { label: ui.contact.addressLabel, value: t(site.contact.address), href: undefined, Icon: MapPin },
  ];

  const fieldClass =
    "w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-dim transition-colors focus:border-[var(--violet)] focus:outline-none";

  return (
    <section id="contact" className="section">
      <div className="container-x">
        <SectionHeader eyebrow={ui.contact.eyebrow} title={ui.contact.title} />

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Info */}
          <SectionReveal>
            <h3 className="font-display text-xl font-semibold text-ink">
              {t(ui.contact.heading)}
            </h3>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              {t(ui.contact.blurb)}
            </p>
            <div className="mt-8 space-y-3">
              {details.map(({ label, value, href, Icon }) => (
                <div
                  key={value}
                  className="glass flex items-start gap-3.5 px-5 py-4"
                >
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-[var(--gradient-soft)] text-coral-ink">
                    <Icon size={16} />
                  </span>
                  <div>
                    <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-dim">
                      {t(label)}
                    </span>
                    {href ? (
                      <a
                        href={href}
                        className="text-sm text-ink transition-colors hover:text-coral-ink"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-sm text-ink">{value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>

          {/* Form */}
          <SectionReveal delay={0.1}>
            <form onSubmit={handleSubmit} className="glass-strong space-y-4 p-6 sm:p-8">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t(ui.contact.nameLabel)}
                </label>
                <input id="name" name="name" type="text" required placeholder={t(ui.contact.namePlaceholder)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t(ui.contact.emailLabel)}
                </label>
                <input id="email" name="email" type="email" required placeholder={t(ui.contact.emailPlaceholder)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  {t(ui.contact.messageLabel)}
                </label>
                <textarea id="message" name="message" required rows={4} placeholder={t(ui.contact.messagePlaceholder)} className={`${fieldClass} resize-none`} />
              </div>

              <button type="submit" disabled={status === "sending"} className="btn-gradient w-full justify-center disabled:opacity-60">
                {status === "sending" ? (
                  t(ui.contact.sending)
                ) : (
                  <>
                    {t(ui.contact.send)}
                    <Send size={15} />
                  </>
                )}
              </button>

              {status === "success" && (
                <p className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 size={16} />
                  {t(ui.contact.success)}
                </p>
              )}
              {status === "error" && (
                <p className="flex items-center gap-2 text-sm text-coral-ink">
                  <AlertCircle size={16} />
                  {t(ui.contact.error)}
                </p>
              )}
            </form>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
