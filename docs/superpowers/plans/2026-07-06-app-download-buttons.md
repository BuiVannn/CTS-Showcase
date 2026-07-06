# App Download Buttons (Android/iOS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép người dùng tải app CTS Lab (Android APK trực tiếp + iOS mock "Sắp có") từ web, hiển thị nhất quán ở 4 vị trí qua một component chung, với route trung gian đếm lượt tải.

**Architecture:** Data model per-platform (`downloads.android/ios` với `status`/`kind`/`target`) thay cho `downloadHref` đơn. Logic thuần tách ra `src/lib/app-download.ts` (test được), lưu lượt tải qua `src/lib/downloads-db.ts` (better-sqlite3, mẫu như `games-db.ts`). Route `/api/download/[slug]?platform=` giải đích + đếm + 302. Một component `AppDownload` (3 variant) render ở chi tiết app, `/download`, grid, home. Official store badge chỉ khi app đã live; APK và "sắp có" dùng treatment tự thiết kế.

**Tech Stack:** Next.js 16 (App Router, route handlers), React 19, TypeScript, Tailwind 4, better-sqlite3, vitest, lucide-react.

## Global Constraints

- **Next.js là bản có breaking changes** — đọc `node_modules/next/dist/docs/` khi cần API mới; route handler nhận `{ params }: { params: Promise<{ slug: string }> }` (params là Promise).
- **Route động cần rebuild:** sau khi thêm `/api/download`, deploy phải `npm run build && pm2 restart cts-redesign` (app chạy `next start`, không tự nhận source edit). File trong `public/` là tĩnh, không cần rebuild.
- **Official badge ⇔ `status="available"` + `kind∈{play,appstore}`.** APK + mọi `soon` = treatment tự thiết kế. Không tự vẽ lại badge Google/Apple; không dùng robot Android (trademark).
- **Link tải dùng `<a>` thường (KHÔNG `next/link`)** + `rel="nofollow"` — tránh prefetch nội bộ tự kích redirect và thổi phồng số đếm.
- **Mọi chuỗi hiển thị là `Localized` (`{en,vi}`)**; tên brand ("Android", "iOS", "PTalk"...) để plain.
- **DB test dùng `:memory:`**; đường dẫn thật qua env với default `./data/<name>.db` (mẫu `games-db.ts`).
- Test lib: `npm test` (vitest). Gate task UI: `npx tsc --noEmit` + `npm run lint`.

---

### Task 1: Data model — types + dữ liệu + gỡ consumer cũ

**Files:**
- Modify: `src/content/types.ts` (thêm types, sửa `EcosystemApp`)
- Modify: `src/content/ecosystem.ts` (thay `downloadHref` → `downloads` cho cả 7 app)
- Modify: `src/components/products/ProductDetail.tsx:97-108` (gỡ khối nút `downloadHref` cũ, tạm chỉ giữ nút back — sẽ thay bằng AppDownload ở Task 6)
- Test: `src/content/ecosystem.test.ts` (thêm cases; file đã tồn tại? nếu chưa, tạo mới — repo có `products.test.ts` cùng thư mục)

**Interfaces:**
- Produces: `Platform`, `DownloadKind`, `DownloadStatus`, `PlatformDownload`, `AppDownloads`; `EcosystemApp.downloads?: AppDownloads` (đã bỏ `downloadHref`).

- [ ] **Step 1: Thêm types vào `src/content/types.ts`** (đặt ngay trước `export interface EcosystemApp`)

```ts
export type Platform = "android" | "ios";
export type DownloadKind = "apk" | "play" | "appstore" | "testflight";
export type DownloadStatus = "available" | "soon";

export interface PlatformDownload {
  status: DownloadStatus;
  kind?: DownloadKind;   // bắt buộc khi status="available" — quyết định badge/label
  target?: string;       // đích thật (file URL / store URL); chỉ API route đọc
  version?: string;      // apk: "1.2.0"
  updatedAt?: string;    // apk: ISO date "2026-06-10"
  size?: string;         // apk (tùy chọn): "48 MB"
}

export interface AppDownloads {
  android?: PlatformDownload;
  ios?: PlatformDownload;
}
```

Trong `EcosystemApp`: **xóa** dòng `downloadHref: string;` và **thêm** `downloads?: AppDownloads;`.

