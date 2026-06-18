# CTS Lab — "Academic Tech" redesign + multi-purpose platform + gamehub-ready foundation

**Date:** 2026-06-18
**Status:** Approved direction; Phase 1 design.
**Owner:** namnx (frontend) · two leaders (stakeholders) · CTS Lab @ PTIT

---

## 1. Context & goals

The current site (`ctslab.net`) is a **single-page landing** built on Next.js 16 + React 19 +
Tailwind v4, in a light "Soft Futurism" style (coral/violet/aqua). Leadership criticised it as
unattractive (colour, layout, fonts) and now wants:

1. A **premium, polished** look ("đẹp, sang"), aligned to the **CTS logo brand** (red + blue).
2. A shift from landing page → **multi-purpose website** (a platform, not one page).
3. An integrated **gamehub** (itch.io-style) — to be built **progressively**.
4. **One unified style/colour** across every sub-area.
5. **Academic + technology (AI/STEM/VR)**, modern, clear, with tasteful motion.
6. Stay on **React** (Next.js) for simplicity.

This spec covers **Phase 1** only: the visual redesign + multi-page shell + content layer +
a **gamehub catalog (Level 1)** + keeping the VR tour. It is explicitly architected so the gamehub
can grow without a rewrite.

### Success criteria (Phase 1 "done")

- Light + dark themes, brand-correct, no flash-of-wrong-theme on first paint.
- Shared design system + component library applied consistently across all Phase-1 pages.
- Pages live: `/`, `/products`, `/products/[slug]`, `/games`, `/games/[slug]`, `/team`, `/vr-tour`,
  and a merged `/about` + `/contact`.
- Gamehub catalog renders from a typed `Game` data source through a repository function (no UI coupling).
- Every existing piece of real content is migrated **and cleaned** (no duplicate/misplaced assets,
  no untranslated strings).
- Each page ships finished — **no half-built pages.** Thin areas use a designed `EmptyState`/"coming soon",
  never a broken-looking page.

---

## 2. Non-goals (deferred)

- **Phase 2:** gamehub Level 2 (self-hosted HTML5 games playable in-browser) and/or Level 3 (public user
  uploads, ratings, comments, payments). Requires storage / DB / auth — out of scope now.
- **Phase 3:** real SSO / accounts ("One Account"). In Phase 1 this stays a **marketing section only**.
- `/research` (publications) and `/news` (blog): deferred. `/research` may return when there is real content.
- URL localization (no `/en`, `/vi` route prefixes — see §5).

---

## 3. Design direction — "Academic Tech"

Brand DNA from the logo: **CTS in red** shaped into VR goggles, **blue** arms → brand = **red + blue**.

### Colour strategy 70 / 20 / 10

- **~70% neutral** (near-black / near-white / gray) — the academic, clean, premium base.
- **~20% blue** — high-frequency UI: primary buttons, links, active nav/tab, focus ring, info icons.
  Blue is the "backbone" (academic, clear, never reads as "error").
- **~10% red** — brand accent ONLY: logo, the single most-important CTA per screen
  (e.g. "Tham quan VR"), "Mới/Nổi bật" badges, feature-card border/hover.
  **Rule: ≤ 2–3 red touches per screen** or red loses its punch.

Brand-red is kept **separate from error-red**: form errors use a different/darker red + icon,
warnings use **amber**, success uses **green** — so the semantic system never clashes with the brand.

### Design tokens (CSS variables — replace Soft Futurism tokens in `globals.css`)

| Role | Light | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0B0D12` |
| `--surface` | `#F6F7F9` | `#12151C` |
| `--card` | `#FFFFFF` | `#181C25` |
| `--border` | `#E6E8EC` | `#262B36` |
| `--ink` (text) | `#14161B` | `#ECEEF2` |
| `--ink-2` (muted) | `#5B616E` | `#A2A8B4` |
| `--dim` | `#8A909C` | `#6B7280` |
| `--blue` (UI primary) | `#2563EB` | `#5B8DEF` |
| `--red` (brand accent) | `#E11B22` | `#F2555B` |

> Dark mode **must** use the brightened tints (`#5B8DEF`, `#F2555B`), never raw `#2563EB`/`#E11B22`
> (they fail contrast on dark). Semantic colours (`--danger`, `--warning` amber, `--success` green)
> are defined separately from `--red`.

### Typography

