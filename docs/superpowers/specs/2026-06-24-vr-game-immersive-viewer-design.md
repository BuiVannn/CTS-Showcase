# VR Tour + Game — "Immersive Viewer" chrome + CIE sub-tour

**Date:** 2026-06-24
**Status:** Approved direction & scope; pending spec review
**Branch:** home-redesign

## 1. Summary

Two of CTS Lab's flagship features — the **VR campus tour** and the **Game hub** — currently
have very thin React chrome around their embedded content. This work does three things, as one
coherent design pass:

- **A. CIE fix (functional):** rename the location "Trung tâm IEC" → "Trung tâm CIE", and make
  that location open the new standalone sub-tour in `public/vr-tour/vtour-cie/` instead of the
  single old panorama — without touching the other 14 locations.
- **B. Shared "Immersive Viewer" chrome:** give the VR shell and the Game player one consistent,
  branded viewer identity (glassy bar + viewfinder HUD frame + branded loading/arrival), built
  entirely from the existing CTS design system.
- **C. Game Hub polish:** make the hub read as intentional rather than empty (1 game in a 3-col
  grid today).

**Hard constraint:** the VR (krpano) content and the Game (Unity WebGL) content stay byte-for-byte
unchanged. All work is in the React chrome that frames them, plus two surgical edits to the krpano
`app.js` for the CIE rename + swap trigger.

## 2. Goals / Non-goals

**Goals**
- CIE renamed everywhere it's user-visible; CIE opens the 38-room `vtour-cie` sub-tour; a clear way
  back to the campus tour.
- VR and Game feel like two halves of the same premium feature set.
- Zero risk to the other 14 VR locations and to the existing game embed behavior.
- Fully reversible via git.

**Non-goals**
- No edits to `tour.xml`, `panos/`, or any panorama content of the main tour.
- No edits inside `vtour-cie/` (runs as-is, stock krpano skin).
- No merging of the 38 CIE scenes into the main tour (explicitly rejected for safety).
- No new color palette or typefaces — reuse the CTS system only.
- Not redesigning the krpano in-tour UI (sidebar, hotspots) beyond the CIE rename + swap.

## 3. Design system — reused tokens (no new identity)

- **Color:** `--bg`, `--surface`, `--card`, `--border`, `--ink`, `--ink-2`, `--dim`; brand
  `--blue #2563eb` and `--red #e11b22`; the **blue→red gradient** (already used by `GameCover`).
- **Glass bar:** translucent `--card` + `backdrop-blur`, hairline `--border`.
- **Type:** Plus Jakarta Sans (display 700/800) for titles; **JetBrains Mono** (`--font-mono`)
  for the HUD readouts (scene counter, tech tags, status) — extends the existing "mono = meta/data"
  rule.
- **Radius:** existing `--radius-sm/md/lg/pill`. **Shadows:** existing `--shadow-sm/md/lg`.
- **Motion:** `motion/react`, always gated by `useReducedMotion` (matches current shell).

### Signature element — "viewfinder HUD"
A 1px brand-gradient hairline framing the viewport with small **corner ticks** (⌐ ¬ ∟ _⌐) and a
live **mono status readout**. Evokes a VR/camera viewfinder, sits entirely outside the iframe, and
is the *only* bold element — everything else stays quiet. This is the one memorable thing shared by
VR and Game.

## 4. Component architecture

New shared module under `src/components/viewer/` so VR and Game draw from one source of truth:

- **`ViewerChrome.tsx`** — full-bleed fixed container (used by VR) OR inline framed container (used
  by Game). Renders: the glassy **top bar** (slots: `back`, `label`, `status`, `actions`), the
  **HUD frame** (corner ticks + gradient hairline), and `children` (the iframe). Props:
  `variant: "fullscreen" | "inline"`, `back: { label, onBack } | { label, href }`, `label: string`,
  `status?: string` (mono), `actions?: ReactNode`.
- **`ViewerFrame.tsx`** — just the HUD: gradient hairline + 4 corner ticks. Pure presentational,
  `aria-hidden`. (Can be folded into ViewerChrome; kept separate for reuse on the Game embed.)
- **`ViewerEntry.tsx`** — branded loading / arrival overlay: eyebrow, big display title, one-line
  lead, a brand-gradient progress shimmer, and a "Bắt đầu →" enter button. On reduced motion it
  skips the shimmer and just fades. Props: `title`, `lead`, `meta` (mono line), `onEnter`.

