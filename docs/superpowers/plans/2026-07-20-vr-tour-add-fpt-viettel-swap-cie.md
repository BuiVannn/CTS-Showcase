# VR Tour — Add Lab FPT + Lab Viettel, Swap CIE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish two new krpano lab sub-tours (Lab FPT, Lab Viettel) and replace the existing CIE sub-tour on the `/vr-tour` page, using the existing `cts-vr-load` swap mechanism, with zero downtime and full CIE backup/rollback.

**Architecture:** Static krpano tours live under `public/vr-tour/vtour-*` (served live by Next.js, no build). The campus tour's `app.js` sidebar intercepts a click and `postMessage`s a `cts-vr-load` to the React shell; the shell (`vr-viewer.ts` + `VRTourShell.tsx`) validates the URL against a whitelist and swaps the iframe. We extend the whitelist from 2 to 4 tours and add two sidebar entries.

**Tech Stack:** Next.js (custom build in this repo — read `node_modules/next/dist/docs/` before Next API work), React client component, TypeScript, Vitest, krpano (vanilla JS `app.js`), pm2 + Cloudflare tunnel deploy.

## Global Constraints

- **NEVER run `npm run build` or `next dev` inside `/home/namnx/ctslab-redesign`** while pm2 serves it — it overwrites the live `.next`. Code changes deploy via the worktree+swap procedure (Task 9). Reference: memory `deployment.md`, `.git/sdd/deploy-swap-note.md`.
- Files under `public/` are static and go **live without a build** (hard-reload only).
- pm2 app name: **`cts-redesign`**, cwd `/home/namnx/ctslab-redesign`, serves `:3001`.
- **Never** write `tour_testingserver.exe` / `tour_testingserver_macos` into `public/`.
- Sidebar labels are **Vietnamese-only** (the `app.js` sidebar does not read site locale): **"Lab FPT"**, **"Lab Viettel"**, placed **immediately after "Trung tâm CIE"**.
- Do not commit the CIE swap until local reachability passes; git `HEAD` (old CIE at `a8218077`) must stay a valid rollback point throughout.
- Commit messages end with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.

---

### Task 1: Extract the two new lab tours (FPT + Viettel)

Additive only — nothing existing is touched. Both go live immediately once the files land.

**Files:**
- Create: `public/vr-tour/vtour-fpt/` (from `folder_tmp/Fpt.zip` → `vtour/`)
- Create: `public/vr-tour/vtour-viettel/` (from `folder_tmp/Viettel.zip` → `Viettel/vtour/`)

- [ ] **Step 1: Extract FPT into place, excluding dev binaries**

```bash
cd /home/namnx/ctslab-redesign
unzip -q folder_tmp/Fpt.zip 'vtour/*' -x '*/tour_testingserver*' -d public/vr-tour/_fpt_stage
mv public/vr-tour/_fpt_stage/vtour public/vr-tour/vtour-fpt
rmdir public/vr-tour/_fpt_stage
find public/vr-tour/vtour-fpt -name '.DS_Store' -delete
```

- [ ] **Step 2: Extract Viettel into place, excluding dev binaries**

```bash
cd /home/namnx/ctslab-redesign
unzip -q folder_tmp/Viettel.zip 'Viettel/vtour/*' -x '*/tour_testingserver*' -d public/vr-tour/_viettel_stage
mv public/vr-tour/_viettel_stage/Viettel/vtour public/vr-tour/vtour-viettel
rm -rf public/vr-tour/_viettel_stage
find public/vr-tour/vtour-viettel -name '.DS_Store' -delete
```

- [ ] **Step 3: Verify structure, entry file, and thumbnails exist; assert no dev binaries**

```bash
cd /home/namnx/ctslab-redesign
test -f public/vr-tour/vtour-fpt/tour.html && echo "fpt tour.html OK"
test -f public/vr-tour/vtour-fpt/panos/fpt1.tiles/thumb.jpg && echo "fpt thumb OK"
test -f public/vr-tour/vtour-viettel/tour.html && echo "viettel tour.html OK"
test -f public/vr-tour/vtour-viettel/panos/Viettel_Sanh.tiles/thumb.jpg && echo "viettel thumb OK"
# Must print nothing:
find public/vr-tour/vtour-fpt public/vr-tour/vtour-viettel -name 'tour_testingserver*'
```
Expected: three `... OK` lines for each tour, and the `find` prints nothing.