- [ ] **Step 2: Cập nhật `src/content/ecosystem.ts`** — với **mỗi** app, xóa dòng `downloadHref: "#",` và thêm khối `downloads`.

KidMentor (`id: "kidmentor"`) và PTalk Signature (`id: "ptalk-signature"`) — thêm:

```ts
    downloads: {
      // TODO(user): đổi `target` sang host thật khi chốt (games origin :8090 / public/ / thư mục ngoài repo).
      android: { status: "available", kind: "apk", target: "/downloads/kidmentor.apk", version: "1.0.0", updatedAt: "2026-07-06" },
      ios: { status: "soon" },
    },
```

(PTalk Signature dùng `target: "/downloads/ptalk-signature.apk"` và `version`/`updatedAt` tương ứng — giá trị nội dung, user chỉnh sau.)

5 app còn lại (`ptalk`, `viet-creative`, `vision-tale`, `unilearn`, `p-connect`) — thêm:

```ts
    downloads: { android: { status: "soon" }, ios: { status: "soon" } },
```

- [ ] **Step 3: Gỡ khối download cũ trong `ProductDetail.tsx`** — thay dòng 97-108 (khối `<Reveal delay={0.14}>...</Reveal>`) bằng:

```tsx
            <Reveal delay={0.14}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/products" variant="blue">
                  {t(ui.products.backCta)} <ArrowRight size={16} />
                </Button>
              </div>
            </Reveal>
```

Xóa import `Download` khỏi dòng 3 nếu không còn dùng (giữ `Check, ArrowRight`).

- [ ] **Step 4: Viết test dữ liệu** — `src/content/ecosystem.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ecosystem } from "./ecosystem";

describe("ecosystem downloads", () => {
  it("mọi app đều khai báo downloads cho cả android & ios", () => {
    for (const app of ecosystem) {
      expect(app.downloads?.android, app.name).toBeDefined();
      expect(app.downloads?.ios, app.name).toBeDefined();
    }
  });
  it("platform available phải có kind và target", () => {
    for (const app of ecosystem) {
      for (const pd of [app.downloads?.android, app.downloads?.ios]) {
        if (pd?.status === "available") {
          expect(pd.kind, app.name).toBeTruthy();
          expect(pd.target, app.name).toBeTruthy();
        }
      }
    }
  });
  it("đúng 2 app có android apk sẵn (KidMentor, PTalk Signature)", () => {
    const ready = ecosystem.filter((a) => a.downloads?.android?.status === "available").map((a) => a.id).sort();
    expect(ready).toEqual(["kidmentor", "ptalk-signature"]);
  });
});
```

- [ ] **Step 5: Chạy test + typecheck**

Run: `npm test -- ecosystem && npx tsc --noEmit`
Expected: test PASS; tsc không lỗi (không còn tham chiếu `downloadHref`).

- [ ] **Step 6: Commit**

```bash
git add src/content/types.ts src/content/ecosystem.ts src/content/ecosystem.test.ts src/components/products/ProductDetail.tsx
git commit -m "feat(download): per-platform download data model + seed 2 APKs"
```

---

### Task 2: Helper thuần `app-download.ts`

**Files:**
- Create: `src/lib/app-download.ts`
- Test: `src/lib/app-download.test.ts`

**Interfaces:**
- Consumes: `EcosystemApp`, `PlatformDownload`, `Platform` từ `@/content/types`.
- Produces:
  - `downloadApiHref(slug: string, platform: Platform): string`
  - `resolveDownload(app: EcosystemApp | undefined, platform: Platform): ResolveResult`
  - `describeDownload(pd: PlatformDownload | undefined): DownloadView`
  - `badgeSrc(store: "play" | "appstore", locale: "en" | "vi", theme: "light" | "dark"): string`
  - types `ResolveResult`, `DownloadView`

