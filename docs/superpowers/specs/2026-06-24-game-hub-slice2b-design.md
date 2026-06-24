# Game Hub — Slice 2b: student submissions + moderation + security shields (3.7c)

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** Open game uploads to **any logged-in user** (not just admin), but gate them behind a **moderation queue** — submissions are `pending` until an admin approves. Add the **security shields** required for untrusted uploaders: zip-bomb limits, per-user quotas, and a CSP `frame-ancestors` lock on the game origin. Builds on slice 2a (upload pipeline, sandboxed serving, `games.ctslab.net`). **Excludes** per-game subdomains and the full student dashboard (later).

---

## 1. Goal

A student signs in, submits their WebGL game, and sees "pending review". An admin reviews the queue and approves (→ public in the hub) or rejects (→ removed). Untrusted uploads cannot harm the server, exhaust resources, or be hotlinked.

## 2. Decisions (settled with user)

- **Eligibility:** any authenticated SSO user may submit. The **moderation gate** (admin approval before public) is the trust boundary — not an upload allowlist.
- **Per-game subdomain: deferred.** Approved games still serve from the single `games.ctslab.net` (acceptable because only *vetted* games go public). Per-game `*.games.ctslab.net` is a later sub-step once the wildcard-cert/cost decision is made.
- Reuse slice-2a infra (storage dir, `games-sandbox` static server, SQLite, `safeExtractZip`).

## 3. Threat model → shields (the point of this slice)

| Threat | Reaches | Shield (this slice) |
|---|---|---|
| Virus/binary in zip "infecting" server | — | **None needed:** server never executes uploads; files are inert bytes served statically (design invariant — keep it). |
| **Zip slip** (entry `../../etc/...` overwrites server files) | Server FS | Already shipped: `resolveInside` rejects escaping entries (2a). Keep + covered by tests. |
| **Zip bomb** (50MB → 100s of GB on extract) | Server disk/RAM (DoS) | **NEW:** pre-extract caps — total uncompressed size, file count, per-file size → reject before writing. |
| Disk exhaustion / spam uploads | Server disk | **NEW:** per-user **quota** (max pending + max total) + moderation. |
| Malicious game JS (steal session, break out) | Visitor browser | Origin isolation + iframe sandbox (2a). **NEW:** CSP `frame-ancestors` (game embeddable only on ctslab.net) + moderation. |
| Hotlinking / embedding the game elsewhere / phishing frame | Visitors | **NEW:** CSP `frame-ancestors https://ctslab.net` on the game origin. |
| Malware distribution via the platform | Downloaders | **Moderation** (admin reviews before public) + serve-not-download. |
| Cross-game data snooping (shared localStorage) | Other games | Partially open in 2b (single origin); closed later by per-game subdomains. Mitigated now because only vetted games are public. |
| *(Optional)* known-malware files | — | ClamAV scan on upload — noted as optional/future (low priority: static, non-executed files). |

## 4. Architecture & components

### 4.0 Env config (all limits adjustable without code changes)
All thresholds are env vars with the agreed defaults (documented in `.env.example`; real values overridable in `.env.local`):
- `GAMES_MAX_UNCOMPRESSED_MB` (default `300`) — total size after extraction.
- `GAMES_MAX_FILES` (default `2000`) — entry count per zip.
- `GAMES_MAX_FILE_MB` (default `100`) — largest single extracted file.
- `GAMES_MAX_PENDING_PER_USER` (default `3`).
- `GAMES_MAX_TOTAL_PER_USER` (default `10`).
- (existing from 2a: `GAMES_MAX_UPLOAD_MB` (default `100`) — compressed zip size; `GAMES_ORIGIN`, `GAMES_STORAGE_DIR`, `GAMES_DB`.)

### 4.1 Data model (`src/lib/games-db.ts`, extend)
- Add columns: `owner_id TEXT`, `owner_email TEXT`, and use `status` ∈ `{ "pending", "published", "rejected" }`. (Migration: `ALTER TABLE ... ADD COLUMN` guarded by a `PRAGMA table_info` check, or recreate-if-missing — implement a tiny idempotent migration in `createGamesStore`.)
- New accessors: `listByStatus(status)`, `listByOwner(ownerId)`, `countByOwner(ownerId, status?)`, `setStatus(slug, status)`. `getCatalog()` continues to show only `published`.

### 4.2 Zip-bomb limits (`src/lib/game-upload.ts`, extend `safeExtractZip`)
- Add an options arg `limits?: { maxTotalBytes; maxFiles; maxFileBytes }`. **Before writing anything**, sum each entry's uncompressed size (`entry.header.size`) and count; if total > `maxTotalBytes`, files > `maxFiles`, or any single entry > `maxFileBytes` → return `{ ok:false, error:"too-big-uncompressed" }`. Caller passes limits from env (defaults 300 MB / 2000 files / 100 MB per file — see §4.0). Unit-tested with a crafted high-ratio entry set (assert rejection without writing).

### 4.3 Quota (`src/lib/games-db.ts` counts + route check)
- Env: `GAMES_MAX_PENDING_PER_USER` (default 3), `GAMES_MAX_TOTAL_PER_USER` (default 10). On submit: if `countByOwner(uid,"pending") >= maxPending` or `countByOwner(uid) >= maxTotal` → `429 { error:"quota" }`.

