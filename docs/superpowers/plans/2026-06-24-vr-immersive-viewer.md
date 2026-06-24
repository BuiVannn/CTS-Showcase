# VR Immersive Viewer + CIE Sub-tour — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the VR tour a branded "Immersive Viewer" chrome (glassy bar + viewfinder HUD + a "Bắt đầu" entry moment), and make the renamed "Trung tâm CIE" location open the standalone `vtour-cie` sub-tour — without touching the other 14 locations.

**Architecture:** A new reusable `src/components/viewer/` module (`ViewerFrame`, `ViewerEntry`, `ViewerChrome`) composes the chrome. `VRTourShell` drives the krpano iframe from a `src` **state**, shows the entry overlay, and provides a context-aware back control. CIE selection is a same-origin `postMessage` from the krpano `app.js` to the parent shell, validated by a pure helper in `src/lib/vr-viewer.ts`, which flips the iframe `src` to the sub-tour. The main `tour.xml`/`panos/` and the `vtour-cie/` folder are never modified.

**Tech Stack:** Next.js (App Router, this repo's fork — see AGENTS.md), React client components, Tailwind v4 with CSS custom-property tokens, `motion/react`, `lucide-react`, krpano (static `public/vr-tour/`), vitest (node env).

## Global Constraints

- **Do NOT modify** `public/vr-tour/tour.xml`, `public/vr-tour/panos/`, or anything inside `public/vr-tour/vtour-cie/`. The other 14 locations and the sub-tour must stay byte-identical.
- **Reuse the existing CTS design system only** — no new colors or typefaces. Tokens: `--bg --surface --card --border --ink --ink-2 --dim`, brand `--blue #2563eb` / `--red #e11b22`, the blue→red gradient, `--radius-sm/md/lg/pill`, `--shadow-sm/md/lg`, fonts `--font-display` / `--font-mono`.
- **Status readout text:** campus = `KHUÔN VIÊN PTIT · 360°`, CIE = `TRUNG TÂM CIE · 360°`. No brittle hardcoded scene/location counts.
- **CIE scene id** (the krpano scene intercepted): `scene_gpbk2224_1773131289876`.
- **postMessage contract:** `{ type: "cts-vr-load", src: "/vr-tour/vtour-cie/tour.html" }`, posted with `targetOrigin = location.origin`; the listener validates `event.origin === window.location.origin`.
- **Accessibility floor:** visible keyboard focus on every control; `prefers-reduced-motion` simplifies animation to a fade but keeps the "Bắt đầu" button; decorative HUD/dots `aria-hidden`.
- **All copy bilingual** (vi/en) via `src/content/ui.ts`.
- **Testing reality:** vitest runs in **node** env (no DOM). Unit-test pure logic in `src/lib/` only; verify React components and krpano edits via `npm run build` + browser at `localhost:3001`. Do not add testing-library/jsdom.
- **Deploy:** pm2 serves the prebuilt `.next` via `next start`. After component changes: `npm run build && pm2 restart cts-redesign` (build must succeed first). `app.js` is a static asset — no build needed, but a running tour must be hard-reloaded to re-fetch it.
- **Reversible:** everything is git-tracked. Back up `app.js` → `app.js.bak` before editing it.

---

## File Structure

- `public/vr-tour/app.js` — **modify** (L70 rename; CIE group click → postMessage). Back up first.
- `src/lib/vr-viewer.ts` — **create** (pure constants + `parseViewerMessage`).
- `src/lib/vr-viewer.test.ts` — **create** (vitest).
- `src/content/ui.ts` — **modify** (add `vrTour` copy keys).
- `src/components/viewer/ViewerFrame.tsx` — **create** (HUD: corner ticks + top gradient accent).
- `src/components/viewer/ViewerEntry.tsx` — **create** (entry/loading overlay; "Bắt đầu" button).
- `src/components/viewer/ViewerChrome.tsx` — **create** (fixed shell: glassy bar + frame + children).
- `src/components/VRTourShell.tsx` — **modify/rewrite** (compose chrome; `src` state; message listener; context-aware back).

---

## Task 1: Rename "Trung tâm IEC" → "Trung tâm CIE" (Step 0)

**Files:**
- Modify: `public/vr-tour/app.js:70`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (text-only). Independent of all other tasks.

- [ ] **Step 1: Back up app.js**

```bash
cp public/vr-tour/app.js public/vr-tour/app.js.bak
```

- [ ] **Step 2: Rename the group title**

In `public/vr-tour/app.js`, line 70, change:

```js
    "title": "Trung tâm IEC",
```

to:

```js
    "title": "Trung tâm CIE",
```

- [ ] **Step 3: Verify it is the only occurrence**

Run: `grep -rn "IEC" public/vr-tour/app.js public/vr-tour/tour.xml public/vr-tour/tour.html`
Expected: no output (zero matches).

- [ ] **Step 4: Commit**

```bash
git add public/vr-tour/app.js
git commit -m "fix(vr-tour): rename location 'Trung tâm IEC' to 'Trung tâm CIE'"
```

(`app.js.bak` is intentionally left untracked as a local safety copy; do not commit it.)

---

## Task 2: Pure VR viewer navigation logic (`src/lib/vr-viewer.ts`)

**Files:**
- Create: `src/lib/vr-viewer.ts`
- Test: `src/lib/vr-viewer.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `const CAMPUS_TOUR_SRC = "/vr-tour/tour.html"`
  - `const CIE_TOUR_SRC = "/vr-tour/vtour-cie/tour.html"`
  - `const VR_LOAD_MESSAGE = "cts-vr-load"`
  - `type ViewerArea = "campus" | "cie"`
  - `interface ViewerMode { src: string; area: ViewerArea }`
  - `const CAMPUS_MODE: ViewerMode` and `const CIE_MODE: ViewerMode`
  - `function parseViewerMessage(data: unknown, origin: string, expectedOrigin: string): ViewerMode | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/vr-viewer.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  parseViewerMessage,
  CAMPUS_MODE,
  CIE_MODE,
  CIE_TOUR_SRC,
  CAMPUS_TOUR_SRC,
} from "./vr-viewer";