- [ ] **Step 4: Verify reachability from the running server**

```bash
for p in vtour-fpt/tour.html vtour-viettel/tour.html \
         vtour-fpt/panos/fpt1.tiles/thumb.jpg \
         vtour-viettel/panos/Viettel_Sanh.tiles/thumb.jpg; do
  printf '%s -> ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3001/vr-tour/$p"
done
```
Expected: every line ends in `200`.

- [ ] **Step 5: Commit the new tour assets**

```bash
cd /home/namnx/ctslab-redesign
git add public/vr-tour/vtour-fpt public/vr-tour/vtour-viettel
git commit -m "$(cat <<'EOF'
feat(vr-tour): add Lab FPT and Lab Viettel sub-tour assets

Two new standalone krpano tours (labs inside the PTIT campus), extracted
from the delivered zips (dev-server binaries excluded). Additive only.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Swap the CIE tour with a 3-layer backup

The CIE URL is unchanged, so this goes fully live the moment the `mv` completes — no code deploy needed for CIE. Verify before committing so git `HEAD` stays a fallback.

**Files:**
- Replace: `public/vr-tour/vtour-cie/` (from `folder_tmp/Cie.zip` → `vtour/`)

- [ ] **Step 1: Create a durable tarball backup outside the repo**

```bash
cd /home/namnx/ctslab-redesign
export TS=$(date +%Y%m%d-%H%M%S)
tar czf ~/vtour-cie-backup-$TS.tar.gz -C public/vr-tour vtour-cie
ls -lh ~/vtour-cie-backup-$TS.tar.gz
echo "TS=$TS"   # note this value; it also names the on-disk .bak below
```
Expected: a ~83 MB tarball listed. Record the printed `TS` value.

- [ ] **Step 2: Stage the new CIE tour (excluding dev binaries) and sanity-check it**

```bash
cd /home/namnx/ctslab-redesign
unzip -q folder_tmp/Cie.zip 'vtour/*' -x '*/tour_testingserver*' -d public/vr-tour/_cie_stage
test -f public/vr-tour/_cie_stage/vtour/tour.html && echo "staged tour.html OK"
find public/vr-tour/_cie_stage/vtour -name 'thumb.jpg' | head -1   # must print a path
find public/vr-tour/_cie_stage/vtour -name '.DS_Store' -delete
```
Expected: `staged tour.html OK` and at least one `thumb.jpg` path. If either is missing, **stop** — do not swap; `rm -rf public/vr-tour/_cie_stage` and investigate.

- [ ] **Step 3: Atomic swap (old CIE renamed to .bak, not deleted)**

```bash
cd /home/namnx/ctslab-redesign
mv public/vr-tour/vtour-cie "public/vr-tour/vtour-cie.bak-$TS"
mv public/vr-tour/_cie_stage/vtour public/vr-tour/vtour-cie
rmdir public/vr-tour/_cie_stage
echo "swapped; old CIE at public/vr-tour/vtour-cie.bak-$TS"
```

- [ ] **Step 4: Verify the new CIE is reachable and is the new content**

```bash
cd /home/namnx/ctslab-redesign
curl -s -o /dev/null -w 'tour.html -> %{http_code}\n' http://localhost:3001/vr-tour/vtour-cie/tour.html
# New CIE title differs from the old ("P503_3"); expect a new scene title:
curl -s http://localhost:3001/vr-tour/vtour-cie/tour.html | grep -o '<title>[^<]*</title>'
# A sample thumbnail resolves:
THUMB=$(cd public/vr-tour/vtour-cie && find panos -name thumb.jpg | head -1)
curl -s -o /dev/null -w "$THUMB -> %{http_code}\n" "http://localhost:3001/vr-tour/vtour-cie/$THUMB"
```
Expected: `tour.html -> 200`, a `<title>` that is **not** `krpano - P503_3`, and the thumbnail `-> 200`.

**Rollback if anything above fails (pre-commit, instant):**
```bash
cd /home/namnx/ctslab-redesign
rm -rf public/vr-tour/vtour-cie
mv "public/vr-tour/vtour-cie.bak-$TS" public/vr-tour/vtour-cie
```

- [ ] **Step 5: Commit the CIE swap**

```bash
cd /home/namnx/ctslab-redesign
git add -A public/vr-tour/vtour-cie
git commit -m "$(cat <<'EOF'
feat(vr-tour): replace CIE sub-tour with expanded 2026-07 version

