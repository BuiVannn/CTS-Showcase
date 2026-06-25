# GameHub Redesign — Sub-project B: hub redesign + search/filter

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** The second of three GameHub-redesign sub-projects. (B) redesigns the public hub (`/games`) into a polished, scannable showcase with **client-side search + filters** (search, classification, genre, tags) and richer game cards. Builds on sub-project A's catalog fields (tagline/genre/classification/tags). **Excludes** the Creator Studio dashboard + create/edit form (sub-project C) and any backend/server-side filtering or pagination.

---

## 1. Goal

Turn the simple card grid into a real hub: a header with the games count + submit CTA, a search box, filter pills that auto-hide when there isn't enough data, and attractive cards that surface the new metadata (cover, badges, tagline, genre/tags). Filtering is client-side over the already-loaded catalog (small list; server-side filtering is a later refinement).

## 2. Decisions (settled with user)

- **Filters:** Search (title/tagline/author) + **Classification** + **Genre** + **Tag chips**. Each filter **control auto-hides** when the catalog has fewer than 2 distinct values for it (clean when few games exist).
- **Client-side** filtering over `getCatalog()` (passed from the server page as a prop).
- No backend change (A already provides the fields).

## 3. Architecture & components

### 3.1 Pure filter module (`src/lib/game-filter.ts`, new + tested)
- `GameFilterState = { query: string; classification: string | null; genre: string | null; tag: string | null }`.
- `filterGames(games: CatalogGame[], f: GameFilterState): CatalogGame[]` — `query` is a case-insensitive substring match over `title` + `tagline` + `author`; `classification`/`genre` are exact matches when set; `tag` matches when `game.tags` includes it. Pure, unit-tested.
- `deriveFacets(games): { classifications: string[]; genres: string[]; tags: string[] }` — distinct, sorted, non-empty values (drives the pills + their auto-hide). Pure, unit-tested.
- Imports the `CatalogGame` type from `@/lib/game-catalog-map` (pure module — no `server-only`).

### 3.2 `GameCard` (`src/components/games/GameCard.tsx`, new — extracted + redesigned)
Presentational card (`game: CatalogGame`): a `<Link href={'/games/'+slug}>` containing `GameCover` (16:9) with an overlaid status/classification `Badge`; below: title, `tagline` (when present, clamped to ~2 lines), a row of genre + up to ~3 tag `Tag` chips, and "by author". Hover-lift (existing card style). Replaces the inline card markup in the current `GameHubView`.

### 3.3 `GameFilters` (`src/components/games/GameFilters.tsx`, new, client)
Controlled component: props `{ facets, state, onChange }`. Renders a search `<input>` (always shown) + a pill group per facet that has ≥2 values: Classification pills, Genre pills, Tag chips — each with an "All" option; the active pill is highlighted. A facet group with <2 values is omitted. An "active filters" summary / clear-all when any filter is set.

### 3.4 `GameHubView` (`src/components/games/GameHubView.tsx`, redesign)
Client; props `{ games: CatalogGame[] }` (unchanged signature). Holds `GameFilterState` (useState), computes `deriveFacets(games)` + `filterGames(games, state)`. Renders: a header (eyebrow + `hubTitle` + `hubLead` + games count + the existing "+ Đăng game" submit Link, kept) optionally over `AmbientField`; `<GameFilters>`; a `Stagger` grid of `<GameCard>` for the filtered list; the existing `EmptyState` component when the filtered list is empty (with a clear-filters action). Keep it the prop-driven server→client pattern (the `/games` page already passes `getCatalog()`).

### 3.5 Strings (`src/content/ui.ts`)
Add to `ui.games`: `searchPlaceholder`, `allFilter` ("All"/"Tất cả"), `filterClassification`, `filterGenre`, `filterTag`, `gamesCount` ("{n} games"/"{n} game"), `noResults`, `clearFilters`.

## 4. Behaviour & quality
- **Auto-hide:** a filter group renders only when `deriveFacets` returns ≥2 values for it — no empty/single-option dropdowns.
- **Search** matches title/tagline/author case-insensitively; combined with the active pills (AND).
- **Single source of truth:** the hub reads `getCatalog()`; lab + user games appear together; only `published` (catalog already filters).
- **Empty state:** when filters yield nothing, the existing `EmptyState` shows with a "clear filters" button.
- **No regression:** clicking a card still routes to `/games/[slug]` (the A-redesigned detail page); the submit link still points to `/games/submit`.
- **Responsive** (cards reflow 1/2/3 cols); **motion** via `Stagger`/`Reveal`; **bilingual** via `ui.games.*`; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect` (filter state is event-driven, not effect-derived).

## 5. Out of scope (B)
- Creator Studio: dashboard, create/edit form, update route (sub-project C).
- Server-side filtering / pagination / full-text search; sort controls (beyond the catalog's default order).
- Project-type + release-status filters (deferred per the chosen v1 filter set); cover/screenshot upload.

## 6. Testing
- **Unit (Vitest):** `filterGames` — query matches title/tagline/author; classification/genre exact; tag membership; combined filters (AND); empty state. `deriveFacets` — distinct/sorted, drops empties, drives auto-hide (a single-value facet → length 1 → hidden by the UI).
- **Manual/live:** `/games` shows the redesigned hub — header + count + submit CTA; cards show cover/badge/tagline/genre/tags; the search box filters; filter pills appear only when ≥2 values exist (with the current small catalog, most are hidden — verify they appear when more games/genres exist by reasoning, and that the search works now); no-result state shows the empty state + clear; a card opens the detail page. Verified via `npm run build` + `pm2 restart cts-redesign`.