- [ ] **Step 1: Viết test** — `src/lib/app-download.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { downloadApiHref, resolveDownload, describeDownload, badgeSrc } from "./app-download";
import type { EcosystemApp } from "@/content/types";

const app = (downloads: EcosystemApp["downloads"]) => ({ slug: "x", downloads } as EcosystemApp);

describe("downloadApiHref", () => {
  it("build đúng route trung gian", () => {
    expect(downloadApiHref("kidmentor", "android")).toBe("/api/download/kidmentor?platform=android");
  });
});

describe("resolveDownload", () => {
  it("available + target → ok", () => {
    const r = resolveDownload(app({ android: { status: "available", kind: "apk", target: "/d/k.apk" } }), "android");
    expect(r).toEqual({ ok: true, target: "/d/k.apk" });
  });
  it("thiếu app → no-platform", () => {
    expect(resolveDownload(undefined, "android")).toEqual({ ok: false, reason: "no-platform" });
  });
  it("thiếu platform → no-platform", () => {
    expect(resolveDownload(app({ ios: { status: "soon" } }), "android")).toEqual({ ok: false, reason: "no-platform" });
  });
  it("soon → not-available", () => {
    expect(resolveDownload(app({ android: { status: "soon" } }), "android")).toEqual({ ok: false, reason: "not-available" });
  });
  it("available nhưng thiếu target → no-target", () => {
    expect(resolveDownload(app({ android: { status: "available", kind: "apk" } }), "android")).toEqual({ ok: false, reason: "no-target" });
  });
});

describe("describeDownload", () => {
  it("undefined / soon → soon", () => {
    expect(describeDownload(undefined)).toEqual({ mode: "soon" });
    expect(describeDownload({ status: "soon" })).toEqual({ mode: "soon" });
  });
  it("play/appstore → official", () => {
    expect(describeDownload({ status: "available", kind: "play" })).toEqual({ mode: "official", store: "play" });
    expect(describeDownload({ status: "available", kind: "appstore" })).toEqual({ mode: "official", store: "appstore" });
  });
  it("testflight → testflight", () => {
    expect(describeDownload({ status: "available", kind: "testflight" })).toEqual({ mode: "testflight" });
  });
  it("apk → mode apk kèm meta", () => {
    expect(describeDownload({ status: "available", kind: "apk", version: "1.0.0", updatedAt: "2026-07-06" }))
      .toEqual({ mode: "apk", version: "1.0.0", updatedAt: "2026-07-06", size: undefined });
  });
});

describe("badgeSrc", () => {
  it("map store+locale+theme → path asset", () => {
    expect(badgeSrc("play", "vi", "light")).toBe("/img/badges/google-play-black-vi.svg");
    expect(badgeSrc("appstore", "en", "dark")).toBe("/img/badges/app-store-white-en.svg");
  });
});
```

- [ ] **Step 2: Chạy test để chắc chắn FAIL**

Run: `npm test -- app-download`
Expected: FAIL ("Cannot find module './app-download'").

- [ ] **Step 3: Viết `src/lib/app-download.ts`**

```ts
import type { EcosystemApp, PlatformDownload, Platform } from "@/content/types";

/** Public href luôn qua route trung gian → đổi hạ tầng/kind không đổi URL, đếm được click. */
export function downloadApiHref(slug: string, platform: Platform): string {
  return `/api/download/${slug}?platform=${platform}`;
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
```

- [ ] **Step 4: Chạy test để PASS**

Run: `npm test -- app-download`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/app-download.ts src/lib/app-download.test.ts
git commit -m "feat(download): pure helpers (resolve/describe/badge/href) + tests"
```

---

### Task 3: Lưu lượt tải `downloads-db.ts`

**Files:**
- Create: `src/lib/downloads-db.ts`
- Test: `src/lib/downloads-db.test.ts`

**Interfaces:**
- Produces: `DownloadsStore { increment(slug, platform): void; getCount(slug, platform): number; total(): number }`, `createDownloadsStore(dbPath: string): DownloadsStore`, `getDownloadsStore(): DownloadsStore`.

- [ ] **Step 1: Viết test** — `src/lib/downloads-db.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { createDownloadsStore } from "./downloads-db";

describe("downloads-db", () => {
  it("increment cộng dồn theo (slug, platform)", () => {
    const s = createDownloadsStore(":memory:");
    s.increment("kidmentor", "android");
    s.increment("kidmentor", "android");
    s.increment("kidmentor", "ios");
    expect(s.getCount("kidmentor", "android")).toBe(2);
    expect(s.getCount("kidmentor", "ios")).toBe(1);
  });
  it("getCount cặp chưa có → 0", () => {
    const s = createDownloadsStore(":memory:");
    expect(s.getCount("nope", "android")).toBe(0);
  });
  it("total cộng tất cả", () => {
    const s = createDownloadsStore(":memory:");
    s.increment("a", "android"); s.increment("b", "ios"); s.increment("b", "ios");
    expect(s.total()).toBe(3);
  });
});
```

- [ ] **Step 2: Chạy test để FAIL**

Run: `npm test -- downloads-db`
Expected: FAIL ("Cannot find module './downloads-db'").

- [ ] **Step 3: Viết `src/lib/downloads-db.ts`** (mẫu `games-db.ts`)

```ts
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface DownloadsStore {
  increment(slug: string, platform: string): void;
  getCount(slug: string, platform: string): number;
  total(): number;
}