Same URL (/vr-tour/vtour-cie/tour.html), same swap mechanism — only the
krpano content is replaced (more scenes). Old version remains recoverable
from history (commit a8218077), an on-disk vtour-cie.bak-*, and a tarball
in ~/. Dev-server binaries excluded.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Ignore and purge krpano dev-server binaries

**Files:**
- Modify: `.gitignore` (append)
- Delete: `public/vr-tour/vtour-cie/tour_testingserver.exe`, `public/vr-tour/vtour-cie/tour_testingserver_macos` (stray untracked leftovers — the swap in Task 2 already removed them from the current `vtour-cie`, but delete any that remain anywhere under `public/vr-tour`)

- [ ] **Step 1: Remove any stray dev binaries under public/vr-tour**

```bash
cd /home/namnx/ctslab-redesign
find public/vr-tour -name 'tour_testingserver*' -print -delete
```
Expected: prints any leftovers as it deletes them (may print nothing if already clean).

- [ ] **Step 2: Add a gitignore rule so they can never be committed**

Append to `.gitignore` (after the `# misc` / `*.pem` block):

```gitignore

# krpano dev-server binaries — never deploy or commit
public/vr-tour/**/tour_testingserver*
```

- [ ] **Step 3: Verify the rule works**

```bash
cd /home/namnx/ctslab-redesign
touch public/vr-tour/vtour-fpt/tour_testingserver.exe
git check-ignore public/vr-tour/vtour-fpt/tour_testingserver.exe && echo "ignored OK"
rm public/vr-tour/vtour-fpt/tour_testingserver.exe
```
Expected: prints the path and `ignored OK`.

- [ ] **Step 4: Commit**

```bash
cd /home/namnx/ctslab-redesign
git add .gitignore
git commit -m "$(cat <<'EOF'
chore(vr-tour): gitignore krpano dev-server binaries

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Extend the tour whitelist in `vr-viewer.ts` (TDD)

**Files:**
- Modify: `src/lib/vr-viewer.ts`
- Test: `src/lib/vr-viewer.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `FPT_TOUR_SRC`, `VIETTEL_TOUR_SRC` (string consts), `FPT_MODE`, `VIETTEL_MODE` (`ViewerMode`), `ViewerArea` now `"campus" | "cie" | "fpt" | "viettel"`. `parseViewerMessage(data, origin, expectedOrigin)` unchanged signature, now returns any of the four modes or `null`.

- [ ] **Step 1: Write the failing tests**

Add these imports to the top `import { … } from "./vr-viewer";` block in `src/lib/vr-viewer.test.ts`: `FPT_MODE`, `VIETTEL_MODE`, `FPT_TOUR_SRC`, `VIETTEL_TOUR_SRC`. Then add these cases inside the `describe("parseViewerMessage", …)` block:

```ts
  it("returns FPT_MODE for the FPT tour url", () => {
    const data = { type: "cts-vr-load", src: FPT_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toEqual(FPT_MODE);
  });

  it("returns VIETTEL_MODE for the Viettel tour url", () => {
    const data = { type: "cts-vr-load", src: VIETTEL_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toEqual(VIETTEL_MODE);
  });

  it("rejects a prototype-pollution src like 'constructor'", () => {
    const data = { type: "cts-vr-load", src: "constructor" };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toBeNull();
  });

  it("rejects a non-string src", () => {
    const data = { type: "cts-vr-load", src: 123 };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toBeNull();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /home/namnx/ctslab-redesign
npx vitest run src/lib/vr-viewer.test.ts
```
Expected: FAIL — `FPT_MODE`/`VIETTEL_MODE`/`FPT_TOUR_SRC`/`VIETTEL_TOUR_SRC` are not exported.

- [ ] **Step 3: Rewrite `src/lib/vr-viewer.ts` to a whitelist map**

Replace the whole file with:

