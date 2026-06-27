# GameHub Redesign — Sub-project C: Creator Studio (dashboard + create/edit form)

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** The third GameHub-redesign sub-project. (C) gives creators a **Studio**: a "my games" dashboard + a multi-section **create/edit form** with **draft / submit-for-review** flow + an owner-scoped **update/delete** API, with correct status-transition business logic. Builds on the A data model + the 2b upload/moderation pipeline. **Excludes** image/screenshot upload (sub-project D — cover stays a URL) and per-game subdomains (sub-project E).

---

## 1. Goal

A signed-in creator manages their games end to end: see all their games with status, create a new game through a clean multi-tab form, save it as a **draft**, submit it for **review**, and **edit** an existing game — with sensible rules about when an edit re-enters moderation. Admins keep their separate moderation queue (2b).

## 2. Decisions (settled with user)

- **Draft + submit:** creators can **Lưu nháp** (status `draft`, not in moderation) or **Gửi duyệt** (status `pending`). The `draft` status already exists (A migration).
- **Edit of a published game:** metadata edits go **live immediately** (stays `published`); uploading a **new build** sends it **back to `pending`** (re-moderation of the playable content).
- **Form = 5 tabs** (decided in the overall redesign): Cơ bản · Phân loại · Tải lên · Mô tả · Hiển thị.
- Reuse the A data model (all metadata columns), the 2b upload pipeline (`safeExtractZip` + zip-bomb limits + quota), and the `games-db` `update()` / `listByOwner` / `setStatus` seams.

## 3. Status-transition business logic (the core)

| From | Action | To | Notes |
|---|---|---|---|
| (none) | Create → **Lưu nháp** | `draft` | requires a build zip + title; metadata optional |
| (none) | Create → **Gửi duyệt** | `pending` | enters moderation |
| `draft` | edit → Lưu nháp | `draft` | |
| `draft` / `rejected` | edit → **Gửi duyệt** | `pending` | (re)enters moderation |
| `pending` | edit → Lưu | `pending` | minor edits while waiting; stays in queue |
| `published` | edit **metadata only** | `published` | live immediately (typo/desc fixes) |
| `published` | edit **with new build zip** | `pending` | re-moderation of the playable content |
| any (owner) | **Delete** | removed | DB row + extracted files deleted |

- **Visibility:** `getCatalog()` shows only `published` (unchanged) — draft/pending/rejected are visible only to the **owner** (Studio) and **admins** (moderation queue).
- **Quota:** the 2b per-user limits (`countByOwner` pending + total) apply on **create** (drafts count toward total). Editing an existing game does not consume quota.
- **Ownership = the security boundary:** the update/delete routes MUST verify `game.owner_id === session user id/email` OR `session.isAdmin`; otherwise `403`. A non-owner can never edit/delete another's game.
- **Slug is immutable after create** (stable URLs + the on-disk `<slug>/` dir); the title can change, the slug cannot.

## 4. Architecture & components

### 4.1 Routes
- `src/app/games/studio/page.tsx` (server, auth): the dashboard. Not signed in → a sign-in prompt (no redirect). Signed in → `StudioDashboard` with the owner's games (`getGamesStore().listByOwner(uid)`).
- `src/app/games/studio/new/page.tsx` (server, auth): `<GameForm mode="create" />`.
- `src/app/games/studio/[slug]/edit/page.tsx` (server, auth + owner check): resolve the game; if not owner (and not admin) → `notFound()`/redirect; render `<GameForm mode="edit" initial={…} slug={…} />`.
- `src/app/games/submit/page.tsx`: **redirect** to `/games/studio/new` (consolidate the 2b basic form into the studio). The hub's "+ Đăng game" link → `/games/studio`.

### 4.2 Components
- `src/components/games/studio/StudioDashboard.tsx` (client): the owner's games as cards (cover/placeholder + title + **status badge** + updated date) with actions **Sửa** (→ `/games/studio/<slug>/edit`), **Xem thử** (→ `/games/<slug>`), **Xoá** (DELETE + confirm), and a prominent **"+ Tạo game mới"** (→ `/games/studio/new`). Empty state when none.
- `src/components/games/studio/GameForm.tsx` (client): the 5-tab form (a lightweight `FormTabs` + per-tab field groups). Props `{ mode, initial?, slug? }`. Holds form state; renders tabs:
  - **① Cơ bản:** `title`, `slug` (auto from title on create, read-only on edit), `tagline`, `author`, `cover` (URL).
  - **② Phân loại:** `classification` (select: game/app/tool/demo/educational), `projectType` (web/external/video), `releaseStatus` (in_dev/released/prototype), `genre`, `tags` (comma-separated).
  - **③ Tải lên:** the build `.zip` (required on create; optional on edit — "replace build"), with the project-type note; for `external`/`video` types, the `externalUrl`/`videoUrl` field instead.
  - **④ Mô tả:** `description` (Markdown textarea + a live **preview** via the existing `MessageContent`).
  - **⑤ Hiển thị:** the status/actions — **Lưu nháp** + **Gửi duyệt** (create/draft/rejected) or **Lưu thay đổi** (edit published) — with a short explanation of what each does. Validation/errors surface here.