Files touched:

| File | Change |
|------|--------|
| `public/vr-tour/app.js` | L70 rename `"Trung tâm IEC"`→`"Trung tâm CIE"`; intercept CIE click → `postMessage` |
| `src/components/VRTourShell.tsx` | Rewrite to use `ViewerChrome`; iframe `src` state; message listener; CIE back; entry overlay |
| `src/components/viewer/ViewerChrome.tsx` | New shared chrome |
| `src/components/viewer/ViewerFrame.tsx` | New HUD frame |
| `src/components/viewer/ViewerEntry.tsx` | New entry/loading overlay |
| `src/components/games/GameEmbed.tsx` | Wrap embed in `ViewerFrame`; slim mono header (title + tech tag); keep fullscreen btn |
| `src/components/games/GameHubView.tsx` | Featured + invitation layout; mono eyebrow |
| `src/components/games/GamePlayView.tsx` | Minor: mono labels to match; keep context aside |
| `src/content/ui.ts` | New copy keys (CIE back label, entry title/lead/meta, hub invitation) |

## 5. Part A — CIE rename + sub-tour swap (functional)

### A1. Rename
`public/vr-tour/app.js` line 70: `"title": "Trung tâm IEC"` → `"title": "Trung tâm CIE"`.
This is the only occurrence of "IEC" in the tour files (verified by grep).

### A2. Swap trigger (1-click)
In `app.js`, the sidebar group "Trung tâm CIE" is intercepted so clicking it opens the sub-tour
directly (no expand-then-click). At the click site (currently `krpano.call('loadscene(...)')`,
~L1491, and/or the group header onclick ~L1469), special-case the CIE group/scene
(`scene_gpbk2224_1773131289876`):

```js
// CIE opens its dedicated standalone sub-tour in the parent viewer shell.
window.parent.postMessage(
  { type: "cts-vr-load", src: "/vr-tour/vtour-cie/tour.html", label: "cie" },
  location.origin
);
return; // do NOT loadscene
```

All other scenes keep the existing `loadscene(...)` behavior unchanged.

### A3. React side (`VRTourShell`)
- `const [src, setSrc] = useState("/vr-tour/tour.html")` drives the iframe.
- A `message` listener (guarded by `event.origin === window.location.origin` and
  `event.data?.type === "cts-vr-load"`) calls `setSrc(event.data.src)` and records that we are in
  CIE mode.
- When in CIE mode, the viewer bar's **back** control becomes **"← Khuôn viên chính"** which calls
  `setSrc("/vr-tour/tour.html")` (returns to campus). When in campus mode, back is the existing
  **"Quay lại"** link to `/`.
- The old panorama `scene_gpbk2224_…` stays in `tour.xml` (untouched) — simply no longer reached
  via the sidebar. Nothing deleted.

### A4. Why this is safe
Main `tour.xml`/`panos/` untouched → the other 14 locations are byte-identical. `vtour-cie/`
untouched → runs standalone. Only `app.js` (2 spots) + `VRTourShell` change. Both are git-tracked.

## 6. Part B — Immersive Viewer chrome

### B1. VR shell (`VRTourShell`, `variant="fullscreen"`)
```
┌───────────────────────────────────────────────┐
│ ← Khuôn viên chính   ◉ THAM QUAN ẢO PTIT · 360°│  glassy bar, mono status, live dot
├───────────────────────────────────────────────┤
│⌐                                             ¬ │  HUD corner ticks + gradient hairline
│            [ krpano iframe — unchanged ]       │
│∟                                            _⌐ │
└───────────────────────────────────────────────┘
```
- Status readout (mono): campus = `KHUÔN VIÊN PTIT · 360°`; CIE = `TRUNG TÂM CIE · 360°`
  (no brittle scene/location count hardcoded).
- The existing 56px bar becomes ~64px, glassy. Back-pill style preserved.
- `ViewerEntry` overlay covers the viewport on first load (and on each `src` swap), showing the
  branded arrival + progress; fades out when the iframe `load` event fires (or on "Bắt đầu").