```ts
/** Static-asset URLs for the krpano tours the shell can host. */
export const CAMPUS_TOUR_SRC = "/vr-tour/tour.html";
export const CIE_TOUR_SRC = "/vr-tour/vtour-cie/tour.html";
export const FPT_TOUR_SRC = "/vr-tour/vtour-fpt/tour.html";
export const VIETTEL_TOUR_SRC = "/vr-tour/vtour-viettel/tour.html";

/** Message type the krpano app.js posts to the parent shell to swap tours. */
export const VR_LOAD_MESSAGE = "cts-vr-load";

export type ViewerArea = "campus" | "cie" | "fpt" | "viettel";

export interface ViewerMode {
  src: string;
  area: ViewerArea;
}

export const CAMPUS_MODE: ViewerMode = { src: CAMPUS_TOUR_SRC, area: "campus" };
export const CIE_MODE: ViewerMode = { src: CIE_TOUR_SRC, area: "cie" };
export const FPT_MODE: ViewerMode = { src: FPT_TOUR_SRC, area: "fpt" };
export const VIETTEL_MODE: ViewerMode = { src: VIETTEL_TOUR_SRC, area: "viettel" };

/**
 * Every tour the shell is allowed to load, keyed by its static-asset URL.
 * A Map (not a plain object) so an attacker-supplied `src` such as
 * "__proto__" or "constructor" cannot match an inherited property.
 */
const MODES_BY_SRC = new Map<string, ViewerMode>([
  [CAMPUS_TOUR_SRC, CAMPUS_MODE],
  [CIE_TOUR_SRC, CIE_MODE],
  [FPT_TOUR_SRC, FPT_MODE],
  [VIETTEL_TOUR_SRC, VIETTEL_MODE],
]);

/**
 * Validate a window `message` event payload from the tour iframe. Returns the
 * ViewerMode to load, or null if the message is not a trusted, same-origin
 * cts-vr-load instruction for a known tour.
 */
export function parseViewerMessage(
  data: unknown,
  origin: string,
  expectedOrigin: string,
): ViewerMode | null {
  if (origin !== expectedOrigin) return null;
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.type !== VR_LOAD_MESSAGE) return null;
  if (typeof d.src !== "string") return null;
  return MODES_BY_SRC.get(d.src) ?? null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd /home/namnx/ctslab-redesign
npx vitest run src/lib/vr-viewer.test.ts
```
Expected: PASS — all cases (existing + 4 new) green.

- [ ] **Step 5: Commit**

```bash
cd /home/namnx/ctslab-redesign
git add src/lib/vr-viewer.ts src/lib/vr-viewer.test.ts
git commit -m "$(cat <<'EOF'
feat(vr-tour): whitelist FPT + Viettel sub-tours in the viewer

Generalize the 2-tour hard-code into a Map-based whitelist covering
campus/cie/fpt/viettel. Map (not object) avoids prototype-pollution
matches on a hostile postMessage src. Adds tests for the new tours,
constructor/proto rejection, and non-string src.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Add bilingual status strings in `ui.ts`

**Files:**
- Modify: `src/content/ui.ts` (the `vrTour` block, right after `statusCie`)

**Interfaces:**
- Produces: `ui.vrTour.statusFpt`, `ui.vrTour.statusViettel` (both `Localized`).

- [ ] **Step 1: Add the two status strings**

In `src/content/ui.ts`, find this line inside `vrTour`:

```ts
    statusCie: { en: "CIE CENTER · 360°", vi: "TRUNG TÂM CIE · 360°" } as Localized,
```

Add immediately after it:

```ts
    statusFpt: { en: "LAB FPT · 360°", vi: "LAB FPT · 360°" } as Localized,
    statusViettel: { en: "LAB VIETTEL · 360°", vi: "LAB VIETTEL · 360°" } as Localized,
```

- [ ] **Step 2: Typecheck the file**

```bash
cd /home/namnx/ctslab-redesign
npx tsc --noEmit
```
Expected: no errors (or only pre-existing unrelated ones — none expected in `ui.ts`).

- [ ] **Step 3: Commit**

```bash
cd /home/namnx/ctslab-redesign
git add src/content/ui.ts
git commit -m "$(cat <<'EOF'
feat(vr-tour): add status labels for Lab FPT / Lab Viettel

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Generalize `VRTourShell.tsx` for N sub-tours

**Files:**
- Modify: `src/components/VRTourShell.tsx`

