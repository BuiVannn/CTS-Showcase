# Home Premium Motion, Ambient Effects & Text Choreography — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CTS Lab homepage feel premium and alive — ambient cursor/background motion, stronger section-title hierarchy, "reads-alive" text choreography, and three new content modules — without regressing scroll performance.

**Architecture:** Add a small global FX layer (cursor spotlight, ambient field, grain) mounted once in the root layout, driven by a single pointer + rAF loop writing CSS variables (never per-move React state). Fix hierarchy in `globals.css` so every existing `.eyebrow`/`.text-section` upgrades at once. Add reusable text-motion primitives (`Scramble`, extended `SplitText`/reveal), reusing the existing tested `CountUp`. Add three home modules and reorder `page.tsx`. Everything degrades under `prefers-reduced-motion` and on touch devices.

**Tech Stack:** Next.js (App Router), React, `motion/react` (Motion), Tailwind v4 (`@theme inline` in `globals.css`), TypeScript, Vitest (node env) for pure-logic units.

## Global Constraints

- **No palette or font changes.** Display = Plus Jakarta Sans (`--font-display`), body = Be Vietnam Pro (`--font-body`), mono = JetBrains Mono (`--font-mono`). Brand: `--blue #2563eb`, `--red #e11b22`. Use existing CSS variables/tokens only.
- **Bilingual content** is mandatory: every user-facing string is `Localized<T> = { en, vi }` from `src/content/types.ts`, resolved via `useLocale().t(...)`. Brand/proper nouns stay plain strings.
- **Animate only `transform` and `opacity`.** No animation bound to scroll event handlers. No layout-thrashing properties.
- **Single pointer listener + single `requestAnimationFrame` loop** for ambient effects; pointer position is written to CSS custom properties, never to React state per move.
- **Respect `prefers-reduced-motion: reduce`** via the existing `useReducedMotionSafe()` hook (returns `boolean`): disable cursor spotlight, aurora drift, text scramble; count-up shows final value; reveals collapse to a plain fade or none.
- **Cursor/hover effects gated** on `(hover: hover) and (pointer: fine)` — disabled on touch.
- **Reveals run once** (`viewport={{ once: true }}`). Ambient layers are `aria-hidden` and `pointer-events: none`.
- **Verification per visual task:** `npm run build` must succeed and `npx eslint <files>` must be clean; then confirm in the live app (`pm2 restart cts-redesign`, `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` → `200`). Deploy only in the final task unless noted.
- **Commit after every task.** Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/lerp.ts` — `lerp(a,b,t)` smoothing helper (+ `src/lib/lerp.test.ts`)
- `src/lib/scramble.ts` — `scrambleText(...)` deterministic scramble frame (+ `src/lib/scramble.test.ts`)
- `src/components/fx/CursorSpotlight.tsx` — pointer-following radial glow (global)
- `src/components/fx/AmbientField.tsx` — living grid + aurora blobs, `tone` prop (per-section)
- `src/components/fx/GrainOverlay.tsx` — static film-grain overlay (global)
- `src/components/ui/Scramble.tsx` — mono-label scramble reveal
- `src/components/ui/RevealLines.tsx` — line-by-line body reveal
- `src/components/home/WhatWeDo.tsx` — 4-pillar thesis grid
- `src/components/home/GamesTeaser.tsx` — arcade teaser strip

**Modify:**
- `src/app/globals.css` — type scale, marker eyebrow, `.text-chip` util, FX keyframes/vars
- `src/app/layout.tsx` — mount `CursorSpotlight` + `GrainOverlay`
- `src/components/ui/SectionHeader.tsx` — spacing for larger titles
- `src/components/ui/SplitText.tsx` — add `clip` rise variant for titles
- `src/components/home/HomeHero.tsx` — wrap in `AmbientField tone="cool"`; body via `RevealLines`
- `src/components/home/HomeStats.tsx` — upgrade to big Impact band
- `src/components/home/EcosystemBento.tsx` (+ wherever `ssoStrong` renders) — chip emphasis
- `src/content/ui.ts` — strings for `WhatWeDo` + `GamesTeaser`
- `src/app/page.tsx` — new module order

**Reuse as-is:** `src/components/ui/CountUp.tsx`, `src/lib/format.ts` (`parseCountValue`, `formatCount`), `src/components/ui/Magnetic.tsx`, `src/components/ui/StatBand.tsx`, `src/lib/useReducedMotionSafe.ts`, `src/lib/text.ts` (`splitWords`), `src/lib/motion.ts` (`EASE`, `staggerContainer`).

---

## PHASE 1 — Hierarchy foundation

### Task 1: Upgrade type scale + marker eyebrow + chip utility

**Files:**
- Modify: `src/app/globals.css` (typography + eyebrow blocks, ~lines 99-120)

**Interfaces:**
- Produces: CSS classes `.eyebrow` (now a marker with leading rule), `.text-section` (larger), `.text-chip` (inline emphasis). No JS API.

- [ ] **Step 1: Enlarge the section title scale**

In `src/app/globals.css`, replace the `.text-section` font-size line:

```css
.text-section {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 700; letter-spacing: -0.03em; line-height: 1.05;
  font-size: clamp(2rem, 5vw, 3.6rem);
}
```

- [ ] **Step 2: Turn the eyebrow into a marker (leading rule + dot + larger)**

Replace the existing `.eyebrow` and `.eyebrow::before` rules with:

```css
.eyebrow {
  display: inline-flex; align-items: center; gap: 0.6rem;
  font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--blue);
}
/* leading rule that "draws in" (see Task 9 for the reveal trigger) */
.eyebrow::before {
  content: ""; height: 1.5px; width: 2.4rem;
  background: linear-gradient(to right, transparent, var(--blue));
  border-radius: 999px;
}
/* brand dot */
.eyebrow::after {
  content: ""; width: 6px; height: 6px; border-radius: 999px;
  background: var(--blue); order: -1; /* dot sits between rule and text via flex order */
}
```

Note: with `order: -1` the dot renders first; adjust to taste so the visual order is `rule · dot · LABEL`. If ordering fights the flex, instead drop `::after` and prepend the dot inside `::before` using a box-shadow dot — but the two-pseudo approach above is preferred for the draw-in animation in Task 9.

- [ ] **Step 3: Add the inline chip utility**

Append after the `.eyebrow` rules:

```css
.text-chip {
  display: inline-block;
  padding: 0.05em 0.45em;
  border-radius: var(--radius-sm);
  background: var(--blue-soft);
  color: var(--blue);
  font-weight: 700;
}
```

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/app/globals.css || true`
Expected: build succeeds (CSS isn't linted by eslint; the `|| true` avoids a false failure).

- [ ] **Step 5: Verify in the live app**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. Open the site; every section eyebrow ("Tương tác", "Hợp tác", "Tiêu biểu", "Đăng nhập một lần") now shows a leading rule + dot and reads larger; section titles are noticeably bigger.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style(home): larger section titles + marker eyebrow + chip utility

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: SectionHeader spacing + inline SSO chip

**Files:**
- Modify: `src/components/ui/SectionHeader.tsx`
- Modify: wherever `ui.ecosystem.ssoStrong` / `sso.title` renders the "Đăng nhập một lần" inline emphasis (locate with grep below)

**Interfaces:**
- Consumes: `.text-chip` from Task 1.
- Produces: unchanged `SectionHeader` props (`eyebrow`, `title`, `cta?`).

- [ ] **Step 1: Increase title top-margin for the larger type**

In `src/components/ui/SectionHeader.tsx`, change the title line from `mt-2` to `mt-3`:

```tsx
<h2 className="text-section mt-3 text-ink">{title}</h2>
```

- [ ] **Step 2: Locate inline SSO emphasis**

Run: `grep -rn "ssoStrong\|sso.title\|Đăng nhập một lần" src/components src/content`
Identify each JSX site that renders the phrase inline (not as an `.eyebrow`, which Task 1 already fixed).

- [ ] **Step 3: Wrap the inline phrase in the chip**

At each inline render site found in Step 2, wrap the strong phrase so it reads as emphasis. Example pattern (adapt to the exact JSX found):

```tsx
{t(ui.ecosystem.ssoPrefix)}
<strong className="text-chip">{t(ui.ecosystem.ssoStrong)}</strong>
```

If no inline (non-eyebrow) render exists, note "no inline SSO site — eyebrow upgrade in Task 1 covers it" and skip the wrap.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/components/ui/SectionHeader.tsx`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/SectionHeader.tsx src/components/home src/content
git commit -m "style(home): balance SectionHeader spacing + chip the SSO phrase

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 2 — Ambient FX

### Task 3: `lerp` utility (TDD)

**Files:**
- Create: `src/lib/lerp.ts`
- Test: `src/lib/lerp.test.ts`

**Interfaces:**
- Produces: `lerp(a: number, b: number, t: number): number`

- [ ] **Step 1: Write the failing test**

`src/lib/lerp.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { lerp } from "./lerp";

describe("lerp", () => {
  it("returns a at t=0", () => expect(lerp(0, 10, 0)).toBe(0));
  it("returns b at t=1", () => expect(lerp(0, 10, 1)).toBe(10));
  it("interpolates the midpoint at t=0.5", () => expect(lerp(0, 10, 0.5)).toBe(5));
  it("works with negative ranges", () => expect(lerp(-4, 4, 0.5)).toBe(0));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/lerp.test.ts`
Expected: FAIL — cannot find module `./lerp`.

- [ ] **Step 3: Implement**

`src/lib/lerp.ts`:

```ts
/** Linear interpolation between a and b by t (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/lerp.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lerp.ts src/lib/lerp.test.ts
git commit -m "feat(lib): add lerp smoothing helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: CursorSpotlight (global)

**Files:**
- Create: `src/components/fx/CursorSpotlight.tsx`
- Modify: `src/app/globals.css` (add `--mx`/`--my` defaults; spotlight is self-styled inline)

**Interfaces:**
- Consumes: `lerp` (Task 3), `useReducedMotionSafe`.
- Produces: `<CursorSpotlight />` (no props). Writes CSS vars `--mx`, `--my` (px) on `document.documentElement`.

- [ ] **Step 1: Add CSS var defaults**

In `src/app/globals.css`, inside the `:root` block (near `--radius-*`), add:

```css
  --mx: 50vw;
  --my: 30vh;
```

- [ ] **Step 2: Implement the component**

`src/components/fx/CursorSpotlight.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { lerp } from "@/lib/lerp";

/**
 * A soft radial glow that trails the pointer. Writes the smoothed pointer
 * position to CSS vars (--mx/--my) via a single rAF loop — never React state —
 * so it cannot cause render churn or scroll jank. Disabled under reduced
 * motion and on non-fine-pointer (touch) devices.
 */
export default function CursorSpotlight() {
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = document.documentElement;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.3;
    let curX = targetX;
    let curY = targetY;
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        root.style.setProperty("--spot-opacity", "1");
      }
    };
    const onLeave = () => {
      visible = false;
      root.style.setProperty("--spot-opacity", "0");
    };

    const tick = () => {
      curX = lerp(curX, targetX, 0.12);
      curY = lerp(curY, targetY, 0.12);
      root.style.setProperty("--mx", `${curX}px`);
      root.style.setProperty("--my", `${curY}px`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        opacity: "var(--spot-opacity, 0)",
        transition: "opacity 0.4s ease",
        background:
          "radial-gradient(280px circle at var(--mx) var(--my), color-mix(in srgb, var(--blue) 14%, transparent), color-mix(in srgb, var(--red) 8%, transparent) 40%, transparent 70%)",
      }}
    />
  );
}
```

- [ ] **Step 3: Mount it in the root layout**

In `src/app/layout.tsx`, import and render inside `<body>` (before `<ThemeProvider>` content is fine; it must be a client component sibling). Add the import:

```tsx
import CursorSpotlight from "@/components/fx/CursorSpotlight";
```

And inside `<body className="min-h-screen bg-bg text-ink">`, immediately after the no-flash `<script>`:

```tsx
<CursorSpotlight />
```

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/components/fx/CursorSpotlight.tsx src/app/layout.tsx`
Expected: clean.

