"use client";

import { Smartphone, Apple, Glasses, Download, Clock } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { APP_ICONS } from "@/lib/app-icons";
import { describeDownload, downloadApiHref } from "@/lib/app-download";
import type { EcosystemApp, Platform, PlatformDownload, Localized } from "@/content/types";

type Variant = "full" | "row" | "compact";
type T = ReturnType<typeof useLocale>["t"];

const PLATFORM: Record<Platform, { glyph: typeof Smartphone; name: Localized }> = {
  android: { glyph: Smartphone, name: ui.download.nAndroid },
  ios: { glyph: Apple, name: ui.download.nIos },
  vr: { glyph: Glasses, name: ui.download.nVr },
};

/** Which platforms an app offers: VR-only devices show one button; everything
 *  else shows Android + iOS (a missing platform renders as "coming soon"). */
function platformsFor(app: EcosystemApp): Platform[] {
  return app.downloads?.vr ? ["vr"] : ["android", "ios"];
}

/** One unified 3D store button — identical for play / appstore / apk / testflight. */
function StoreButton({
  slug, platform, pd, variant, t,
}: { slug: string; platform: Platform; pd: PlatformDownload | undefined; variant: Variant; t: T }) {
  const view = describeDownload(pd);
  const { glyph: Glyph, name } = PLATFORM[platform];
  const single = platform === "vr";
  const glyphSize = variant === "compact" ? 15 : 17;
  const cls = `store-btn${variant === "compact" ? " store-btn--compact" : ""}${single ? " store-btn--single" : ""}`;

  if (view.mode === "soon") {
    return (
      <span className={`${cls} store-btn--soon`} aria-label={`${t(ui.download.downloadFor)} ${t(name)} — ${t(ui.download.soon)}`}>
        <span className="store-btn__glyph"><Glyph size={glyphSize} aria-hidden /></span>
        <span className="store-btn__label">
          <span className="store-btn__top">{t(ui.download.downloadFor)}</span>
          <span className="store-btn__main">{t(name)} · {t(ui.download.soon)}</span>
        </span>
        <Clock size={variant === "compact" ? 12 : 14} aria-hidden className="opacity-70" />
      </span>
    );
  }

  return (
    <a
      href={downloadApiHref(slug, platform)}
      rel="nofollow"
      aria-label={`${t(ui.download.downloadFor)} ${t(name)}`}
      className={cls}
    >
      <span className="store-btn__glyph"><Glyph size={glyphSize} aria-hidden /></span>
      <span className="store-btn__label">
        <span className="store-btn__top">{t(ui.download.downloadFor)}</span>
        <span className="store-btn__main">{t(name)}</span>
      </span>
      <Download size={variant === "compact" ? 13 : 15} aria-hidden className="opacity-70" />
    </a>
  );
}

/** APK version/updated caption (full/row only) — kept OUT of the button so every
 *  button stays pixel-identical. */
function ApkCaption({ app, t }: { app: EcosystemApp; t: T }) {
  for (const p of platformsFor(app)) {
    const v = describeDownload(app.downloads?.[p]);
    if (v.mode === "apk" && (v.version || v.updatedAt)) {
      return (
        <p className="font-mono text-[0.65rem] text-dim">
          {v.version ? `v${v.version}` : ""}
          {v.version && v.updatedAt ? " · " : ""}
          {v.updatedAt ? `${t(ui.download.updated)} ${v.updatedAt}` : ""}
        </p>
      );
    }
  }
  return null;
}

export default function AppDownload({ app, variant }: { app: EcosystemApp; variant: Variant }) {
  const { t } = useLocale();
  const Icon = APP_ICONS[app.icon] ?? APP_ICONS.mic;
  const platforms = platformsFor(app);
  const controls = platforms.map((p) => (
    <StoreButton key={p} slug={app.slug} platform={p} pd={app.downloads?.[p]} variant={variant} t={t} />
  ));

  if (variant === "row") {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-blue" style={{ background: "var(--blue-soft)" }}>
            <Icon size={20} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{app.name}</p>
            <p className="text-xs text-ink-2">{t(app.categoryLabel)}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1.5 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{controls}</div>
          <ApkCaption app={app} t={t} />
        </div>
      </div>
    );
  }

  // full + compact: a row of buttons; compact shrinks via the CSS modifier.
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">{controls}</div>
      {variant === "full" && <ApkCaption app={app} t={t} />}
    </div>
  );
}