**Interfaces:**
- Consumes: `CAMPUS_MODE`, `parseViewerMessage`, `ViewerMode` from `vr-viewer.ts`; `ui.vrTour.status{Campus,Cie,Fpt,Viettel}` from Task 5.

- [ ] **Step 1: Add a per-area status map at module scope**

In `src/components/VRTourShell.tsx`, just below the imports (before `export default function VRTourShell()`), add:

```tsx
/** Status/eyebrow label per tour area. */
const STATUS_BY_AREA = {
  campus: ui.vrTour.statusCampus,
  cie: ui.vrTour.statusCie,
  fpt: ui.vrTour.statusFpt,
  viettel: ui.vrTour.statusViettel,
} as const;
```

- [ ] **Step 2: Replace the `isCie` branch with a generic sub-tour branch**

Replace this block:

```tsx
  const isCie = mode.area === "cie";
  const back = isCie
    ? {
        label: t(ui.vrTour.backToCampus),
        onClick: () => {
          isFirstLoadRef.current = false;
          setIsFirstLoad(false);
          setMode(CAMPUS_MODE);
          setReady(false);
          setShowEntry(true);
        },
      }
    : { label: t(ui.vrTour.backHome), href: "/" };
  const status = isCie ? t(ui.vrTour.statusCie) : t(ui.vrTour.statusCampus);
```

with:

```tsx
  const isSubtour = mode.area !== "campus";
  const back = isSubtour
    ? {
        label: t(ui.vrTour.backToCampus),
        onClick: () => {
          isFirstLoadRef.current = false;
          setIsFirstLoad(false);
          setMode(CAMPUS_MODE);
          setReady(false);
          setShowEntry(true);
        },
      }
    : { label: t(ui.vrTour.backHome), href: "/" };
  const status = t(STATUS_BY_AREA[mode.area]);
```

- [ ] **Step 3: Update the `ViewerEntry` title to use the generic sub-tour flag**

Replace:

```tsx
        <ViewerEntry
          variant={isFirstLoad ? "hero" : "loader"}
          title={isCie ? t(ui.vrTour.statusCie) : t(ui.vrTour.entryTitle)}
```

with:

```tsx
        <ViewerEntry
          variant={isFirstLoad ? "hero" : "loader"}
          title={isSubtour ? status : t(ui.vrTour.entryTitle)}
```

- [ ] **Step 4: Typecheck**

```bash
cd /home/namnx/ctslab-redesign
npx tsc --noEmit
```
Expected: no new errors. (`STATUS_BY_AREA[mode.area]` is exhaustive over `ViewerArea`, so indexing typechecks.)

- [ ] **Step 5: Commit**

```bash
cd /home/namnx/ctslab-redesign
git add src/components/VRTourShell.tsx
git commit -m "$(cat <<'EOF'
feat(vr-tour): shell supports any sub-tour, not just CIE

Replace the isCie special-case with isSubtour + a per-area status map so
FPT/Viettel get correct back-to-campus behavior and status labels.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Wire the campus sidebar to the new sub-tours (`app.js`)

`app.js` is static (lives under `public/`) — it goes live on hard-reload, no build. Adds two sidebar entries and generalizes the click intercept.

**Files:**
- Modify: `public/vr-tour/app.js` (`sceneData`, `sceneGroups`, new `SUBTOUR_BY_SCENE` const, click intercept)
- Modify: `public/vr-tour/tour.html` (cache-bust `app.js?v=105` → `v=106`)

- [ ] **Step 1: Add two synthetic scenes to `sceneData`**

In `public/vr-tour/app.js`, find the end of the `sceneData` object:

```js
        thumb: 'panos/10.tiles/thumb.jpg'
    },
};
```

Replace it with (insert the two entries before the closing `};`):

```js
        thumb: 'panos/10.tiles/thumb.jpg'
    },
    "scene_lab_fpt": {
        title: 'Lab FPT',
        description: 'Phòng lab hợp tác với FPT trong khuôn viên PTIT.',
        roomType: 'Lab',
        purpose: 'Không gian thực hành và nghiên cứu.',
        thumb: 'vtour-fpt/panos/fpt1.tiles/thumb.jpg'
    },
    "scene_lab_viettel": {
        title: 'Lab Viettel',
        description: 'Phòng lab hợp tác với Viettel trong khuôn viên PTIT.',
        roomType: 'Lab',
        purpose: 'Không gian thực hành và nghiên cứu.',
        thumb: 'vtour-viettel/panos/Viettel_Sanh.tiles/thumb.jpg'
    },
};
```

- [ ] **Step 2: Add two sidebar groups right after "Trung tâm CIE"**

Find the CIE group block:

```js
  {
    "title": "Trung tâm CIE",
    "scenes": [
      "scene_gpbk2224_1773131289876"
    ]
  },