export function createDownloadsStore(dbPath: string): DownloadsStore {
  const db = new Database(dbPath);
  if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");
  db.exec(
    `CREATE TABLE IF NOT EXISTS downloads (
       slug TEXT NOT NULL, platform TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
       PRIMARY KEY (slug, platform)
     )`,
  );
  return {
    increment: (slug, platform) =>
      void db.prepare(
        `INSERT INTO downloads (slug, platform, count) VALUES (?, ?, 1)
         ON CONFLICT(slug, platform) DO UPDATE SET count = count + 1`,
      ).run(slug, platform),
    getCount: (slug, platform) =>
      (db.prepare("SELECT count FROM downloads WHERE slug = ? AND platform = ?").get(slug, platform) as { count: number } | undefined)?.count ?? 0,
    total: () =>
      (db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM downloads").get() as { n: number }).n,
  };
}

let _store: DownloadsStore | null = null;
export function getDownloadsStore(): DownloadsStore {
  if (!_store) {
    const path = process.env.DOWNLOADS_DB || "./data/downloads.db";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    _store = createDownloadsStore(path);
  }
  return _store;
}
```

- [ ] **Step 4: Chạy test để PASS**

Run: `npm test -- downloads-db`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/downloads-db.ts src/lib/downloads-db.test.ts
git commit -m "feat(download): SQLite click-count store + tests"
```

---

### Task 4: Nhãn i18n cho download (`ui.ts`)

**Files:**
- Modify: `src/content/ui.ts` (thêm namespace `download`)

**Interfaces:**
- Produces: `ui.download.{apk, testflight, soon, updated, forAndroid, forIos, centerTitle, centerIntro, viewAll, bandTitle, bandLead}`.

- [ ] **Step 1: Thêm section `download` vào object `ui`** (đặt sau `products: {...}` để nhóm logic)

```ts
  download: {
    apk: { en: "Download APK", vi: "Tải APK" } as Localized,
    testflight: { en: "Join the beta", vi: "Tham gia bản beta" } as Localized,
    soon: { en: "Coming soon", vi: "Sắp có" } as Localized,
    updated: { en: "Updated", vi: "Cập nhật" } as Localized,
    forAndroid: { en: "for Android", vi: "cho Android" } as Localized,
    forIos: { en: "for iOS", vi: "cho iOS" } as Localized,
    centerTitle: { en: "Download our apps", vi: "Tải ứng dụng của chúng tôi" } as Localized,
    centerIntro: {
      en: "Get CTS Lab apps on your device. More platforms are on the way.",
      vi: "Cài ứng dụng CTS Lab lên thiết bị của bạn. Thêm nền tảng sẽ sớm ra mắt.",
    } as Localized,
    viewAll: { en: "View all apps", vi: "Xem tất cả ứng dụng" } as Localized,
    bandTitle: { en: "Take our apps with you", vi: "Mang ứng dụng theo bên bạn" } as Localized,
    bandLead: {
      en: "Install CTS Lab apps on Android and iOS.",
      vi: "Cài ứng dụng CTS Lab trên Android và iOS.",
    } as Localized,
  },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: không lỗi.

- [ ] **Step 3: Commit**

```bash
git add src/content/ui.ts
git commit -m "feat(download): i18n labels for download UI"
```

---

### Task 5: Route trung gian `/api/download/[slug]`

**Files:**
- Create: `src/app/api/download/[slug]/route.ts`

**Interfaces:**
- Consumes: `getProduct` (`@/content/products`), `resolveDownload` (Task 2), `getDownloadsStore` (Task 3), `Platform`.

- [ ] **Step 1: Viết route** — `src/app/api/download/[slug]/route.ts`

```ts
import { NextResponse } from "next/server";
import { getProduct } from "@/content/products";
import { resolveDownload } from "@/lib/app-download";
import { getDownloadsStore } from "@/lib/downloads-db";
import type { Platform } from "@/content/types";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = new URL(req.url).searchParams.get("platform");
  const back = () => NextResponse.redirect(new URL(`/products/${slug}`, req.url), 302);

  if (platform !== "android" && platform !== "ios") return back();
  const res = resolveDownload(getProduct(slug), platform as Platform);
  if (!res.ok) return back();

  try { getDownloadsStore().increment(slug, platform); } catch { /* đếm lỗi không chặn tải */ }

  const dest = res.target.startsWith("http") ? res.target : new URL(res.target, req.url).toString();
  return NextResponse.redirect(dest, 302);
}
```

- [ ] **Step 2: Build (route động cần build để verify)**

Run: `npm run build`
Expected: build thành công, có route `/api/download/[slug]` trong output.

- [ ] **Step 3: Verify thủ công** — chạy `npm run start -- -p 3100` ở terminal khác rồi:

```bash
# available → 302 tới target
curl -sI "http://localhost:3100/api/download/kidmentor?platform=android" | grep -i "location\|HTTP"
# soon → 302 quay về /products
curl -sI "http://localhost:3100/api/download/ptalk?platform=android" | grep -i "location"
# platform sai → 302 quay về /products
curl -sI "http://localhost:3100/api/download/kidmentor?platform=win" | grep -i "location"
```
Expected: lần 1 Location = `/downloads/kidmentor.apk`; lần 2 & 3 Location = `/products/...`.
Dừng server test sau khi xong.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/download
git commit -m "feat(download): /api/download redirect route with click counting"
```

