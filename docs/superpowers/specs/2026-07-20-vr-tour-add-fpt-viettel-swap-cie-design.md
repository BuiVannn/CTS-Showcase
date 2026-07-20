# VR Tour — Add Lab FPT + Lab Viettel, Swap CIE (safe, no-downtime)

**Date:** 2026-07-20
**Status:** Approved (design), pending implementation plan
**Scope:** One implementation cycle.

## 1. Goal

Three krpano sub-tours were delivered as zips in `folder_tmp/`:

- **`Fpt.zip`** — a new lab tour ("Lab FPT"), inside the PTIT campus.
- **`Viettel.zip`** — a new lab tour ("Lab Viettel"), inside the PTIT campus.
- **`Cie.zip`** — an updated/expanded version of the existing CIE center tour (replaces the current one).

Publish all three on the VR page **without breaking the running production system**, following the exact pattern the existing CIE sub-tour already uses. FPT and Viettel are labs *inside* the campus, so they appear as ordinary locations in the campus tour sidebar — not as external/partner destinations.

## 2. Current architecture (as-is)

- Route `src/app/vr-tour/page.tsx` → `src/components/VRTourShell.tsx` renders one fullscreen `<iframe>` whose `src` is driven by React state.
- `src/lib/vr-viewer.ts` hard-codes exactly two modes:
  - `campus` → `/vr-tour/tour.html` — the PTIT tour, which has a **custom shell** (`app.js`, `style.css`, sidebar, popups).
  - `cie` → `/vr-tour/vtour-cie/tour.html` — a **plain krpano** export, iframe-embedded.
- **Tour switch mechanism:** in the campus `app.js` (~line 1491), the sidebar item for group "Trung tâm CIE" is intercepted on click and, instead of `loadscene`, it `postMessage({type:'cts-vr-load', src:'/vr-tour/vtour-cie/tour.html'}, location.origin)` to the parent shell. `parseViewerMessage` in `vr-viewer.ts` validates origin + type + a **whitelist of known src URLs**, then the shell swaps the iframe. The "back" button is provided by the shell chrome (`ViewerChrome`), not by the sub-tour.
- Sidebar rendering: `sceneGroups` (array of `{title, scenes:[id]}`) + per-scene `sceneData` (title/thumb/description). A sidebar item is only rendered if `getSceneMeta(id).thumb` resolves (`app.js` `getSidebarGroups`, filter `scene.thumb`). The CIE item hangs off a real campus scene id (`scene_gpbk2224_1773131289876`) that has a thumbnail; its click is intercepted before `loadscene`.
- `public/vr-tour` **is tracked in git** (~24,768 files; current `vtour-cie` = 4,712 files / 83 MB, committed at `a8218077`). Next.js serves `public/` directly, so static assets go live **without a rebuild**.

## 3. Delivered payloads (verified)

| Zip | Web-tour subdir | Web payload | Non-web junk to drop | Ships `thumb.jpg`? |
|---|---|---|---|---|
| `Cie.zip` (505 MB) | `vtour/` | **258 MB** | ~225 MB source `Cie_*.png` at zip root | 24 |
| `Fpt.zip` (63 MB) | `vtour/` | **61 MB** | — | 5 |
| `Viettel.zip` (220 MB) | `Viettel/vtour/` | **21 MB** | ~190 MB source images outside `vtour/` | 6 |

All three are **plain krpano** (only `tour.html`/`tour.js`/`tour.xml` + `panos`/`plugins`/`skin`) — no `app.js`/`style.css`. Each `.tiles` dir ships its own `thumb.jpg`. Each zip also contains `tour_testingserver.exe` + `tour_testingserver_macos` (krpano dev tools) that **must be excluded**.

First scene ids (for reference): FPT `scene_fpt1`; Viettel `scene_viettel_sanh`; new CIE `scene_...` per its `tour.xml` `startscene`.

## 4. Design

### 4.1 Static assets (live immediately, no build)