- **Display:** Unbounded. **Body:** Be Vietnam Pro. **Mono:** JetBrains Mono (numbers, tags, code-ish meta).
- **Validation item:** check Unbounded renders **Vietnamese diacritics** cleanly at heavy weights (700/800),
  and judge whether it reads too "web3/crypto". Keep a neutral grotesk fallback ready for display if so.

---

## 4. Theme system (decision)

**Decision: one global theme, light default, no-flash via inline script, no `next-themes` dependency.**

- **Single source of truth.** One site-wide theme (`data-theme="light|dark"` on `<html>`), **not** a
  per-route forced theme. The gamehub's darker, game-y mood is achieved with **dark section surfaces/bands
  within the page** that look right in either theme — *not* by flipping the global theme when entering
  `/games`. This avoids a jarring switch on navigation and per-route FOUC. (If leadership later insists on
  a hard force-dark `/games`, it's possible but adds state + FOUC complexity — flagged, not chosen.)
- **Precedence:** explicit user choice in `localStorage['cts-theme']` wins everywhere. If no stored choice
  → default **Light**, and **do not auto-follow `prefers-color-scheme`** on the public face. This is a
  deliberate brand decision (consistent academic light first impression for stakeholders/demos) and is
  **reversible in one line** (see script comment).
- **No-flash (anti-FOUC):** an inline `<script>` in `<head>` sets `data-theme` **before first paint**.
  Never set the initial theme in `useEffect` (that flashes the wrong theme for one frame).

```tsx
// app/layout.tsx — inside <head>, rendered before <body> paints.
// Verify the exact placement against Next 16 docs (node_modules/next/dist/docs/) before coding.
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{
      var k='cts-theme', s=localStorage.getItem(k);
      // default light; to RESPECT system instead, swap the next line for:
      //   var t = s || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var t = s || 'light';
      document.documentElement.setAttribute('data-theme', t);
    }catch(e){ document.documentElement.setAttribute('data-theme','light'); }})();`,
  }}
/>
```

- A **client** `ThemeProvider` reads the same key, exposes `theme` + `toggle()`, and on toggle writes
  `localStorage` and updates `data-theme`. It must **not** re-derive the initial theme on mount (the inline
  script already set it) — only sync React state + subsequent changes.
- `ThemeToggle` (client) lives in the navbar.

---

## 5. Information architecture (IA)

### Phase 1 routes

```
/                     Home    (hero · ecosystem bento · stats band · featured)
/products             Products grid (PTalk, VietCreative, Vision Tale, Unilearn)
/products/[slug]      Product detail
/games                Gamehub catalog (filter by category)            ← new
/games/[slug]         Game detail (screenshots/video · play/embed/download)  ← new
/team                 Team (faculty + students)
/vr-tour              VR tour (KEEP existing krpano iframe untouched)
/about + /contact     About + contact — merged into one page if both are thin
```

Deferred: `/research`, `/news`. `/partners` → a **section** (on home and/or about), not a route yet.

### i18n — no URL localization

Keep the existing **client `LocaleProvider`** (`src/lib/locale.tsx`, EN/VI). **One shared route set**;
only the content swaps by locale. Do **not** introduce `next-intl`'s `[locale]` segment routing /
middleware (complex, error-prone on Next 16, and hurts SEO with split URLs). This sidesteps the i18n-routing
risk entirely.

### Deep pages

`/products/[slug]` and `/games/[slug]` show a **breadcrumb** (Home / Section / Item) — the "platform" cue.

---

## 6. App architecture (Next.js 16, App Router)

> AGENTS.md warns Next 16 has breaking changes. Before coding, verify theming injection, `generateMetadata`,
> route handlers, and `dynamic`/`generateStaticParams` conventions in `node_modules/next/dist/docs/`.

- **App shell** in `app/layout.tsx`: `<html>` + inline theme script + Navbar + Footer + providers
  (ThemeProvider, LocaleProvider, SmoothScroll). Every page inherits the shell → unified style is automatic.
- **Server/Client boundary (important):**
  - `'use client'` ONLY for interactive bits: `ThemeProvider`, `LocaleProvider`, `SmoothScroll`,
    `ThemeToggle`, `Navbar` (mobile menu/state), `FilterBar`, any motion wrappers.
  - **Content pages stay Server Components** (SEO + lighter JS). Repository functions (`getGames`,
    `getProducts`, …) run on the server. Do **not** turn the whole shell into a client tree.
- **Metadata:** every route exports `metadata` or `generateMetadata`; `/products/[slug]` and `/games/[slug]`
  generate per-item title / description / OpenGraph (link sharing + academic credibility).
- **Content layer (extensibility key):** data lives in `src/content/*` and is read through a thin
  **repository** module per domain. UI imports `getGames()/getGame(slug)`, never the raw array. Swapping
  static data → API/DB later changes only the repository, never the components.
- **Motion:** keep `motion/react` + Lenis. **Lenis caution:** it intercepts scroll-restoration / anchor
  jumps / reduced-motion — wrap carefully, respect `prefers-reduced-motion`, and test in-page anchors.
  Keep motion restrained (reveal-on-scroll, subtle hovers) to read "modern/academic", not flashy.

---

## 7. Content model

Reuse the established pattern: `Localized<T = string> = { en: T; vi: T }`, `LocalImage = { src; alt }`.
**One bilingual pattern only** — `Localized` for strings, `Localized<string[]>` for lists. No mixing.

```ts
// src/content/types.ts (additions)

export type ContentStatus = "published" | "draft" | "coming-soon";

/** Shared base for any catalog item (Game, Product, later News/Research). */
export interface Content {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;          // short — used in grids/cards
  cover: LocalImage;           // rendered through <MediaFrame> at a fixed aspect ratio
  tags: Localized<string[]>;
  status: ContentStatus;
  featured?: boolean;          // → "Nổi bật" block
  order?: number;              // manual sort within a catalog
  releaseDate?: string;        // ISO "YYYY-MM-DD" — sort "newest" + auto-generate "MỚI" badge
}