---

### Task 6: Component `AppDownload` + gắn vào trang chi tiết (variant full)

**Files:**
- Create: `src/components/products/AppDownload.tsx`
- Create: `public/img/badges/README.md` (quy ước tên file cho user)
- Modify: `src/components/products/ProductDetail.tsx` (chèn `<AppDownload variant="full">`)

**Interfaces:**
- Consumes: `describeDownload`, `downloadApiHref` (Task 2), `useLocale`, `useTheme`, `ui.download`, `APP_ICONS`, `EcosystemApp`, `Platform`.
- Produces: `export default function AppDownload({ app, variant }: { app: EcosystemApp; variant: "full" | "row" | "compact" })`.

- [ ] **Step 1: Tạo `public/img/badges/README.md`**

```markdown
# Store badges (asset chính thức — user tự cấp)

Drop các file SVG official vào đây, đúng tên:

- `google-play-black-en.svg`  `google-play-black-vi.svg`
- `google-play-white-en.svg`  `google-play-white-vi.svg`
- `app-store-black-en.svg`    `app-store-black-vi.svg`
- `app-store-white-en.svg`    `app-store-white-vi.svg`

Nguồn: Apple Marketing Resources ("Download on the App Store"), Google Play brand
("Get it on Google Play"). Bản `black` dùng cho theme sáng, `white` cho dark mode.
Chỉ dùng cho app ĐÃ live trên store — không dùng cho APK / "sắp có".
```

- [ ] **Step 2: Viết `src/components/products/AppDownload.tsx`**

```tsx
"use client";

import { Smartphone, Download, Apple, Clock, ArrowUpRight } from "lucide-react";
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
```

*Ghi chú:* `ArrowUpRight` import để dành cho Task 8 nếu cần; nếu lint báo unused thì bỏ import đó.

- [ ] **Step 3: Gắn vào `ProductDetail.tsx`** — thêm import và chèn khối trước nút back (thay khối `<Reveal delay={0.14}>` đã rút gọn ở Task 1):

```tsx
import AppDownload from "@/components/products/AppDownload";
```

```tsx
            <Reveal delay={0.14}>
              <div className="mt-8">
                <h2 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-dim">
                  {locale === "vi" ? "Tải ứng dụng" : "Get the app"}
                </h2>
                <div className="mt-3"><AppDownload app={p} variant="full" /></div>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/products" variant="ghost">
                  {t(ui.products.backCta)} <ArrowRight size={16} />
                </Button>
              </div>
            </Reveal>
```

- [ ] **Step 4: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: không lỗi (nếu `Apple`/`ArrowUpRight` unused → xóa import thừa rồi chạy lại).