| Source (in zip) | Destination | Action |
|---|---|---|
| `Fpt.zip` → `vtour/` | `public/vr-tour/vtour-fpt/` | Create |
| `Viettel.zip` → `Viettel/vtour/` | `public/vr-tour/vtour-viettel/` | Create |
| `Cie.zip` → `vtour/` | `public/vr-tour/vtour-cie/` | **Replace in place (atomic rename)** |

Rules:
- Extract **only** the `vtour/` (resp. `Viettel/vtour/`) subtree; discard the source-image siblings.
- **Never** write `tour_testingserver.exe` / `tour_testingserver_macos` into `public/`. Also delete the two stray ones currently sitting untracked in `vtour-cie/`, and add `public/vr-tour/**/tour_testingserver*` to `.gitignore`.
- New folders (`vtour-fpt`, `vtour-viettel`) are purely additive — nothing to lose; `rm -rf` fully undoes them.

### 4.2 CIE swap — backup & rollback

Three backup layers, in order of durability:

1. **Git history (primary, automatic):** the old CIE is committed at `a8218077` and stays there forever. Restore any time with
   `git checkout a8218077 -- public/vr-tour/vtour-cie`.
2. **On-disk `.bak` (instant rollback during the swap window):** do not delete the old tour — rename it.
   - Swap: `mv vtour-cie vtour-cie.bak-<ts>` then `mv vtour-cie.new vtour-cie` (sub-second, no dropped viewers).
   - Rollback: reverse the two `mv` commands.
3. **Tarball outside the repo (guards against an accidental `git clean`/`rm` wiping both):**
   `tar czf ~/vtour-cie-backup-<ts>.tar.gz -C public/vr-tour vtour-cie` (~83 MB).

Ordering rule that keeps git as the safety net: **verify the new CIE before committing.** While uncommitted, `HEAD` still holds the old CIE, so a bad swap is undone with `git restore` and nothing is lost. Only remove `vtour-cie.bak-*` and the tarball **after** the new tour is confirmed good in production **and** committed.

Rollback matrix:

| Failure detected | Recovery |
|---|---|
| Right after `mv` (pre-commit) | Reverse the two `mv` (use `.bak-<ts>`) — instant |
| After commit | `git checkout a8218077 -- public/vr-tour/vtour-cie`, recommit |
| Disk + git both lost | Extract `~/vtour-cie-backup-<ts>.tar.gz` |

### 4.3 Code changes (require rebuild → worktree+swap deploy)

**`src/lib/vr-viewer.ts`** — generalize from two hard-coded modes to a small registry:

```ts
export type ViewerArea = "campus" | "cie" | "fpt" | "viettel";

export const CAMPUS_TOUR_SRC  = "/vr-tour/tour.html";
export const CIE_TOUR_SRC     = "/vr-tour/vtour-cie/tour.html";
export const FPT_TOUR_SRC     = "/vr-tour/vtour-fpt/tour.html";
export const VIETTEL_TOUR_SRC = "/vr-tour/vtour-viettel/tour.html";
```

- Keep `CAMPUS_MODE`, `CIE_MODE`; add `FPT_MODE`, `VIETTEL_MODE`.
- Replace the two `if (d.src === …)` checks with a lookup over a `{src → ViewerMode}` table covering all four tours. Unchanged safety semantics: reject on origin mismatch, wrong `type`, non-object, or unknown `src` (returns `null`).

**`src/components/VRTourShell.tsx`** — replace the `isCie` boolean with `isSubtour = mode.area !== "campus"`.
- Back button: any sub-tour → back to campus (`CAMPUS_MODE`, reset ready/showEntry); campus → back home (`href:"/"`).
- Status line + entry title: derived per `mode.area` from a small map into `ui.vrTour` (see below). CIE keeps its current wording.

**`src/content/ui.ts`** — add bilingual status strings alongside `statusCie`:
- `statusFpt`: `{ en: "LAB FPT · 360°", vi: "LAB FPT · 360°" }`
- `statusViettel`: `{ en: "LAB VIETTEL · 360°", vi: "LAB VIETTEL · 360°" }`

(Entry title for sub-tours continues to reuse the status string, matching current CIE behavior.)

