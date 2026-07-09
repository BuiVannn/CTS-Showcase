# Download 3D-Button Redesign + Games Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify every app-download control into one premium 3D "store-style" button used everywhere, restructure `/download` into Mobile Apps + VR Device groups, and fix three Games-page defects (EN toggle leaking Vietnamese, inconsistent studio design, a `--` tab title).

**Architecture:** Presentation + content/data-grouping only. A single `.store-btn` CSS class in `globals.css` provides the 3D look (multi-layer shadows + sheen pseudo-element, theme-aware via `[data-theme]`); `AppDownload.tsx` renders that button for all download kinds. STEM VR lives in a **separate** `vrDevices` array so the existing `ecosystem` array (and `/products`) is untouched. Games strings move into `ui.ts` and render via the client `useLocale().t()`.

**Tech Stack:** Next.js (custom fork — see `AGENTS.md`; read `node_modules/next/dist/docs/` before touching framework APIs), React, TypeScript, Tailwind v4 (`@import "tailwindcss"`) + CSS custom-property design tokens, lucide-react, vitest.

## Global Constraints

- **Do NOT change working download logic:** `src/app/api/download/[slug]`, `downloadApiHref`, `resolveDownload`, and click counting stay byte-identical. Only presentation/data-grouping changes.
- **Design tokens only** for colours/radius/shadow: `var(--bg|ink|ink-2|dim|blue|blue-soft|border|card|surface|radius-*|shadow-*)`. Dark theme selector is `[data-theme="dark"]`.
- **STEM VR must NOT be added to the `ecosystem` array** — `src/content/ecosystem.test.ts` asserts every `ecosystem` app declares both `android` + `ios`. It goes in a new `vrDevices` array.
- **`getDownloadApps()` and `getProducts()` keep their current return values** — `src/content/products.test.ts` and `ecosystem.test.ts` must stay green.
- **All user-facing strings bilingual** via `Localized` (`{ en, vi }`) in `src/content/ui.ts`, rendered with `t()`. Never hardcode Vietnamese in components.
- **STEM VR ships as "Coming soon"** — no real file/link, no `target`. Not shown on `/products`.
- Respect `prefers-reduced-motion` in all button animation.

---

## File Structure

**Create:**
- `src/components/games/studio/StudioHead.tsx` — client; standard studio page chrome (breadcrumb + eyebrow + localized title + optional lead).
- `src/components/games/studio/SignInButton.tsx` — client; localized styled submit button for the studio sign-in server-action form.

**Modify:**
- `src/content/types.ts` — extend `Platform`, `IconKey`, `EcosystemCategory`, `AppDownloads`.
- `src/content/ecosystem.ts` — add exported `vrDevices` array (STEM VR).
- `src/content/products.ts` — `getProduct` searches both arrays; add `getVrDevices`.
- `src/content/products.test.ts` — add `getVrDevices` + `getProduct("stem-vr")` tests.
- `src/lib/app-icons.ts` — add `vr` icon.
- `src/content/ui.ts` — add download button/group strings + games/studio strings.
- `src/app/globals.css` — append `.store-btn` 3D styles.
- `src/components/products/AppDownload.tsx` — rewrite into the unified 3D button + VR support.
- `src/components/products/DownloadCenter.tsx` — two-group layout.
- `src/components/games/GameHubView.tsx` — localize "Submit your game".
- `src/components/games/studio/StudioDashboard.tsx` — localize status labels + delete error.
- `src/components/games/studio/GameForm.tsx` — localize error map + "need zip".
- `src/app/games/studio/page.tsx` — localized + polished chrome + `SignInButton`.
- `src/app/games/studio/new/page.tsx` — localized + polished chrome + form card.
- `src/app/games/studio/[slug]/edit/page.tsx` — localized + polished chrome + form card.
- `src/app/games/[slug]/page.tsx` — non-empty title fallback (Task 7, pending investigation).

---

## Task 1: Data & content layer (types, VR device, getters, icon, strings)

**Files:**
- Modify: `src/content/types.ts`
- Modify: `src/content/ecosystem.ts`
- Modify: `src/content/products.ts`
- Modify: `src/lib/app-icons.ts`
- Modify: `src/content/ui.ts`
- Test: `src/content/products.test.ts`

**Interfaces:**
- Produces: `Platform = "android" | "ios" | "vr"`; `AppDownloads.vr?: PlatformDownload`; `IconKey` includes `"vr"`; `EcosystemCategory` includes `"vr"`.
- Produces: `vrDevices: EcosystemApp[]` (export from `ecosystem.ts`) — one app slug `"stem-vr"`, `downloads: { vr: { status: "soon" } }`.
- Produces: `getVrDevices(): EcosystemApp[]`; `getProduct(slug)` now resolves `stem-vr`.
- Produces (ui.ts, `ui.download`): `downloadFor`, `nAndroid`, `nIos`, `nVr`, `mobileGroup`, `vrGroup`, `mobileGroupLead`, `vrGroupLead` (all `Localized`).

