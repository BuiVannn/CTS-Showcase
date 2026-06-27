# GameHub fix + polish — bugs + UX pass

**Date:** 2026-06-27
**Status:** Draft for review
**Scope:** Fix the bugs found in user testing of the GameHub branch (detail-page 404, case-sensitive filter, cover-URL/next-image breakage, can't preview unpublished games) and improve the Creator-Studio UX (navigation/breadcrumb, always-visible form action bar, dashboard polish, delete error handling) + two minor fixes (quota split, search scope). One focused pass before continuing to sub-projects D/E.

---

## 1. Goal

Make the GameHub feel finished and correct: published games open from "Xem thử", filters work regardless of casing, the studio is easy to navigate and save from any tab, and creators can preview their own games before they go public.

## 2. Decisions (settled with user)

- **Cover:** remove the cover-URL field from the Studio form for now (image upload is sub-project D). GameCover shows its branded placeholder — avoids the `next/image` external-domain breakage entirely.
- **Preview:** the **owner (and admins)** can open the detail page for **their own game at any status** (draft/pending/rejected), with a "Chưa công khai" banner. Public visitors still only see `published`.

## 3. Bug fixes

### 3.1 Detail-page 404 for newly-published games (`src/app/games/[slug]/page.tsx`)
- **Cause:** the page is statically optimized (`dynamicParams=true` but no `force-dynamic`), so a `notFound()` rendered while a game was still pending gets cached and keeps serving 404 after approval.
- **Fix:** `export const dynamic = "force-dynamic"` (the hub already has this) so the page always reads the current catalog/DB. (Keep `generateStaticParams` or drop it — moot under force-dynamic; drop for clarity.)

### 3.2 Case-insensitive filters (`src/lib/game-filter.ts`)
- **Cause:** `filterGames` compares `classification`/`genre`/`tags` case-sensitively and `deriveFacets` dedups case-sensitively → "WebGL" ≠ "webgl", duplicate facets, wrong filtering.
- **Fix:** match case-insensitively (compare lowercased) in `filterGames`; in `deriveFacets`, dedup case-insensitively keeping a canonical display value (first-seen casing) so each value appears once. Unit-tested with mixed-case fixtures.

### 3.3 Remove the cover-URL field (`GameForm.tsx` + routes)
- Drop the cover input from the Studio form (tab ①). The create/update routes simply read no cover (stays `null`). Avoids `next/image` errors from arbitrary external cover URLs (no `images.remotePatterns` configured, and proxying user URLs is undesirable). Re-added properly in sub-project D.

### 3.4 Owner/admin preview of unpublished games (`/games/[slug]/page.tsx` + `GameDetailView`)
- The detail page resolves: published → `getCatalogGame(slug)` (public). If not public, look up the DB row (`getGamesStore().get(slug)`); if it exists AND the viewer is the **owner or admin**, render it (via the pure `mapUserGame`) with a **"Chưa công khai — chỉ bạn xem được"** banner; otherwise `notFound()`.
- `GameDetailView` gains an optional `notPublic?: boolean` prop that renders the banner at the top when true.

## 4. UX / UI (Studio)

### 4.1 Navigation (studio pages)
- Add a `Breadcrumb` (CTS Lab › Games › Studio / New / Edit) + a back-to-hub link on `studio/page.tsx`, `studio/new/page.tsx`, `studio/[slug]/edit/page.tsx`. The dashboard also links back to `/games` ("← Game Hub").

### 4.2 Form action bar (`GameForm.tsx`)
- Move the save actions out of the last tab into an **always-visible action bar** at the bottom of the form (below the tab panels), shown on every tab: **Lưu nháp** + **Gửi duyệt** (create/draft/rejected) or **Lưu thay đổi** (published/pending). Keep the validation (jump to the offending tab). Polish the tab strip (numbered + labelled + active indicator; horizontal scroll on mobile).

### 4.3 Dashboard polish (`StudioDashboard.tsx`)
- Cards (not a bare list) with a **coloured status badge** (draft=neutral, pending=amber-ish via the existing `Badge` tones, published=blue, rejected=red), title, updated hint, and the Sửa / Xem thử / Xoá actions; a nicer **empty state** (reuse `EmptyState`); a header row with "+ Tạo game mới". Match the Hub card aesthetic.
- **Delete handles errors:** check `res.ok`; on failure show an inline message instead of silently refreshing.

## 5. Minor fixes
- **5.1 Quota split** (`/api/games/studio`): the **pending limit** blocks only **submit** (`status==="pending"`); the **total limit** blocks any create. So a creator at the pending cap can still save a **draft** (under the total cap).
- **5.2 Search scope** (`game-filter.ts`): include `genre` + `tags` in the search haystack (already lowercased).

## 6. Out of scope
- Image/screenshot **upload** (sub-project D) — cover stays a placeholder.
- Per-game **subdomain** (sub-project E).
- Zip-bomb hardening (gate actual decompressed bytes vs the declared `header.size`) — a separate hardening note.
- Broader redesign beyond the studio/detail touch-points above.

## 7. Testing
- **Unit (Vitest):** `filterGames` matches case-insensitively (filter "webgl" finds a game tagged "WebGL"; classification/genre case-insensitive); `deriveFacets` collapses "WebGL"/"webgl" to one canonical facet. `nextStatusOnEdit` unchanged (still green). A `game-filter` mixed-case fixture.
- **Manual/live:** create a game via Studio → **Xem thử** shows it (owner preview, "Chưa công khai" banner) even before approval; admin approves → public `/games/<slug>` opens (no 404). The hub filter pills/search work across mixed-case tags. The form saves from any tab via the bottom bar. Studio pages have a breadcrumb/back link. Delete shows an error if it fails. A non-owner still can't preview another's unpublished game (notFound). Verified via `npm run build` + `pm2 restart cts-redesign`.
