# Game Hub — Slice 2a: admin upload + sandboxed serving (3.7b)

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** Let an **admin** upload a WebGL game (ZIP) through the site; the server validates + extracts it into the games storage dir, records it in a DB, and it appears in the Game Hub, **playing from the separate sandbox origin `games.ctslab.net`**. Proves the upload + isolated-serving core with a **trusted uploader**. **Excludes** student self-registration, moderation queue, per-game subdomains, and student dashboards (slices 2b/2c).

---

## 1. Goal

A maintainer adds a new game without editing code or touching the server filesystem by hand: fill a form, upload the build ZIP, and it's live in the hub — served from an origin isolated from ctslab.net's session.

## 2. Verified foundation (feasibility done 2026-06-24)

- **`games.ctslab.net`** → Cloudflare tunnel `CTS_Showcase` → local static server on **:8090** (pm2 `games-sandbox`) serving **`/home/namnx/ctslab-games`**. `https://games.ctslab.net/_test/` → 200, **no X-Frame-Options/CSP** (iframe-able).
- Auth cookies are **host-only** (no `Domain=`), so the subdomain never receives ctslab.net's session → untrusted game JS can't hijack a logged-in user. The isolation model holds. See [[games-sandbox-infra]].

## 3. Decisions (settled with user)

- Slice **2a** = admin-only upload + sandboxed serving (trusted uploader; auto-published).
- Serve user games from the **single subdomain** `games.ctslab.net` (per-game subdomains deferred to 2b).
- Storage = local filesystem dir served by the :8090 static server.
- **Defaults to confirm in review:** optional **cover image** allowed at 2a; max upload **60 MB**.

## 4. Architecture & components