- [ ] **Step 1: Write the failing tests** — append to `src/content/products.test.ts`:

```typescript
import { getVrDevices } from "./products";

describe("getVrDevices", () => {
  it("returns STEM VR as a VR-only download (coming soon)", () => {
    const vr = getVrDevices();
    expect(vr.map((a) => a.slug)).toEqual(["stem-vr"]);
    expect(vr[0].downloads?.vr?.status).toBe("soon");
    expect(vr[0].downloads?.android).toBeUndefined();
  });
  it("STEM VR is NOT a mobile download app and NOT in the products grid", () => {
    expect(getDownloadApps().some((a) => a.slug === "stem-vr")).toBe(false);
    expect(getProducts().some((a) => a.slug === "stem-vr")).toBe(false);
  });
  it("getProduct resolves stem-vr (so the download route can find it later)", () => {
    expect(getProduct("stem-vr")?.name).toBe("STEM VR");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/content/products.test.ts`
Expected: FAIL — `getVrDevices` is not exported / `getProduct("stem-vr")` undefined.

- [ ] **Step 3: Extend `src/content/types.ts`**

```typescript
export type IconKey = "mic" | "paintbrush" | "film" | "music" | "graduation" | "signature" | "bluetooth" | "vr";
```
```typescript
export type EcosystemCategory =
  | "ai-voice"
  | "creative-ai"
  | "video-ai"
  | "learning-ai"
  | "connectivity"
  | "vr";
```
```typescript
export type Platform = "android" | "ios" | "vr";
```
```typescript
export interface AppDownloads {
  android?: PlatformDownload;
  ios?: PlatformDownload;
  vr?: PlatformDownload;
}
```

- [ ] **Step 4: Add `vrDevices` to `src/content/ecosystem.ts`** — append AFTER the closing `];` of the `ecosystem` array (do NOT touch `ecosystem`):

```typescript
/** VR-headset products (Meta Quest / standalone). Kept SEPARATE from `ecosystem`
 *  so the /products grid + ecosystem tests (which require android+ios on every
 *  ecosystem app) stay unchanged. Surfaced only in the VR group on /download. */
export const vrDevices: EcosystemApp[] = [
  {
    id: "stem-vr",
    name: "STEM VR",
    slug: "stem-vr",
    year: 2025,
    category: "vr",
    categoryLabel: { en: "VR Learning", vi: "Học tập VR" },
    icon: "vr",
    excerpt: {
      en: "Immersive STEM lessons for Meta Quest and standalone VR headsets.",
      vi: "Bài học STEM nhập vai cho Meta Quest và các kính VR độc lập.",
    },
    description: {
      en: "STEM VR turns abstract science and technology lessons into hands-on, immersive experiences on Meta Quest and other standalone VR headsets.",
      vi: "STEM VR biến các bài học khoa học và công nghệ trừu tượng thành trải nghiệm nhập vai, thực hành trực tiếp trên Meta Quest và các kính VR độc lập khác.",
    },
    features: {
      en: [
        "Immersive, hands-on STEM simulations",
        "Runs on Meta Quest and standalone VR headsets",
        "Curriculum-aligned lesson modules",
      ],
      vi: [
        "Mô phỏng STEM nhập vai, thực hành trực tiếp",
        "Chạy trên Meta Quest và kính VR độc lập",
        "Học phần bám sát chương trình",
      ],
    },
    tags: { en: ["VR", "STEM", "Immersive"], vi: ["VR", "STEM", "Nhập vai"] },
    downloads: { vr: { status: "soon" } },
    image: { src: "/img/vr.jpg", alt: { en: "STEM VR", vi: "STEM VR" } },
  },
];
```

- [ ] **Step 5: Update `src/content/products.ts`** — change the import and `getProduct`, add `getVrDevices` (leave `getProducts`, `getDownloadApps`, `isDownloadApp`, `DOWNLOAD_APP_SLUGS` unchanged):

```typescript
import { ecosystem, vrDevices } from "./ecosystem";
import type { EcosystemApp } from "./types";

export function getProducts(): EcosystemApp[] {
  return ecosystem;
}

export function getProduct(slug: string): EcosystemApp | undefined {
  return [...ecosystem, ...vrDevices].find((p) => p.slug === slug);
}
```
Add after `getDownloadApps`:
```typescript
/** VR-headset products for the VR Device group on /download. */
export function getVrDevices(): EcosystemApp[] {
  return vrDevices;
}
```

