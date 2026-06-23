# "Một tài khoản" App Logo Grid + 3 New Apps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3 new ecosystem apps (KidMentor, PTalk Signature, P-Connect) as full products with mock content + temporary logos, and replace the "Một tài khoản" text paragraph with a grid of all 7 app tiles (logo or icon fallback) linking to their detail pages.

**Architecture:** Extend the content layer (new `IconKey`/category values, optional `logo`, 3 new `ecosystem` entries with mock bilingual copy). Centralize the `IconKey → lucide` map into one module reused by the product detail page and the new grid. Add a client grid component that renders a logo (if `app.logo` set) or the app icon, and slot it into the existing SSO block in `HomeStats`.

**Tech Stack:** Next.js 16 (App Router), React 19, `motion/react`, `lucide-react`, Tailwind v4, TypeScript, Vitest (node) for content tests, existing `useLocale` i18n.

## Global Constraints

- **Bilingual:** every user-facing string is `Localized` (`{ en, vi }`) via `useLocale().t(...)`. Mock copy must be plausible (no "lorem ipsum"), both languages filled.
- **Single source of truth:** apps come from the `ecosystem` array via `getProducts()`; the grid and detail pages derive from it (no hardcoded app lists in the UI).
- **Logo-or-icon fallback:** a tile renders `<Image src={app.logo}>` only when `app.logo` is a non-empty string; otherwise the app's icon. A missing logo file must never produce a broken image (decided by the data field, not a network probe).
- **Existing tokens only** (`--radius-*`, `--border`, `bg-card`, `bg-surface`, `text-ink`, `--blue`, etc.); no new dependencies.
- **No `react-hooks/set-state-in-effect`; no `eslint-disable`.** New images use `next/image`.
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; for tasks with tests `npx vitest run` green; live `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` → `200`. Deploy in the final task.
- **Commit after every task**; `git add` specific files only (NEVER `git add -A` — `game/` + stray images must stay untracked). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/app-icons.ts` — `APP_ICONS: Record<IconKey, LucideIcon>` (shared icon map)
- `src/components/home/OneAccountApps.tsx` — the app tile grid

**Modify:**
- `src/content/types.ts` — extend `IconKey`, extend `EcosystemCategory`, add `logo?: string` to `EcosystemApp`
- `src/content/ecosystem.ts` — append 3 new apps (mock + logo)
- `src/content/products.test.ts` — assert the 3 new slugs + count
- `src/components/products/ProductDetail.tsx` — use the shared `APP_ICONS`
- `src/content/sso.ts` — add a short `lead` + `more` bilingual string
- `src/components/home/HomeStats.tsx` — replace the SSO paragraph with the grid

**User-provided assets (not in this plan):** `public/img/logos/{kidmentor,ptalk-signature,p-connect}.png`. The build does not depend on them (icon fallback covers absence).

---

## Task 1: Types + shared icon map + ProductDetail refactor

**Files:**
- Modify: `src/content/types.ts`, `src/components/products/ProductDetail.tsx`
- Create: `src/lib/app-icons.ts`

**Interfaces:**
- Produces: `IconKey` now includes `"graduation" | "signature" | "bluetooth"`; `EcosystemCategory` includes `"connectivity"`; `EcosystemApp.logo?: string`; `APP_ICONS: Record<IconKey, LucideIcon>`.

- [ ] **Step 1: Extend the content types**

In `src/content/types.ts`:

```ts
export type IconKey = "mic" | "paintbrush" | "film" | "music" | "graduation" | "signature" | "bluetooth";

export type EcosystemCategory =
  | "ai-voice"
  | "creative-ai"
  | "video-ai"
  | "learning-ai"
  | "connectivity";
```

And add `logo` to the `EcosystemApp` interface (right after the `image` field or near it):

```ts
  logo?: string; // public path to a tile logo, e.g. "/img/logos/ptalk.png"; falls back to `icon`
