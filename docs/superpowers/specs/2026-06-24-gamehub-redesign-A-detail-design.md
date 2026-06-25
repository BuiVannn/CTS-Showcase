# GameHub Redesign — Sub-project A: rich data model + redesigned detail page

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** The first of three GameHub-redesign sub-projects. (A) expands the game data model with the curated metadata fields and **redesigns the game detail page** (`/games/[slug]`) into a premium, itch.io-inspired but CTS-Lab-styled page. **Excludes** the hub-list redesign + filters (sub-project B) and the Creator Studio dashboard + create/edit form (sub-project C). No image/screenshot upload (cover is a URL for now).

---

## 1. Goal

Give each game a real "project page": cover/hero, tagline, creator, metadata badges, the playable build, a Markdown description, links, and a community stub — laying the data foundation that B (hub) and C (studio form) build on. The detail page must look finished even though the form to author this data ships in C; the lab game `tyrp` is backfilled with sample metadata to demo it.

## 2. Data model (foundation for A/B/C)

### 2.1 DB games table (`src/lib/games-db.ts`, extend — one idempotent migration)
Add nullable columns (PRAGMA-guarded `ALTER TABLE`, like the 2b migration): `tagline TEXT`, `description TEXT` (Markdown), `classification TEXT`, `project_type TEXT`, `release_status TEXT`, `genre TEXT`, `tags TEXT` (CSV), `video_url TEXT`, `external_url TEXT`, `updated_at TEXT`. The `status` enum gains `"draft"` (used by C; harmless now). Update `DbGame` + the `insert` SQL to carry the new columns; add an `update(slug, patch)` accessor (used by C — define it now so the seam exists, with a unit test).

### 2.2 Static lab game (`src/content/types.ts`, `src/content/games.ts`)
Extend the `Game` interface with optional fields: `tagline?: Localized`, `description?: Localized` (Markdown), `classification?: string`, `projectType?: string`, `releaseStatus?: string`, `genre?: string`, `externalUrl?: string`, `videoUrl?: string`. Backfill `tyrp` with sample values (VI/EN tagline + a short Markdown description, `classification:"game"`, `projectType:"web"`, `releaseStatus:"released"`, `genre`) so the redesigned page demos rich content.

### 2.3 Unified catalog (`src/lib/game-catalog.ts`, extend)
`CatalogGame` gains: `tagline?: Localized` (lab) / plain — see note; `description?: string` (resolved Markdown); `classification?`, `projectType?`, `releaseStatus?`, `genre?`, `externalUrl?`, `videoUrl?`; keep `tags?: string[]`. Mapping:
- **Lab:** `tagline` from the static `tagline`/`blurb` (`Localized`); `description` from the static `description` resolved to a string (see below); badges from the static fields; `tags` from static.
- **User (DB):** `tagline`/`description` plain strings from the columns; `tags` from the CSV column (fallback `[]`); badges from the columns.
- **Bilingual note:** lab text fields are `Localized`; user text is single-language (as entered). To keep the client view simple, `CatalogGame` carries `tagline` as `Localized | string` resolved in the client via a small `resolveText(t, v)` helper (`typeof v === "string" ? v : t(v)`), and `description` as a plain string (lab: pre-resolved to VI in the mapping, since the detail prose is one block — acceptable for v1; full bilingual prose is a later refinement).

## 3. Detail page redesign (`/games/[slug]`)

### 3.1 Route (`src/app/games/[slug]/page.tsx`, modify)
Server: `getCatalogGame(slug)` → `notFound()`; `generateStaticParams` from lab games (`dynamicParams=true`); render `<GameDetailView game={g} />`. Keep `metadata`.

### 3.2 `GameDetailView` (`src/components/games/GameDetailView.tsx`, new — replaces `GamePlayView`)
Client component (`useLocale` for bilingual chrome). Layout, top→bottom, all degrading gracefully when a field is absent:
- **Breadcrumb** (CTS Lab › Games › title) + back-to-hub link.
- **Hero:** an `AmbientField tone="warm"` band holding: the **cover** (16:9 `GameCover`, or branded placeholder) beside/over a column with **title** (`text-section`), **tagline**, **creator** ("bởi {author}"), and **badges** (`release_status`, `classification`, `project_type`) via `Badge`. Primary CTA depends on `projectType`: web → "Chơi ngay" (scrolls to/anchors the embed); external → "Mở liên kết" (`external_url`); video → "Xem video".
- **Play section** (web builds): the existing `<GameEmbed src={embedUrl} title>` (16:9 + fullscreen) with the heavy-game note. (External/video types show a link card instead of the iframe.)
- **Two-column body** (`lg:grid-cols-[1.6fr_1fr]`):
  - **Main:** "Giới thiệu" → the `description` rendered with the existing `<MessageContent>` (Markdown + KaTeX). Graceful empty state if no description.
  - **Sidebar:** a **meta card** (creator, genre, tags as `Tag` chips, classification, project type, release status, date); a **Links** block (`external_url`, `video_url` when present); a **community stub** card ("Bình luận — sắp ra mắt", disabled).
- Motion: `Reveal`/`Stagger` for the sections; existing tokens; bilingual chrome labels via `ui.games.*` (add a few: `about`, `links`, `comingSoonComments`, `play`/`openLink`/`watchVideo`, badge label helpers).

### 3.3 Retire `GamePlayView`
`GameDetailView` supersedes `GamePlayView`; remove the old component and its import. `GameEmbed`/`GameCover`/`MessageContent` are reused unchanged.

## 4. Behaviour & quality
- **Graceful degradation:** every new field is optional; the page renders cleanly for the existing minimal games (only `tyrp` is backfilled) and for future rich ones. No field → its block is omitted (no empty headers).
- **Single source of truth:** the page reads only `getCatalogGame()`; lab + user games render through the same component.
- **No regression:** the playable embed still works (web builds keep `GameEmbed` with the slice-2a sandbox/allow-same-origin fix); `tyrp` still plays.
- **Security/safety:** `description` is rendered via `MessageContent` (react-markdown, **no raw HTML** → no XSS) — important since C will let users author it. `external_url`/`video_url` open with `rel="noopener noreferrer"` `target="_blank"`.
- **Bilingual** chrome; existing tokens/components; responsive (stacks on mobile); no `eslint-disable`; no `react-hooks/set-state-in-effect`.

## 5. Out of scope (A)
- Hub list redesign + search/filters (sub-project B).
- Creator Studio: dashboard, the multi-section create/edit form, the update route (sub-project C) — A only adds the `update()` store seam + columns.
- Image/screenshot **upload** + gallery; trailer **embed** (links only); real comments/community; AI disclosure / store links / changelog.
- Full bilingual long-form description (v1 description is one resolved block).

## 6. Testing
- **Unit (Vitest):** the migration adds the columns idempotently + existing rows survive; `update(slug, patch)` updates only the given fields; `getCatalog` maps the new fields for lab (`tyrp`) + user sources (badges/tags/tagline/description present).
- **Manual/live:** `/games/tyrp` shows the redesigned page — hero with cover/tagline/badges, the playable embed, the Markdown description, the meta sidebar + community stub; a minimal user game (e.g. `test`) renders gracefully (no tagline/description → those blocks omitted) and still plays; mobile reflow OK. Verified via `npm run build` + `pm2 restart cts-redesign`.