- [ ] **Step 6: Add the VR icon in `src/lib/app-icons.ts`**

```typescript
import { Mic, Paintbrush, Film, Music, GraduationCap, Signature, Bluetooth, Glasses } from "lucide-react";
```
```typescript
export const APP_ICONS: Record<IconKey, LucideIcon> = {
  mic: Mic,
  paintbrush: Paintbrush,
  film: Film,
  music: Music,
  graduation: GraduationCap,
  signature: Signature,
  bluetooth: Bluetooth,
  vr: Glasses,
};
```

- [ ] **Step 7: Add download strings to `src/content/ui.ts`** — inside the `download: { ... }` object (e.g. right after the `forIos` line), add:

```typescript
    downloadFor: { en: "Download for", vi: "Tải cho" } as Localized,
    nAndroid: { en: "Android", vi: "Android" } as Localized,
    nIos: { en: "iOS", vi: "iOS" } as Localized,
    nVr: { en: "VR device", vi: "thiết bị VR" } as Localized,
    mobileGroup: { en: "Mobile Apps", vi: "Ứng dụng di động" } as Localized,
    vrGroup: { en: "VR Device", vi: "Thiết bị VR" } as Localized,
    mobileGroupLead: {
      en: "Install CTS Lab apps on your phone or tablet.",
      vi: "Cài ứng dụng CTS Lab lên điện thoại hoặc máy tính bảng.",
    } as Localized,
    vrGroupLead: {
      en: "Immersive learning on Meta Quest and standalone VR headsets.",
      vi: "Học tập nhập vai trên Meta Quest và kính VR độc lập.",
    } as Localized,
```

- [ ] **Step 8: Run tests + typecheck to verify green**

Run: `npx vitest run src/content/products.test.ts src/content/ecosystem.test.ts && npx tsc --noEmit`
Expected: PASS (all tests) and no type errors.

- [ ] **Step 9: Commit**

```bash
git add src/content/types.ts src/content/ecosystem.ts src/content/products.ts src/content/products.test.ts src/lib/app-icons.ts src/content/ui.ts
git commit -m "feat(download): add VR device data layer (STEM VR) + button strings"
```

---

## Task 2: 3D `.store-btn` styles in globals.css

**Files:**
- Modify: `src/app/globals.css` (append at end, currently 204 lines)

**Interfaces:**
- Produces CSS classes consumed by Task 3: `.store-btn`, `.store-btn--compact`, `.store-btn--single`, `.store-btn--soon`, and inner `.store-btn__glyph`, `.store-btn__label`, `.store-btn__top`, `.store-btn__main`.

- [ ] **Step 1: Append the 3D button styles** to the end of `src/app/globals.css`:

```css
/* ============================================================
   Unified 3D download button (store-btn)
   Theme-aware premium "keycap"; used for every download kind.
   ============================================================ */
.store-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  overflow: hidden;
  border-radius: 14px;
  padding: 0.55rem 1rem;
  color: var(--bg);
  background: linear-gradient(180deg, #20232b 0%, #0c0d11 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -1px 0 rgba(0, 0, 0, 0.45),
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 6px 16px -4px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.18s ease,
    filter 0.18s ease;
  will-change: transform;
}
[data-theme="dark"] .store-btn {
  color: var(--ink);
  background: linear-gradient(180deg, #ffffff 0%, #e9e9ef 100%);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18),
    0 2px 4px rgba(0, 0, 0, 0.5),
    0 6px 16px -4px rgba(0, 0, 0, 0.6);
}
.store-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.22) 48%, transparent 62%);
  transform: translateX(-120%);
  transition: transform 0.6s ease;
  pointer-events: none;
}
[data-theme="dark"] .store-btn::before {
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.6) 48%, transparent 62%);
}
.store-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(0, 0, 0, 0.45),
    0 6px 12px -4px rgba(0, 0, 0, 0.3),
    0 10px 28px -8px rgba(0, 0, 0, 0.45);
}
.store-btn:hover::before {
  transform: translateX(120%);
}
.store-btn:active {
  transform: translateY(0) scale(0.975);
  filter: brightness(0.98);
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.35),
    0 1px 2px rgba(0, 0, 0, 0.25);
}
.store-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--blue);
}
.store-btn__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.store-btn__label {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  text-align: left;
}
.store-btn__top {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}
.store-btn__main {
  font-size: 0.9rem;
  font-weight: 700;
}
/* single-line variant (VR: one platform, no dual row) */
.store-btn--single .store-btn__label {
  flex-direction: row;
  align-items: baseline;
  gap: 0.35rem;
}
/* compact variant (product grid + home band) */
.store-btn--compact {
  padding: 0.4rem 0.7rem;
  border-radius: 11px;
  gap: 0.4rem;
}
.store-btn--compact .store-btn__top {
  display: none;
}
.store-btn--compact .store-btn__main {
  font-size: 0.78rem;
}
/* coming-soon: flat, muted, not interactive */
.store-btn--soon {
  background: var(--surface);
  color: var(--dim);
  border: 1px dashed var(--border);
  box-shadow: none;
  cursor: default;
}
.store-btn--soon::before {
  display: none;
}
.store-btn--soon:hover {
  transform: none;
  filter: none;
  box-shadow: none;
}
[data-theme="dark"] .store-btn--soon {
  background: var(--surface);
  color: var(--dim);
  box-shadow: none;
}
@media (prefers-reduced-motion: reduce) {
  .store-btn,
  .store-btn::before {
    transition: none;
  }
  .store-btn:hover {
    transform: none;
  }
  .store-btn:hover::before {
    transform: translateX(-120%);
  }
  .store-btn:active {
    transform: none;
  }
}
```