```

- [ ] **Step 2: Create the shared icon map**

`src/lib/app-icons.ts`:

```ts
import type { LucideIcon } from "lucide-react";
import { Mic, Paintbrush, Film, Music, GraduationCap, Signature, Bluetooth } from "lucide-react";
import type { IconKey } from "@/content/types";

/** Single source for mapping an app's IconKey to a lucide icon component. */
export const APP_ICONS: Record<IconKey, LucideIcon> = {
  mic: Mic,
  paintbrush: Paintbrush,
  film: Film,
  music: Music,
  graduation: GraduationCap,
  signature: Signature,
  bluetooth: Bluetooth,
};
```

- [ ] **Step 3: Use the shared map in ProductDetail**

In `src/components/products/ProductDetail.tsx`: remove the local `const ICONS` block and its now-unused icon imports (`Mic, Paintbrush, Film, Music` from the top import — keep `Download, Check, ArrowRight`), import the shared map, and use it. Replace the import line and the map usage:

```tsx
import { Download, Check, ArrowRight } from "lucide-react";
import { APP_ICONS } from "@/lib/app-icons";
```

Delete the local `const ICONS: Record<IconKey, LucideIcon> = { ... };` and the now-unused `import type { LucideIcon }` if it's only used there. Change the icon resolution:

```tsx
const Icon = APP_ICONS[p.icon] ?? APP_ICONS.mic;
```

(Keep `import type { IconKey }` only if still referenced; if not, remove it. Let eslint flag unused imports.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/content/types.ts src/lib/app-icons.ts src/components/products/ProductDetail.tsx`
Expected: clean (no unused-import warnings — remove any you orphaned). Build passes (product detail pages still render with icons).

- [ ] **Step 5: Commit**

```bash
git add src/content/types.ts src/lib/app-icons.ts src/components/products/ProductDetail.tsx
git commit -m "refactor(content): extend IconKey/category, add app.logo, shared icon map

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Add 3 new ecosystem apps (mock) + tests

**Files:**
- Modify: `src/content/ecosystem.ts`, `src/content/products.test.ts`

**Interfaces:**
- Consumes: extended types (Task 1).
- Produces: `getProducts()` returns 7 apps incl. slugs `kidmentor`, `ptalk-signature`, `p-connect`, each with `logo` set.

- [ ] **Step 1: Write the failing test additions**

In `src/content/products.test.ts`, update/extend:

```ts
import { describe, it, expect } from "vitest";
import { getProducts, getProduct } from "./products";

describe("getProducts", () => {
  it("returns all ecosystem products", () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(7);
  });
});