### B2. Game player (`GameEmbed` + `ViewerFrame`)
The game keeps its contextual page (breadcrumb + aside with blurb/tags — games benefit from
context), but the **embed** gets the shared HUD frame and a slim mono header so it visually
matches VR:
```
┌─────────────────────────────────────────┐
│ ◉ TO YOUR RIGHT PLACES! · WEBGL · UNITY  │  slim mono header
│⌐                                       ¬ │  HUD ticks (shared ViewerFrame)
│        [ Unity WebGL — unchanged ]       │
│∟                                      _⌐⛶│  fullscreen btn (existing)
└─────────────────────────────────────────┘
```
Shared language: same HUD ticks, same gradient hairline, same mono labels, same back-pill — VR and
Game now clearly belong together.

## 7. Part C — Game Hub polish

`GameHubView`: replace the sparse 3-col grid (1 real card + emptiness) with an intentional layout:
- **Mono eyebrow** `◉ GAME HUB · WEBGL`, display title, lead (existing copy).
- **Featured card** (larger, spans 2 cols on desktop) for the flagship game, with the cover, a
  `▶ Chơi` affordance on hover, and tags.
- **Invitation tile** next to it — a *styled* "Sắp ra mắt — gửi game của bạn" card (brand-gradient
  hairline, not a sad dashed box), pointing to the members area.
- Keep `AmbientField tone="warm"`. Layout collapses to single-column on mobile.
- Apply the same mono-eyebrow treatment on `GamePlayView` for consistency.

## 8. Accessibility & quality floor

- Visible keyboard focus on all controls (back pill, enter button, fullscreen).
- `prefers-reduced-motion`: entry overlay skips shimmer/animation, just fades; HUD is static.
- HUD frame and decorative dots are `aria-hidden`.
- Status readouts are text, not images; localized via `ui.ts` (vi/en).
- Responsive: viewer bar wraps/condenses on mobile (status hides under `sm` like the current
  eyebrow does); game featured layout stacks.

## 9. Copy (new `ui.ts` keys, vi/en)

- `vrTour.backToCampus` — vi: "Khuôn viên chính" / en: "Main campus"
- `vrTour.entryTitle` — vi: "Trải nghiệm 360°" / en: "360° experience"
- `vrTour.entryLead` — vi: "Tham quan khuôn viên PTIT" / en: "Tour the PTIT campus"
- `vrTour.statusCampus` — vi: "KHUÔN VIÊN PTIT · 360°" / en: "PTIT CAMPUS · 360°"
- `vrTour.statusCie` — vi: "TRUNG TÂM CIE · 360°" / en: "CIE CENTER · 360°"
- `vrTour.enter` — vi: "Bắt đầu" / en: "Start"
- `games.comingSoonTitle` — vi: "Sắp ra mắt" / en: "Coming soon"
- `games.submitGame` — vi: "Gửi game của bạn" / en: "Submit your game"

(Existing `vrTour.loading/back/eyebrow` and `games.*` are reused where possible.)

## 10. Safety, backup & deployment

- **Backup:** all of `public/vr-tour` and `src/` are git-tracked. Before editing, copy
  `app.js` → `app.js.bak` (belt-and-suspenders, as requested). Full revert at any time:
  `git checkout -- public/vr-tour/app.js src/components/`.
- **Static vs build:** `app.js` is a static asset (no build needed). The React components require
  `npm run build`. **Deploy:** `npm run build && pm2 restart cts-redesign` (build must succeed
  before restart — pm2 serves the prebuilt `.next`).

## 11. Verification

Manual, against `localhost:3001` after `npm run build && pm2 restart`:
1. `/vr-tour` → branded entry overlay shows, fades to campus tour.
2. Open sidebar → "Trung tâm CIE" label correct → click → viewer swaps to the 38-room sub-tour.
3. Click "← Khuôn viên chính" → returns to campus tour.
4. Spot-check 2–3 other locations (Thư viện, Lab CTS, Tòa A1) → still load normally.
5. HUD frame + glassy bar render in light AND dark theme.
6. `/games` → hub reads intentional (featured + invitation), not empty.
7. `/games/tyrp` → embed shows shared HUD frame + mono header; fullscreen still works.
8. Keyboard-tab through controls (focus visible); reduced-motion respected.

## 12. Future (out of scope)

- Merging CIE scenes into the main tour for in-sidebar parity (only if desired later).
- Removing `vtour-cie/tour_testingserver.*` dev binaries from `public/` (cleanup).
- Per-location entry art, minimap, or scene search in the VR HUD.