### 4.4 Submission route (`src/app/api/games/submit/route.ts`, new — `runtime="nodejs"`)
- `POST`: require `auth()` (any user; **not** admin) → 401 else. Quota check (4.3). Parse formData (title, author, zip). Size ≤ `GAMES_MAX_UPLOAD_MB`. Slug unique. `safeExtractZip(buffer, dest, { limits })` (4.2) — on failure clean up + return the error. `insertGame({ status:"pending", owner_id, owner_email })`. Return `202 { slug, status:"pending" }`. Files extract to the storage dir (servable but **not listed** until published; unguessable enough for review-window; deleted on reject).

### 4.5 Submission UI (`src/app/games/submit/page.tsx` + `src/components/games/SubmitGameForm.tsx`)
- Server page: `auth()`; if not signed in → a "sign in to submit" prompt (not a redirect). If signed in → the submit form + **the user's own submissions** with status badges (`pending`/`published`/`rejected`) via `listByOwner`. Bilingual. A link to this page from the Game Hub ("Submit your game").
- Client form: title, author, `.zip` → POST `/api/games/submit`; show pending confirmation + quota/errors; `router.refresh()`.

### 4.6 Moderation UI (`src/app/admin/games/page.tsx`, extend; `GameUploadManager` → add a pending queue)
- Admin page now shows a **Pending queue** (status `pending`): each row has title/author/owner + a **Preview** link (`${GAMES_ORIGIN}/<slug>/index.html`, open in new tab) + **Approve** / **Reject** buttons. Plus the existing published list (delete). Admin can still upload directly (auto-published, as 2a).

### 4.7 Moderation actions (`src/app/api/admin/games/route.ts`, extend)
- `PATCH` (`{ slug, action: "approve" | "reject" }`, admin-only): approve → `setStatus(slug,"published")`; reject → `setStatus(slug,"rejected")` + `rmSync` the game's files (via the `resolveInside` guard). Keep existing POST (admin direct upload) + DELETE.

### 4.8 CSP `frame-ancestors` on the game origin (infra)
- The game responses from `games.ctslab.net` must carry `Content-Security-Policy: frame-ancestors https://ctslab.net` so a game can only be framed by ctslab.net (blocks hotlinking + phishing frames). **python http.server can't set custom headers**, so set it via a **Cloudflare Response-Header Transform Rule** on `games.ctslab.net` (dashboard; no server change). *(Alternative/upgrade: replace the static server with Caddy/nginx, which also sets headers + faster serving of large `.unityweb` — a recommended but separate scaling step.)* Document the exact header for the user/leader to add.
- `X-Content-Type-Options: nosniff` recommended on the same rule.

### 4.9 ClamAV (optional, future)
- Note only: an upload-time virus scan (ClamAV `clamd`) could be added as defense-in-depth. Low priority since files are static and never executed server-side; revisit if downloadable non-game files are ever allowed.

## 5. Behaviour & quality
- **Server safety:** uploads never execute on the server; zip slip rejected (2a); zip bomb rejected pre-write (4.2); quotas + moderation bound disk/abuse.
- **Visitor safety:** approved games serve cross-origin + iframe-sandboxed (2a) + CSP frame-ancestors (4.8); only vetted games are public.
- **Moderation integrity:** only `published` games appear in `getCatalog()`/hub; pending/rejected are hidden; reject deletes files.
- **Quota/limits** enforced server-side; generic error codes (`auth`/`quota`/`too-big-uncompressed`/`no-index`/…). No path/secret leakage.
- Bilingual UI; existing tokens; SQLite (behind the store seam); no `eslint-disable`; no `react-hooks/set-state-in-effect`.

## 6. Out of scope (this slice)
- **Per-game subdomains** `*.games.ctslab.net` + wildcard cert (next sub-step; needs the cost/infra decision).
- **Full student dashboard** (edit/replace/analytics for own games) — slice 2c; 2b only shows the submitter a read-only status list.
- ClamAV implementation; switching the static server to Caddy/nginx (scaling step); object storage/CDN migration.
- Payments / per-app purchase (3.10).

## 7. Testing
- **Unit (Vitest):** `safeExtractZip` with `limits` rejects an entry-set exceeding `maxTotalBytes`/`maxFiles`/`maxFileBytes` **without writing** (crafted fixture); accepts a within-limits zip. `games-db` migration adds columns idempotently; `listByStatus`/`countByOwner`/`setStatus` behave; `getCatalog` excludes non-`published`.
- **Manual/live:** a non-admin user submits a game → status `pending`, NOT in the hub; admin sees it in the queue, Preview works, **Approve** → appears in hub + plays; **Reject** → removed + files deleted; quota blocks the 4th pending; an oversized-on-extract zip is rejected; after the Cloudflare CSP rule, `curl -I https://games.ctslab.net/<slug>/index.html` shows `content-security-policy: frame-ancestors https://ctslab.net` and the game refuses to embed on a non-ctslab.net page. Verified via `npm run build` + `pm2 restart cts-redesign`.
