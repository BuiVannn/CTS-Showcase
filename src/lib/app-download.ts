import type { EcosystemApp, PlatformDownload, Platform } from "@/content/types";

/** Public href luôn qua route trung gian → đổi hạ tầng/kind không đổi URL, đếm được click. */
export function downloadApiHref(slug: string, platform: Platform): string {
  return `/api/download/${slug}?platform=${platform}`;
}

const PLATFORMS: readonly Platform[] = ["android", "ios", "vr"];

/** Validate the untrusted `?platform=` query value. */
export function isPlatform(value: string | null): value is Platform {
  return PLATFORMS.includes(value as Platform);
}

export type ResolveResult =
  | { ok: true; target: string }
  | { ok: false; reason: "no-platform" | "not-available" | "no-target" };

/** Server-side: resolve đích thật cho 1 platform. */
export function resolveDownload(app: EcosystemApp | undefined, platform: Platform): ResolveResult {
  const pd = app?.downloads?.[platform];
  if (!pd) return { ok: false, reason: "no-platform" };
  if (pd.status !== "available") return { ok: false, reason: "not-available" };
  if (!pd.target) return { ok: false, reason: "no-target" };
  return { ok: true, target: pd.target };
}

export type DownloadView =
  | { mode: "official"; store: "play" | "appstore" }
  | { mode: "apk"; version?: string; updatedAt?: string; size?: string }
  | { mode: "testflight" }
  | { mode: "soon" };

/** Client-side: mô tả cách render 1 platform (không phụ thuộc JSX → test được). */
export function describeDownload(pd: PlatformDownload | undefined): DownloadView {
  if (!pd || pd.status !== "available") return { mode: "soon" };
  switch (pd.kind) {
    case "play": return { mode: "official", store: "play" };
    case "appstore": return { mode: "official", store: "appstore" };
    case "testflight": return { mode: "testflight" };
    default: return { mode: "apk", version: pd.version, updatedAt: pd.updatedAt, size: pd.size };
  }
}

/** Đường dẫn asset badge chính thức (user tự drop vào public/img/badges/). */
export function badgeSrc(store: "play" | "appstore", locale: "en" | "vi", theme: "light" | "dark"): string {
  const name = store === "play" ? "google-play" : "app-store";
  const color = theme === "dark" ? "white" : "black";
  return `/img/badges/${name}-${color}-${locale}.svg`;
}