**`public/vr-tour/app.js`** — static (live immediately), version-bumped:
- Add two synthetic `sceneData` entries with explicit cross-tour thumbnails:
  - `scene_lab_fpt`: `{ title:"Lab FPT", thumb:"vtour-fpt/panos/fpt1.tiles/thumb.jpg", purpose/description:… }`
  - `scene_lab_viettel`: `{ title:"Lab Viettel", thumb:"vtour-viettel/panos/Viettel_Sanh.tiles/thumb.jpg", … }`
  - Thumb paths verified against the zips: `fpt1.tiles/thumb.jpg` and `Viettel_Sanh.tiles/thumb.jpg` both exist (note the capital `S` — the tiles dir case differs from the lowercased krpano scene id). Re-confirm after extraction.
  - These are not in campus `tour.xml`, so `getSceneMeta`'s krpano lookup returns empty and the explicit `sceneData.thumb` is used — the item renders.
- Add two `sceneGroups` entries **immediately after "Trung tâm CIE"**: `{title:"Lab FPT", scenes:["scene_lab_fpt"]}`, `{title:"Lab Viettel", scenes:["scene_lab_viettel"]}`.
- Generalize the click intercept (~line 1493) from a single CIE `if` to a `{ sceneId → subtourURL }` map so CIE/FPT/Viettel each `postMessage` their own URL and `return` before `loadscene`.
- Bump `app.js?v=105 → v=106` in `public/vr-tour/tour.html` to bust cache. (`style.css`/`tour.xml` versions unchanged — not edited.)

### 4.4 Sidebar labels (decided)

- Vietnamese-only, matching the existing hard-coded sidebar (which does not read the site locale): **"Lab FPT"** and **"Lab Viettel"**, consistent with the existing "Lab CTS".
- Placement: **immediately after "Trung tâm CIE"** (order: … → Trung tâm CIE → Lab FPT → Lab Viettel → Tòa A2 → …).

## 5. Deploy order (no-downtime)

1. **Static assets first** — extract the 3 tours into `public/vr-tour/…` (CIE via the atomic `.bak` swap) and update `app.js` + `tour.html` version bump. These go live immediately. If a user clicks a new Lab item before step 2 lands, the shell's `parseViewerMessage` returns `null` for the not-yet-whitelisted URL → **no-op, no crash**.
2. **Code deploy** — build the three TS changes via the worktree+swap procedure (**never** `npm run build` inside the repo — it overwrites the `.next` pm2 is serving). Once the new bundle is live, the shell accepts the FPT/Viettel URLs and the feature is fully functional.
3. **Commit everything** (assets + code) to git, as requested. Commit only **after** production verification (§6), so `HEAD` remains a valid rollback point throughout.

## 6. Verification

- **Unit:** extend `src/lib/vr-viewer.test.ts` — add cases asserting `FPT_MODE`/`VIETTEL_MODE` for their URLs, keep the origin-mismatch / wrong-type / unknown-src rejections. Run vitest; all pass.
- **Static reachability:** each of `/vr-tour/vtour-fpt/tour.html`, `/vr-tour/vtour-viettel/tour.html`, `/vr-tour/vtour-cie/tour.html` returns 200 from the running server; a sample tile + `thumb.jpg` from each resolves 200.
- **End-to-end (against the live server):** open `/vr-tour`, confirm the campus sidebar shows "Lab FPT" and "Lab Viettel" (with thumbnails) right after "Trung tâm CIE"; clicking each swaps the iframe to the correct tour; the shell "back" returns to campus; CIE still opens and shows the **new** content; existing campus scenes and the CIE back-flow are unregressed.
- **No stray binaries:** confirm no `tour_testingserver*` under `public/` and that `.gitignore` covers them.

## 7. Non-goals / notes

- Marketing copy "164 scenes" (`ui.home.vrCardLabel`, `ui.home.statScenes`) will be slightly stale after adding scenes — **not changed** unless requested.
- No locale-awareness added to the campus `app.js` sidebar (it stays Vietnamese-only, matching today's behavior).
- No refactor of the krpano tours themselves beyond dropping the dev-server binaries.
- Sub-tours remain plain krpano; the shell continues to own the "back" control.
```