### 4.1 Env config (`.env.local` / `.env.example`)
- `GAMES_ORIGIN` (default `https://games.ctslab.net`) — public origin for user-game iframes.
- `GAMES_STORAGE_DIR` (default `/home/namnx/ctslab-games`) — extraction target (the :8090 server's root).
- `GAMES_DB` (default `./data/games.db`) — SQLite.
- `GAMES_MAX_UPLOAD_MB` (default `60`).

### 4.2 Games DB (`src/lib/games-db.ts`, new — `better-sqlite3`, already a dep)
- Table: `games(id TEXT PK, slug TEXT UNIQUE, title TEXT, author TEXT, cover TEXT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)`.
- Accessors (server-only): `listPublishedGames(): DbGame[]`, `getDbGame(slug): DbGame | undefined`, `insertGame(g)`, `deleteGame(slug)`, `slugExists(slug)`. Lazy singleton like `ptalk-usage.ts`.

### 4.3 Unified catalog (`src/lib/game-catalog.ts`, new, server-only)
- `CatalogGame = { slug, title, author, cover?, tags?, source: "lab" | "user", embedUrl: string, sandboxed: boolean }`.
- `getCatalog(): CatalogGame[]` — maps static lab games (`getGames()`, `source:"lab"`, `embedUrl = embedPath`, `sandboxed:false`) **plus** `listPublishedGames()` (`source:"user"`, `embedUrl = ${GAMES_ORIGIN}/${slug}/index.html`, `sandboxed:true`).
- `getCatalogGame(slug)` — resolve one (lab first, then DB).
- This is the single source the hub + play pages read (replacing direct `getGames()` in the views).

### 4.4 Slug + zip helpers (`src/lib/game-upload.ts`, new + tested)
- `slugify(title: string): string` — strip Vietnamese diacritics (NFD + remove combining), lowercase, non-alnum → `-`, trim dashes. Pure, unit-tested.
- `safeExtractZip(buffer, destDir)` — extract a WebGL build ZIP with **path-traversal protection** (reject entries containing `..` or absolute paths or resolving outside `destDir`), locating the directory that contains `index.html` and extracting **its contents** into `destDir` (flattens a single top-level wrapper folder). Returns `{ ok, error? }`. Uses a pure-JS zip lib (`adm-zip` or `unzipper`) added as a dep. The traversal guard is unit-tested with a malicious-path fixture.

### 4.5 Upload + delete routes (`src/app/api/admin/games/route.ts`, new — `runtime = "nodejs"`)
- `POST` (upload): `auth()` → require `session.isAdmin` (else 403). Parse `await req.formData()`: `title`, `author`, optional `slug`, optional `cover` (image), `file` (zip). Validate: zip present, size ≤ `GAMES_MAX_UPLOAD_MB`, derive/clean slug (ensure unique). `safeExtractZip` into `${GAMES_STORAGE_DIR}/${slug}/`; require `index.html` present after extract (else clean up + 400). Save cover (if any) under the storage dir or `public/games-covers/`. `insertGame({ status: "published" })`. Return `201 { slug }`. On any failure, remove partial files (no orphan dirs/rows).
- `DELETE` (`?slug=`): admin-only → `deleteGame(slug)` + `rm -rf ${GAMES_STORAGE_DIR}/${slug}`.
- Admin-gated server-side (defense in depth beyond `proxy.ts`). Generic error codes; no path/secret leakage.

### 4.6 Admin UI (`src/app/admin/games/page.tsx` + `src/components/admin/GameUploadManager.tsx`)
- Server page: re-check `session.isAdmin` (or rely on `proxy.ts` gate) + render the client manager. Lists current games (`getCatalog()` user-source) with delete buttons; a form (title, author, optional slug, optional cover, ZIP file input) that POSTs multipart to `/api/admin/games` with progress + result/errors. Bilingual.

### 4.7 Hub + play integration (modify)
- `src/components/games/GameHubView.tsx`: take a `games: CatalogGame[]` **prop** instead of calling `getGames()`; the hub `page.tsx` (server) passes `getCatalog()`.
- `src/app/games/[slug]/page.tsx` + `GamePlayView`: resolve via `getCatalogGame(slug)`; pass `embedUrl` + `sandboxed` to `GameEmbed`.
- `src/components/games/GameEmbed.tsx`: take `src` (full URL or path) + `sandboxed` boolean. When `sandboxed`, use `sandbox="allow-scripts allow-pointer-lock allow-popups"` (**no `allow-same-origin`** — different origin already isolates; omitting it hardens further) + `allow="fullscreen; autoplay"`. Lab games (`sandboxed:false`) keep the current same-origin attrs. `generateStaticParams` for `[slug]` stays from lab games only (user games are dynamic — render on demand, `dynamicParams` allowed).

## 5. Behaviour & quality
- **Security:** untrusted games served only from `games.ctslab.net` (separate origin, host-only cookies); iframe sandbox without `allow-same-origin`; **path-traversal-safe extraction**; size cap; upload/delete are `isAdmin`-gated server-side. No secret/path leakage in errors.
- **Single source of truth:** hub + play + admin list all read `getCatalog()` / the DB.
- **Resilience:** failed upload cleans up partial files + DB row; a missing `index.html` is rejected with a clear message; the static server already running means a successful upload is immediately playable.
- **Bilingual** admin UI; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect`.
- **No regression:** the lab game (tyrp) still plays same-origin; existing hub/play behaviour unchanged for it.

## 6. Out of scope (2a)
- Student registration / eligibility, **moderation/approval queue**, student "my games" dashboard, editing a game's files after upload (delete + re-upload instead) — slices 2b/2c.
- Per-game subdomains + CSP `frame-ancestors` + sitelock — slice 2b (needs wildcard cert / separate domain).
- Production-grade static server (swap python http.server → Caddy/nginx/`serve`) and object storage/CDN — scaling step.
- Auto-fixing a game's canvas sizing (the slice-1 pointer fix) — per-game, not automated.

## 7. Testing
- **Unit (Vitest):** `slugify` (Vietnamese diacritics → ascii dashes, uniqueness-friendly); `safeExtractZip` traversal guard (a fixture entry `../evil.txt` or absolute path is **rejected**, no write outside destDir); catalog mapping (`embedUrl`/`sandboxed` correct for lab vs user source).
- **Manual/live:** as admin, upload a small WebGL ZIP via `/admin/games` → it extracts to `${GAMES_STORAGE_DIR}/<slug>/`, the DB row is `published`, the hub lists it, the play page embeds it from `games.ctslab.net/<slug>/index.html` (iframe, sandboxed) and it plays; delete removes the row + files; a non-admin gets 403; a zip without `index.html` is rejected. Verified via `npm run build` + `pm2 restart cts-redesign` (+ the `games-sandbox` server already serving the dir).