- [ ] **Step 2: Verify the stylesheet compiles**

Run: `npx next build 2>&1 | head -30` (or if a dev server is already running, confirm no CSS parse error in its output)
Expected: build proceeds past CSS processing with no `globals.css` error. (A full build is fine; you only need to confirm CSS parses.)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(download): 3D store-btn styles (theme-aware, sheen, reduced-motion)"
```

---

## Task 3: Rewrite `AppDownload` into the unified 3D button

**Files:**
- Modify (full rewrite): `src/components/products/AppDownload.tsx`

**Interfaces:**
- Consumes: `.store-btn*` classes (Task 2); `ui.download.{downloadFor,nAndroid,nIos,nVr,soon,updated}` + existing `downloadApiHref`, `describeDownload` (Task 1 + unchanged lib).
- Consumes: `APP_ICONS` includes `vr` (Task 1).
- Produces: default export `AppDownload({ app, variant })` with `variant: "full" | "row" | "compact"`, rendering `["vr"]` controls when `app.downloads?.vr` exists, else `["android","ios"]`. No behavioural change to the `/api/download` href.

- [ ] **Step 1: Replace the entire contents of `src/components/products/AppDownload.tsx`** with:

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `Localized` is unused anywhere it's fine; it's imported for `PLATFORM`.)

- [ ] **Step 3: Verify no stale badge/theme references remain**

Run: `grep -n "badgeSrc\|useTheme\|no-img-element" src/components/products/AppDownload.tsx`
Expected: no output (badge `<img>` path and `useTheme` are gone).

- [ ] **Step 4: Visual check** — start the dev server (`npm run dev`), open `/download`, `/products`, a product detail page, and the home page. Confirm: uniform 3D buttons everywhere; hover lifts + sheen sweep; press sinks; APK apps show a version caption; "soon" platforms show the flat dashed pill. Toggle the theme — button inverts (dark-on-light ↔ light-on-dark). No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/products/AppDownload.tsx
git commit -m "feat(download): unify all download controls into the 3D store button"
```

---

## Task 4: `/download` two-group layout (Mobile Apps + VR Device)

**Files:**
- Modify (rewrite): `src/components/products/DownloadCenter.tsx`

**Interfaces:**
- Consumes: `getDownloadApps()`, `getVrDevices()` (Task 1); `AppDownload variant="row"` (Task 3); `ui.download.{mobileGroup,vrGroup,mobileGroupLead,vrGroupLead,centerTitle,centerIntro}`.

- [ ] **Step 1: Replace the entire contents of `src/components/products/DownloadCenter.tsx`** with:

```tsx
"use client";

import { useLocale } from "@/lib/locale";
import { getDownloadApps, getVrDevices } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AppDownload from "@/components/products/AppDownload";
import type { EcosystemApp } from "@/content/types";

function Group({ heading, lead, apps }: { heading: string; lead: string; apps: EcosystemApp[] }) {
  if (apps.length === 0) return null;
  return (
    <div className="mt-12 first:mt-10">
      <Reveal>
        <div className="flex items-center gap-3">
          <h2 className="text-display text-lg text-ink">{heading}</h2>
          <span className="h-px flex-1 bg-border" aria-hidden />
        </div>
        <p className="mt-1 text-sm text-ink-2">{lead}</p>
      </Reveal>
      <Stagger className="mt-5 flex flex-col gap-3">
        {apps.map((app) => (
          <StaggerItem key={app.id}>
            <AppDownload app={app} variant="row" />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}

export default function DownloadCenter() {
  const { t } = useLocale();
  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.products.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.download.centerTitle)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.download.centerIntro)}</p>
        </Reveal>
        <Group heading={t(ui.download.mobileGroup)} lead={t(ui.download.mobileGroupLead)} apps={getDownloadApps()} />
        <Group heading={t(ui.download.vrGroup)} lead={t(ui.download.vrGroupLead)} apps={getVrDevices()} />
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check** — reload `/download`. Confirm two labelled sections: "Mobile Apps" (5 app rows: Unilearn, VietCreative, KidMentor, PTalk Signature, P-Connect) and "VR Device" (STEM VR, single "VR device · Coming soon" button). Toggle EN/VI — headings, leads, and buttons all switch language.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/DownloadCenter.tsx
git commit -m "feat(download): split /download into Mobile Apps + VR Device groups"
```