- [ ] **Step 5: Verify hình ảnh** — `npm run build && npm run start -- -p 3100`, mở `http://localhost:3100/products/kidmentor` và `/products/ptalk`.
Expected: KidMentor hiện nút "Tải APK cho Android" (kèm `v1.0.0 · Cập nhật 2026-07-06`) + chip "iOS · Sắp có"; PTalk hiện 2 chip "Sắp có". Badge official chưa có asset → app hiện tại không có kind store nên không ảnh hưởng. Dừng server.

- [ ] **Step 6: Commit**

```bash
git add src/components/products/AppDownload.tsx public/img/badges/README.md src/components/products/ProductDetail.tsx
git commit -m "feat(download): AppDownload component + full variant on product detail"
```

---

### Task 7: Trang `/download` (variant row) + link nav/footer

**Files:**
- Create: `src/app/download/page.tsx`
- Create: `src/components/products/DownloadCenter.tsx`
- Modify: `src/content/site.ts` (thêm nav item `/download`)

**Interfaces:**
- Consumes: `AppDownload` (variant row), `getProducts`, `ui.download`, `Navbar`, `Footer`, `Container`.

- [ ] **Step 1: Viết `src/components/products/DownloadCenter.tsx`**

```tsx
"use client";

import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AppDownload from "@/components/products/AppDownload";

export default function DownloadCenter() {
  const { t } = useLocale();
  const apps = getProducts();
  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.products.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.download.centerTitle)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.download.centerIntro)}</p>
        </Reveal>
        <Stagger className="mt-10 flex flex-col gap-3">
          {apps.map((app) => (
            <StaggerItem key={app.id}>
              <AppDownload app={app} variant="row" />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Viết `src/app/download/page.tsx`** (mẫu `products/page.tsx`)

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DownloadCenter from "@/components/products/DownloadCenter";

export const metadata: Metadata = {
  title: "Tải ứng dụng",
  description: "Tải ứng dụng CTS Lab cho Android và iOS.",
};

export default function DownloadPage() {
  return (
    <>
      <Navbar />
      <main><DownloadCenter /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Thêm nav item** — trong `src/content/site.ts`, mảng `nav`, thêm sau `/products`:

```ts
    { id: "/download", label: { en: "Download", vi: "Tải app" } },
```

- [ ] **Step 4: Typecheck + lint + verify**

Run: `npx tsc --noEmit && npm run lint`
Then: `npm run build && npm run start -- -p 3100`, mở `http://localhost:3100/download`.
Expected: danh sách 7 app dạng row; KidMentor & PTalk Signature có nút APK, còn lại "Sắp có"; nav có mục "Tải app". Dừng server.

- [ ] **Step 5: Commit**

```bash
git add src/app/download src/components/products/DownloadCenter.tsx src/content/site.ts
git commit -m "feat(download): /download center page (row variant) + nav link"
```

---

### Task 8: Grid `/products` — variant compact (sửa nested-link)

**Files:**
- Modify: `src/components/products/ProductsGrid.tsx`

**Interfaces:**
- Consumes: `AppDownload` (variant compact).

- [ ] **Step 1: Refactor thẻ để tránh `<a>` lồng `<a>`** — thay khối `<Link href=...>...</Link>` (dòng ~28-55) bằng cấu trúc: card là `div`, chỉ media+tiêu đề link vào chi tiết, `AppDownload` là hàng anh em ở đáy.

```tsx
              <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue">
                <Link href={`/products/${p.slug}`} className="block">
                  <HoverPreview
                    src={p.image.src}
                    alt={t(p.image.alt)}
                    overlay={
                      <div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-white">{t(p.excerpt)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t(p.tags).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-[var(--radius-pill)] bg-white/15 px-2 py-0.5 text-[0.6rem] font-medium text-white">{tag}</span>
                          ))}
                        </div>
                      </div>
                    }
                  />
                  <div className="px-1.5 pt-2">
                    <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
                    <h2 className="text-display mt-2 text-base text-ink">{p.name}</h2>
                    <p className="mt-1 text-sm text-ink-2">{t(p.excerpt)}</p>
                  </div>
                </Link>
                <div className="mt-auto px-1.5 pb-1 pt-3">
                  <AppDownload app={p} variant="compact" />
                </div>
              </div>
```

Thêm import: `import AppDownload from "@/components/products/AppDownload";`. Bỏ import `Tag` nếu không còn dùng (khối tag cũ đã chuyển vào overlay; kiểm tra lint).

- [ ] **Step 2: Typecheck + lint + verify**