- `src/components/games/studio/FormTabs.tsx` (client, small): a controlled tab strip + panels (or accordion on mobile).

### 4.3 API
- **Create** (`POST /api/games/studio`, new — `runtime="nodejs"`, auth): the rich create. Auth (any user) → 401; quota (2b) → 429; parse multipart (all metadata + `status` ∈ {draft,pending} + the zip). Validate (title required; zip required + `safeExtractZip` with the 2b zip-bomb LIMITS into `<slug>/`); unique slug via `slugify`+`exists`. `insert` the core row with the chosen `status` + owner, then `update(slug, {…metadata, updated_at})`. Return `201 { slug, status }`. (The 2b `/api/games/submit` route is superseded by this; remove it + its page → redirect.)
- **Update** (`PUT /api/games/[slug]`, new — `runtime="nodejs"`, auth): resolve the game; **owner-or-admin gate** (403 else). Parse multipart (metadata + `status` intent + optional new zip). Apply the status-transition table (§3): metadata `update()`; if a new zip → `safeExtractZip` (limits) replacing `<slug>/` + force `status="pending"`; else honour the submitted status per the rules (draft↔pending; published stays published on metadata-only). Always set `updated_at`. Return `200 { slug, status }`.
- **Delete** (`DELETE /api/games/[slug]`): owner-or-admin gate → `remove(slug)` + `rmSync` the `<slug>/` dir (via the `resolveInside` guard). Return `{ ok: true }`. (Admin moderation `PATCH`/admin-upload `POST` stay at `/api/admin/games`.)
- A pure, tested helper `nextStatusOnEdit(current, submittedStatus, hasNewBuild)` encodes §3's transition rules (so the route logic is unit-tested).

### 4.4 Strings (`src/content/ui.ts`)
- A `ui.studio` block (bilingual): dashboard title/empty, the tab labels, field labels/placeholders, `saveDraft`, `submitReview`, `saveChanges`, status labels, action confirmations, validation/error messages, the per-action explanations.

## 5. Behaviour & quality
- **Aesthetic:** matches CTS Lab — `AmbientField`/header on the dashboard, cards with status badges (reuse `Badge`), the form in a clean card with a tab strip, soft surfaces, `Reveal`/`Stagger`, the existing tokens; responsive (tabs → stacked/accordion on mobile); a Markdown **preview** in the description tab. Not an enterprise admin grid.
- **Security/ownership:** every owner-scoped route verifies ownership-or-admin server-side (403); `description`/metadata are stored as-is but rendered via `MessageContent` (no raw HTML → no XSS); the build extraction reuses the path-traversal-safe + zip-bomb-limited pipeline (2b); slug immutable.
- **Moderation integrity:** only `published` reaches the public catalog; new builds always re-enter `pending`; admins keep the 2b queue.
- **Single source of truth:** the studio reads `games-db` (`listByOwner`); the public hub/detail read `getCatalog()`. No duplication of the game list.
- Bilingual; existing tokens; SQLite behind the seam; no `eslint-disable`; no `react-hooks/set-state-in-effect` (form state is event-driven).

## 6. Out of scope (C)
- **Image/screenshot upload** (sub-project D) — cover is a URL field; no gallery.
- **Per-game subdomain** (sub-project E).
- Trailer embedding (link only), real comments/community, AI disclosure, external store links, changelog, duplicate-game, multi-owner/teams.
- Admin-side studio (admins manage via the 2b queue + can edit any via the same owner-or-admin routes).

## 7. Testing
- **Unit (Vitest):** `nextStatusOnEdit(current, submitted, hasNewBuild)` — covers every §3 row (draft→draft/pending; rejected→pending; pending→pending; published+metadata→published; published+newBuild→pending). `games-db` `update`/`listByOwner`/`setStatus` already tested (A/2b) — add a test that `listByOwner` returns mixed statuses for the owner.
- **Manual/live:** sign in (non-admin) → `/games/studio` (empty) → "Tạo game mới" → fill the 5 tabs → **Lưu nháp** → appears as `draft` (not in hub) → **Gửi duyệt** → `pending` → admin approves → `published` (in hub, plays). Edit the published game's description → stays published (live). Edit + replace the build → back to `pending`. A non-owner hitting `/games/studio/<other>/edit` or `PUT/DELETE /api/games/<other>` → 403/blocked. Delete → gone + files removed. Verified via `npm run build` + `pm2 restart cts-redesign`.