---

## Task 5: Localize interactive Games components

**Files:**
- Modify: `src/content/ui.ts` (add strings)
- Modify: `src/components/games/GameHubView.tsx`
- Modify: `src/components/games/studio/StudioDashboard.tsx`
- Modify: `src/components/games/studio/GameForm.tsx`

**Interfaces:**
- Produces (ui.ts): `ui.games.submitYourGame`; `ui.studio.{statusDraft,statusPending,statusPublished,statusRejected,deleteFailed,errQuota,errTooLarge,errTooBig,errNoIndex,errInvalidZip,errUnsafePath,errBad,errForbidden,errGeneric,errNeedZip}` — all `Localized`.

- [ ] **Step 1: Add strings to `src/content/ui.ts`** — inside `games: { ... }` add:

```typescript
    submitYourGame: { en: "+ Submit your game", vi: "+ Đăng game của bạn" } as Localized,
```
Inside `studio: { ... }` add:
```typescript
    statusDraft: { en: "Draft", vi: "Nháp" } as Localized,
    statusPending: { en: "Pending", vi: "Chờ duyệt" } as Localized,
    statusPublished: { en: "Published", vi: "Đã đăng" } as Localized,
    statusRejected: { en: "Rejected", vi: "Bị từ chối" } as Localized,
    deleteFailed: { en: "Delete failed.", vi: "Xoá không thành công." } as Localized,
    errQuota: { en: "You've reached your game limit.", vi: "Bạn đã đạt giới hạn số game." } as Localized,
    errTooLarge: { en: "File too large.", vi: "File quá lớn." } as Localized,
    errTooBig: { en: "Uncompressed game too large.", vi: "Game giải nén quá lớn." } as Localized,
    errNoIndex: { en: "Zip is missing index.html.", vi: "Zip thiếu index.html." } as Localized,
    errInvalidZip: { en: "Invalid zip file.", vi: "File zip không hợp lệ." } as Localized,
    errUnsafePath: { en: "Zip contains an unsafe path.", vi: "Zip chứa đường dẫn không an toàn." } as Localized,
    errBad: { en: "Missing required information.", vi: "Thiếu thông tin bắt buộc." } as Localized,
    errForbidden: { en: "You don't have permission.", vi: "Bạn không có quyền." } as Localized,
    errGeneric: { en: "Error", vi: "Lỗi" } as Localized,
    errNeedZip: { en: "Please upload a game file (.zip).", vi: "Cần tải lên file game (.zip)." } as Localized,
```

- [ ] **Step 2: Localize `GameHubView.tsx`** — replace the hardcoded link text (currently `+ Đăng game của bạn`):

```tsx
          <Link href="/games/studio" className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-blue hover:text-blue">
            {t(ui.games.submitYourGame)}
          </Link>
```

- [ ] **Step 3: Localize `StudioDashboard.tsx`** — remove the `STATUS_VI` const and localize status + delete error. Replace the `STATUS_VI` declaration with a localized helper inside the component and update the two usages:

Delete this line:
```tsx
const STATUS_VI: Record<string, string> = { draft: "Nháp", pending: "Chờ duyệt", published: "Đã đăng", rejected: "Bị từ chối" };
```
Inside `StudioDashboard`, after `const { t } = useLocale();`, add:
```tsx
  const statusLabel = (s: string) => {
    const map: Record<string, typeof ui.studio.statusDraft> = {
      draft: ui.studio.statusDraft,
      pending: ui.studio.statusPending,
      published: ui.studio.statusPublished,
      rejected: ui.studio.statusRejected,
    };
    return map[s] ? t(map[s]) : s;
  };
```
Change the delete error line:
```tsx
    else setErr(`❌ ${t(ui.studio.deleteFailed)}`);
```
Change the badge render:
```tsx
                <Badge tone={STATUS_TONE[g.status] ?? "neutral"}>{statusLabel(g.status)}</Badge>
```

- [ ] **Step 4: Localize `GameForm.tsx`** — import the `Localized` type, move the error map inside the component so it can use `t()`, and localize the "need zip" message.