Run: `npx tsc --noEmit && npm run lint`
Then: `npm run build && npm run start -- -p 3100`, mở `http://localhost:3100/products`.
Expected: mỗi thẻ có 2 chip nền tảng nhỏ ở đáy; KidMentor/PTalk Signature chip APK bấm được, còn lại "Sắp có"; bấm vùng ảnh/tên vẫn vào chi tiết; không có lỗi hydration/nested-anchor trong console. Dừng server.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/ProductsGrid.tsx
git commit -m "feat(download): compact download chips on products grid (fix nested link)"
```

---

### Task 9: Band "Tải ứng dụng" trên home

**Files:**
- Create: `src/components/home/DownloadBand.tsx`
- Modify: `src/app/page.tsx` (chèn sau `EcosystemBento`, trước `GamesTeaser`)

**Interfaces:**
- Consumes: `AppDownload` (compact), `getProducts`, `ui.download`, `SectionHeader`, `Container`.

- [ ] **Step 1: Viết `src/components/home/DownloadBand.tsx`** — nêu bật app đã có bản tải (available bất kỳ platform), + link "Xem tất cả".

```tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import MediaFrame from "@/components/ui/MediaFrame";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AppDownload from "@/components/products/AppDownload";

export default function DownloadBand() {
  const { t } = useLocale();
  const featured = getProducts().filter(
    (a) => a.downloads?.android?.status === "available" || a.downloads?.ios?.status === "available",
  );
  if (featured.length === 0) return null;

  return (
    <section className="section">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.download.bandTitle)}</span>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <p className="max-w-xl text-sm leading-relaxed text-ink-2">{t(ui.download.bandLead)}</p>
            <Link href="/download" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
              {t(ui.download.viewAll)} <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
        <Stagger className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {featured.map((app) => (
            <StaggerItem key={app.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-center gap-4">
                  <div className="w-24 flex-shrink-0"><MediaFrame src={app.image.src} alt={t(app.image.alt)} /></div>
                  <div className="min-w-0">
                    <h3 className="text-display text-base text-ink">{app.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-2">{t(app.excerpt)}</p>
                  </div>
                </div>
                <div className="mt-4"><AppDownload app={app} variant="compact" /></div>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Chèn vào `src/app/page.tsx`** — thêm import và đặt giữa `EcosystemBento` và `GamesTeaser`:

```tsx
import DownloadBand from "@/components/home/DownloadBand";
```
```tsx
        <EcosystemBento />
        <DownloadBand />
        <GamesTeaser />
```

- [ ] **Step 3: Typecheck + lint + verify**

Run: `npx tsc --noEmit && npm run lint`
Then: `npm run build && npm run start -- -p 3100`, mở `http://localhost:3100/`.
Expected: band "Mang ứng dụng theo bên bạn" xuất hiện sau lưới hệ sinh thái, nêu KidMentor + PTalk Signature với chip APK + link "Xem tất cả ứng dụng". Dừng server.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/DownloadBand.tsx src/app/page.tsx
git commit -m "feat(download): home download band linking to /download"
```

---

## Self-Review (đã thực hiện khi viết plan)

**Spec coverage:**
- §3 data model → Task 1. §4 helper/variant → Task 2 + 6. §5.1 chi tiết → Task 6. §5.2 /download → Task 7. §5.3 grid → Task 8. §5.4 home → Task 9. §6 route+analytics → Task 3 + 5. §7 asset badge → Task 6 (README + badgeSrc). §8 i18n → Task 4. §9 build note → Global Constraints + step verify mỗi task UI.
- §6 "X+ Downloads trên HomeStats" & §10 ngoài phạm vi → cố ý KHÔNG có task (đúng YAGNI). `total()` đã có sẵn trong store cho phase sau.

**Placeholder scan:** `target: "/downloads/*.apk"` và `version/updatedAt` là **giá trị nội dung** cho user chỉnh (đã đánh dấu `TODO(user)`), không phải placeholder kế hoạch — mọi step đều có code thật.

**Type consistency:** `PlatformDownload`/`AppDownloads`/`DownloadView`/`ResolveResult` nhất quán giữa Task 1↔2↔5↔6; `downloadApiHref`, `resolveDownload`, `describeDownload`, `badgeSrc`, `increment/getCount/total` trùng tên ở nơi khai báo và nơi dùng.
