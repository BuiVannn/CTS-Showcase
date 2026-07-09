# Download redesign + Games fixes — Design

Date: 2026-07-09
Status: Approved (direction), pending spec review

## Goal

Unify every app-download control into a single, premium, 3D "store-style" button
used everywhere; restructure `/download` into two labelled groups (Mobile Apps +
VR Device); and fix three Games-page defects (EN toggle leaking Vietnamese,
inconsistent studio page design, a `--` browser-tab title).

**Hard constraint:** do NOT change working download logic — `/api/download/[slug]`
route, `downloadApiHref`, `resolveDownload`, and click counting stay untouched.
Only presentation + content/data grouping changes.

---

## Part 1 — Unified 3D download button (the centrepiece)

Replace today's two visual styles (official badge `<img>` for Play/App Store +
blue pill for APK/TestFlight) with ONE component rendering an identical button
for every `kind`. The link still goes through `/api/download/[slug]?platform=…`.

### `StoreButton` — visual spec

A tactile, raised "key" that reads as a premium official badge but is uniform
across all apps. Theme-aware, encapsulated in a `.store-btn` class in
`globals.css` (multi-layer shadows + sheen need pseudo-elements Tailwind can't
express cleanly); layout via Tailwind utilities on the element.

**Surface**
- Rounded `14px`. Padding `px-4 py-2.5` (full), tighter for compact.
- Solid premium gradient, theme-aware (auto-inverts):
  - Light theme: `linear-gradient(180deg,#20232b,#0c0d11)` — near-black, white text.
  - Dark theme: `linear-gradient(180deg,#ffffff,#e9e9ef)` — near-white, ink text.
- Hairline edge: `1px` semi-transparent border for crisp definition on any bg.

**3D depth (the key requirement)**
- Raised keycap look via layered shadows:
  - Ambient + contact drop: `0 2px 4px rgba(0,0,0,.20), 0 6px 16px -4px rgba(0,0,0,.35)`.
  - Top inner highlight (catches light): `inset 0 1px 0 rgba(255,255,255,.16)` (light-on-dark; inverted values in dark theme).
  - Bottom inner lip: `inset 0 -1px 0 rgba(0,0,0,.45)`.

**Interaction**
- Hover: lift `translateY(-2px)`, shadow grows (`0 10px 28px -8px`), slight
  brightness up, icon micro-scale `1.06`, and an animated diagonal **sheen**
  streak sweeps across (`::before` gradient translateX).
- Active/press: `translateY(0) scale(.975)`, shadow collapses to the contact
  layer — a real "pressed the key down" feel.
- Focus-visible: `ring-2 ring-blue ring-offset-2 ring-offset-bg`.
- `@media (prefers-reduced-motion: reduce)`: drop transforms + sheen, keep the
  colour/brightness hover only.

**Content**
- Left: platform glyph in a subtle inset "keycap" (Android → `Smartphone`,
  iOS → `Apple`, VR → `Glasses`/`Headset` from lucide).
- Two lines: tiny uppercase tracked label "Download for" (top) + bold platform
  name "Android" / "iOS" / "VR device" (bottom).
- Single-platform buttons (VR) render one centred line.

**APK metadata** (`version` · `updated`) renders as a small muted caption BELOW
the button pair — never inside the button — so all buttons stay pixel-identical.

**Coming-soon state**
- Same footprint, flattened: `bg-surface`, dashed border, muted text, no 3D, no
  sheen, `cursor-default`, not a link. Small "Coming soon" affordance + clock
  glyph. Keeps the aria-label.

**Compact variant** (products grid, home band)
- Condensed single-line version of the same button (glyph + short platform
  word), same gradient/shadow language at reduced scale so it still reads 3D but
  fits tight cards.

### Blast radius
- Rewrite `PlatformControl` (inside `AppDownload.tsx`) into the unified button;
  drop the `badgeSrc`/`<img>` branch. Keep `describeDownload` (used to detect
  `soon` + APK meta and by tests). Badge SVG assets stay in repo, just unused.
- `AppDownload` renders controls from the app's available platforms:
  `app.downloads?.vr ? ["vr"] : ["android","ios"]` (mobile always shows both;
  a missing platform → coming-soon).

---

## Part 2 — `/download` restructured into two groups