Add to the imports:
```tsx
import type { Localized } from "@/content/types";
```
Delete the module-level `errorMsg` function (the `function errorMsg(code) { ... }` block). Inside the `GameForm` component, after `const { t } = useLocale();`, add:
```tsx
  const errorMsg = (code: string | undefined): string => {
    const m: Record<string, Localized> = {
      quota: ui.studio.errQuota,
      "too-large": ui.studio.errTooLarge,
      "too-big-uncompressed": ui.studio.errTooBig,
      "no-index": ui.studio.errNoIndex,
      "invalid-zip": ui.studio.errInvalidZip,
      "unsafe-path": ui.studio.errUnsafePath,
      bad: ui.studio.errBad,
      forbidden: ui.studio.errForbidden,
    };
    const key = code ?? "";
    return `❌ ${m[key] ? t(m[key]) : `${t(ui.studio.errGeneric)}: ${code ?? ""}`}`;
  };
```
Change the "need zip" line (currently `setMsg("❌ Cần tải lên file game (.zip).")`):
```tsx
    if (mode === "create" && !file) { setMsg(`❌ ${t(ui.studio.errNeedZip)}`); return; }
```
(The existing `errorMsg("bad")` and `errorMsg(d.error)` call sites now resolve to the in-component closure — no change needed there.)

- [ ] **Step 5: Verify no Vietnamese remains hardcoded in these files**

Run: `grep -nP "[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]" src/components/games/GameHubView.tsx src/components/games/studio/StudioDashboard.tsx src/components/games/studio/GameForm.tsx | grep -v "vi:"`
Expected: no output.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Visual check** — on `/games` and `/games/studio` (signed in), toggle EN/VI: "Submit your game", status badges, and form validation errors all switch language.

- [ ] **Step 8: Commit**

```bash
git add src/content/ui.ts src/components/games/GameHubView.tsx src/components/games/studio/StudioDashboard.tsx src/components/games/studio/GameForm.tsx
git commit -m "fix(games): localize hub + studio strings so EN toggle works"
```

---

## Task 6: Studio pages — localized headings + design consistency

**Files:**
- Create: `src/components/games/studio/StudioHead.tsx`
- Create: `src/components/games/studio/SignInButton.tsx`
- Modify: `src/content/ui.ts`
- Modify: `src/app/games/studio/page.tsx`
- Modify: `src/app/games/studio/new/page.tsx`
- Modify: `src/app/games/studio/[slug]/edit/page.tsx`

**Interfaces:**
- Consumes: `AmbientField` (`@/components/fx/AmbientField`, tone `"warm"`), `Breadcrumb`, `Reveal`, `Container`.
- Produces: `StudioHead({ page: "dashboard" | "new" | "edit", titleSuffix?: string })` (client) — renders breadcrumb + eyebrow + localized `<h1>`. `SignInButton()` (client) — localized submit button.
- Produces (ui.ts): `ui.studio.{pageTitle,newTitle,editTitle,bcNew,bcEdit,signIn,dashboardLead,newLead}`.

- [ ] **Step 1: Add studio-page strings to `src/content/ui.ts`** — inside `studio: { ... }`:

```typescript
    pageTitle: { en: "Game Studio", vi: "Game Studio" } as Localized,
    newTitle: { en: "Create a new game", vi: "Tạo game mới" } as Localized,
    editTitle: { en: "Edit", vi: "Sửa" } as Localized,
    bcNew: { en: "New", vi: "Tạo mới" } as Localized,
    bcEdit: { en: "Edit", vi: "Sửa" } as Localized,
    signIn: { en: "Sign in", vi: "Đăng nhập" } as Localized,
    dashboardLead: {
      en: "Publish and manage the games you've built.",
      vi: "Đăng và quản lý các game bạn đã tạo.",
    } as Localized,
    newLead: {
      en: "Upload a web build and fill in the details to publish.",
      vi: "Tải lên bản build web và điền thông tin để đăng.",
    } as Localized,
```

- [ ] **Step 2: Create `src/components/games/studio/StudioHead.tsx`**

```tsx
"use client";

import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Reveal from "@/components/ui/Reveal";

type Page = "dashboard" | "new" | "edit";

export default function StudioHead({ page, titleSuffix }: { page: Page; titleSuffix?: string }) {
  const { t } = useLocale();
  const base = [
    { label: "CTS Lab", href: "/" },
    { label: t(ui.games.breadcrumb), href: "/games" },
  ];
  const crumbs =
    page === "dashboard"
      ? [...base, { label: t(ui.studio.pageTitle) }]
      : [
          ...base,
          { label: t(ui.studio.pageTitle), href: "/games/studio" },
          { label: page === "new" ? t(ui.studio.bcNew) : t(ui.studio.bcEdit) },
        ];
  const titleKey =
    page === "dashboard" ? ui.studio.pageTitle : page === "new" ? ui.studio.newTitle : ui.studio.editTitle;
  const leadKey = page === "dashboard" ? ui.studio.dashboardLead : page === "new" ? ui.studio.newLead : undefined;

  return (
    <Reveal>
      <Breadcrumb items={crumbs} />
      <span className="eyebrow eyebrow-draw mt-4 block">{t(ui.studio.pageTitle)}</span>
      <h1 className="text-section mt-2 text-ink">
        {t(titleKey)}
        {titleSuffix ? `: ${titleSuffix}` : ""}
      </h1>
      {leadKey && <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{t(leadKey)}</p>}
    </Reveal>
  );
}
```