const ORIGIN = "http://localhost:3001";

describe("parseViewerMessage", () => {
  it("returns CIE_MODE for a valid cts-vr-load message from the same origin", () => {
    const data = { type: "cts-vr-load", src: CIE_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toEqual(CIE_MODE);
  });

  it("returns CAMPUS_MODE when asked to load the campus tour", () => {
    const data = { type: "cts-vr-load", src: CAMPUS_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toEqual(CAMPUS_MODE);
  });

  it("rejects a message from a different origin", () => {
    const data = { type: "cts-vr-load", src: CIE_TOUR_SRC };
    expect(parseViewerMessage(data, "https://evil.example", ORIGIN)).toBeNull();
  });

  it("rejects a message with the wrong type", () => {
    const data = { type: "something-else", src: CIE_TOUR_SRC };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toBeNull();
  });

  it("rejects an unknown src", () => {
    const data = { type: "cts-vr-load", src: "/vr-tour/hack.html" };
    expect(parseViewerMessage(data, ORIGIN, ORIGIN)).toBeNull();
  });

  it("rejects non-object payloads", () => {
    expect(parseViewerMessage(null, ORIGIN, ORIGIN)).toBeNull();
    expect(parseViewerMessage("cts-vr-load", ORIGIN, ORIGIN)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/vr-viewer.test.ts`
Expected: FAIL — cannot resolve `./vr-viewer`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/vr-viewer.ts`:

```ts
/** Static-asset URLs for the two krpano tours the shell can host. */
export const CAMPUS_TOUR_SRC = "/vr-tour/tour.html";
export const CIE_TOUR_SRC = "/vr-tour/vtour-cie/tour.html";

/** Message type the krpano app.js posts to the parent shell to swap tours. */
export const VR_LOAD_MESSAGE = "cts-vr-load";

export type ViewerArea = "campus" | "cie";

export interface ViewerMode {
  src: string;
  area: ViewerArea;
}

export const CAMPUS_MODE: ViewerMode = { src: CAMPUS_TOUR_SRC, area: "campus" };
export const CIE_MODE: ViewerMode = { src: CIE_TOUR_SRC, area: "cie" };

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
  if (d.src === CIE_TOUR_SRC) return CIE_MODE;
  if (d.src === CAMPUS_TOUR_SRC) return CAMPUS_MODE;
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/vr-viewer.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/vr-viewer.ts src/lib/vr-viewer.test.ts
git commit -m "feat(vr-viewer): pure tour-swap message validation + mode constants"
```

---

## Task 3: VR copy keys (`src/content/ui.ts`)

**Files:**
- Modify: `src/content/ui.ts` (the `vrTour` object, ~L134-138)

**Interfaces:**
- Consumes: nothing.
- Produces (read by Tasks 5 & 7 as `ui.vrTour.*`): `backHome`, `backToCampus`, `entryTitle`, `entryLead`, `enter`, `statusCampus`, `statusCie`. (Existing `eyebrow`, `loading`, `back` are kept.)

- [ ] **Step 1: Replace the `vrTour` block**

In `src/content/ui.ts`, replace the existing `vrTour` object:

```ts
  vrTour: {
    eyebrow: { en: "PTIT Virtual Tour", vi: "Tham quan ảo PTIT" } as Localized,
    loading: { en: "Loading the 360° campus experience…", vi: "Đang tải trải nghiệm khuôn viên 360°…" } as Localized,
    back: { en: "Back", vi: "Quay lại" } as Localized,
  },
```

with:

```ts
  vrTour: {
    eyebrow: { en: "PTIT Virtual Tour", vi: "Tham quan ảo PTIT" } as Localized,
    loading: { en: "Loading the 360° campus experience…", vi: "Đang tải trải nghiệm khuôn viên 360°…" } as Localized,
    back: { en: "Back", vi: "Quay lại" } as Localized,
    backHome: { en: "Back", vi: "Quay lại" } as Localized,
    backToCampus: { en: "Main campus", vi: "Khuôn viên chính" } as Localized,
    entryTitle: { en: "360° experience", vi: "Trải nghiệm 360°" } as Localized,
    entryLead: { en: "Tour the PTIT campus in virtual reality.", vi: "Tham quan khuôn viên PTIT bằng thực tế ảo." } as Localized,
    enter: { en: "Start", vi: "Bắt đầu" } as Localized,
    statusCampus: { en: "PTIT CAMPUS · 360°", vi: "KHUÔN VIÊN PTIT · 360°" } as Localized,
    statusCie: { en: "CIE CENTER · 360°", vi: "TRUNG TÂM CIE · 360°" } as Localized,
  },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors from `ui.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/content/ui.ts
git commit -m "feat(vr-tour): add Immersive Viewer copy keys (entry, status, back)"
```

---

## Task 4: `ViewerFrame` — the HUD signature

**Files:**
- Create: `src/components/viewer/ViewerFrame.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `export default function ViewerFrame(): JSX.Element` — an absolutely-positioned, `aria-hidden`, `pointer-events-none` overlay. The consumer (`ViewerChrome`) must place it inside a `relative` container.

- [ ] **Step 1: Create the component**

Create `src/components/viewer/ViewerFrame.tsx`:

```tsx
/**
 * Viewfinder HUD: four brand-blue corner ticks plus a thin blue→red gradient
 * accent line along the top of the viewport. Purely decorative — it sits above
 * the tour iframe but never intercepts pointer events. The single "signature"
 * element of the Immersive Viewer; everything else stays quiet.
 */
export default function ViewerFrame() {
  const corners = [
    "left-3 top-3 border-l-2 border-t-2",
    "right-3 top-3 border-r-2 border-t-2",
    "left-3 bottom-3 border-l-2 border-b-2",
    "right-3 bottom-3 border-r-2 border-b-2",
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {/* top scan-line accent */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, var(--blue), var(--red))", opacity: 0.7 }}
      />
      {/* corner ticks */}
      {corners.map((pos) => (
        <span
          key={pos}
          className={`absolute h-4 w-4 rounded-[2px] ${pos}`}
          style={{ borderColor: "var(--blue)", opacity: 0.65 }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/viewer/ViewerFrame.tsx
git commit -m "feat(viewer): ViewerFrame HUD (corner ticks + gradient scan line)"
```

---

## Task 5: `ViewerEntry` — branded entry/loading overlay

**Files:**
- Create: `src/components/viewer/ViewerEntry.tsx`

**Interfaces:**
- Consumes: `useLocale`, `ui.vrTour` (Task 3); `motion/react`; `lucide-react`.
- Produces:
  `export interface ViewerEntryProps { variant: "hero" | "loader"; title: string; lead: string; meta: string; ready: boolean; onEnter: () => void }`
  `export default function ViewerEntry(props: ViewerEntryProps): JSX.Element`
  - `variant="hero"`: full arrival screen with the **"Bắt đầu →"** button (disabled with a shimmer until `ready`).
  - `variant="loader"`: compact spinner used when swapping tours mid-session (no button).

- [ ] **Step 1: Create the component**

Create `src/components/viewer/ViewerEntry.tsx`:

```tsx
"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

export interface ViewerEntryProps {
  variant: "hero" | "loader";
  title: string;
  lead: string;
  meta: string;
  ready: boolean;
  onEnter: () => void;
}

export default function ViewerEntry({ variant, title, lead, meta, ready, onEnter }: ViewerEntryProps) {
  const { t } = useLocale();
  const reduce = useReducedMotion();

  if (variant === "loader") {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-bg/80 backdrop-blur-sm">
        <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-border border-t-blue" />
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-ink-2">{meta}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-bg px-6 text-center"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <span className="font-mono text-xs uppercase tracking-[0.22em] text-ink-2">{meta}</span>
      <h1 className="text-display text-4xl font-extrabold text-ink sm:text-5xl">{title}</h1>
      <p className="max-w-sm text-base leading-relaxed text-ink-2">{lead}</p>

      {/* progress shimmer until the tour iframe has loaded */}
      <div className="relative mt-1 h-[3px] w-56 overflow-hidden rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 w-1/3 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--blue), var(--red))" }}
          animate={ready || reduce ? { width: "100%", left: 0 } : { left: ["-33%", "100%"] }}
          transition={ready || reduce ? { duration: 0.3 } : { duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <button
        type="button"
        onClick={onEnter}
        disabled={!ready}
        className="group mt-3 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, var(--blue), var(--red))" }}
      >
        {t(ui.vrTour.enter)}
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/viewer/ViewerEntry.tsx
git commit -m "feat(viewer): ViewerEntry arrival overlay with Bắt đầu button"
```

---

## Task 6: `ViewerChrome` — fixed shell, glassy bar, frame

**Files:**
- Create: `src/components/viewer/ViewerChrome.tsx`

**Interfaces:**
- Consumes: `ViewerFrame` (Task 4); `next/link`; `lucide-react`.
- Produces:
  `export type ViewerBack = { label: string; href: string } | { label: string; onClick: () => void }`
  `export interface ViewerChromeProps { back: ViewerBack; label: string; status: string; children: ReactNode }` (import `ReactNode` from `"react"`)
  `export default function ViewerChrome(props: ViewerChromeProps): JSX.Element`
  - Renders a fixed full-bleed shell: a glassy top bar (back control + brand dot + `label` + mono `status`) above a `relative flex-1` viewport that contains `children` (the iframe) and a `ViewerFrame`.

- [ ] **Step 1: Create the component**

Create `src/components/viewer/ViewerChrome.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ViewerFrame from "@/components/viewer/ViewerFrame";

export type ViewerBack = { label: string; href: string } | { label: string; onClick: () => void };

export interface ViewerChromeProps {
  back: ViewerBack;
  label: string;
  status: string;
  children: ReactNode;
}

const backClasses =
  "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/80 px-4 py-2 text-sm font-medium text-ink shadow-[var(--shadow-sm)] backdrop-blur transition-colors hover:text-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue";

export default function ViewerChrome({ back, label, status, children }: ViewerChromeProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      {/* glassy chrome bar */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/70 px-4 backdrop-blur-md">
        {"href" in back ? (
          <Link href={back.href} className={backClasses}>
            <ArrowLeft size={15} />
            {back.label}
          </Link>
        ) : (
          <button type="button" onClick={back.onClick} className={backClasses}>
            <ArrowLeft size={15} />
            {back.label}
          </button>
        )}

        <div className="ml-1 hidden items-center gap-2 sm:flex">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--red))" }}
          />
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink">{label}</span>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-dim">· {status}</span>
        </div>
      </header>

      {/* viewport */}
      <div className="relative flex-1">
        {children}
        <ViewerFrame />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/viewer/ViewerChrome.tsx
git commit -m "feat(viewer): ViewerChrome shell (glassy bar + HUD frame slot)"
```

---

## Task 7: Rewrite `VRTourShell` (Phase 1 — campus chrome complete)

**Files:**
- Modify (full rewrite): `src/components/VRTourShell.tsx`

**Interfaces:**
- Consumes: `ViewerChrome` (Task 6), `ViewerEntry` (Task 5), `vr-viewer` constants + `parseViewerMessage` (Task 2), `ui.vrTour` (Task 3), `useLocale`.
- Produces: the default `VRTourShell` page component. The window `message` listener is wired here but only fires once Task 8 makes `app.js` post — so after this task the campus tour and all 14 locations behave exactly as before, now wrapped in the new chrome with the "Bắt đầu" entry.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `src/components/VRTourShell.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import ViewerChrome from "@/components/viewer/ViewerChrome";
import ViewerEntry from "@/components/viewer/ViewerEntry";
import { CAMPUS_MODE, parseViewerMessage, type ViewerMode } from "@/lib/vr-viewer";

/**
 * Fullscreen VR tour. Drives the krpano iframe from `mode.src` state so the
 * "Trung tâm CIE" location can swap the viewport to its standalone sub-tour
 * (the krpano app.js posts a cts-vr-load message; see vr-viewer.ts). A branded
 * entry overlay covers each load: a "hero" arrival on first open, a light
 * loader on subsequent tour swaps.
 */
export default function VRTourShell() {
  const { t } = useLocale();
  const [mode, setMode] = useState<ViewerMode>(CAMPUS_MODE);
  const [ready, setReady] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  const firstLoad = useRef(true);

  // Swap tours when the krpano app.js asks (same-origin, validated).
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const next = parseViewerMessage(event.data, event.origin, window.location.origin);
      if (!next || next.src === mode.src) return;
      firstLoad.current = false;
      setMode(next);
      setReady(false);
      setShowEntry(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mode.src]);

  // The light loader auto-dismisses once the swapped tour has painted.
  useEffect(() => {
    if (ready && !firstLoad.current) setShowEntry(false);
  }, [ready]);

  const isCie = mode.area === "cie";
  const back = isCie
    ? { label: t(ui.vrTour.backToCampus), onClick: () => { firstLoad.current = false; setMode(CAMPUS_MODE); setReady(false); setShowEntry(true); } }
    : { label: t(ui.vrTour.backHome), href: "/" };
  const status = isCie ? t(ui.vrTour.statusCie) : t(ui.vrTour.statusCampus);

  return (
    <ViewerChrome back={back} label={t(ui.vrTour.eyebrow)} status={status}>
      <iframe
        key={mode.src}
        src={mode.src}
        title="PTIT Virtual Tour"
        onLoad={() => setReady(true)}
        className="absolute inset-0 z-10 h-full w-full border-0"
        allow="fullscreen; autoplay; xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
      />
      {showEntry && (
        <ViewerEntry
          variant={firstLoad.current ? "hero" : "loader"}
          title={isCie ? t(ui.vrTour.statusCie) : t(ui.vrTour.entryTitle)}
          lead={t(ui.vrTour.entryLead)}
          meta={status}
          ready={ready}
          onEnter={() => setShowEntry(false)}
        />
      )}
    </ViewerChrome>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build completes (the `/vr-tour` route compiles).

- [ ] **Step 4: Restart and verify the new chrome (manual)**

Run: `pm2 restart cts-redesign`
Then in a browser at `http://localhost:3001/vr-tour`:
- The branded **entry overlay** appears (eyebrow status, big "Trải nghiệm 360°", lead, shimmer).
- When loaded, **"Bắt đầu →"** enables; clicking it reveals the campus tour.
- The **glassy bar** shows back-pill "Quay lại", brand dot, "THAM QUAN ẢO PTIT · KHUÔN VIÊN PTIT · 360°".
- **HUD** corner ticks + top gradient line are visible over the tour.
- Open the krpano sidebar, click 2–3 locations (Thư viện, Lab CTS, Tòa A1) → they still load normally inside the tour.
- Toggle dark theme → bar/overlay/HUD still read well.
- Tab with keyboard → back-pill and button show focus rings.

- [ ] **Step 5: Commit**

```bash
git add src/components/VRTourShell.tsx
git commit -m "feat(vr-tour): Immersive Viewer chrome with src-state + entry overlay"
```

---

## Task 8: CIE swap trigger (Phase 2 — `app.js` intercept + end-to-end)

**Files:**
- Modify: `public/vr-tour/app.js` (the sidebar click path, ~L1469 group header / ~L1491 scene item)

**Interfaces:**
- Consumes: the postMessage contract validated by `parseViewerMessage` (Task 2) and the listener in `VRTourShell` (Task 7).
- Produces: clicking "Trung tâm CIE" in the krpano sidebar posts `{ type: "cts-vr-load", src: "/vr-tour/vtour-cie/tour.html" }` to the parent, swapping the viewport to the sub-tour.

- [ ] **Step 1: Read the click path**

Open `public/vr-tour/app.js` and read the scene-list rendering around L1443–1495 (the `header.onclick` group toggle at ~L1469 and the `item.onclick` scene loader at ~L1491–1492: `krpano.call('loadscene(${scene.sceneName}, null, MERGE, BLEND(1.0))')`).

- [ ] **Step 2: Intercept the CIE scene click**

At the scene-item click handler (the `item.onclick = () => { ... }` that calls `loadscene`), make the CIE scene post to the parent instead of loading the in-tour panorama. Change:

```js
             item.onclick = () => {
                 krpano.call(`loadscene(${scene.sceneName}, null, MERGE, BLEND(1.0))`);
             };
```

to:

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

(If the exact variable names differ, keep the guard identical and adapt only the surrounding handler. Do not change any other scene's behavior.)

- [ ] **Step 3: Hard-reload and verify end-to-end (manual)**

`app.js` is static — no rebuild needed, but hard-reload to bypass cache.
At `http://localhost:3001/vr-tour` (Ctrl/Cmd-Shift-R):
- Enter the campus tour, open the sidebar, click **"Trung tâm CIE"**.
- The viewport shows the **light loader**, then the standalone **38-room CIE sub-tour** (stock krpano skin) inside the same chrome.
- The bar back-pill now reads **"← Khuôn viên chính"** and status **"TRUNG TÂM CIE · 360°"**.
- Click **"← Khuôn viên chính"** → returns to the campus tour.
- Regression: click **Thư viện, Lab CTS, Tòa A1** → each loads its panorama normally (no swap).

- [ ] **Step 4: Commit**

```bash
git add public/vr-tour/app.js
git commit -m "feat(vr-tour): CIE location opens standalone vtour-cie sub-tour"
```

---

## Task 9: Final build, deploy & full verification

**Files:** none (verification + deploy only).

- [ ] **Step 1: Run the unit tests**

Run: `npx vitest run src/lib/vr-viewer.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds; `/vr-tour` listed in the route output.

- [ ] **Step 3: Deploy**

Run: `pm2 restart cts-redesign`

- [ ] **Step 4: Verification checklist (manual, `localhost:3001`)**

- [ ] `/vr-tour` → branded entry overlay → "Bắt đầu" reveals campus tour.
- [ ] Sidebar shows **"Trung tâm CIE"** (not IEC).
- [ ] Click CIE → swaps to the 38-room sub-tour; status + back label update.
- [ ] "← Khuôn viên chính" returns to campus.
- [ ] Thư viện / Lab CTS / Tòa A1 still load normally (no regression).
- [ ] Light + dark theme both render the bar/HUD/overlay correctly.
- [ ] Keyboard focus visible on back-pill and "Bắt đầu"; reduced-motion still shows the button.
- [ ] `grep -rn "IEC" public/vr-tour/app.js` → no matches.

- [ ] **Step 5: Confirm served output**

Run: `curl -s http://localhost:3001/vr-tour | grep -o "<title>[^<]*</title>"`
Expected: `<title>PTIT Virtual Tour</title>`.

---

## Notes for the implementer

- **Phase boundary:** Tasks 1–7 are Phase 1 (rename + chrome, campus verifiable on its own). Task 8 is Phase 2 (CIE swap). This is deliberate — see the spec §9b for why chrome-first avoids rework.
- **Never** touch `tour.xml`, `panos/`, or `vtour-cie/`. If a step seems to require it, stop — the design forbids it.
- **Rollback:** `git checkout -- public/vr-tour/app.js src/components/ src/content/ui.ts src/lib/vr-viewer*` restores everything; `public/vr-tour/app.js.bak` is a local copy of the pre-edit app.js.
- Spec: `docs/superpowers/specs/2026-06-24-vr-game-immersive-viewer-design.md`.