describe("getProduct", () => {
  it("finds a product by slug", () => {
    expect(getProduct("ptalk")?.name).toBe("PTalk");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getProduct("does-not-exist")).toBeUndefined();
  });
  it("includes the three new apps with logos", () => {
    for (const slug of ["kidmentor", "ptalk-signature", "p-connect"]) {
      const app = getProduct(slug);
      expect(app, `missing app: ${slug}`).toBeDefined();
      expect(app?.logo).toBe(`/img/logos/${slug}.png`);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/content/products.test.ts`
Expected: FAIL — count < 7 and the new slugs are undefined.

- [ ] **Step 3: Append the 3 new apps**

In `src/content/ecosystem.ts`, add these three entries to the `ecosystem` array (after `unilearn`, before the closing `]`):

```ts
  {
    id: "kidmentor",
    name: "KidMentor",
    slug: "kidmentor",
    year: 2025,
    category: "learning-ai",
    categoryLabel: { en: "Kids Learning", vi: "Học tập cho trẻ" },
    icon: "graduation",
    excerpt: {
      en: "An AI learning companion that guides children through lessons at their own pace.",
      vi: "Người bạn học AI đồng hành, dẫn dắt trẻ qua từng bài học theo nhịp độ riêng.",
    },
    description: {
      en: "KidMentor is an AI companion for young learners — it personalises lessons by grade and curriculum, answers questions patiently, and gives parents a clear view of progress in a safe, age-appropriate space.",
      vi: "KidMentor là người bạn AI cho trẻ nhỏ — cá nhân hoá bài học theo lớp và chương trình, kiên nhẫn trả lời câu hỏi và cho phụ huynh thấy rõ tiến độ trong một không gian an toàn, phù hợp lứa tuổi.",
    },
    features: {
      en: [
        "Lessons personalised by grade and curriculum",
        "Patient, age-appropriate AI tutoring",
        "Parent view of learning progress",
      ],
      vi: [
        "Bài học cá nhân hoá theo lớp và chương trình",
        "Gia sư AI kiên nhẫn, phù hợp lứa tuổi",
        "Phụ huynh theo dõi tiến độ học tập",
      ],
    },
    tags: { en: ["AI", "Kids", "Learning"], vi: ["AI", "Trẻ em", "Học tập"] },
    downloadHref: "#",
    // image = existing placeholder so /products + Hệ sinh thái cards never break;
    // logo = convention path the user drops a file at (grid shows it when present).
    image: { src: "/img/1account.png", alt: { en: "KidMentor", vi: "KidMentor" } },
    logo: "/img/logos/kidmentor.png",
  },
  {
    id: "ptalk-signature",
    name: "PTalk Signature",
    slug: "ptalk-signature",
    year: 2025,
    category: "ai-voice",
    categoryLabel: { en: "AI Voice", vi: "Giọng nói AI" },
    icon: "signature",
    excerpt: {
      en: "The signature PTalk voice assistant — a refined everyday companion that listens and responds naturally.",
      vi: "Bản Signature của trợ lý giọng nói PTalk — người bạn đồng hành hằng ngày, lắng nghe và phản hồi tự nhiên.",
    },
    description: {
      en: "PTalk Signature is the premium voice-assistant experience of the PTalk family — natural spoken dialogue, helpful daily routines, and a friendly companion designed for comfort and everyday use.",
      vi: "PTalk Signature là trải nghiệm trợ lý giọng nói cao cấp của dòng PTalk — đối thoại tự nhiên bằng giọng nói, hỗ trợ thói quen hằng ngày và là người bạn thân thiện, dễ dùng.",
    },
    features: {
      en: [
        "Natural, real-time spoken dialogue",
        "Helpful daily routines and reminders",
        "Friendly companion designed for everyday use",
      ],
      vi: [
        "Đối thoại tự nhiên bằng giọng nói, thời gian thực",
        "Hỗ trợ thói quen và nhắc việc hằng ngày",
        "Người bạn thân thiện, dễ dùng hằng ngày",
      ],
    },
    tags: { en: ["AI", "Voice", "Assistant"], vi: ["AI", "Giọng nói", "Trợ lý"] },
    downloadHref: "#",
    image: { src: "/img/1account.png", alt: { en: "PTalk Signature", vi: "PTalk Signature" } },
    logo: "/img/logos/ptalk-signature.png",
  },
  {
    id: "p-connect",
    name: "P-Connect",
    slug: "p-connect",
    year: 2025,
    category: "connectivity",
    categoryLabel: { en: "Connectivity", vi: "Kết nối" },
    icon: "bluetooth",
    excerpt: {
      en: "Pairs and manages the lab's assistant devices over Bluetooth — one tap to connect.",
      vi: "Ghép nối và quản lý các thiết bị trợ lý của lab qua Bluetooth — chạm một lần là kết nối.",
    },
    description: {
      en: "P-Connect is the companion app that discovers, pairs, and manages CTS Lab's assistant hardware over Bluetooth — keep devices updated, switch between them, and connect in a single tap.",
      vi: "P-Connect là ứng dụng đồng hành giúp dò tìm, ghép nối và quản lý các thiết bị trợ lý của CTS Lab qua Bluetooth — cập nhật thiết bị, chuyển đổi giữa các thiết bị và kết nối chỉ với một chạm.",
    },
    features: {
      en: [
        "Discover and pair devices over Bluetooth",
        "Manage and update connected hardware",
        "One-tap switching between devices",
      ],
      vi: [
        "Dò tìm và ghép nối thiết bị qua Bluetooth",
        "Quản lý và cập nhật thiết bị đã kết nối",
        "Chuyển đổi giữa các thiết bị chỉ với một chạm",
      ],
    },
    tags: { en: ["Bluetooth", "Devices", "Connectivity"], vi: ["Bluetooth", "Thiết bị", "Kết nối"] },
    downloadHref: "#",
    image: { src: "/img/1account.png", alt: { en: "P-Connect", vi: "P-Connect" } },
    logo: "/img/logos/p-connect.png",
  },
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/content/products.test.ts` → PASS. Then `npx vitest run` → full suite green.

- [ ] **Step 5: Verify build + detail pages**

Run: `npx tsc --noEmit && npm run build`
Expected: build passes; the output route list now includes `/products/kidmentor`, `/products/ptalk-signature`, `/products/p-connect` (SSG). Then `pm2 restart cts-redesign && sleep 3 && for s in kidmentor ptalk-signature p-connect; do curl -s -o /dev/null -w "$s: %{http_code}\n" http://localhost:3001/products/$s; done` → each `200`.

Note: detail-page + "Hệ sinh thái" images use the existing `/img/1account.png` placeholder, so nothing breaks there. Only the 3 new apps' tiles in the One-account grid reference `/img/logos/<slug>.png` (because their `logo` field is set) — those tiles show a broken image ONLY until the user drops the 3 logo files in; the 4 logo-less apps show the icon fallback. This interim state is expected since the user is providing the logos.

- [ ] **Step 6: Commit**

```bash
git add src/content/ecosystem.ts src/content/products.test.ts
git commit -m "feat(content): add KidMentor, PTalk Signature, P-Connect (mock + logo)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Strings + OneAccountApps grid component

**Files:**
- Modify: `src/content/sso.ts`
- Create: `src/components/home/OneAccountApps.tsx`

**Interfaces:**
- Consumes: `getProducts()`, `APP_ICONS` (Task 1), `sso.lead`/`sso.more`.
- Produces: `<OneAccountApps />` (no props).

- [ ] **Step 1: Add the lead + more strings**

In `src/content/sso.ts`, add two fields to the object (and to its type literal at the top):

In the type annotation, add:

```ts
  lead: Localized;
  more: Localized;
```

In the object value, add:

```ts
  lead: { en: "One account for every CTS Lab app.", vi: "Một tài khoản cho mọi ứng dụng CTS Lab." },
  more: { en: "…and more.", vi: "…và hơn thế nữa." },
```

- [ ] **Step 2: Implement the grid**

`src/components/home/OneAccountApps.tsx`:

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { sso } from "@/content/sso";
import { APP_ICONS } from "@/lib/app-icons";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

/**
 * "One account" launcher: a tile per ecosystem app (logo if provided, else the
 * app icon), linking to its detail page. Derives the app list from getProducts()
 * so it stays in sync as apps are added.
 */
export default function OneAccountApps() {
  const { t } = useLocale();
  const apps = getProducts();

  return (
    <div className="mt-5">
      <p className="text-sm leading-relaxed text-ink-2">{t(sso.lead)}</p>
      <Stagger className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {apps.map((app) => {
          const Icon = APP_ICONS[app.icon] ?? APP_ICONS.mic;
          return (
            <StaggerItem key={app.id}>
              <Link
                href={`/products/${app.slug}`}
                className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-bg p-3 transition-transform duration-300 hover:-translate-y-0.5 hover:border-blue"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface">
                  {app.logo ? (
                    <Image src={app.logo} alt={t(app.image.alt)} width={40} height={40} className="h-full w-full object-cover" />
                  ) : (
                    <Icon size={18} className="text-blue" aria-hidden />
                  )}
                </span>
                <span className="text-sm font-medium text-ink">{app.name}</span>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
      <p className="mt-4 text-sm font-medium text-dim">{t(sso.more)}</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/content/sso.ts src/components/home/OneAccountApps.tsx`
Expected: clean. (The component isn't mounted yet — that's Task 4 — so this just confirms it compiles.)

- [ ] **Step 4: Commit**

```bash
git add src/content/sso.ts src/components/home/OneAccountApps.tsx
git commit -m "feat(home): One-account app tile grid (logo or icon fallback)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Integrate into the "Một tài khoản" block

**Files:**
- Modify: `src/components/home/HomeStats.tsx`

**Interfaces:**
- Consumes: `<OneAccountApps />` (Task 3).

- [ ] **Step 1: Replace the paragraph with the grid**

In `src/components/home/HomeStats.tsx`, add the import:

```tsx
import OneAccountApps from "@/components/home/OneAccountApps";
```

Replace the SSO paragraph line:

```tsx
<p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(sso.description)}</p>
```

with:

```tsx
<OneAccountApps />
```

(Keep the eyebrow + `<h2>` title above it unchanged. `sso.description` stays in the data, just unused here — leaving the `sso` import in place since `sso.caption`/`sso.title` are still used.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/home/HomeStats.tsx`
Expected: clean. Then `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/` → `200`. The "Một tài khoản" block now shows a 7-tile app grid (icons until logos are added) + "…và hơn thế nữa."; each tile links to its detail page.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomeStats.tsx
git commit -m "feat(home): show app logo grid in the One-account block

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Polish, verify, deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full automated suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. the 7-app + new-slug assertions). No stray `eslint-disable`.

- [ ] **Step 2: Visual / responsive audit (code level)**

Confirm: the grid reflows (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) for 7 tiles without overflow; tiles with no `logo` show the icon (the 4 existing apps), tiles with `logo` set will show the image once the file exists; the 3 new apps appear in `/products` and "Hệ sinh thái" too. If a tile crowds on mobile, adjust the grid columns and report.

- [ ] **Step 3: Logo-fallback sanity**

Since the 3 logo files may not exist yet, confirm the page does not error and the `next/image` for a missing file degrades acceptably (Next renders the `<img>` with the src; a 404 image shows browser's broken-image only for those tiles — acceptable interim). If preferred, note in the report that adding the files resolves it. Do NOT remove the `logo` fields.

- [ ] **Step 4: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3` then health-check `/`, `/products`, `/products/kidmentor` → `200`.

- [ ] **Step 5: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(home): one-account grid responsive/fallback fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes were needed, do not create an empty commit — report the audit results.

---

## Self-Review (completed during planning)

**Spec coverage:**
- §2 7 apps in grid → Task 3 (derives from getProducts) + Task 4. 3 new full products with mock → Task 2.
- §3 logo convention paths → set on the data in Task 2 (`logo: /img/logos/<slug>.png`); fallback in Task 3.
- §4.1 type extensions → Task 1. §4.2 shared icon map → Task 1. §4.3 new entries → Task 2. §4.4 grid → Task 3. §4.5 integration → Task 4. §4.6 strings → Task 3.
- §5 behaviour (fallback, a11y, responsive, motion, bilingual) → Tasks 3/4 + Task 5 audit.
- §7 testing (content tests + manual) → Task 2 tests + Task 5.

**Placeholder scan:** No TBD/TODO. Complete code in every code step. Mock app copy is real bilingual text, not lorem ipsum. The only judgment step is removing orphaned imports in ProductDetail (Task 1 Step 3) — concrete instruction + eslint catches it.

**Type consistency:** `IconKey` extension (Task 1) is consumed by `APP_ICONS` (Task 1) and the new app `icon` values (Task 2) and the grid (Task 3). `EcosystemApp.logo?: string` defined Task 1, set Task 2, read Task 3. `APP_ICONS` signature `Record<IconKey, LucideIcon>` consistent across ProductDetail + grid. `sso.lead`/`sso.more` defined Task 3 Step 1, read Task 3 Step 2.

**Note for implementer:** the 3 logo PNGs are user-provided and may be absent during implementation — that is expected; build/tests do not depend on them and the grid icon-fallback covers the 4 logo-less apps. Do not block on the assets.
```