```
Hero: eyebrow + "Download our apps" + intro

── Mobile Apps ─────────────────────────
  [icon] Unilearn        [Android] [iOS]
  [icon] VietCreative    [Android] [iOS]
  [icon] KidMentor       [Android] [iOS]   v1.0.0 · Updated 2026-07-06
  [icon] PTalk Signature [Android] [iOS]
  [icon] P-Connect       [Android] [iOS]

── VR Device ───────────────────────────
  [headset] STEM VR      [ Download for VR device · Coming soon ]
```

Two labelled sections (group eyebrow + heading + divider), each a `Stagger` list
of `AppDownload variant="row"`.

### Data changes (isolated, `/products` grid untouched)
- `ecosystem.ts`: add a SEPARATE exported array `vrDevices: EcosystemApp[]`
  holding STEM VR. The existing `ecosystem` array is unchanged → the `/products`
  grid renders exactly as before. STEM VR does NOT appear on `/products`.
  - STEM VR: `id/slug: "stem-vr"`, `category: "vr"`,
    `categoryLabel {en:"VR Learning", vi:"Học tập VR"}`, `icon: "vr"`,
    `downloads: { vr: { status: "soon" } }`, `image: "/img/vr.jpg"`, bilingual
    excerpt/description e.g. *"Immersive STEM lessons for Meta Quest and
    standalone VR headsets."*
- `products.ts`:
  - `getProducts()` — unchanged (returns `ecosystem`).
  - `getProduct(slug)` — search `[...ecosystem, ...vrDevices]` so the download
    route can resolve STEM VR when it later ships. (No behaviour change today.)
  - `getDownloadApps()` — unchanged (the 5 mobile slugs) → existing tests pass.
  - add `getVrDevices()` → returns `vrDevices`.
- `types.ts`: `Platform |= "vr"`; `AppDownloads += vr?: PlatformDownload`;
  `IconKey |= "vr"`; `EcosystemCategory |= "vr"`.
- `app-icons.ts`: `vr → Glasses` (or `Headset`).
- `ui.ts`: add `download.forVr` ("for VR device" / "cho thiết bị VR"),
  `download.vrDownload` label, group headings
  `download.mobileGroup` / `download.vrGroup`.

`DownloadCenter.tsx` renders hero → Mobile Apps section (`getDownloadApps()`) →
VR Device section (`getVrDevices()`).

### Accepted trade-off
Dropping official Play/App Store badges in favour of uniform custom buttons
diverges from Google/Apple badge guidelines when linking to stores. This is the
user's explicit, intentional choice for visual consistency.

---

## Part 3 — Games page fixes

### 3a. EN toggle leaks Vietnamese → localize
Move all hardcoded strings into `ui.ts` (`ui.games` / `ui.studio`) and render via
`t()`:
- `GameHubView`: "+ Đăng game của bạn" → `ui.games.submitYourGame`.
- `StudioDashboard`: `STATUS_VI` map → localized status labels; "❌ Xoá không
  thành công." → localized.
- `GameForm`: error-code map + "❌ Cần tải lên file game (.zip)." → localized.
- Server pages `studio/page.tsx` (heading "Game Studio", "Đăng nhập"),
  `studio/new/page.tsx` ("Tạo game mới", breadcrumb "Tạo mới"): user-facing text
  can't use the client `useLocale` hook directly. Move that text into small
  client components (or reuse existing client views) that call `t()`, mirroring
  how `GameHubView`/`DownloadCenter` already localize. Server-only auth logic
  stays server-side; pass an `authed`/data prop down.

### 3b. Design consistency
Raise `studio`, `studio/new`, `studio/[slug]/edit` to the hub/detail standard:
eyebrow label, `AmbientField` tone, `Reveal` wrappers, consistent heading +
intro, and card styling around `GameForm`.

### 3c. `--` browser-tab title
Not yet located. During implementation, run the dev server and navigate every
Games subroute to find the page emitting `--` (suspected empty/missing `title`),
then fix so every Games route sets a proper tab title.

---

## Part 4 — Verification
- `tsc` typecheck clean; `vitest` green (add a `getVrDevices` test; confirm the
  existing `products.test.ts` still passes since `getDownloadApps` is unchanged).
- Run the site and manually verify: buttons in light + dark, hover/press 3D +
  reduced-motion; `/download` two-group layout; EN/VI toggle across Games pages;
  every Games tab title (including the fixed `--`).

## Out of scope
- No change to `/api/download`, click counting, auth, or the games sandbox
  origin. No real STEM VR file/link (stays "Coming soon"). STEM VR not shown on
  `/products`.