export type GameCategory =
  | "puzzle" | "adventure" | "arcade" | "educational" | "simulation";

export interface Credit {
  name: string;                // proper noun — kept as-is
  role: Localized;             // "Lập trình" / "Programming", etc.
}

/** Discriminated union on playMode → TS enforces the right fields per kind. */
export type GamePlay =
  | { playMode: "embed";    embedUrl: string; aspectRatio?: string }
  | { playMode: "download"; downloadUrl: string; size?: string;
      platform?: ("web" | "windows" | "android" | "ios")[] }
  | { playMode: "external"; externalUrl: string };

export type Game = Content & {
  category: GameCategory;
  categoryLabel: Localized;
  description: Localized;       // long — /games/[slug]
  screenshots?: LocalImage[];
  credits?: Credit[];          // credit students/authors — itch.io style, academic spirit
} & GamePlay;

/** Existing EcosystemApp re-expressed on the shared base (migrate gradually). */
export type Product = Content & {
  name: string;                // brand name
  year: number;
  category: EcosystemCategory;
  categoryLabel: Localized;
  icon: IconKey;
  description: Localized;
  features: Localized<string[]>;
  downloadHref: string;
};
```

Repositories: `src/content/games.ts` (data) + `getGames()/getGame(slug)` returning only
`status === "published" | "coming-soon"`, sorted by `featured`, then `order`, then `releaseDate`.

### Content cleanup pass (mandatory during migration)

Migrating data is the moment to fix known content bugs — do **not** copy them forward:

- Duplicate/shared images (e.g. VietCreative & Vision Tale share `vietCreative.jpg`; PCar/Smart Arm shared
  files) → supply or flag distinct assets; `MediaFrame` enforces aspect ratio so no more lopsided images.
- Untranslated strings inside Vietnamese content (e.g. "Ministry of Education") → localize properly.
- `sso.ts` → render as a **marketing section** ("Một tài khoản") describing the vision. **No "Đăng nhập"
  button that 404s or no-ops** in Phase 1 (SSO is Phase 3). Don't over-promise a login that doesn't exist.

---

## 8. Component system

A single, **multi-variant** component set (props/slots — never fork one Card per section):

- **Layout/shell:** `Navbar` (multi-page, active-route state), `Footer`, `Breadcrumb`, `ThemeToggle`,
  `SectionHeader`, `Container`.
- **Surfaces:** `Card` (one component; slots for badge/meta/tags; variants for feature/standard),
  `BentoGrid`, `StatBand` (mono numerals), `Badge` (brand / "MỚI" / status), `Button` (`blue` | `red` | `ghost`).
- **Catalog needs (new):**
  - `FilterBar` + `Tag` — category filtering on `/games`.
  - `EmptyState` — designed empty / "coming soon" for thin areas (directly addresses the "empty page looks
    broken" risk).
  - `MediaFrame` — image wrapper that **enforces a fixed aspect ratio** (e.g. 16:9), fixing the legacy
    lopsided-image bug once at the component level.
- **Media:** game detail renders per `playMode` (embed iframe / download buttons / external link).

---

## 9. Gamehub foundation & extensibility path

- **Phase 1 (Level 1 — catalog):** React-only. `/games` grid (filter by category, `status` badges,
  auto-"MỚI" from `releaseDate`), `/games/[slug]` detail. `playMode` decides how "play" renders
  (embed an external HTML5/itch link, download, or external link). A few real games or designed
  "coming soon" cards — never an empty grid.
- **Level 2 (later):** self-host HTML5 games playable in-browser → add object storage + a small API in the
  repository layer; `playMode: "embed"` already models it. UI largely unchanged.
- **Level 3 (later):** user uploads + accounts + ratings → add DB + auth + moderation behind the repository
  and new routes. Still additive.

The `Game` type + repository + `/games` routes are the contract that makes Level 2/3 **additive, not a
rewrite** — this is the core "dễ mở rộng" requirement.

---

## 10. Reuse & migration of existing code

"Re-skin, don't discard data." Existing content maps onto the new IA:

| Existing | New home |
|---|---|
| `ecosystem.ts` (4 apps) | `/products` + home bento |
| `team.ts` | `/team` |
| `partners.ts` | Partners **section** |
| `sso.ts` | "Một tài khoản" marketing section (no live login) |
| `showcase.ts` | home/featured as relevant |
| VR tour (`/vr-tour` + `public/vr-tour/*` krpano) | **unchanged** |

Most existing components (`Hero`, `AboutSection`, `Team`, `Partners`, `Contact`, `Footer`, `SmoothScroll`,
`SectionReveal`) get **re-skinned** to the new tokens/components rather than deleted. The Soft Futurism
utilities (aurora/glass/grain) and coral/violet/aqua tokens in `globals.css` are removed/replaced.

---

## 11. Phasing & ordering

**Phase 1 scope is intentionally narrow** — the biggest risk is shipping another half-done thing while the
site is already being judged on looks.

**Implementation order (design-system-first):**

1. **Design system + shared components first** (tokens light/dark, theme system, Card/Button/Badge/Nav/
   Footer/Breadcrumb/StatBand/FilterBar/EmptyState/MediaFrame). This is exactly what's being graded.
2. Then pages, finished one at a time: Home → `/products` (+ detail) → `/games` (+ detail) → `/team` →
   merged `/about`+`/contact`. Keep `/vr-tour`.
3. Content migration + cleanup pass alongside the relevant page.

Defer `/research`, `/news` to a later phase. **Fewer pages, fully finished > many half-built pages.**

---

## 12. Risks & technical notes

- **Next 16 breaking changes** — verify theming injection, `generateMetadata`, route handlers, params
  conventions against `node_modules/next/dist/docs/` before writing code (per AGENTS.md).
- **FOUC** — solved by the inline head script (§4); do not regress it into `useEffect`.
- **Server/Client leakage** — keep content pages as Server Components; isolate `'use client'` to interactive
  leaves.
- **Lenis + anchors + reduced-motion** — wrap carefully; test in-page navigation and `prefers-reduced-motion`.
- **Unbounded Vietnamese diacritics** at heavy weights + "web3" read — validate; keep a fallback.
- **Contrast** — dark-mode brand tints must pass WCAG AA against `--card`/`--bg`.
- **VR tour weight** — `public/vr-tour/` is ~431 MB; out of scope to change now, but note it inflates the
  deploy bundle (candidate for CDN offload later).

---

## 13. Decisions log

1. **Theme:** one global theme; light default; **system pref not auto-followed** on public face
   (reversible 1-liner); gamehub mood via dark section bands, not a forced per-route theme; no-flash inline
   script; no `next-themes`.
2. **`Game` type:** adopt all upgrades — shared `Content` base, **discriminated union on `playMode`**,
   `status`, `featured`/`order`, `releaseDate` (auto "MỚI"), `credits`, fixed-aspect `cover` via `MediaFrame`,
   single `Localized<T>` bilingual pattern.
3. **Phase 1 scope:** **narrow** — design system + `/`, `/products`(+detail), `/games`(+detail), `/team`,
   `/vr-tour`, merged `/about`+`/contact`. Defer `/research`, `/news`. SSO = marketing section only.

### Still open (not blocking the plan)

- Final gamehub depth (Level 1 vs 2 vs 3) — leadership to decide; doesn't block Phase 1.
- Whether to merge `/about` + `/contact` or keep separate — decide when content volume is known.
- Confirm default-Light-ignoring-system is acceptable, or flip to respect-system (1-line change).
