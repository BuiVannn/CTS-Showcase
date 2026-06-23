"use client";

import { Mail, Phone } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { deviceMailto } from "@/lib/device-mailto";

/**
 * "Order the physical device" CTA block shown on detail pages for apps with a
 * device (app.device). Pre-filled email + tel link; no backend.
 */
export default function DeviceOrderBlock({ appName }: { appName: string }) {
  const { t } = useLocale();
  const href = deviceMailto(site.contact.email, t(ui.device.subjectPrefix), appName);
  const tel = `tel:${site.contact.phone.replace(/\s+/g, "")}`;

  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h2 className="text-display text-lg text-ink">{t(ui.device.title)}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">{t(ui.device.blurb)}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <a
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-[0.9rem] font-semibold text-white transition duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Mail size={16} aria-hidden /> {t(ui.device.cta)}
        </a>
        <a href={tel} className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-blue">
          <Phone size={14} aria-hidden /> {site.contact.phone}
        </a>
      </div>
    </div>
  );
}
