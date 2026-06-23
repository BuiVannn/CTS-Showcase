# Custom Cursor, Particle Network, Games Mascot & Scroll Utilities — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the disliked cursor spotlight with a custom dot+ring cursor, add an interactive particle-network background, a small robot mascot in the Games area, and two scroll utilities (logo-to-top + a back-to-top button) — without regressing scroll performance.

**Architecture:** A custom cursor and a `<canvas>` particle network become the new atmosphere, each gated to capable devices and reduced-motion. Pointer position drives transforms/canvas drawing via rAF, never per-move React state. The round-1 `CursorSpotlight` is removed and the `AmbientField` cursor-reactive grid layer is dropped (the particles + custom cursor supersede them). Two small scroll utilities reuse the existing Lenis instance.

**Tech Stack:** Next.js (App Router), React, `motion/react`, Tailwind v4 (`@theme inline` in `globals.css`), `lenis` (smooth scroll, accessed via `@/lib/lenis`), TypeScript, Vitest (node env) for pure-logic units.

## Global Constraints

- **No palette or font changes.** Use existing CSS variables/tokens only (`--blue #2563eb`, `--red #e11b22`, `--blue-soft`, `--red-soft`, `--radius-*`, `--ink`, `--card`, `--border`, fonts via `--font-*`).
- **Bilingual:** every real user-facing string is `Localized` (`{ en, vi }`) from `src/content/types.ts`, resolved via `useLocale().t(...)`. Short imperative `data-cursor` verbs may be authored inline.
- **Performance:** one `requestAnimationFrame` loop per animated component; pointer position written to transforms / canvas / motion values, **never** per-move React state. Canvas loops pause when off-screen (`IntersectionObserver`) and on tab blur. Particle counts are **capped**. Nothing bound to scroll-event handlers except discrete threshold toggles. No layout-thrashing animated properties.
- **Reduced motion** (`useReducedMotionSafe()` → boolean): disables custom cursor (native cursor restored), particle network, mascot bob; scroll-to-top behaviors become instant jumps.
- **Touch / coarse pointer:** custom cursor and particle-cursor interaction disabled when `(hover: hover) and (pointer: fine)` is false; native cursor untouched. The back-to-top button still works on touch.
- **Lint:** no `react-hooks/set-state-in-effect` violations and **no `eslint-disable`** in new/edited files (the project lints this rule as an error). State that must be derived from media queries uses a `useSyncExternalStore` hook (the established `useReducedMotionSafe` pattern), not setState-in-effect.
- **Cursor safety:** the custom cursor is `pointer-events: none` and never intercepts clicks; `cursor: none` is applied only while the custom cursor is mounted and active, and text inputs keep a text caret.
- **Verification per visual task:** `npm run build` succeeds and `npx eslint <files>` is clean; for tasks with tests `npx vitest run` is green; then live check (`pm2 restart cts-redesign`, `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` → `200`). Deploy in the final task unless noted.
- **Commit after every task.** Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/scrollToTop.ts` — `scrollToTop(instant?: boolean)` shared helper (Lenis-aware)
- `src/components/ui/ScrollToTop.tsx` — fixed bottom-right back-to-top button
- `src/lib/usePointerFine.ts` — `usePointerFine()` hook (`(hover:hover) and (pointer:fine)` via `useSyncExternalStore`)
- `src/components/fx/CustomCursor.tsx` — dot + trailing ring cursor with hover morph + label
- `src/lib/particles.ts` — `particleCount(...)` + `lineAlpha(...)` pure helpers (+ `src/lib/particles.test.ts`)
- `src/components/fx/ParticleNetwork.tsx` — canvas particle-network background
- `src/components/home/GamesMascot.tsx` — SVG robot mascot (eyes follow cursor)

**Modify:**
- `src/components/Navbar.tsx` — logo `onClick` → scroll to top when already on `/`
- `src/content/ui.ts` — add `ui.nav.backToTop` (and any mascot/cursor strings if needed)
- `src/app/layout.tsx` — remove `CursorSpotlight`, add `CustomCursor` + `ScrollToTop`
- `src/app/globals.css` — `cursor: none` gated rule
- `src/components/fx/AmbientField.tsx` — remove the cursor-reactive grid layer
- `src/components/home/HomeHero.tsx` — add `ParticleNetwork tone="cool"`; `data-cursor` on the VR card
- `src/components/home/GamesTeaser.tsx` — add `ParticleNetwork tone="warm"` + `GamesMascot`
- `src/components/home/SpotlightSection.tsx` — `data-cursor="Kéo"` on the 3D stage
- `src/components/home/DemoVideo.tsx` — `data-cursor="Play"` on the video facade

**Delete:**
- `src/components/fx/CursorSpotlight.tsx`

**Reuse as-is:** `src/lib/lenis.ts` (`getLenis()`), `src/lib/useReducedMotionSafe.ts`, `src/components/fx/GrainOverlay.tsx`, `src/components/ui/Button.tsx`, `useLocale`.

---

## PHASE 1 — Scroll utilities

### Task 1: `scrollToTop` helper + header logo to top

**Files:**
- Create: `src/lib/scrollToTop.ts`
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Produces: `scrollToTop(instant?: boolean): void` — scrolls the page to the top using Lenis if available, else `window.scrollTo`.

- [ ] **Step 1: Create the helper**

`src/lib/scrollToTop.ts`:

```ts
import { getLenis } from "./lenis";