```

Replace it with (append the two new groups immediately after):

```js
  {
    "title": "Trung tâm CIE",
    "scenes": [
      "scene_gpbk2224_1773131289876"
    ]
  },
  {
    "title": "Lab FPT",
    "scenes": [
      "scene_lab_fpt"
    ]
  },
  {
    "title": "Lab Viettel",
    "scenes": [
      "scene_lab_viettel"
    ]
  },
```

- [ ] **Step 3: Add the `SUBTOUR_BY_SCENE` lookup**

Find this line:

```js
const SCENE_GROUPS_STORAGE_KEY = 'ptit_scene_groups_v1';
```

Insert immediately **before** it:

```js
// Sidebar entries that open a standalone sub-tour in the parent shell
// (posted as a cts-vr-load message) instead of loading a krpano scene.
const SUBTOUR_BY_SCENE = {
  'scene_gpbk2224_1773131289876': '/vr-tour/vtour-cie/tour.html',
  'scene_lab_fpt': '/vr-tour/vtour-fpt/tour.html',
  'scene_lab_viettel': '/vr-tour/vtour-viettel/tour.html',
};

```

- [ ] **Step 4: Generalize the click intercept**

Find this block (inside the `groupScenes.forEach` render loop):

```js
             item.onclick = () => {
                 // CIE opens its dedicated standalone sub-tour in the parent shell.
                 if (scene.sceneName === 'scene_gpbk2224_1773131289876') {
                     window.parent.postMessage(
                         { type: 'cts-vr-load', src: '/vr-tour/vtour-cie/tour.html' },
                         location.origin
                     );
                     return;
                 }
                 krpano.call(`loadscene(${scene.sceneName}, null, MERGE, BLEND(1.0))`);
             };
```

Replace it with:

```js
             item.onclick = () => {
                 // Some sidebar entries open a standalone sub-tour in the parent shell.
                 const subtourSrc = SUBTOUR_BY_SCENE[scene.sceneName];
                 if (subtourSrc) {
                     window.parent.postMessage(
                         { type: 'cts-vr-load', src: subtourSrc },
                         location.origin
                     );
                     return;
                 }
                 krpano.call(`loadscene(${scene.sceneName}, null, MERGE, BLEND(1.0))`);
             };
```

- [ ] **Step 5: Cache-bust `app.js` in `tour.html`**

In `public/vr-tour/tour.html`, change:

```html
                <script src="app.js?v=105"></script>
```
to:
```html
                <script src="app.js?v=106"></script>
```

- [ ] **Step 6: Sanity-check the edits (syntax + presence)**

```bash
cd /home/namnx/ctslab-redesign
node --check public/vr-tour/app.js && echo "app.js syntax OK"
grep -c 'scene_lab_fpt\|scene_lab_viettel' public/vr-tour/app.js   # each id on 3 lines (sceneData + group + subtour) -> 6
grep -n 'SUBTOUR_BY_SCENE' public/vr-tour/app.js
grep -o 'app.js?v=106' public/vr-tour/tour.html
```
Expected: `app.js syntax OK`; `grep -c` prints `6` (each new scene id appears 3×: sceneData key, sceneGroups entry, SUBTOUR_BY_SCENE key); `SUBTOUR_BY_SCENE` found (definition + usage lines); `app.js?v=106` printed.

- [ ] **Step 7: Verify the sidebar renders the new entries in the live campus tour**

Hard-reload `http://localhost:3001/vr-tour` (or open the campus tour iframe directly at `http://localhost:3001/vr-tour/tour.html`) and confirm the sidebar shows "Lab FPT" and "Lab Viettel" with thumbnails, immediately after "Trung tâm CIE". (Clicking them is a safe no-op until the shell rebuild in Task 9 — the old bundle rejects the not-yet-whitelisted URL.)