- [ ] **Step 3: Create `src/components/games/studio/SignInButton.tsx`**

```tsx
"use client";

import { LogIn } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

export default function SignInButton() {
  const { t } = useLocale();
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
    >
      <LogIn size={16} aria-hidden /> {t(ui.studio.signIn)}
    </button>
  );
}
```

- [ ] **Step 4: Rewrite `src/app/games/studio/page.tsx`** — keep all server/auth logic; swap chrome for `StudioHead` + `AmbientField`, and the sign-in button for `SignInButton`:

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import AmbientField from "@/components/fx/AmbientField";
import { auth } from "@/auth";
import { signIn } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import StudioDashboard from "@/components/games/studio/StudioDashboard";
import StudioHead from "@/components/games/studio/StudioHead";
import SignInButton from "@/components/games/studio/SignInButton";

export const metadata: Metadata = { title: "Studio — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  if (!ownerId) {
    return (
      <>
        <Navbar />
        <main>
          <section className="section relative overflow-hidden pt-28">
            <AmbientField tone="warm" />
            <Container>
              <StudioHead page="dashboard" />
              <form action={async () => { "use server"; await signIn("authentik"); }} className="mt-8">
                <SignInButton />
              </form>
            </Container>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  const games = getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }));
  return (
    <>
      <Navbar />
      <main>
        <section className="section relative overflow-hidden pt-28">
          <AmbientField tone="warm" />
          <Container>
            <StudioHead page="dashboard" />
            <StudioDashboard games={games} />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Rewrite `src/app/games/studio/new/page.tsx`**

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import AmbientField from "@/components/fx/AmbientField";
import { auth } from "@/auth";
import GameForm from "@/components/games/studio/GameForm";
import StudioHead from "@/components/games/studio/StudioHead";

export const metadata: Metadata = { title: "Tạo game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!(session?.user)) redirect("/games/studio");
  return (
    <>
      <Navbar />
      <main>
        <section className="section relative overflow-hidden pt-28">
          <AmbientField tone="warm" />
          <Container>
            <StudioHead page="new" />
            <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
              <GameForm mode="create" />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 6: Rewrite `src/app/games/studio/[slug]/edit/page.tsx`** — keep all auth/data logic, swap chrome. Only the `return (...)` and imports change; the `resolve`/`initial` logic is unchanged:

Replace the imports block's `Breadcrumb` import with `StudioHead` + `AmbientField`:
```tsx
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import AmbientField from "@/components/fx/AmbientField";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import GameForm, { type GameFormData } from "@/components/games/studio/GameForm";
import StudioHead from "@/components/games/studio/StudioHead";
```
Replace the `return (...)` block with:
```tsx
  return (
    <>
      <Navbar />
      <main>
        <section className="section relative overflow-hidden pt-28">
          <AmbientField tone="warm" />
          <Container>
            <StudioHead page="edit" titleSuffix={g.title} />
            <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
              <GameForm mode="edit" slug={slug} status={g.status} initial={initial} />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Verify no hardcoded Vietnamese remains in the studio pages**

Run: `grep -nP "[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]" src/app/games/studio/page.tsx src/app/games/studio/new/page.tsx "src/app/games/studio/[slug]/edit/page.tsx" | grep -vE "vi:|title:"`
Expected: no output. (Metadata `title:` lines keep Vietnamese, consistent with the rest of the site — see Task 7 note.)

- [ ] **Step 9: Visual check** — signed in, open `/games/studio`, `/games/studio/new`, and an edit page. Confirm each has the eyebrow + AmbientField + Reveal heading matching the hub/detail look; the form sits in a card; EN/VI toggle switches headings, leads, breadcrumbs, sign-in button.

- [ ] **Step 10: Commit**

```bash
git add src/content/ui.ts src/components/games/studio/StudioHead.tsx src/components/games/studio/SignInButton.tsx src/app/games/studio/page.tsx src/app/games/studio/new/page.tsx "src/app/games/studio/[slug]/edit/page.tsx"
git commit -m "feat(games): consistent, localized studio page chrome"
```

---

## Task 7: Fix the `--` browser-tab title on a Games subpage

The exact page was not identified during planning. Find it empirically, then apply the documented fix. The suspected cause is an empty/whitespace game title flowing into `generateMetadata` (tab renders as a dash-like placeholder), or a route whose title resolves to an empty string.

**Files:**
- Modify: `src/app/games/[slug]/page.tsx` (likely)
- Possibly: whichever route the investigation implicates.

- [ ] **Step 1: Enumerate rendered `<title>` for every Games route.** With the dev server running (`npm run dev`), run:

```bash
for u in / /games /games/studio /games/studio/new; do \
  printf '%s => ' "$u"; curl -s "http://localhost:3000$u" | grep -oiE '<title>[^<]*</title>' | head -1; echo; done
```
Also visit each published game at `/games/<slug>` in the browser and read the tab title (dynamic + possibly auth-gated routes are easier to check visually). Note which URL shows `--` (or an empty/placeholder title).

- [ ] **Step 2: Confirm the source.** If it is a game detail page, check that game's stored/seed `title`. Inspect `generateMetadata` in `src/app/games/[slug]/page.tsx:29` — it returns `{ title: r ? r.game.title : "Không tìm thấy" }`; an empty `r.game.title` yields the blank/`--` tab.

- [ ] **Step 3: Apply the fix.** For the game detail route, guarantee a non-empty title:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  const title = r ? (r.game.title?.trim() || "Game") : "Không tìm thấy";
  return { title };
}
```
If the investigation implicates a different route instead, set an explicit non-empty `title` on that route's `metadata`/`generateMetadata` following the same pattern (never return `""`/`undefined`/a lone dash).

- [ ] **Step 4: Verify** — re-run the Step 1 loop and re-check the implicated page in the browser. Expected: every Games route shows a real title; no `--` tab anywhere.

- [ ] **Step 5: Commit**

```bash
git add src/app/games/[slug]/page.tsx
git commit -m "fix(games): ensure every game route has a non-empty tab title"
```

---

## Task 8: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Unit tests**

Run: `npx vitest run`
Expected: all green (including `products.test.ts`, `ecosystem.test.ts`).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 4: Manual matrix** — with the app running, verify:
  - `/download`: two groups; 5 mobile rows; STEM VR "Coming soon" in VR group.
  - Buttons on `/download`, `/products`, a product detail, and the home band are all the unified 3D style; hover (lift + sheen), press (sink), focus ring visible via keyboard Tab.
  - Theme toggle: buttons invert cleanly in light + dark; "soon" pill stays flat/muted.
  - `prefers-reduced-motion` (DevTools → Rendering → emulate): no transform/sheen animation, colour hover still works.
  - EN/VI toggle across `/games`, `/games/studio`, `/games/studio/new`, an edit page: no Vietnamese leaking in EN mode.
  - Every Games tab title is a real title (no `--`).
  - Download links still hit `/api/download/<slug>?platform=…` (check an APK app's Android button network request).

- [ ] **Step 5: Final commit (if any residual fixes were needed)**

```bash
git add -A
git commit -m "chore: verification fixes for download + games redesign"
```

---

## Self-Review

**Spec coverage:**
- Unified 3D button (all kinds) → Tasks 2 + 3. ✓
- Remove official store badges → Task 3 Step 3 grep confirms `badgeSrc` gone. ✓
- Coming-soon + compact variants → Task 2 CSS + Task 3 component. ✓
- APK meta as caption → Task 3 `ApkCaption`. ✓
- `/download` two groups → Task 4. ✓
- STEM VR data isolated from `ecosystem`/`/products` → Task 1 (`vrDevices`) + tests. ✓
- `getProduct` resolves both arrays; `getDownloadApps`/`getProducts` unchanged → Task 1. ✓
- Games EN toggle leak → Tasks 5 + 6. ✓
- Studio design consistency → Task 6. ✓
- `--` tab title → Task 7. ✓
- Don't break `/api/download` logic → Global Constraints; no task touches it. ✓
- Verification (tsc, vitest, build, manual) → Task 8. ✓

**Placeholder scan:** Task 7 is an investigation task by necessity but ships a concrete detection command + concrete fix code, not a "TODO". No other placeholders.

**Type consistency:** `platformsFor`, `StoreButton`, `ApkCaption`, `PLATFORM` map (Task 3) use `Platform`/`PlatformDownload`/`Localized` from Task 1. `getVrDevices` name identical in Tasks 1 & 4. `StudioHead({ page, titleSuffix })` signature identical across Task 6 creation + all three page call sites. `ui.download.*` / `ui.studio.*` keys referenced in Tasks 3–6 all match the keys added in Tasks 1, 5, 6.