/**
 * Scroll the page to the very top. Uses the shared Lenis instance for a smooth
 * glide when present; falls back to the native API. Pass `instant` (e.g. under
 * reduced motion) to jump without animation.
 */
export function scrollToTop(instant = false): void {
  const lenis = getLenis();
  if (lenis) {
    lenis.scrollTo(0, { immediate: instant });
    return;
  }
  window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
}
```

- [ ] **Step 2: Wire the logo**

In `src/components/Navbar.tsx`, the brand is `<Link href="/" className="flex items-center" aria-label="CTS Lab — home">`. Add a reduced-motion-aware handler so that when already on the home route, clicking scrolls to top instead of doing a no-op navigation. Add imports at the top (the file already imports `usePathname` and `useReducedMotion` from motion — reuse them; it already has `const pathname = usePathname();` and `const reduce = useReducedMotion();`):

```tsx
import { scrollToTop } from "@/lib/scrollToTop";
```

Change the brand link to:

```tsx
<Link
  href="/"
  className="flex items-center"
  aria-label="CTS Lab — home"
  onClick={(e) => {
    if (pathname === "/") {
      e.preventDefault();
      scrollToTop(!!reduce);
    }
  }}
>
```

(Keep the existing `<Image>` child unchanged.)

- [ ] **Step 3: Build + lint**

Run: `npm run build && npx eslint src/lib/scrollToTop.ts src/components/Navbar.tsx`
Expected: clean.

- [ ] **Step 4: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. On the home page, scroll down and click the logo → smooth scroll to top; on other pages the logo still navigates home.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrollToTop.ts src/components/Navbar.tsx
git commit -m "feat(nav): header logo scrolls to top when already home

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Back-to-top button

**Files:**
- Create: `src/components/ui/ScrollToTop.tsx`
- Modify: `src/content/ui.ts`, `src/app/layout.tsx`

**Interfaces:**
- Consumes: `scrollToTop` (Task 1), `getLenis`, `useReducedMotionSafe`, `useLocale`, `ui.nav.backToTop`.
- Produces: `<ScrollToTop />` (no props).

- [ ] **Step 1: Add the bilingual label**

In `src/content/ui.ts`, inside the existing `nav` block (which currently has `download`, `viewAll`, `getInTouch`, `menu`), add:

```ts
    backToTop: { en: "Back to top", vi: "Lên đầu trang" } as Localized,
```

- [ ] **Step 2: Implement the button**

`src/components/ui/ScrollToTop.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { scrollToTop } from "@/lib/scrollToTop";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