- [ ] **Step 5: Verify in the live app**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. On a mouse device the glow trails the cursor; scrolling stays smooth. With reduced motion on, nothing renders.

- [ ] **Step 6: Commit**

```bash
git add src/components/fx/CursorSpotlight.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat(fx): cursor-following spotlight (rAF, CSS vars, reduced-motion safe)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: AmbientField (per-section grid + aurora)

**Files:**
- Create: `src/components/fx/AmbientField.tsx`
- Modify: `src/app/globals.css` (aurora keyframes)
- Modify: `src/components/home/HomeHero.tsx` (replace the hand-rolled grid/glow block with `AmbientField tone="cool"`)

**Interfaces:**
- Consumes: CSS vars `--mx`/`--my` (Task 4), `useReducedMotionSafe`.
- Produces: `<AmbientField tone?: "cool" | "warm" />` — an absolutely-positioned, `aria-hidden` background layer meant to sit inside a `relative` section.

- [ ] **Step 1: Add aurora keyframes**

In `src/app/globals.css`, append:

```css
@keyframes aurora-drift {
  0%   { transform: translate3d(0,0,0) scale(1); }
  50%  { transform: translate3d(4%, -3%, 0) scale(1.08); }
  100% { transform: translate3d(0,0,0) scale(1); }
}
```

- [ ] **Step 2: Implement the component**

`src/components/fx/AmbientField.tsx`:

```tsx
"use client";

