"use client";

import { Smartphone, Download, Apple, Clock } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme-context";
import { ui } from "@/content/ui";
import { APP_ICONS } from "@/lib/app-icons";
import { describeDownload, downloadApiHref, badgeSrc } from "@/lib/app-download";
import type { EcosystemApp, Platform, PlatformDownload } from "@/content/types";

type Variant = "full" | "row" | "compact";

/** 1 nút/badge cho 1 platform. */
function PlatformControl({
  slug, platform, pd, variant, locale, theme, t,
}: {
  slug: string; platform: Platform; pd: PlatformDownload | undefined; variant: Variant;
  locale: "en" | "vi"; theme: "light" | "dark"; t: ReturnType<typeof useLocale>["t"];
}) {
  const view = describeDownload(pd);
  const href = downloadApiHref(slug, platform);
  const PlatformIcon = platform === "ios" ? Apple : Smartphone;
  const forLabel = platform === "ios" ? t(ui.download.forIos) : t(ui.download.forAndroid);

  // "Sắp có" — chip tĩnh, không phải link, không dùng badge official.
  if (view.mode === "soon") {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-surface px-4 py-2.5 text-sm text-dim opacity-70"
        aria-label={`${platform} — ${t(ui.download.soon)}`}
      >
        <PlatformIcon size={16} aria-hidden /> {forLabel} · <Clock size={13} aria-hidden /> {t(ui.download.soon)}
      </span>
    );
  }

  // Official store badge (chỉ khi live + kind store).
  if (view.mode === "official") {
    const src = badgeSrc(view.store, locale, theme);
    const alt = view.store === "play" ? "Get it on Google Play" : "Download on the App Store";
    const badgeH = variant === "compact" ? "h-9" : "h-12";
    return (
      <a href={href} rel="nofollow" aria-label={alt} className="inline-flex transition hover:opacity-90">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={`${badgeH} w-auto`} />
      </a>
    );
  }

  // APK / TestFlight — nút custom, luôn <a> (không next/link) + rel nofollow.
  const label = view.mode === "apk" ? t(ui.download.apk) : t(ui.download.testflight);
  const compact = variant === "compact";
  return (
    <a
      href={href}
      rel="nofollow"
      className={`group inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-blue px-4 ${compact ? "py-2 text-[0.8rem]" : "py-2.5 text-sm"} font-semibold text-white transition hover:brightness-110 active:scale-[0.98]`}
    >
      <PlatformIcon size={compact ? 14 : 16} aria-hidden />
      <span className="flex flex-col items-start leading-tight">
        <span>{label} {compact ? "" : forLabel}</span>
        {!compact && view.mode === "apk" && (view.version || view.updatedAt) && (
          <span className="text-[0.65rem] font-normal opacity-80">
            {view.version ? `v${view.version}` : ""}{view.version && view.updatedAt ? " · " : ""}
            {view.updatedAt ? `${t(ui.download.updated)} ${view.updatedAt}` : ""}
          </span>
        )}
      </span>
      <Download size={compact ? 13 : 15} className="opacity-80" aria-hidden />
    </a>
  );
}

export default function AppDownload({ app, variant }: { app: EcosystemApp; variant: Variant }) {
  const { t, locale } = useLocale();
  const { theme } = useTheme();
  const Icon = APP_ICONS[app.icon] ?? APP_ICONS.mic;

  const controls = (
    <>
      <PlatformControl slug={app.slug} platform="android" pd={app.downloads?.android} variant={variant} locale={locale} theme={theme} t={t} />
      <PlatformControl slug={app.slug} platform="ios" pd={app.downloads?.ios} variant={variant} locale={locale} theme={theme} t={t} />
    </>
  );

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
        <div className="flex flex-wrap items-center gap-2">{controls}</div>
      </div>
    );
  }

  // full + compact: hàng nút; compact nhỏ hơn (do PlatformControl tự co theo variant).
  return <div className="flex flex-wrap items-center gap-3">{controls}</div>;
}
