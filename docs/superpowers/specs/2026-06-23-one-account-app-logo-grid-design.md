# "Một tài khoản" → App Logo Grid + 3 new ecosystem apps (Quick win 3.1)

**Date:** 2026-06-23 (rev. 2)
**Status:** Draft for review
**Scope:** (a) Add three new ecosystem apps — **KidMentor, PTalk Signature, P-Connect** — as full products with mock content + real (temporary, background) logos; (b) replace the text paragraph in the "Một tài khoản / One Account" (SSO) block with a grid of clickable app **logos** linking to each app's detail page, showing **all 7 apps**. No backend/auth changes.

---

## 1. Goal

Make "one account for every app" tangible: a grid of app tiles (logo + name) in the "Một tài khoản" block, each linking to its product detail page, ending with "…và hơn thế nữa." At the same time, grow the ecosystem from 4 to 7 apps so the grid (and the existing "Hệ sinh thái" section + `/products`) reflect the full product family.

## 2. Decisions (settled with the user)

- **7 apps in the grid:** the 4 existing (`PTalk`, `VietCreative`, `Vision Tale`, `Unilearn`) + 3 new (`KidMentor`, `PTalk Signature`, `P-Connect`).
- **3 new apps = full products with mock content:** added to the `ecosystem` data so they get detail pages and also appear in the "Hệ sinh thái" section and `/products`. Copy (excerpt/description/features/tags) is **mock/placeholder** for now; real logos are used.
- **Logos:** the user provides **3 real logos (images WITH background, temporary)** for KidMentor, PTalk Signature, P-Connect. The other 4 apps have **no logo yet → fall back to the app icon**. Each tile renders the logo if `app.logo` is set, else the icon — so the grid works today and upgrades when assets/logos arrive (drop-in, no code change).
- **Tile artwork is framed** (bordered rounded tile) so background-bearing logos still look clean.

## 3. Asset deliverable (user provides)

Place the 3 logo files (any of png/jpg/webp; background is fine for now) at:

```
public/img/logos/kidmentor.png
public/img/logos/ptalk-signature.png
public/img/logos/p-connect.png
```

Filenames match the app **slug**. If a file isn't there yet, that tile shows the app's icon (no broken image). The 4 existing apps can get logos later by dropping `public/img/logos/<slug>.png` and setting `logo` on their data entry.

## 4. Architecture & components

### 4.1 Types (`src/content/types.ts`)
- Extend `IconKey` with keys for the new apps, e.g. add `"graduation" | "signature" | "bluetooth"` (final lucide choice during implementation; any sensible mapping).
- Extend `EcosystemCategory` if needed for P-Connect (e.g. add `"connectivity"`); reuse existing categories for KidMentor (`learning-ai`) and PTalk Signature (`ai-voice`).
- Add an optional `logo?: string` field to `EcosystemApp` (public path, e.g. `/img/logos/kidmentor.png`).

### 4.2 Shared icon map (`src/content/icons.ts`, new — small refactor)
- Centralize the `IconKey → lucide component` map currently inline in `ProductDetail.tsx` so both `ProductDetail` and the new grid use one source. Update `ProductDetail.tsx` to import it (no behaviour change). Add the new icons to the map.

### 4.3 New ecosystem entries (`src/content/ecosystem.ts`)
- Append 3 entries with **mock bilingual content** + `logo`:
  - **KidMentor** — slug `kidmentor`, category `learning-ai`, icon `graduation`, logo `/img/logos/kidmentor.png`. Mock copy: an AI learning companion for children.
  - **PTalk Signature** — slug `ptalk-signature`, category `ai-voice`, icon `signature`, logo `/img/logos/ptalk-signature.png`. Mock copy: the signature voice-assistant experience.
  - **P-Connect** — slug `p-connect`, category `connectivity`, icon `bluetooth`, logo `/img/logos/p-connect.png`. Mock copy: connects the lab's assistant devices (Bluetooth).
- Each entry has the same shape as existing apps (name, slug, year, category, categoryLabel, icon, excerpt, description, features, tags, downloadHref `#`, image). For `image`, point to the logo path for now (or an existing placeholder) so detail pages and the "Hệ sinh thái" cards render without a broken image.

### 4.4 Grid component (`src/components/home/OneAccountApps.tsx`, new)
- Reads `getProducts()`; renders a responsive grid of all apps.
- Each tile: a framed square showing `<Image src={app.logo}>` when `app.logo` is set, else the app icon (from the shared map); the app **name**; wrapped in `<Link href={'/products/' + app.slug}>` with hover lift; bilingual `alt`/labels.
- A trailing "…và hơn thế nữa." / "…and more." label.

### 4.5 Integration (`src/components/home/HomeStats.tsx`)
- In the SSO sub-card: keep `sso.caption` eyebrow + `sso.title`; replace `<p>{t(sso.description)}</p>` with a short one-line lead + `<OneAccountApps />`.

### 4.6 Strings
- Add a short bilingual lead + the "…và hơn thế nữa." label (in `sso.ts` or `ui.ts`). The long `sso.description` stays in data (unused in this block).

## 5. Behaviour & quality
- **Fallback:** missing `logo` → app icon (no broken `<img>`).
- **Accessibility:** tiles are real links named by the app; logo `<Image>` has bilingual `alt`; icon fallback `aria-hidden` with the visible name as the label.
- **Responsive:** grid reflows (≈2 cols mobile → 4 desktop) for 7 tiles + the "more" label.
- **Motion:** reuse `Reveal`/`Stagger`; respects reduced motion.
- **Bilingual** throughout; existing tokens only; no new dependencies.
- **Mock content is clearly serviceable** (no "lorem ipsum"); written as plausible placeholder so detail pages don't look broken.

## 6. Out of scope
- Final marketing copy for the 3 new apps (mock now; real copy later).
- Transparent/branded logos for all 7 (background logos used temporarily; 4 apps use icon fallback until assets arrive).
- The KidMentor "đặt thiết bị vật lý" block (that is item 3.5 — a separate quick win).
- Changes to `EcosystemBento` beyond what naturally follows from the data gaining 3 apps.

## 7. Testing
- **Unit (Vitest):** the existing `products`/`showcase` content tests already validate data shape; if a `logo-or-icon` resolver helper is introduced, add a small unit (in/out logo present). Extend the products test to assert the 3 new slugs exist and resolve.
- **Manual/live:** SSO block shows 7 tiles; the 3 new apps show their logos, the other 4 show icons; every tile links to the correct `/products/<slug>`; the 3 new detail pages render with mock content; `/products` + "Hệ sinh thái" now list 7 apps; mobile reflow OK; VI/EN correct. Verified via `npm run build` + `pm2 restart cts-redesign` + click-through.