import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

/**
 * Section-level atmosphere: a faint technical grid that brightens near the
 * cursor (via --mx/--my) plus two slow-drifting aurora blobs. Cool (blue) by
 * default; warm (red) for game/showcase areas. Pure transform/opacity motion.
 */
export default function AmbientField({ tone = "cool" }: { tone?: "cool" | "warm" }) {
  const reduce = useReducedMotionSafe();
  const a = tone === "warm" ? "var(--red-soft)" : "var(--blue-soft)";
  const b = tone === "warm" ? "var(--blue-soft)" : "var(--red-soft)";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* base grid */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
        }}
      />
      {/* cursor-reactive grid highlight (no-op until pointer moves) */}
      {!reduce && (
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(var(--blue) 1px, transparent 1px), linear-gradient(90deg, var(--blue) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(180px circle at var(--mx) var(--my), #000 0%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(180px circle at var(--mx) var(--my), #000 0%, transparent 70%)",
          }}
        />
      )}
      {/* aurora blobs */}
      <div
        className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-[90px]"
        style={{ background: a, animation: reduce ? undefined : "aurora-drift 18s ease-in-out infinite" }}
      />
      <div
        className="absolute top-52 -left-12 h-64 w-64 rounded-full blur-[100px]"
        style={{ background: b, animation: reduce ? undefined : "aurora-drift 22s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Use it in the hero**

In `src/components/home/HomeHero.tsx`, replace the entire existing atmosphere block (the `<motion.div aria-hidden ...>` containing the grid + two glow `motion.div`s, currently ~lines 41-56) with:

```tsx
<AmbientField tone="cool" />
```

Add the import near the other component imports:

```tsx
import AmbientField from "@/components/fx/AmbientField";
```

Remove now-unused parallax transforms/imports only if they become unused (`yGrid`, `yGlow` were used by the removed block — delete those two `useTransform` lines and the `fade` style if no longer referenced; keep `yCopy`/`yCard`/`fade` if still used elsewhere in the file). Run lint to catch unused vars.

- [ ] **Step 4: Build + lint**

Run: `npm run build && npx eslint src/components/fx/AmbientField.tsx src/components/home/HomeHero.tsx`
Expected: clean (fix any unused-variable warnings from Step 3).

- [ ] **Step 5: Verify in the live app**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. Hero shows a living grid that brightens around the cursor + slow aurora; no scroll jank.

- [ ] **Step 6: Commit**

```bash
git add src/components/fx/AmbientField.tsx src/components/home/HomeHero.tsx src/app/globals.css
git commit -m "feat(fx): cursor-reactive ambient field (grid + aurora) in hero

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: GrainOverlay (global)

**Files:**
- Create: `src/components/fx/GrainOverlay.tsx`
- Modify: `src/app/layout.tsx` (mount it)

**Interfaces:**
- Produces: `<GrainOverlay />` (no props) — fixed, `aria-hidden`, `pointer-events: none` film grain.

- [ ] **Step 1: Implement using an inline SVG noise data-URI**

`src/components/fx/GrainOverlay.tsx`:

```tsx
/**
 * Static film-grain overlay for a tactile, premium surface. Pure CSS/SVG, no
 * runtime cost or motion — safe under reduced motion. Very low opacity so it
 * never harms legibility.
 */
export default function GrainOverlay() {
  const noise =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>`
    );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
      style={{ backgroundImage: `url("${noise}")`, backgroundSize: "120px 120px" }}
    />
  );
}
```

Note: the `%23n` keeps the `#n` filter id valid after `encodeURIComponent`. If the grain is invisible/too strong, tune `opacity-[0.035]` only.

- [ ] **Step 2: Mount in the layout**

In `src/app/layout.tsx`, import and render alongside `CursorSpotlight`:

```tsx
import GrainOverlay from "@/components/fx/GrainOverlay";
```

```tsx
<CursorSpotlight />
<GrainOverlay />
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npx eslint src/components/fx/GrainOverlay.tsx src/app/layout.tsx`
Expected: clean.

- [ ] **Step 4: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. A faint texture is visible on flat surfaces; text stays crisp.

- [ ] **Step 5: Commit**

```bash
git add src/components/fx/GrainOverlay.tsx src/app/layout.tsx
git commit -m "feat(fx): subtle film-grain overlay

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 3 — Text choreography

### Task 7: `scrambleText` utility (TDD)

**Files:**
- Create: `src/lib/scramble.ts`
- Test: `src/lib/scramble.test.ts`

**Interfaces:**
- Produces: `scrambleText(target: string, revealCount: number, frame: number, charset?: string): string`
  - Reveals the first `revealCount` characters of `target` verbatim.
  - Replaces each remaining non-space character with a deterministic char from `charset` chosen from `(frame + index)` — no `Math.random`.
  - Preserves spaces and string length exactly.

- [ ] **Step 1: Write the failing test**

`src/lib/scramble.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scrambleText } from "./scramble";

describe("scrambleText", () => {
  it("returns the target when fully revealed", () => {
    expect(scrambleText("PTalk", 5, 0)).toBe("PTalk");
    expect(scrambleText("PTalk", 99, 0)).toBe("PTalk");
  });
  it("preserves length and spaces", () => {
    const out = scrambleText("PTIT VR", 0, 3);
    expect(out).toHaveLength(7);
    expect(out[4]).toBe(" "); // space position preserved
  });
  it("reveals the prefix verbatim", () => {
    const out = scrambleText("PTalk", 2, 7);
    expect(out.slice(0, 2)).toBe("PT");
  });
  it("is deterministic for the same inputs", () => {
    expect(scrambleText("PTalk", 1, 42)).toBe(scrambleText("PTalk", 1, 42));
  });
  it("uses only charset characters for scrambled positions", () => {
    const charset = "AB";
    const out = scrambleText("XYZ", 0, 1, charset);
    for (const ch of out) expect(charset.includes(ch)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/scramble.test.ts`
Expected: FAIL — cannot find module `./scramble`.

- [ ] **Step 3: Implement**

`src/lib/scramble.ts`:

```ts
const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>*#";

/**
 * Deterministic scramble frame. First `revealCount` chars are shown verbatim;
 * remaining non-space chars are replaced by a charset char chosen from
 * (frame + index). Spaces and length are preserved. No randomness so it is
 * pure and testable.
 */
export function scrambleText(
  target: string,
  revealCount: number,
  frame: number,
  charset: string = DEFAULT_CHARS
): string {
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (i < revealCount || ch === " ") {
      out += ch;
    } else {
      const idx = (frame + i * 7) % charset.length;
      out += charset[idx];
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/scramble.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scramble.ts src/lib/scramble.test.ts
git commit -m "feat(lib): deterministic scrambleText frame helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Scramble component + apply to mono labels

**Files:**
- Create: `src/components/ui/Scramble.tsx`
- Modify: `src/components/home/HomeHero.tsx` (the `// {vrCardLabel}` mono kicker)

**Interfaces:**
- Consumes: `scrambleText` (Task 7), `useReducedMotionSafe`, Motion `useInView`.
- Produces: `<Scramble text: string, className?: string, durationMs?: number />`.

- [ ] **Step 1: Implement the component**

`src/components/ui/Scramble.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";
import { scrambleText } from "@/lib/scramble";

/**
 * Reveals a short label with a terminal-style scramble when it enters view.
 * Reserved for tiny mono labels (never body copy). Under reduced motion the
 * final text shows immediately.
 */
export default function Scramble({
  text,
  className,
  durationMs = 700,
}: {
  text: string;
  className?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotionSafe();
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (reduce || !inView) {
      setDisplay(text);
      return;
    }
    let raf = 0;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const reveal = Math.floor(p * text.length);
      setDisplay(scrambleText(text, reveal, frame));
      frame++;
      if (p < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, text, durationMs]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
```

- [ ] **Step 2: Apply to the hero VR mono kicker**

In `src/components/home/HomeHero.tsx`, replace the mono label line:

```tsx
<div className="font-mono mt-5 text-[0.7rem] tracking-wider text-blue">{"// "}<Scramble text={t(ui.home.vrCardLabel)} /></div>
```

Add the import:

```tsx
import Scramble from "@/components/ui/Scramble";
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npx eslint src/components/ui/Scramble.tsx src/components/home/HomeHero.tsx`
Expected: clean.

- [ ] **Step 4: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. The `// 164 scenes · 360°` kicker scrambles into place once on load; reduced motion shows it static.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Scramble.tsx src/components/home/HomeHero.tsx
git commit -m "feat(ui): terminal scramble reveal for mono labels

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: RevealLines (body) + title clip variant + eyebrow draw

**Files:**
- Create: `src/components/ui/RevealLines.tsx`
- Modify: `src/components/ui/SplitText.tsx` (add `clip` rise)
- Modify: `src/app/globals.css` (eyebrow rule draw-in keyframe + class)
- Modify: `src/components/home/HomeHero.tsx` (hero lead via `RevealLines`)

**Interfaces:**
- Consumes: `useReducedMotionSafe`, `EASE`, `staggerContainer`.
- Produces:
  - `<RevealLines text: string, className?: string, delay?: number />` — splits on `\n` (or renders one block) and rises each line behind a clip mask.
  - `SplitText` gains optional `clip?: boolean` prop: when true, each word rises from `120%` behind `overflow-hidden` wrappers.
  - CSS class `.eyebrow-draw` that animates the `::before` rule width from 0.

- [ ] **Step 1: Implement RevealLines**

`src/components/ui/RevealLines.tsx`:

```tsx
"use client";

import { motion } from "motion/react";
import { EASE, staggerContainer } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/useReducedMotionSafe";

const line = {
  hidden: { y: "110%" },
  show: { y: 0, transition: { duration: 0.7, ease: EASE } },
};

/**
 * Body/lead reveal: each line rises behind a clip mask as it enters view.
 * Lines are separated by "\n". Never scrambles or animates per character so
 * the text stays readable. Plain render under reduced motion.
 */
export default function RevealLines({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotionSafe();
  const lines = text.split("\n");
  if (reduce) return <p className={className}>{text}</p>;
  return (
    <motion.p
      className={className}
      variants={staggerContainer(0.12, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {lines.map((ln, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span className="block" variants={line}>
            {ln}
          </motion.span>
        </span>
      ))}
    </motion.p>
  );
}
```

- [ ] **Step 2: Add the `clip` variant to SplitText**

In `src/components/ui/SplitText.tsx`, add `clip = false` to the props and, when `clip` is true, wrap each word span in an `overflow-hidden` inline-block and change the word variant to rise from `120%`. Concretely, add the prop:

```tsx
export default function SplitText({
  segments,
  className,
  delayChildren = 0.05,
  clip = false,
}: {
  segments: SplitSegment[];
  className?: string;
  delayChildren?: number;
  clip?: boolean;
}) {
```

Add a clip word variant near the existing `word` const:

```tsx
const wordClip = {
  hidden: { y: "120%" },
  show: { y: 0, transition: { duration: 0.7, ease: EASE } },
};
```

In the animated branch, render each word using the clip wrapper when `clip` is set:

```tsx
{words.map((item, i) => (
  <Fragment key={i}>
    {clip ? (
      <span className="inline-block overflow-hidden align-bottom">
        <motion.span aria-hidden className={`inline-block ${item.className ?? ""}`} variants={wordClip}>
          {item.w}
        </motion.span>
      </span>
    ) : (
      <motion.span aria-hidden className={`inline-block ${item.className ?? ""}`} variants={word}>
        {item.w}
      </motion.span>
    )}
    {i < words.length - 1 ? " " : ""}
  </Fragment>
))}
```

- [ ] **Step 3: Add the eyebrow draw-in animation**

In `src/app/globals.css`, append:

```css
@keyframes eyebrow-rule {
  from { width: 0; opacity: 0; }
  to   { width: 2.4rem; opacity: 1; }
}
.eyebrow-draw::before { animation: eyebrow-rule 0.7s ease forwards; }
@media (prefers-reduced-motion: reduce) {
  .eyebrow-draw::before { animation: none; }
}
```

The `.eyebrow-draw` class is opt-in; apply it where an eyebrow should animate its rule (e.g. add `eyebrow-draw` next to `eyebrow` on the hero/section eyebrows). Applying globally is fine but optional.

- [ ] **Step 4: Use RevealLines for the hero lead**

In `src/components/home/HomeHero.tsx`, replace the lead paragraph:

```tsx
<RevealLines {...rise(0.12)} className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg" text={t(site.hero.subtitle)} />
```

Wait — `RevealLines` already manages its own reveal; do NOT spread `rise(...)` onto it. Use:

```tsx
<RevealLines className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg" text={t(site.hero.subtitle)} delay={0.12} />
```

Add the import:

```tsx
import RevealLines from "@/components/ui/RevealLines";
```

The hero `<h1>` already uses `SplitText`; add `clip` to make the headline rise behind a mask:

```tsx
<SplitText clip segments={[ /* unchanged segments */ ]} />
```

- [ ] **Step 5: Build + lint**

Run: `npm run build && npx eslint src/components/ui/RevealLines.tsx src/components/ui/SplitText.tsx src/components/home/HomeHero.tsx`
Expected: clean.

- [ ] **Step 6: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. Headline words rise behind a mask; the lead reveals line-by-line; reduced motion shows everything static.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/RevealLines.tsx src/components/ui/SplitText.tsx src/app/globals.css src/components/home/HomeHero.tsx
git commit -m "feat(ui): line reveal + clip-rise titles + eyebrow draw-in

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Apply choreography to remaining section headers/leads

**Files:**
- Modify: `src/components/home/ShowcaseSection.tsx`, `src/components/home/Partners.tsx`, `src/components/home/SpotlightSection.tsx`, `src/components/home/EcosystemBento.tsx`

**Interfaces:**
- Consumes: `SplitText` (clip), `RevealLines`, `.eyebrow-draw` from Task 9.

- [ ] **Step 1: Upgrade hand-rolled headers**

In `ShowcaseSection.tsx` and `Partners.tsx`, the headers render `<span className="eyebrow">{...}</span>` + `<h2 className="text-section mt-2 text-ink">{...}</h2>`. Add `eyebrow-draw` to the eyebrow and wrap the title text in a clip `SplitText`. Example for `ShowcaseSection.tsx`:

```tsx
<span className="eyebrow eyebrow-draw">{t(ui.showcase.eyebrow)}</span>
<h2 className="text-section mt-3 text-ink">
  <SplitText clip segments={[{ text: t(ui.showcase.title) }]} />
</h2>
```

Import `SplitText` where missing:

```tsx
import SplitText from "@/components/ui/SplitText";
```

Apply the same pattern to `Partners.tsx` (`ui.partners.eyebrow` / `ui.partners.title`).

- [ ] **Step 2: Upgrade Spotlight + Ecosystem leads**

In `SpotlightSection.tsx`, the eyebrow/title appear twice (pinned + fallback). Add `eyebrow-draw` to both `<span className="eyebrow">` and convert the lead `<p>` to `RevealLines` (import it). Keep the existing `text-section` title; optionally wrap in clip `SplitText`. In `EcosystemBento.tsx`, the header already uses `SectionHeader` (covered by Task 1/2) — only convert its intro paragraph (if any) to `RevealLines`.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npx eslint src/components/home/ShowcaseSection.tsx src/components/home/Partners.tsx src/components/home/SpotlightSection.tsx src/components/home/EcosystemBento.tsx`
Expected: clean.

- [ ] **Step 4: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. Each section's eyebrow rule draws in and its title rises as it scrolls into view.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/ShowcaseSection.tsx src/components/home/Partners.tsx src/components/home/SpotlightSection.tsx src/components/home/EcosystemBento.tsx
git commit -m "feat(home): apply title/eyebrow/line choreography across sections

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 4 — New content modules

### Task 11: Content strings for WhatWeDo + GamesTeaser

**Files:**
- Modify: `src/content/ui.ts` (add `whatWeDo` and `gamesTeaser` blocks)

**Interfaces:**
- Produces: `ui.whatWeDo` (`eyebrow`, `title`, `lead`, `pillars: { key, title, desc }[]`) and `ui.gamesTeaser` (`eyebrow`, `title`, `lead`, `cta`) — all `Localized`.

- [ ] **Step 1: Add the strings**

In `src/content/ui.ts`, add inside the exported `ui` object (after the `home` block):

```ts
  whatWeDo: {
    eyebrow: { en: "What we build", vi: "Chúng tôi làm gì" } as Localized,
    title: { en: "Four ways we make learning physical", vi: "Bốn cách biến bài học thành điều chạm được" } as Localized,
    lead: {
      en: "Robots, immersive worlds, AI tools, and games — built so students learn by doing.",
      vi: "Robot, thế giới nhập vai, công cụ AI và games — tạo ra để học sinh học bằng cách làm.",
    } as Localized,
    pillars: [
      { key: "robot", title: { en: "Robots", vi: "Robot" } as Localized, desc: { en: "Hands-on STEM hardware", vi: "Phần cứng STEM thực hành" } as Localized },
      { key: "vr", title: { en: "VR worlds", vi: "Thế giới VR" } as Localized, desc: { en: "360° campus & labs", vi: "Khuôn viên & phòng lab 360°" } as Localized },
      { key: "ai", title: { en: "AI tools", vi: "Công cụ AI" } as Localized, desc: { en: "Voice & learning companions", vi: "Trợ lý giọng nói & học tập" } as Localized },
      { key: "games", title: { en: "Games", vi: "Games" } as Localized, desc: { en: "Play-to-learn experiences", vi: "Học qua trò chơi" } as Localized },
    ],
  },
  gamesTeaser: {
    eyebrow: { en: "Play", vi: "Chơi" } as Localized,
    title: { en: "The lab's games hub", vi: "Khu game của lab" } as Localized,
    lead: {
      en: "Browse and play the games we build — rolling out soon.",
      vi: "Duyệt và chơi những game lab tạo ra — sắp ra mắt.",
    } as Localized,
    cta: { en: "Open Games", vi: "Vào khu Games" } as Localized,
  },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content/ui.ts
git commit -m "content(home): strings for WhatWeDo + GamesTeaser

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: WhatWeDo 4-pillar grid

**Files:**
- Create: `src/components/home/WhatWeDo.tsx`
- Modify: `src/app/page.tsx` (insert after `HomeHero`)

**Interfaces:**
- Consumes: `ui.whatWeDo` (Task 11), `Container`, `SectionHeader`, `Magnetic`, `RevealLines`, lucide icons.

- [ ] **Step 1: Implement the component**

`src/components/home/WhatWeDo.tsx`:

```tsx
"use client";

import { Bot, Boxes, Sparkles, Gamepad2 } from "lucide-react";
import { motion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { EASE, staggerContainer } from "@/lib/motion";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

const ICONS = { robot: Bot, vr: Boxes, ai: Sparkles, games: Gamepad2 } as const;

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function WhatWeDo() {
  const { t } = useLocale();
  const pillars = ui.whatWeDo.pillars;
  return (
    <section className="section">
      <Container>
        <SectionHeader eyebrow={t(ui.whatWeDo.eyebrow)} title={t(ui.whatWeDo.title)} />
        <motion.div
          className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer(0.1, 0.05)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {pillars.map((p) => {
            const Icon = ICONS[p.key as keyof typeof ICONS] ?? Sparkles;
            const warm = p.key === "games";
            return (
              <motion.div
                key={p.key}
                variants={card}
                className="group relative bg-card p-7 transition-transform duration-300 hover:-translate-y-1"
              >
                <span
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-border"
                  style={{ background: warm ? "var(--red-soft)" : "var(--blue-soft)", color: warm ? "var(--red)" : "var(--blue)" }}
                >
                  <Icon size={20} />
                </span>
                <h3 className="text-display mt-4 text-lg text-ink">{t(p.title)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{t(p.desc)}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Insert into the page after the hero**

In `src/app/page.tsx`, add the import and render `WhatWeDo` between `HomeHero` and `SpotlightSection`:

```tsx
import WhatWeDo from "@/components/home/WhatWeDo";
```

```tsx
<HomeHero />
<WhatWeDo />
<SpotlightSection />
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npx eslint src/components/home/WhatWeDo.tsx src/app/page.tsx`
Expected: clean.

- [ ] **Step 4: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. A 4-pillar grid (Robot · VR · AI · Games) sits right under the hero; the Games pillar uses warm accent; cards stagger in and lift on hover.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/WhatWeDo.tsx src/app/page.tsx
git commit -m "feat(home): What-we-do 4-pillar thesis grid

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Impact band (upgrade HomeStats)

**Files:**
- Modify: `src/components/home/HomeStats.tsx`

**Interfaces:**
- Consumes: existing `StatBand` (already uses `CountUp`), `AmbientField` (Task 5), `Container`.

- [ ] **Step 1: Make the band larger and atmospheric**

In `src/components/home/HomeStats.tsx`, wrap the stat band in a `relative` full-width feature block with an `AmbientField` and larger numbers. Replace the `Reveal`-wrapped `StatBand` block with:

```tsx
<div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-7 sm:p-10">
  <AmbientField tone="cool" />
  <div className="relative">
    <StatBand items={stats} />
  </div>
</div>
```

Add the import:

```tsx
import AmbientField from "@/components/fx/AmbientField";
```

To enlarge the numbers, bump the value text in `src/components/ui/StatBand.tsx` from `text-2xl` to `text-3xl sm:text-4xl`. (This component is shared; the larger size suits the impact band and is acceptable elsewhere.)

- [ ] **Step 2: Build + lint**

Run: `npm run build && npx eslint src/components/home/HomeStats.tsx src/components/ui/StatBand.tsx`
Expected: clean.

- [ ] **Step 3: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. The stats band reads as a larger impact moment with animated count-up over a faint living grid.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HomeStats.tsx src/components/ui/StatBand.tsx
git commit -m "feat(home): bigger impact stats band with ambient field

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: GamesTeaser arcade strip

**Files:**
- Create: `src/components/home/GamesTeaser.tsx`
- Modify: `src/app/page.tsx` (insert before `Partners`)

**Interfaces:**
- Consumes: `ui.gamesTeaser` (Task 11), `AmbientField tone="warm"`, `Container`, `Button`, `Magnetic`, lucide `Gamepad2`/`ArrowRight`.

- [ ] **Step 1: Implement the component**

`src/components/home/GamesTeaser.tsx`:

```tsx
"use client";

import { Gamepad2, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import AmbientField from "@/components/fx/AmbientField";

export default function GamesTeaser() {
  const { t } = useLocale();
  return (
    <section className="section">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-8 sm:p-12">
            <AmbientField tone="warm" />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <span className="eyebrow eyebrow-draw" style={{ color: "var(--red)" }}>{t(ui.gamesTeaser.eyebrow)}</span>
                <h2 className="text-section mt-3 text-ink">{t(ui.gamesTeaser.title)}</h2>
                <p className="mt-3 text-base leading-relaxed text-ink-2">{t(ui.gamesTeaser.lead)}</p>
              </div>
              <Magnetic>
                <Button href="/games" variant="red">
                  <Gamepad2 size={16} /> {t(ui.gamesTeaser.cta)} <ArrowRight size={16} />
                </Button>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Insert into the page before Partners**

In `src/app/page.tsx`, add the import and place `GamesTeaser` after `EcosystemBento`, before `Partners`:

```tsx
import GamesTeaser from "@/components/home/GamesTeaser";
```

```tsx
<EcosystemBento />
<GamesTeaser />
<Partners />
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npx eslint src/components/home/GamesTeaser.tsx src/app/page.tsx`
Expected: clean.

- [ ] **Step 4: Verify**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: `200`. A warm-toned Games teaser sits before Partners and links to `/games`; CTA is magnetic.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/GamesTeaser.tsx src/app/page.tsx
git commit -m "feat(home): games teaser arcade strip

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## PHASE 5 — Polish, verify, deploy

### Task 15: Reduced-motion / touch / mobile pass + performance + deploy

**Files:**
- Modify: any component needing a fix surfaced by this pass (no new files expected)

**Interfaces:** none new.

- [ ] **Step 1: Full typecheck, lint, tests**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (includes `lerp`, `scramble`, existing `format`/`scrollSteps`/etc.).

- [ ] **Step 2: Reduced-motion audit**

Temporarily emulate reduced motion (browser devtools "Emulate prefers-reduced-motion: reduce") and confirm: cursor spotlight absent, aurora static, scramble shows final text, count-up shows final value, line/title reveals show static text. Fix any component that still animates by routing it through `useReducedMotionSafe()`.

- [ ] **Step 3: Touch / no-hover audit**

In devtools device mode (touch), confirm `CursorSpotlight` and the grid-follow highlight do not render/track (gated on `(hover: hover) and (pointer: fine)`).

- [ ] **Step 4: Mobile reflow audit**

At 375px width confirm: `WhatWeDo` is single column, `GamesTeaser` stacks, hero card and stats remain readable, no horizontal scroll.

- [ ] **Step 5: Performance smoke check**

Scroll the full homepage and confirm no visible jank. If any janky layer appears, verify it animates only `transform`/`opacity` and is `pointer-events: none`.

- [ ] **Step 6: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/`
Expected: build succeeds; `200`.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "polish(home): reduced-motion, touch & mobile passes for motion system

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- §2 Signature (lab-responds-to-you) → Tasks 4 + 5 (cursor spotlight + reactive grid; warm tone in Tasks 13/14).
- §3 Ambient FX (CursorSpotlight, AmbientField, GrainOverlay, Magnetic) → Tasks 4, 5, 6 (Magnetic reused in 12/14).
- §4 Section header & type fix → Tasks 1, 2 (CSS auto-upgrades all eyebrows; SectionHeader spacing; SSO chip).
- §5 Text motion system (title/marker/lines/scramble/count/stagger) → Tasks 7, 8, 9, 10 (count = existing `CountUp`, reused in 13).
- §6 New modules (WhatWeDo, Impact band, GamesTeaser, page order) → Tasks 11, 12, 13, 14.
- §7 Quality floor (reduced-motion, touch, transform/opacity, single rAF, once-only, focus) → constraints throughout + Task 15 audit.
- §8 Phases → mapped 1:1 to plan phases.

**Placeholder scan:** No TBD/TODO; every code step shows complete code. Two steps intentionally require a grep-and-adapt (Task 2 SSO site, Task 10 section bodies) because exact JSX varies — each gives the concrete pattern to apply and a skip condition.

**Type consistency:** `scrambleText(target, revealCount, frame, charset?)` used identically in Task 7/8. `lerp(a,b,t)` consistent in Task 3/4. `AmbientField({tone})` consistent in Tasks 5/13/14. `CountUp`/`parseCountValue`/`formatCount` are pre-existing and reused unchanged. `RevealLines({text,className,delay})` consistent in Tasks 9/10.

**Note for implementer:** Pre-existing uncommitted working-tree changes (footer, nav, hero font/sizing) are unrelated to this plan and may be committed separately; do not revert them.
