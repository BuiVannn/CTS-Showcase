# "Một tài khoản" → App Logo Grid (Quick win 3.1)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Homepage — replace the text paragraph in the "Một tài khoản / One Account" (SSO) block with a grid of clickable app **logos** that link to each app's detail page, ending with "…và hơn thế nữa." No backend/auth changes.

---

## 1. Goal

Turn the static SSO description sentence into a **visual app launcher**: a row of app tiles (PTalk, VietCreative, Vision Tale, Unilearn, … và hơn thế nữa) where each tile shows the app's **logo** and links to its detail page (`/products/<slug>`). This makes the "one account for every app" message tangible and drives traffic into the product pages.

## 2. Decisions (settled with the user)

- **Tile artwork = real per-app logos**, which the user will provide. To ship immediately and degrade gracefully, each tile renders the app's logo **if the file exists**, otherwise falls back to the app's existing **icon** (`mic`/`paintbrush`/`film`/`music`). Dropping a logo file in later upgrades the tile automatically — no code change.
- **Location:** the existing "Một tài khoản" (SSO) block rendered in `HomeStats` — keep the eyebrow ("Đăng nhập một lần") and title ("Một tài khoản"); replace the long `sso.description` paragraph with a short lead + the logo grid + the "…và hơn thế nữa." ending.
- **Apps shown:** the four existing ecosystem apps (`ptalk`, `viet-creative`, `vision-tale`, `unilearn`), read from the existing `ecosystem` data (single source of truth), so the grid stays in sync if apps are added/removed.

## 3. Asset deliverable (user provides)

Drop transparent logo files (PNG or SVG, roughly square, ~256px) at:

```
public/img/logos/ptalk.png
public/img/logos/viet-creative.png
public/img/logos/vision-tale.png
public/img/logos/unilearn.png
```

Filenames match the app **slug**. Until a file is present, that tile shows the app's lucide icon instead (no broken image).

## 4. Architecture & components

**Data (`src/content/ecosystem.ts` + `src/content/types.ts`):**
- Add an optional `logo?: string` field to `EcosystemApp` (a public path, e.g. `/img/logos/ptalk.png`). Populate it for the four apps pointing at the convention paths above. The grid treats a missing/absent file via the icon fallback (the field can be set now; the file arrives later).

**Component (`src/components/home/OneAccountApps.tsx`, new):**
- Reads `getProducts()` and renders a responsive grid of tiles.
- Each tile: a square logo frame (Next `<Image>` from `app.logo`) **or** the app's icon (reusing the existing `IconKey → lucide` mapping already used by the product pages) when no logo; the app **name**; wrapped in a `<Link href={'/products/' + app.slug}>` with hover lift. Bilingual `alt`/labels via `useLocale`.
- A trailing "…và hơn thế nữa." tile/label (bilingual) signaling the ecosystem is growing.

**Integration (`src/components/home/HomeStats.tsx`):**
- In the SSO sub-card, keep `sso.caption` eyebrow + `sso.title`. Replace the `<p>{t(sso.description)}</p>` with: a short one-line lead + `<OneAccountApps />`.

**Strings (`src/content/sso.ts` or `src/content/ui.ts`):**
- Add a short bilingual lead (e.g. EN "One account for every CTS Lab app." / VI "Một tài khoản cho mọi ứng dụng CTS Lab.") and the "…và hơn thế nữa." / "…and more." label. The long `sso.description` stays in the data (it may still be used elsewhere) but is no longer rendered in this block.

## 5. Behaviour & quality

- **Fallback:** missing `logo` → render the app icon (no broken `<img>`). Decide "has logo" by the presence of `app.logo` (string set) — the user sets the field when they add the file; if they prefer zero-config, the component may instead always try the logo path and let `<Image>` error to the icon, but the explicit field is simpler and SSR-safe.
- **Accessibility:** each tile is a real link with an accessible name (app name); logo `<Image>` has bilingual `alt`; icon fallback is `aria-hidden` with the visible name carrying the label.
- **Responsive:** grid reflows (e.g. 2 cols mobile → 4 cols desktop); the "…và hơn thế nữa." item wraps cleanly.
- **Motion:** reuse the existing `Reveal`/`Stagger` pattern; respects reduced motion via the existing components.
- **Bilingual:** all visible text via `t(...)`.
- No new dependencies; existing tokens only.

## 6. Out of scope
- Real logo asset creation (user provides; icon fallback covers the gap).
- Changing the product detail pages or the `EcosystemBento` section (which already shows app cards) — this is only the "Một tài khoản" block.
- A dedicated Vision Tale image (still reuses VietCreative's — unrelated to this logo grid).

## 7. Testing
- **Manual/live:** the SSO block shows the four app tiles; each links to the correct `/products/<slug>`; tiles with no logo file show the icon fallback (no broken image); reflows on mobile; VI/EN labels correct. Verified via `npm run build` + `pm2 restart cts-redesign` + a click-through.
- No new pure-logic unit needed (the icon-mapping reuse and link composition are declarative); if a small helper is introduced (e.g. resolving logo-or-icon), it gets a Vitest unit per the repo pattern.