- [ ] **Step 8: Commit**

```bash
cd /home/namnx/ctslab-redesign
git add public/vr-tour/app.js public/vr-tour/tour.html
git commit -m "$(cat <<'EOF'
feat(vr-tour): add Lab FPT / Lab Viettel sidebar entries

Two new campus-sidebar locations after "Trung tâm CIE" that open the
new standalone sub-tours via cts-vr-load. Generalize the single CIE
intercept into a SUBTOUR_BY_SCENE map. Bump app.js cache version to 106.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Full local verification gate (pre-deploy)

No new commit — this gates the deploy. Everything below must pass before Task 9.

- [ ] **Step 1: Run the whole unit suite**

```bash
cd /home/namnx/ctslab-redesign
npm test
```
Expected: all tests pass (including the 4 new `vr-viewer` cases).

- [ ] **Step 2: Typecheck the whole project**

```bash
cd /home/namnx/ctslab-redesign
npx tsc --noEmit
```
Expected: no new errors.

- [ ] **Step 3: Confirm all three tour URLs + one thumbnail each resolve 200**

```bash
for p in vtour-cie/tour.html vtour-fpt/tour.html vtour-viettel/tour.html \
         vtour-fpt/panos/fpt1.tiles/thumb.jpg \
         vtour-viettel/panos/Viettel_Sanh.tiles/thumb.jpg; do
  printf '%s -> ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3001/vr-tour/$p"
done
```
Expected: every line ends in `200`.

- [ ] **Step 4: Confirm git tree is clean (all work committed)**

```bash
cd /home/namnx/ctslab-redesign
git status --porcelain
```
Expected: empty (ignoring the pre-existing untracked items from the initial `git status` such as `.next.bak-*`, `data/`, `game/`, etc. — no VR-related files should be uncommitted).

---

### Task 9: Deploy the code via worktree+swap

Only the three TS files (`vr-viewer.ts`, `ui.ts`, `VRTourShell.tsx`) need a build; the static assets and `app.js` are already live. Follow the memory `deployment.md` procedure exactly. **Do not `npm run build` in the repo.**

**Files:** none edited — this builds committed code into a fresh `.next` and swaps it in.

- [ ] **Step 1: Backup the current live build (instant hardlink)**

```bash
cd /home/namnx/ctslab-redesign
cp -al .next .next.bak-$(date +%Y%m%d-%H%M%S)
```

- [ ] **Step 2: Create an isolated worktree at HEAD and populate it**

```bash
cd /home/namnx/ctslab-redesign
export WT=/home/namnx/cts-deploy-wt-$(date +%Y%m%d-%H%M%S)
git worktree add "$WT" HEAD
cp -al node_modules "$WT"/            # hardlink (NOT symlink — Turbopack rejects a symlinked node_modules)
cp -a .env.local "$WT"/ 2>/dev/null || true
echo "WT=$WT"
```

- [ ] **Step 3: Build inside the worktree**

```bash
cd "$WT"
npm run build
```
Expected: build completes successfully. (This does NOT touch the live `.next` in the repo.)

- [ ] **Step 4: Rewrite the worktree's absolute path in the built server files**

```bash
cd /home/namnx/ctslab-redesign
sed -i "s|$WT|/home/namnx/ctslab-redesign|g" "$WT"/.next/required-server-files.json "$WT"/.next/required-server-files.js 2>/dev/null || \
  sed -i "s|$WT|/home/namnx/ctslab-redesign|g" "$WT"/.next/required-server-files.json