/**
 * Fixed bottom-right button that appears after the user scrolls past ~1
 * viewport and scrolls back to the top on click. Visibility is a discrete
 * threshold toggle (not per-pixel state). Reduced motion → instant jump.
 */
export default function ScrollToTop() {
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotionSafe();
  const { t } = useLocale();

  useEffect(() => {
    const threshold = () => window.innerHeight * 0.9;
    const apply = (y: number) => setShown(y > threshold());
    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ scroll }: { scroll: number }) => apply(scroll);
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }
    const handle = () => apply(window.scrollY);
    handle();
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <button
      type="button"
      aria-label={t(ui.nav.backToTop)}
      onClick={() => scrollToTop(reduce)}
      className={`fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-border bg-card text-ink shadow-[var(--shadow-md)] transition-all duration-300 hover:border-blue hover:text-blue ${
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <ArrowUp size={18} />
    </button>
  );
}
```

Note: `setShown(y > threshold())` only re-renders when the boolean flips (React bails on identical values), so this is a discrete toggle, not per-pixel state.

- [ ] **Step 3: Mount it in the layout**

In `src/app/layout.tsx`, add the import and render it once inside `<body>` (after `<GrainOverlay />`):

```tsx
import ScrollToTop from "@/components/ui/ScrollToTop";
```

```tsx
<GrainOverlay />
<ScrollToTop />
```

- [ ] **Step 4: Build + lint + typecheck**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/ui/ScrollToTop.tsx src/app/layout.tsx src/content/ui.ts`
Expected: clean.

- [ ] **Step 5: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. Scrolling down ~1 screen reveals the bottom-right arrow; clicking glides to top; it hides near the top.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ScrollToTop.tsx src/app/layout.tsx src/content/ui.ts
git commit -m "feat(ui): back-to-top button (appears after one viewport)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 2 — Custom cursor

### Task 3: Custom cursor (replaces CursorSpotlight)

**Files:**
- Create: `src/lib/usePointerFine.ts`, `src/components/fx/CustomCursor.tsx`
- Delete: `src/components/fx/CursorSpotlight.tsx`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `useReducedMotionSafe`.
- Produces: `usePointerFine(): boolean`; `<CustomCursor />` (no props). Adds/removes the `cursor-none` class on `<html>` while active.

- [ ] **Step 1: Capability hook (no setState-in-effect)**

`src/lib/usePointerFine.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(cb: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}
function getServerSnapshot(): boolean {
  return false;
}

/** True only on devices with a fine, hovering pointer (mouse/trackpad). */
export function usePointerFine(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 2: Implement the cursor**

`src/components/fx/CustomCursor.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { usePointerFine } from "@/lib/usePointerFine";

const HOVER_SELECTOR = 'a, button, [role="button"], [data-cursor]';

/**
 * Custom cursor: a dot tracking the pointer 1:1 and an outline ring that trails
 * with smoothing. Over interactive targets the ring grows; elements with a
 * `data-cursor="…"` attribute show that label inside the ring. Position is
 * written to transforms in a single rAF loop — never React state. Active only
 * on fine-pointer, non-reduced-motion devices; otherwise renders nothing and
 * leaves the native cursor alone.
 */
export default function CustomCursor() {
  const reduce = useReducedMotionSafe();
  const fine = usePointerFine();
  const enabled = fine && !reduce;

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("cursor-none");

    let dotX = window.innerWidth / 2;
    let dotY = window.innerHeight / 2;
    let ringX = dotX;
    let ringY = dotY;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dotX = e.clientX;
      dotY = e.clientY;
      const target = e.target as Element | null;
      const hit = target?.closest?.(HOVER_SELECTOR) ?? null;
      setHovering(!!hit);                       // event handler, not effect body
      setLabel(hit?.getAttribute("data-cursor") || null);
    };
    const tick = () => {
      ringX += (dotX - ringX) * 0.18;
      ringY += (dotY - ringY) * 0.18;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      root.classList.remove("cursor-none");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-blue"
        style={{ transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)" }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full border border-blue text-blue transition-[width,height,background-color] duration-200 ${
          hovering ? "h-12 w-12 bg-blue/10" : "h-8 w-8"
        }`}
        style={{ transform: "translate3d(-100px, -100px, 0) translate(-50%, -50%)" }}
      >
        {label && <span className="text-[0.6rem] font-semibold">{label}</span>}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Swap in the layout, delete CursorSpotlight**

In `src/app/layout.tsx`: replace the `CursorSpotlight` import with `CustomCursor`, and replace `<CursorSpotlight />` with `<CustomCursor />`:

```tsx
import CustomCursor from "@/components/fx/CustomCursor";
```
```tsx
<CustomCursor />
<GrainOverlay />
<ScrollToTop />
```

Then delete the file:

```bash
git rm src/components/fx/CursorSpotlight.tsx
```

- [ ] **Step 4: Gated `cursor: none` CSS**

In `src/app/globals.css`, append:

```css
/* Hide the native cursor only while the custom cursor is active; keep a text
   caret in editable fields. */
html.cursor-none, html.cursor-none * { cursor: none; }
html.cursor-none input, html.cursor-none textarea, html.cursor-none [contenteditable="true"] { cursor: text; }
```

- [ ] **Step 5: Build + lint**

Run: `npm run build && npx eslint src/lib/usePointerFine.ts src/components/fx/CustomCursor.tsx src/app/layout.tsx`
Expected: clean. Confirm the build does not error on the deleted `CursorSpotlight` (no remaining imports).

- [ ] **Step 6: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. On a mouse: a dot + trailing ring replace the native cursor; the ring grows over links/buttons. On reduced motion or touch: native cursor, nothing rendered.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(fx): custom dot+ring cursor; remove cursor spotlight

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `data-cursor` labels on key surfaces

**Files:**
- Modify: `src/components/home/HomeHero.tsx`, `src/components/home/SpotlightSection.tsx`, `src/components/home/DemoVideo.tsx`

**Interfaces:**
- Consumes: the `data-cursor` label mechanism from Task 3 (an element with `data-cursor="X"` makes the ring show `X` on hover).

- [ ] **Step 1: Hero VR card → "Xem"**

In `src/components/home/HomeHero.tsx`, the right-column VR spotlight is a `<Link href="/vr-tour" className="group block rounded-… ">`. Add `data-cursor="Xem"` to that `<Link>` (keep all existing props/classes).

- [ ] **Step 2: PTalk 3D stage → "Kéo"**

In `src/components/home/SpotlightSection.tsx`, the `Stage` renders the 3D viewer inside `<div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-3 …">`. Add `data-cursor="Kéo"` to that outer Stage wrapper `<div>` (the one wrapping the `RobotViewer`/aspect-square). Keep existing classes/attributes.

- [ ] **Step 3: Demo video facade → "Play"**

In `src/components/home/DemoVideo.tsx`, find the clickable play facade (the element the user clicks to start the video) and add `data-cursor="Play"` to it. If the facade is a `<button>`/`<div role="button">`, add the attribute there. Read the file first and attach it to the actual click target.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/components/home/HomeHero.tsx src/components/home/SpotlightSection.tsx src/components/home/DemoVideo.tsx`
Expected: clean.

- [ ] **Step 5: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. Hovering the VR card shows "Xem" in the ring, the 3D stage shows "Kéo", the demo video shows "Play".

- [ ] **Step 6: Commit**

```bash
git add src/components/home/HomeHero.tsx src/components/home/SpotlightSection.tsx src/components/home/DemoVideo.tsx
git commit -m "feat(home): cursor labels on VR card, 3D stage, demo video

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 3 — Particle network

### Task 5: Particle math helpers (TDD)

**Files:**
- Create: `src/lib/particles.ts`, `src/lib/particles.test.ts`

**Interfaces:**
- Produces:
  - `particleCount(width: number, height: number, opts?: { density?: number; cap?: number; min?: number }): number`
  - `lineAlpha(dist: number, maxDist: number): number`

- [ ] **Step 1: Write the failing tests**

`src/lib/particles.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { particleCount, lineAlpha } from "./particles";

describe("particleCount", () => {
  it("scales with area at the default density", () => {
    // 1280x720 = 921600 / 16000 ≈ 57.6 → 58, under the cap
    expect(particleCount(1280, 720)).toBe(58);
  });
  it("caps large viewports", () => {
    expect(particleCount(4000, 4000, { cap: 70 })).toBe(70);
  });
  it("never returns below the minimum", () => {
    expect(particleCount(200, 200, { min: 12 })).toBe(12);
  });
  it("returns an integer", () => {
    expect(Number.isInteger(particleCount(1000, 800))).toBe(true);
  });
});

describe("lineAlpha", () => {
  it("is 1 at zero distance", () => expect(lineAlpha(0, 120)).toBe(1));
  it("is 0 at/over the max distance", () => {
    expect(lineAlpha(120, 120)).toBe(0);
    expect(lineAlpha(200, 120)).toBe(0);
  });
  it("fades linearly between", () => expect(lineAlpha(60, 120)).toBeCloseTo(0.5));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/particles.test.ts`
Expected: FAIL — cannot find module `./particles`.

- [ ] **Step 3: Implement**

`src/lib/particles.ts`:

```ts
/**
 * Particle count scaled to viewport area, with a hard cap and a floor. Keeps
 * the network dense enough to read on large screens without unbounded cost on
 * huge ones, and never so sparse it disappears on small screens.
 */
export function particleCount(
  width: number,
  height: number,
  opts: { density?: number; cap?: number; min?: number } = {}
): number {
  const { density = 16000, cap = 70, min = 14 } = opts;
  const raw = Math.round((width * height) / density);
  return Math.max(min, Math.min(cap, raw));
}

/** Line opacity that fades linearly from 1 (touching) to 0 (>= maxDist). */
export function lineAlpha(dist: number, maxDist: number): number {
  if (dist >= maxDist) return 0;
  return 1 - dist / maxDist;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/particles.test.ts`
Expected: PASS (7 tests). Then `npx vitest run` → full suite green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/particles.ts src/lib/particles.test.ts
git commit -m "feat(lib): particle count + line alpha helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: ParticleNetwork canvas component

**Files:**
- Create: `src/components/fx/ParticleNetwork.tsx`

**Interfaces:**
- Consumes: `particleCount`, `lineAlpha` (Task 5), `useReducedMotionSafe`, `usePointerFine` (Task 3).
- Produces: `<ParticleNetwork tone?: "cool" | "warm" />` — an `aria-hidden`, absolutely-positioned canvas that fills its `position: relative` parent.

- [ ] **Step 1: Implement the component**

`src/components/fx/ParticleNetwork.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { particleCount, lineAlpha } from "@/lib/particles";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { usePointerFine } from "@/lib/usePointerFine";

type Pt = { x: number; y: number; vx: number; vy: number };

const MAX_DIST = 130;       // link distance (CSS px)
const CURSOR_DIST = 170;    // link-to-cursor distance

/**
 * Interactive particle-network background drawn on a <canvas>. Points drift and
 * link to nearby points and to the cursor. One rAF loop; paused off-screen and
 * on tab blur; particle count capped to viewport. Disabled under reduced motion
 * and on coarse/touch pointers (renders nothing).
 */
export default function ParticleNetwork({ tone = "cool" }: { tone?: "cool" | "warm" }) {
  const reduce = useReducedMotionSafe();
  const fine = usePointerFine();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabled = !reduce; // motion gate; cursor-linking additionally needs `fine`

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = tone === "warm" ? "225, 27, 34" : "37, 99, 235"; // --red / --blue
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    let pts: Pt[] = [];
    let raf = 0;
    let running = false;
    const cursor = { x: -9999, y: -9999, on: false };

    const resize = () => {
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = particleCount(w, h);
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const al = lineAlpha(d, MAX_DIST);
          if (al > 0) {
            ctx.strokeStyle = `rgba(${rgb}, ${al * 0.28})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (cursor.on) {
          const dc = Math.hypot(a.x - cursor.x, a.y - cursor.y);
          const alc = lineAlpha(dc, CURSOR_DIST);
          if (alc > 0) {
            ctx.strokeStyle = `rgba(${rgb}, ${alc * 0.5})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(cursor.x, cursor.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${rgb}, 0.55)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(step); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const onMove = (e: PointerEvent) => {
      if (!fine || e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      cursor.x = e.clientX - r.left;
      cursor.y = e.clientY - r.top;
      cursor.on = cursor.x >= 0 && cursor.y >= 0 && cursor.x <= w && cursor.y <= h;
    };
    const onLeave = () => { cursor.on = false; };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(parent);
    const onBlur = () => stop();
    const onFocus = () => { if (!document.hidden) start(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [enabled, fine, tone]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />;
}
```

- [ ] **Step 2: Build + lint**

Run: `npm run build && npx eslint src/components/fx/ParticleNetwork.tsx`
Expected: clean (no `react-hooks/set-state-in-effect` — this component uses no React state at all).

- [ ] **Step 3: Commit**

```bash
git add src/components/fx/ParticleNetwork.tsx
git commit -m "feat(fx): interactive particle-network canvas

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Wire ParticleNetwork + trim AmbientField

**Files:**
- Modify: `src/components/fx/AmbientField.tsx`, `src/components/home/HomeHero.tsx`, `src/components/home/GamesTeaser.tsx`

**Interfaces:**
- Consumes: `<ParticleNetwork tone>` (Task 6), `<AmbientField tone>` (existing).

- [ ] **Step 1: Remove the cursor-reactive grid layer from AmbientField**

In `src/components/fx/AmbientField.tsx`, delete the entire `{!reduce && ( … cursor-reactive grid highlight … )}` block (the second grid `<div>` whose `maskImage` uses `var(--mx) var(--my)`). Keep the base grid and the two aurora blobs. After removal, `reduce` is still used by the aurora `animation` props, so the import stays. Run eslint to confirm no unused vars.

- [ ] **Step 2: Add ParticleNetwork to the hero**

In `src/components/home/HomeHero.tsx`, the hero currently renders `<AmbientField tone="cool" />` near the top of the `<section>`. Add `ParticleNetwork` right after it so both layer behind the content (AmbientField provides the aurora color underlay; ParticleNetwork provides the moving network):

```tsx
import ParticleNetwork from "@/components/fx/ParticleNetwork";
```
```tsx
<AmbientField tone="cool" />
<ParticleNetwork tone="cool" />
```

- [ ] **Step 3: Add ParticleNetwork to the Games teaser**

In `src/components/home/GamesTeaser.tsx`, the teaser card renders `<AmbientField tone="warm" />` inside the `relative overflow-hidden` card. Add `ParticleNetwork tone="warm"` right after it:

```tsx
import ParticleNetwork from "@/components/fx/ParticleNetwork";
```
```tsx
<AmbientField tone="warm" />
<ParticleNetwork tone="warm" />
```

(The card is already `relative overflow-hidden`, so the absolutely-positioned canvas fills it correctly and is clipped.)

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/components/fx/AmbientField.tsx src/components/home/HomeHero.tsx src/components/home/GamesTeaser.tsx`
Expected: clean.

- [ ] **Step 5: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. The hero and Games card show a drifting particle network that links to the cursor (cool/warm respectively); scrolling stays smooth; reduced motion shows none.

- [ ] **Step 6: Commit**

```bash
git add src/components/fx/AmbientField.tsx src/components/home/HomeHero.tsx src/components/home/GamesTeaser.tsx
git commit -m "feat(home): particle network in hero + games; drop reactive grid layer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 4 — Games mascot

### Task 8: Robot mascot (eyes follow cursor)

**Files:**
- Create: `src/components/home/GamesMascot.tsx`
- Modify: `src/components/home/GamesTeaser.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `useReducedMotionSafe`, `usePointerFine`.
- Produces: `<GamesMascot />` (no props) — a small decorative SVG robot.

- [ ] **Step 1: Bob keyframes**

In `src/app/globals.css`, append:

```css
@keyframes mascot-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

- [ ] **Step 2: Implement the mascot**

`src/components/home/GamesMascot.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { usePointerFine } from "@/lib/usePointerFine";

/**
 * Small decorative robot for the Games area. Idle bob via CSS; pupils follow
 * the cursor (computed in a single rAF off a plain pointer ref — no per-move
 * React state). Static and bob-free under reduced motion.
 */
export default function GamesMascot() {
  const reduce = useReducedMotionSafe();
  const fine = usePointerFine();
  const rootRef = useRef<SVGSVGElement>(null);
  const leftRef = useRef<SVGCircleElement>(null);
  const rightRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (reduce || !fine) return;
    const pointer = { x: 0, y: 0, seen: false };
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true;
    };
    const aim = (pupil: SVGCircleElement | null, cx: number, cy: number) => {
      if (!pupil) return;
      const svg = rootRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      // socket center in viewport coords (svg is 120x120 viewBox)
      const sx = r.left + (cx / 120) * r.width;
      const sy = r.top + (cy / 120) * r.height;
      const a = Math.atan2(pointer.y - sy, pointer.x - sx);
      const max = 3; // px of travel inside the eye (viewBox units)
      pupil.setAttribute("cx", String(cx + Math.cos(a) * max));
      pupil.setAttribute("cy", String(cy + Math.sin(a) * max));
    };
    const tick = () => {
      if (pointer.seen) { aim(leftRef.current, 48, 54); aim(rightRef.current, 72, 54); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("pointermove", onMove); };
  }, [reduce, fine]);

  return (
    <svg
      ref={rootRef}
      aria-hidden
      viewBox="0 0 120 120"
      className="h-20 w-20 shrink-0 text-blue"
      style={{ animation: reduce ? undefined : "mascot-bob 2.8s ease-in-out infinite" }}
    >
      {/* antenna */}
      <line x1="60" y1="20" x2="60" y2="34" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="17" r="4" fill="var(--red)" />
      {/* head */}
      <rect x="32" y="34" width="56" height="44" rx="12" fill="var(--card)" stroke="currentColor" strokeWidth="3" />
      {/* eyes (sockets) */}
      <circle cx="48" cy="54" r="9" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <circle cx="72" cy="54" r="9" fill="#fff" stroke="currentColor" strokeWidth="2" />
      {/* pupils */}
      <circle ref={leftRef} cx="48" cy="54" r="4" fill="currentColor" />
      <circle ref={rightRef} cx="72" cy="54" r="4" fill="currentColor" />
      {/* mouth */}
      <rect x="48" y="66" width="24" height="4" rx="2" fill="currentColor" />
      {/* body hint */}
      <rect x="42" y="82" width="36" height="18" rx="6" fill="var(--card)" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
```

- [ ] **Step 3: Place it in the Games teaser**

In `src/components/home/GamesTeaser.tsx`, render `<GamesMascot />` inside the teaser's content row so it sits near the CTA without disturbing the copy. Add the import and place it between the text block and the `Magnetic` CTA (it is `shrink-0`, so it co-exists in the flex row):

```tsx
import GamesMascot from "@/components/home/GamesMascot";
```

Inside the `relative flex … sm:justify-between` row, after the `<div className="max-w-xl">…</div>` text block and before the `<Magnetic>` CTA, add:

```tsx
<GamesMascot />
```

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/components/home/GamesMascot.tsx src/components/home/GamesTeaser.tsx`
Expected: clean (no React state in the mascot → no setState-in-effect).

- [ ] **Step 5: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games`
and `… http://localhost:3001/` → both `200`. In the Games teaser a small robot bobs and its pupils track the cursor; reduced motion → still, centered eyes.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/GamesMascot.tsx src/components/home/GamesTeaser.tsx src/app/globals.css
git commit -m "feat(home): games robot mascot with cursor-tracking eyes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 5 — Polish, verify, deploy

### Task 9: Reduced-motion / touch / mobile / perf audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by the audit (no new files expected)

- [ ] **Step 1: Full automated suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (includes new `particles` tests + existing suites). Confirm NO `react-hooks/set-state-in-effect` and NO stray `eslint-disable` in any new/edited file.

- [ ] **Step 2: Reduced-motion code audit**

Confirm each new animating unit degrades: `CustomCursor` (returns null when `reduce`), `ParticleNetwork` (returns null when `reduce`), `GamesMascot` (no bob + static eyes when `reduce`), `ScrollToTop` + `scrollToTop` (instant jump when `reduce`). Confirm `globals.css` keeps the global `@media (prefers-reduced-motion: reduce)` block. Fix any gap by routing through `useReducedMotionSafe()`.

- [ ] **Step 3: Touch / pointer audit**

Confirm `CustomCursor` and `ParticleNetwork` cursor-linking are gated by `usePointerFine()` (`(hover:hover) and (pointer:fine)`); the native cursor is never hidden on touch (the `cursor-none` class is only added inside the `enabled` effect); the back-to-top button works without a fine pointer.

- [ ] **Step 4: Mobile reflow audit (code level)**

At 375px: confirm the back-to-top button doesn't overlap the footer or important controls, the Games teaser still reflows (`flex-col sm:flex-row`) with the mascot not breaking the layout (`shrink-0`, hidden or wrapping acceptably), and the hero canvas fills without horizontal scroll. Add `hidden sm:block` to the mascot if it crowds the mobile layout (report the decision).

- [ ] **Step 5: Performance smoke check**

Scroll the full homepage; confirm no jank with two canvases (hero + games) — they pause when off-screen via `IntersectionObserver`. If any jank, confirm particle caps and that off-screen pausing works.

- [ ] **Step 6: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3` then health-check `http://localhost:3001/`, `/games`, `/products` → all `200`.

- [ ] **Step 7: Commit (only if fixes were made)**

```bash
git add -A
git commit -m "polish(home): reduced-motion/touch/mobile audit for cursor+particles+mascot

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes were needed, do not create an empty commit — report the audit results.

---

## Self-Review (completed during planning)

**Spec coverage:**
- §3 Custom cursor (dot+ring, morph, label, native-cursor hide, gating) → Tasks 3 + 4.
- §4 Particle network (canvas, tone, cursor-link, perf caps, off-screen pause, reduced-motion/touch off) → Tasks 5 + 6 + 7; round-1 reactive-grid removed in Task 7.
- §5 Robot mascot (SVG, bob, eyes follow, reduced-motion, games-only, last/optional) → Task 8.
- §6.1 Logo→top → Task 1. §6.2 Back-to-top button → Task 2.
- §7 Quality floor (reduced-motion, touch, single rAF, no per-move state, no setState-in-effect, cursor safety, bilingual) → constraints throughout + Task 9 audit.
- §8 Phases → mapped 1:1 (utilities → cursor → particles → mascot → polish).

**Placeholder scan:** No TBD/TODO. Every code step shows complete code. Task 4 step 3 (DemoVideo) and Task 8 step 3 (teaser placement) require reading the current file to attach an attribute/element — each names the exact target and attribute, not a vague instruction.

**Type consistency:** `particleCount(width, height, opts?)` and `lineAlpha(dist, maxDist)` used identically in Tasks 5/6. `usePointerFine(): boolean` defined in Task 3, consumed in Tasks 6/8. `scrollToTop(instant?)` defined Task 1, consumed Task 2. `ParticleNetwork({tone})` and `AmbientField({tone})` consistent in Task 7. `data-cursor` label contract defined in Task 3, used in Task 4.

**Note for implementer:** This plan builds on round-1 motion work already committed on this branch (HEAD `212bf051`). It deletes `CursorSpotlight` and trims `AmbientField` — those are intended replacements, not regressions.