grep -rl "$WT" "$WT"/.next && echo "!! WORKTREE PATH STILL PRESENT — DO NOT SWAP" || echo "path rewrite clean"
```
Expected: `path rewrite clean` (the `grep -rl` finds nothing).

- [ ] **Step 5: Stage the new build next to the live one**

```bash
cd /home/namnx/ctslab-redesign
mv "$WT"/.next /home/namnx/ctslab-redesign/.next.new
```

- [ ] **Step 6: Swap and restart in one shot**

```bash
cd /home/namnx/ctslab-redesign
mv .next .next.old && mv .next.new .next && pm2 restart cts-redesign --update-env
```

- [ ] **Step 7: Verify routes and check for new errors**

```bash
sleep 3
for u in / /vr-tour; do printf '%s -> ' "$u"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3001$u"; done
stat -c '%y' /home/namnx/ctslab-redesign/.next/BUILD_ID
stat -c '%y' /home/namnx/.pm2/logs/cts-redesign-error.log
```
Expected: `/` and `/vr-tour` return `200`; `BUILD_ID` mtime is just now; the error-log mtime does **not** post-date the restart (pre-existing "Failed to find Server Action" noise is not a regression).

**Rollback if the deploy is bad:**
```bash
cd /home/namnx/ctslab-redesign
mv .next .next.broken && mv .next.old .next && pm2 restart cts-redesign
```

- [ ] **Step 8: Remove the worktree**

```bash
cd /home/namnx/ctslab-redesign
git worktree remove "$WT" --force
git worktree prune
```

---

### Task 10: Post-deploy end-to-end verification + backup cleanup

- [ ] **Step 1: Drive the live VR page end-to-end**

Open `https://ctslab.net/vr-tour` (or `http://localhost:3001/vr-tour`) in a browser and confirm:
1. Campus sidebar shows **Lab FPT** and **Lab Viettel** (with thumbnails) right after **Trung tâm CIE**.
2. Clicking **Lab FPT** swaps the viewer to the FPT tour; the shell status reads `LAB FPT · 360°`; the "Khuôn viên chính" back button returns to campus.
3. Clicking **Lab Viettel** does the same with `LAB VIETTEL · 360°`.
4. Clicking **Trung tâm CIE** opens the **new** CIE content and back-to-campus still works.
5. A normal campus scene (e.g. "Thư viện") still loads in-place (not intercepted).

If any check fails, use the Task 9 rollback (code) and/or Task 2 rollback (CIE assets).

- [ ] **Step 2: Only after all checks pass — clean up backups**

```bash
cd /home/namnx/ctslab-redesign
rm -rf public/vr-tour/vtour-cie.bak-*        # on-disk CIE backup
rm -f .next.old                              # old build (keep .next.bak-* per existing convention or prune later)
# Keep ~/vtour-cie-backup-*.tar.gz for a few days, then remove manually.
git worktree list                            # confirm no stray deploy worktrees
```

- [ ] **Step 3: Final status confirmation**

```bash
cd /home/namnx/ctslab-redesign
git log --oneline -8
git status --porcelain | grep vr-tour || echo "no uncommitted vr-tour files"
```
Expected: the feature commits present; no uncommitted vr-tour files.

---

## Self-Review

**Spec coverage:**
- §4.1 static assets → Tasks 1, 2. ✓
- §4.2 CIE backup/rollback (3 layers, verify-before-commit) → Task 2 (tarball, .bak, rollback blocks) + git history note. ✓
- §4.3 `vr-viewer.ts` registry → Task 4; `VRTourShell.tsx` → Task 6; `ui.ts` → Task 5; `app.js` + `tour.html` bump → Task 7. ✓
- §4.4 labels + placement → Task 7 Steps 1–2, Global Constraints. ✓
- §5 deploy order (assets live first, code via worktree, commit after verify) → Tasks 1–2 (live on mv), 8 (gate), 9 (worktree), commit-after-verify enforced in Task 2. ✓
- §6 verification (unit, reachability, e2e, no stray binaries) → Tasks 4/8 (unit), 1/2/8 (reachability), 10 (e2e), 3 (binaries). ✓
- §7 non-goals (marketing copy untouched, no locale in app.js) → respected; nothing changes them. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; every command shows expected output. ✓

**Type consistency:** `ViewerArea` = `"campus"|"cie"|"fpt"|"viettel"` used consistently in Task 4 (definition) and Task 6 (`STATUS_BY_AREA` keys). `FPT_MODE`/`VIETTEL_MODE`/`FPT_TOUR_SRC`/`VIETTEL_TOUR_SRC` names identical across Tasks 4 test/impl. `SUBTOUR_BY_SCENE` and scene ids `scene_lab_fpt`/`scene_lab_viettel` identical across Task 7 steps and match `app.js` thumb paths `vtour-fpt/panos/fpt1.tiles/thumb.jpg` / `vtour-viettel/panos/Viettel_Sanh.tiles/thumb.jpg` verified against the zips. ✓
