# Home 3D PTalk + Site-Wide Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive 3D PTalk spotlight (with an AR/VR motion-graphics layer and a pinned scrollytelling moment) and a reusable, site-wide motion system to the CTS Lab site, keeping the existing "Academic Tech" look.

**Architecture:** A small shared motion library (`Reveal`, `Stagger`, `CountUp`, `Magnetic`, `ScrollProgress`, `SplitText`, `PageTransition`, `HoverPreview`) plus pure, unit-tested helpers in `src/lib`. A client-only, lazy-loaded `RobotViewer` (three.js / R3F) renders the PTalk model with AR effects; `SpotlightSection` frames it and, on desktop, pins it as a scroll-driven storytelling moment. Every page then composes the shared library for consistent motion.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `motion` (Motion v12, imported from `motion/react`), `@react-three/fiber` 9, `@react-three/drei` 10, `three` 0.184, `@react-three/postprocessing` (new), `lenis`, vitest.

## Global Constraints

- **Design system unchanged.** Use existing CSS variables only: `--blue #2563eb`, `--red #e11b22`, `--blue-soft`, `--red-soft`, `--border`, `--card`, `--surface`, `--bg`, `--ink`, `--ink-2`, `--dim`, `--shadow-sm/md/lg`, `--radius-sm/md/lg/pill`. Dark-mode brand values are `--blue #5b8def`, `--red #f2555b`. Never reintroduce removed "Soft Futurism" tokens (`--coral`, `--border-strong`, `--gradient-soft`, `text-coral-ink`, `.glass-strong`).
- **Shared easing:** `EASE = [0.2, 0.7, 0.2, 1]` from `@/lib/motion`. Reveal distance default 24px; reveal viewport margin `"-60px"`.
- **Reduced motion:** every animated component must independently no-op (render plain, no transform) when `useReducedMotion()` is true. CSS already clamps transition/animation durations globally.
- **3D safety:** `RobotViewer` is imported only via `next/dynamic(..., { ssr: false })`; three.js + postprocessing must never enter the initial bundle. Draco decoder is local at `/draco/`. Model is `/model/robot.glb` (already present).
- **Rim-light colors** for the 3D model: red `#f2555b`, blue `#5b8def`.
- **i18n:** all user-facing copy via `useLocale()`'s `t(localized)`; never hardcode VI/EN strings in components. Bilingual content lives in `src/content/*`.
- **Dependencies:** the ONLY new dependency is `@react-three/postprocessing`. No GSAP / scroll libraries.
- **Verification gates:** `npm run lint`, `npm run test`, and `npm run build` must all pass before the final commit of each task that changes code.

## Testing approach (read once)

The repo's vitest runs in `environment: "node"` with no jsdom/testing-library (see `vitest.config.ts`), and existing tests are pure-function tests. Therefore:
- **Pure logic** (number parsing, word splitting, scroll-step segmentation) lives in `src/lib/*.ts` helpers and is developed **test-first** (real failing test → implement → pass).
- **Visual/interactive components** (motion, WebGL) cannot be unit-tested in node. Their gate is: `npm run build` (typecheck + bundling/SSR safety) **passes** plus the explicit **manual checklist** in the task. Do not invent DOM tests that can't run here.

---

## File Structure

**New — pure helpers (tested):**
- `src/lib/format.ts` — `parseCountValue`, `formatCount` (CountUp math).
- `src/lib/text.ts` — `splitWords` (SplitText).
- `src/lib/scrollSteps.ts` — `activeStepFromProgress` (pinned-section step segmentation).

**New — shared motion components:**
- `src/components/ui/Reveal.tsx`
- `src/components/ui/Stagger.tsx` (`Stagger` + `StaggerItem`)
- `src/components/ui/CountUp.tsx`
- `src/components/ui/Magnetic.tsx`
- `src/components/ui/ScrollProgress.tsx`
- `src/components/ui/SplitText.tsx`
- `src/components/ui/PageTransition.tsx`
- `src/components/ui/HoverPreview.tsx`

**New — 3D:**
- `src/components/home/RobotViewer.tsx` (client-only; model + AR layer + bloom + callout anchors)
- `src/components/home/SpotlightSection.tsx` (frame + pinned scrollytelling)

**New — tests:**
- `src/lib/format.test.ts`, `src/lib/text.test.ts`, `src/lib/scrollSteps.test.ts`

**Modified:**
- `package.json` / `package-lock.json` (add `@react-three/postprocessing`)
- `src/lib/motion.ts` (expand variants)
- `src/content/ui.ts` (add `ui.spotlight.steps`)
- `src/app/layout.tsx` (mount `ScrollProgress`; wrap children in `PageTransition`)
- `src/app/page.tsx` (insert `SpotlightSection`)
- `src/components/home/HomeHero.tsx`, `HomeStats.tsx`, `ShowcaseSection.tsx`, `EcosystemBento.tsx`, `Partners.tsx`, `HomeCTA.tsx`
- `src/components/ui/StatBand.tsx`, `MediaFrame.tsx`(unchanged — superseded by HoverPreview where needed), `Button.tsx`, `Navbar.tsx`
- `src/components/products/ProductsGrid.tsx`, `ProductDetail.tsx`, `src/components/team/TeamGrid.tsx`, `src/components/StubPage.tsx`, `src/components/VRTourShell.tsx`

**Reused as-is:** `public/model/robot.glb`, `public/draco/*`, `src/content/site.ts` (`site.videoUrl` already exists at line 54).

---

## Task 1: Expand the motion variant library

**Files:**
- Modify: `src/lib/motion.ts`

**Interfaces:**
- Produces: `EASE: [number,number,number,number]`, `DURATION: number`, `fadeUp(distance?: number): Variants`, `fadeIn: Variants`, `scaleIn: Variants`, `staggerContainer(stagger?: number, delayChildren?: number): Variants`, `fadeUpItem: Variants`.

- [ ] **Step 1: Replace `src/lib/motion.ts` with the expanded library**

```ts
import type { Variants, Transition } from "motion/react";

/** Shared cubic-bezier easing (typed as a 4-tuple for Motion). */
export const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];
export const DURATION = 0.7;

const base: Transition = { duration: DURATION, ease: EASE };

/** Fade + rise from `distance` px below. */
export function fadeUp(distance = 24): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    show: { opacity: 1, y: 0, transition: base },
  };
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: base },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: base },
};

/** Container that staggers its children's reveal. */
export function staggerContainer(stagger = 0.08, delayChildren = 0.05): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
  };
}

/** Default child variant used by Stagger / StaggerItem. */
export const fadeUpItem: Variants = fadeUp(24);
```

- [ ] **Step 2: Typecheck/lint**

Run: `npm run lint`
Expected: no errors for `src/lib/motion.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/motion.ts
git commit -m "feat(motion): expand shared variant library (fadeUp/fadeIn/scaleIn/stagger)"
```

---

## Task 2: CountUp math helper (`src/lib/format.ts`)

**Files:**
- Create: `src/lib/format.ts`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Produces:
  - `parseCountValue(value: string): { target: number | null; pad: number; suffix: string; raw: string }`
  - `formatCount(n: number, pad: number, suffix: string): string`

- [ ] **Step 1: Write the failing test**

`src/lib/format.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { parseCountValue, formatCount } from "./format";

describe("parseCountValue", () => {
  it("parses a plain integer", () => {
    expect(parseCountValue("164")).toEqual({ target: 164, pad: 0, suffix: "", raw: "164" });
  });
  it("preserves zero-padding width", () => {
    expect(parseCountValue("05")).toEqual({ target: 5, pad: 2, suffix: "", raw: "05" });
  });
  it("keeps a trailing suffix", () => {
    expect(parseCountValue("164+")).toEqual({ target: 164, pad: 0, suffix: "+", raw: "164+" });
  });
  it("returns null target for non-numeric values", () => {
    expect(parseCountValue("PTIT")).toEqual({ target: null, pad: 0, suffix: "", raw: "PTIT" });
  });
});

describe("formatCount", () => {
  it("rounds and pads", () => {
    expect(formatCount(4.6, 2, "")).toBe("05");
  });
  it("appends the suffix", () => {
    expect(formatCount(164, 0, "+")).toBe("164+");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/format.test.ts`
Expected: FAIL with "Failed to resolve import './format'" / "parseCountValue is not a function".

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
export interface CountParts {
  /** numeric target, or null when the value has no leading digits */
  target: number | null;
  /** zero-pad width to preserve (only when the original was zero-padded, e.g. "05") */
  pad: number;
  /** trailing non-numeric suffix to re-append (e.g. "+") */
  suffix: string;
  /** the original value, returned verbatim when target is null */
  raw: string;
}

export function parseCountValue(value: string): CountParts {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return { target: null, pad: 0, suffix: "", raw: value };
  const digits = match[1];
  const pad = digits.length > 1 && digits.startsWith("0") ? digits.length : 0;
  return { target: parseInt(digits, 10), pad, suffix: match[2] ?? "", raw: value };
}

export function formatCount(n: number, pad: number, suffix: string): string {
  return String(Math.round(n)).padStart(pad, "0") + suffix;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/format.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat(lib): add CountUp number parsing/formatting helpers"
```

---

## Task 3: SplitText word helper (`src/lib/text.ts`)

**Files:**
- Create: `src/lib/text.ts`
- Test: `src/lib/text.test.ts`

**Interfaces:**
- Produces: `splitWords(text: string): string[]`

- [ ] **Step 1: Write the failing test**

`src/lib/text.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { splitWords } from "./text";

describe("splitWords", () => {
  it("splits on whitespace preserving order", () => {
    expect(splitWords("Meet PTalk now")).toEqual(["Meet", "PTalk", "now"]);
  });
  it("collapses extra whitespace and trims", () => {
    expect(splitWords("  a   b ")).toEqual(["a", "b"]);
  });
  it("returns an empty array for blank input", () => {
    expect(splitWords("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/text.test.ts`
Expected: FAIL (cannot resolve `./text`).

- [ ] **Step 3: Implement `src/lib/text.ts`**

```ts
/** Split a string into words, trimming and collapsing whitespace. */
export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter((w) => w.length > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/text.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/text.ts src/lib/text.test.ts
git commit -m "feat(lib): add splitWords helper for SplitText"
```

---

## Task 4: Scroll-step segmentation helper (`src/lib/scrollSteps.ts`)

**Files:**
- Create: `src/lib/scrollSteps.ts`
- Test: `src/lib/scrollSteps.test.ts`

**Interfaces:**
- Produces: `activeStepFromProgress(progress: number, count: number): number`

- [ ] **Step 1: Write the failing test**

`src/lib/scrollSteps.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { activeStepFromProgress } from "./scrollSteps";

describe("activeStepFromProgress", () => {
  it("maps the start of the range to step 0", () => {
    expect(activeStepFromProgress(0, 3)).toBe(0);
  });
  it("maps the middle of the range to the middle step", () => {
    expect(activeStepFromProgress(0.5, 3)).toBe(1);
  });
  it("clamps the end of the range to the last step", () => {
    expect(activeStepFromProgress(1, 3)).toBe(2);
  });
  it("clamps negative/over-range input", () => {
    expect(activeStepFromProgress(-0.2, 3)).toBe(0);
    expect(activeStepFromProgress(2, 3)).toBe(2);
  });
  it("returns 0 when there are no steps", () => {
    expect(activeStepFromProgress(0.7, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/scrollSteps.test.ts`
Expected: FAIL (cannot resolve `./scrollSteps`).

- [ ] **Step 3: Implement `src/lib/scrollSteps.ts`**

```ts
/** Map a 0..1 scroll progress to an active step index in [0, count-1]. */
export function activeStepFromProgress(progress: number, count: number): number {
  if (count <= 0) return 0;
  const clamped = Math.min(0.999999, Math.max(0, progress));
  return Math.min(count - 1, Math.floor(clamped * count));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/scrollSteps.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrollSteps.ts src/lib/scrollSteps.test.ts
git commit -m "feat(lib): add scroll-step segmentation helper"
```

---

## Task 5: `Reveal` + `Stagger` components

**Files:**
- Create: `src/components/ui/Reveal.tsx`
- Create: `src/components/ui/Stagger.tsx`

**Interfaces:**
- Consumes: `EASE`, `staggerContainer`, `fadeUpItem` from `@/lib/motion`.
- Produces:
  - `Reveal` (default export): `{ children: ReactNode; direction?: "up"|"down"|"left"|"right"|"none"; delay?: number; once?: boolean; className?: string }`
  - `Stagger` (named): `{ children: ReactNode; className?: string; stagger?: number; once?: boolean }`
  - `StaggerItem` (named): `{ children: ReactNode; className?: string }`

- [ ] **Step 1: Create `src/components/ui/Reveal.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

type Direction = "up" | "down" | "left" | "right" | "none";

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
};

export default function Reveal({
  children,
  direction = "up",
  delay = 0,
  once = true,
  className,
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  once?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const { x, y } = offset[direction];
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Stagger.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { staggerContainer, fadeUpItem } from "@/lib/motion";

export function Stagger({
  children,
  className,
  stagger = 0.08,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerContainer(stagger)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={fadeUpItem}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 3: Typecheck/lint**

Run: `npm run lint`
Expected: no errors for the two new files.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Reveal.tsx src/components/ui/Stagger.tsx
git commit -m "feat(ui): add Reveal and Stagger reveal primitives"
```

---

## Task 6: `CountUp` component

**Files:**
- Create: `src/components/ui/CountUp.tsx`

**Interfaces:**
- Consumes: `parseCountValue`, `formatCount` from `@/lib/format`.
- Produces: `CountUp` (default export): `{ value: string; durationMs?: number; className?: string }`.

- [ ] **Step 1: Create `src/components/ui/CountUp.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion, animate } from "motion/react";
import { EASE } from "@/lib/motion";
import { parseCountValue, formatCount } from "@/lib/format";

export default function CountUp({
  value,
  durationMs = 1400,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const parts = parseCountValue(value);

  const [display, setDisplay] = useState(() =>
    parts.target === null || reduce ? value : formatCount(0, parts.pad, parts.suffix)
  );

  useEffect(() => {
    if (parts.target === null || reduce || !inView) return;
    const controls = animate(0, parts.target, {
      duration: durationMs / 1000,
      ease: EASE,
      onUpdate: (v) => setDisplay(formatCount(v, parts.pad, parts.suffix)),
    });
    return () => controls.stop();
  }, [inView, reduce, parts.target, parts.pad, parts.suffix, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck/lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CountUp.tsx
git commit -m "feat(ui): add CountUp scroll-triggered number animation"
```

---

## Task 7: `Magnetic` component

**Files:**
- Create: `src/components/ui/Magnetic.tsx`

**Interfaces:**
- Produces: `Magnetic` (default export): `{ children: ReactNode; strength?: number; className?: string }`.

- [ ] **Step 1: Create `src/components/ui/Magnetic.tsx`**

```tsx
"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

export default function Magnetic({
  children,
  strength = 0.4,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.3 });

  if (reduce) return <span className={className}>{children}</span>;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-flex ${className ?? ""}`}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Typecheck/lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Magnetic.tsx
git commit -m "feat(ui): add Magnetic pointer-follow wrapper for CTAs"
```

---

## Task 8: `ScrollProgress` bar + mount in layout

**Files:**
- Create: `src/components/ui/ScrollProgress.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `ScrollProgress` (default export): no props.

- [ ] **Step 1: Create `src/components/ui/ScrollProgress.tsx`**

```tsx
"use client";

import { motion, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.2 });
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, var(--blue), var(--red))" }}
    />
  );
}
```

- [ ] **Step 2: Mount it in `src/app/layout.tsx`**

Add the import near the other component imports (after line 6 `import SmoothScroll ...`):
```tsx
import ScrollProgress from "@/components/ui/ScrollProgress";
```
Then render it just inside `<LocaleProvider>`, before `<SmoothScroll />`:
```tsx
        <ThemeProvider>
          <LocaleProvider>
            <ScrollProgress />
            <SmoothScroll />
            {children}
          </LocaleProvider>
        </ThemeProvider>
```

- [ ] **Step 3: Build to verify SSR/import safety**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/ScrollProgress.tsx src/app/layout.tsx
git commit -m "feat(ui): add site-wide scroll-progress bar"
```

---

## Task 9: `SplitText` component

**Files:**
- Create: `src/components/ui/SplitText.tsx`

**Interfaces:**
- Consumes: `splitWords` from `@/lib/text`; `staggerContainer` from `@/lib/motion`.
- Produces: `SplitText` (default export): `{ segments: { text: string; className?: string }[]; className?: string; delayChildren?: number }`; exported `interface SplitSegment { text: string; className?: string }`.

- [ ] **Step 1: Create `src/components/ui/SplitText.tsx`**

```tsx
"use client";

import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { splitWords } from "@/lib/text";
import { staggerContainer } from "@/lib/motion";
import { EASE } from "@/lib/motion";

export interface SplitSegment {
  text: string;
  className?: string;
}

const word = {
  hidden: { opacity: 0, y: "0.5em" },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export default function SplitText({
  segments,
  className,
  delayChildren = 0.05,
}: {
  segments: SplitSegment[];
  className?: string;
  delayChildren?: number;
}) {
  const reduce = useReducedMotion();
  const label = segments.map((s) => s.text).join(" ");

  if (reduce) {
    return (
      <span className={className}>
        {segments.map((s, i) => (
          <Fragment key={i}>
            <span className={s.className}>{s.text}</span>
            {i < segments.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </span>
    );
  }

  const words = segments.flatMap((s) =>
    splitWords(s.text).map((w) => ({ w, className: s.className }))
  );

  return (
    <motion.span
      aria-label={label}
      className={className}
      variants={staggerContainer(0.08, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {words.map((item, i) => (
        <Fragment key={i}>
          <motion.span aria-hidden className={`inline-block ${item.className ?? ""}`} variants={word}>
            {item.w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </motion.span>
  );
}
```

- [ ] **Step 2: Typecheck/lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/SplitText.tsx
git commit -m "feat(ui): add SplitText word-level headline reveal"
```

---

## Task 10: `PageTransition` + mount in layout

**Files:**
- Create: `src/components/ui/PageTransition.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `PageTransition` (default export): `{ children: ReactNode }`.

**Note:** Per `AGENTS.md`, before implementing, skim `node_modules/next/dist/docs/` for any first-class Next 16 view-transition guidance. If none is cleanly available, ship the framework-safe Motion implementation below (enter-fade keyed on `usePathname()`), which needs no experimental flag.

- [ ] **Step 1: Create `src/components/ui/PageTransition.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Wrap children in `src/app/layout.tsx`**

Add the import:
```tsx
import PageTransition from "@/components/ui/PageTransition";
```
Wrap `{children}` (keep `ScrollProgress`/`SmoothScroll` outside the transition):
```tsx
          <LocaleProvider>
            <ScrollProgress />
            <SmoothScroll />
            <PageTransition>{children}</PageTransition>
          </LocaleProvider>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual check**

Run `npm run dev`, navigate between `/` and `/products`. Expected: a brief (~250ms) fade/slide-in of page content on each navigation; with OS "reduce motion" on, navigation is instant.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/PageTransition.tsx src/app/layout.tsx
git commit -m "feat(ui): add subtle route crossfade page transitions"
```

---

## Task 11: `HoverPreview` tile

**Files:**
- Create: `src/components/ui/HoverPreview.tsx`

**Interfaces:**
- Produces: `HoverPreview` (default export): `{ src: string; alt: string; ratio?: string; overlay: ReactNode; className?: string }`.

**Design:** CSS-only hover/focus reveal (no JS), so it is reduced-motion-safe (global CSS clamps the transitions) and keyboard accessible (`group-focus-within`). Image zooms; overlay (caption) fades + slides up.

- [ ] **Step 1: Create `src/components/ui/HoverPreview.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import Image from "next/image";

export default function HoverPreview({
  src,
  alt,
  ratio = "16 / 9",
  overlay,
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  overlay: ReactNode;
  className?: string;
}) {
  return (
    <div
      tabIndex={0}
      className={`group/hp relative w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface outline-none ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 ease-out group-hover/hp:scale-105 group-focus-within/hp:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4 opacity-0 translate-y-2 transition duration-300 group-hover/hp:opacity-100 group-hover/hp:translate-y-0 group-focus-within/hp:opacity-100 group-focus-within/hp:translate-y-0">
        {overlay}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck/lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/HoverPreview.tsx
git commit -m "feat(ui): add HoverPreview tile (image zoom + caption reveal)"
```

---

## Task 12: Add postprocessing dep + build the `RobotViewer` (3D + AR layer)

**Files:**
- Modify: `package.json` / `package-lock.json`
- Create: `src/components/home/RobotViewer.tsx`

**Interfaces:**
- Consumes: `MotionValue` type from `motion/react`.
- Produces: `RobotViewer` (default export): `{ progress?: MotionValue<number>; activeStep?: number; callouts?: Callout[]; effects?: boolean }`; exported `interface Callout { label: string; anchor: [number, number, number] }`.

- [ ] **Step 1: Install the dependency**

Run: `npm install @react-three/postprocessing`
Expected: `@react-three/postprocessing` appears in `package.json` dependencies; lockfile updates.

- [ ] **Step 2: Create `src/components/home/RobotViewer.tsx`**

```tsx
"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Center,
  Bounds,
  Html,
  useProgress,
  ContactShadows,
  Environment,
  Sparkles,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useReducedMotion, type MotionValue } from "motion/react";
import * as THREE from "three";

const MODEL = "/model/robot.glb";
const DRACO = "/draco/"; // locally hosted decoder — no CDN dependency
useGLTF.preload(MODEL, DRACO);

export interface Callout {
  label: string;
  anchor: [number, number, number];
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-border border-t-red" />
        <span className="text-xs font-medium text-dim">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function Robot({
  progress,
  reduce,
  callouts,
  activeStep,
}: {
  progress?: MotionValue<number>;
  reduce: boolean;
  callouts?: Callout[];
  activeStep?: number;
}) {
  const { scene } = useGLTF(MODEL, DRACO);
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    // Scroll-driven rotation: map progress 0..1 -> -0.5..0.5 rad, eased toward target.
    if (progress && !reduce) {
      const target = (progress.get() - 0.5) * 1.0;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, target, 0.08);
    }
    // One-shot materialize scale-in over ~1.2s.
    if (!reduce) {
      if (start.current === null) start.current = state.clock.elapsedTime;
      const t = Math.min(1, (state.clock.elapsedTime - start.current) / 1.2);
      const e = 1 - Math.pow(1 - t, 3);
      g.scale.setScalar(0.92 + 0.08 * e);
    }
  });

  const active = typeof activeStep === "number" ? callouts?.[activeStep] : undefined;

  return (
    <group ref={group}>
      <primitive object={scene} />
      {active && (
        <Html position={active.anchor} center distanceFactor={6} zIndexRange={[20, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-[var(--radius-pill)] border border-border bg-card/95 px-3 py-1 text-[0.7rem] font-semibold text-ink shadow-[var(--shadow-md)]">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red align-middle" />
            {active.label}
          </div>
        </Html>
      )}
    </group>
  );
}

/** Thin emissive ring slowly orbiting the model — an "AR scan" motif. */
function HoloRing({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current && !reduce) ref.current.rotation.z += delta * 0.25;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.4, 0, 0]}>
      <torusGeometry args={[1.7, 0.006, 16, 120]} />
      <meshBasicMaterial color="#5b8def" transparent opacity={0.5} toneMapped={false} />
    </mesh>
  );
}

export default function RobotViewer({
  progress,
  activeStep,
  callouts,
  effects = false,
}: {
  progress?: MotionValue<number>;
  activeStep?: number;
  callouts?: Callout[];
  effects?: boolean;
}) {
  const reduce = useReducedMotion() ?? false;
  const sparkleCount = effects ? 36 : 16;

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 35 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Soft studio lighting + brand-tinted rim lights */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      <pointLight position={[-3, 1, 3]} intensity={30} color="#f2555b" distance={14} />
      <pointLight position={[3, -1, -3]} intensity={30} color="#5b8def" distance={14} />

      <Environment preset="city" environmentIntensity={0.35} />

      <Suspense fallback={<Loader />}>
        <Bounds fit clip margin={1.1}>
          <Center>
            <Robot progress={progress} reduce={reduce} callouts={callouts} activeStep={activeStep} />
          </Center>
        </Bounds>
      </Suspense>

      <HoloRing reduce={reduce} />
      <Sparkles count={sparkleCount} scale={6} size={2} speed={reduce ? 0 : 0.3} color="#8aa6ef" opacity={0.6} />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.35} scale={8} blur={2.5} far={3} />

      <OrbitControls
        makeDefault
        enablePan={false}
        autoRotate={!reduce && !progress}
        autoRotateSpeed={1.1}
        enableDamping
        dampingFactor={0.08}
        zoomSpeed={0.8}
      />

      {effects && !reduce && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  );
}
```

- [ ] **Step 3: Build to verify chunking + types**

Run: `npm run build`
Expected: build succeeds (RobotViewer is not yet imported anywhere, so this only typechecks it; it will be lazy-imported in Task 13).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/home/RobotViewer.tsx
git commit -m "feat(3d): add RobotViewer with AR layer (shadow/env/sparkles/ring/bloom/callouts)"
```

---

## Task 13: Add `ui.spotlight.steps` + `SpotlightSection` (non-pinned) + wire into home

**Files:**
- Modify: `src/content/ui.ts:19-27` (the `spotlight` block)
- Create: `src/components/home/SpotlightSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `RobotViewer` (Task 12), `Reveal` (Task 5), `ui.spotlight` (incl. new `steps`).
- Produces: `SpotlightSection` (default export): no props.

- [ ] **Step 1: Extend `ui.spotlight` in `src/content/ui.ts`**

Replace the existing `spotlight` object (currently `eyebrow`/`title`/`lead`/`hint`) by adding a `steps` array after `hint`:
```ts
  spotlight: {
    eyebrow: { en: "Interactive", vi: "Tương tác" } as Localized,
    title: { en: "Meet PTalk", vi: "Gặp gỡ PTalk" } as Localized,
    lead: {
      en: "Everything we build is meant to be touched, moved, and explored. Here's PTalk, live in 3D — drag to spin it, scroll to zoom in.",
      vi: "Mọi thứ chúng tôi tạo ra đều để chạm, di chuyển và khám phá. Đây là PTalk, sống động trong không gian 3D — kéo để xoay, cuộn để phóng to.",
    } as Localized,
    hint: { en: "Drag to rotate · scroll to zoom", vi: "Kéo để xoay · cuộn để phóng to" } as Localized,
    steps: [
      {
        title: { en: "Voice-native", vi: "Trò chuyện giọng nói" } as Localized,
        desc: { en: "Natural spoken dialogue", vi: "Đối thoại tự nhiên bằng giọng nói" } as Localized,
      },
      {
        title: { en: "Realtime", vi: "Thời gian thực" } as Localized,
        desc: { en: "Instant, low-latency responses", vi: "Phản hồi tức thì, độ trễ thấp" } as Localized,
      },
      {
        title: { en: "Built for learning", vi: "Học tập" } as Localized,
        desc: { en: "A companion for STEM classrooms", vi: "Trợ lý đồng hành cho lớp học STEM" } as Localized,
      },
    ],
  },
```

- [ ] **Step 2: Create `src/components/home/SpotlightSection.tsx` (non-pinned baseline)**

```tsx
"use client";

import dynamic from "next/dynamic";
import { Sparkles, Rotate3d } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";

// WebGL viewer is client-only and lazy-loaded so three.js stays out of the
// initial bundle and never runs during SSR.
const RobotViewer = dynamic(() => import("./RobotViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-red" />
    </div>
  ),
});

export default function SpotlightSection() {
  const { t } = useLocale();
  return (
    <section className="section overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Copy */}
          <Reveal>
            <span className="eyebrow">{t(ui.spotlight.eyebrow)}</span>
            <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg">
              {t(ui.spotlight.lead)}
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red" style={{ background: "var(--red-soft)" }}>
              <Rotate3d size={14} />
              {t(ui.spotlight.hint)}
            </div>
          </Reveal>

          {/* 3D stage */}
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-lg)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 55% at 50% 60%, var(--red-soft), transparent 70%), radial-gradient(55% 50% at 50% 40%, var(--blue-soft), transparent 70%)",
                }}
              />
              <div className="relative aspect-square w-full">
                <RobotViewer />
              </div>
              <div className="pointer-events-none absolute right-5 top-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-[var(--shadow-sm)]">
                <Sparkles size={14} className="text-red" />
                PTalk
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Insert into `src/app/page.tsx`**

Add the import and render `SpotlightSection` between `HomeHero` and `HomeStats`:
```tsx
import HomeHero from "@/components/home/HomeHero";
import SpotlightSection from "@/components/home/SpotlightSection";
import HomeStats from "@/components/home/HomeStats";
```
```tsx
        <HomeHero />
        <SpotlightSection />
        <HomeStats />
```

- [ ] **Step 4: Build + manual check**

Run: `npm run build` then `npm run dev`.
Expected: build succeeds; on `/`, a "Gặp gỡ PTalk" section appears after the hero; the robot loads (spinner → model), **drag rotates**, **scroll-wheel zooms**, it auto-rotates gently, and it sits on a soft contact shadow with sparkles + a faint ring. Toggle dark mode — rim lights/glows still read well. Toggle EN/VI — copy switches.

- [ ] **Step 5: Commit**

```bash
git add src/content/ui.ts src/components/home/SpotlightSection.tsx src/app/page.tsx
git commit -m "feat(home): add PTalk 3D spotlight section (non-pinned baseline)"
```

---

## Task 14: Upgrade `SpotlightSection` to the pinned scrollytelling moment

**Files:**
- Modify: `src/components/home/SpotlightSection.tsx`

**Interfaces:**
- Consumes: `activeStepFromProgress` (`@/lib/scrollSteps`), `useScroll`/`useMotionValueEvent` (`motion/react`), `RobotViewer` `progress`/`activeStep`/`callouts`/`effects` props.

**Behavior:** Desktop (`lg`) + motion-allowed → tall section, sticky stage, scroll advances the active step (caption highlight + model rotation + in-scene callout) and an "AR HUD" frame surrounds the stage. Mobile (`< lg`) OR reduced motion → the non-pinned baseline (steps shown as a static list, no pin, no scroll rotation, no bloom). The desktop/mobile choice uses a `matchMedia("(min-width: 1024px)")` flag set after mount (SSR renders the safe non-pinned variant first).

- [ ] **Step 1: Replace `src/components/home/SpotlightSection.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles, Rotate3d } from "lucide-react";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { activeStepFromProgress } from "@/lib/scrollSteps";
import type { Callout } from "./RobotViewer";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";

const RobotViewer = dynamic(() => import("./RobotViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-red" />
    </div>
  ),
});

// Approximate local anchor points on the model (tune visually against robot.glb).
const ANCHORS: [number, number, number][] = [
  [0.0, 1.1, 0.3], // head — voice
  [0.0, 0.1, 0.5], // chest — realtime
  [0.0, -0.9, 0.3], // base — learning
];

function Stage({
  callouts,
  progress,
  activeStep,
  effects,
  t,
}: {
  callouts: Callout[];
  progress?: import("motion/react").MotionValue<number>;
  activeStep?: number;
  effects: boolean;
  t: (l: { en: string; vi: string }) => string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-lg)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 60%, var(--red-soft), transparent 70%), radial-gradient(55% 50% at 50% 40%, var(--blue-soft), transparent 70%)",
        }}
      />
      {/* AR HUD corner frame */}
      <div aria-hidden className="pointer-events-none absolute inset-3 z-10">
        <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-blue/50" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-blue/50" />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-blue/50" />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-blue/50" />
      </div>
      <div className="relative aspect-square w-full">
        <RobotViewer progress={progress} activeStep={activeStep} callouts={callouts} effects={effects} />
      </div>
      <div className="pointer-events-none absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/90 px-3 py-1.5 text-[0.7rem] font-semibold text-ink shadow-[var(--shadow-sm)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" /> LIVE
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border bg-card/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-[var(--shadow-sm)]">
        <Sparkles size={14} className="text-red" />
        PTalk
      </div>
    </div>
  );
}

export default function SpotlightSection() {
  const { t } = useLocale();
  const reduce = useReducedMotion() ?? false;
  const steps = ui.spotlight.steps;
  const callouts: Callout[] = steps.map((s, i) => ({ label: t(s.title), anchor: ANCHORS[i] }));

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const [activeStep, setActiveStep] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveStep(activeStepFromProgress(v, steps.length));
  });

  const pinned = isDesktop && !reduce;

  // ---- Non-pinned fallback (mobile or reduced motion) ----
  if (!pinned) {
    return (
      <section className="section overflow-hidden">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="eyebrow">{t(ui.spotlight.eyebrow)}</span>
              <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg">
                {t(ui.spotlight.lead)}
              </p>
              <ul className="mt-6 space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="font-mono text-xs text-blue">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="text-display text-sm text-ink">{t(s.title)}</span>
                      <span className="ml-2 text-sm text-ink-2">{t(s.desc)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red" style={{ background: "var(--red-soft)" }}>
                <Rotate3d size={14} />
                {t(ui.spotlight.hint)}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <Stage callouts={callouts} effects={false} t={t} />
            </Reveal>
          </div>
        </Container>
      </section>
    );
  }

  // ---- Pinned scrollytelling (desktop) ----
  return (
    <section ref={sectionRef} className="relative h-[280vh] overflow-clip">
      <div className="sticky top-0 flex h-screen items-center">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="eyebrow">{t(ui.spotlight.eyebrow)}</span>
              <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg">
                {t(ui.spotlight.lead)}
              </p>
              <ul className="mt-8 space-y-4">
                {steps.map((s, i) => {
                  const on = i === activeStep;
                  return (
                    <motion.li
                      key={i}
                      animate={{ opacity: on ? 1 : 0.35, x: on ? 0 : -4 }}
                      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                      className="flex items-start gap-3"
                    >
                      <span className={`mt-1 h-6 w-0.5 rounded-full ${on ? "bg-red" : "bg-border"}`} />
                      <span>
                        <span className="text-display text-base text-ink">{t(s.title)}</span>
                        <span className="block text-sm text-ink-2">{t(s.desc)}</span>
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
              <div className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red" style={{ background: "var(--red-soft)" }}>
                <Rotate3d size={14} />
                {t(ui.spotlight.hint)}
              </div>
            </div>
            <Stage callouts={callouts} progress={scrollYProgress} activeStep={activeStep} effects t={t} />
          </div>
        </Container>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual check (desktop)**

Run `npm run dev`, widen to ≥1024px, scroll through the PTalk section. Expected: the 3D stage **pins** (stays centered) while you scroll ~2.8 viewport heights; the step list highlights step 1→2→3 in turn; the robot turns slightly with scroll; the active callout label appears near the matching part; an AR corner-frame + "● LIVE" + "PTalk" chips surround the stage; bloom subtly lights the ring/sparkles only; the section releases cleanly into HomeStats.

- [ ] **Step 4: Manual check (fallbacks)**

Narrow to <1024px → no pin; steps render as a static numbered list; model auto-rotates; vertical page scroll works over the canvas. Enable OS reduce-motion at desktop width → non-pinned fallback, model static (no auto-rotate), no bloom.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/SpotlightSection.tsx
git commit -m "feat(home): pin PTalk 3D as a scroll-driven storytelling moment"
```

---

## Task 15: Enrich `HomeHero` (split-text headline, parallax, hero card, magnetic CTA)

**Files:**
- Modify: `src/components/home/HomeHero.tsx`

**Interfaces:**
- Consumes: `SplitText` (Task 9), `Magnetic` (Task 7), `MediaFrame`, `useScroll`/`useTransform` (`motion/react`).

- [ ] **Step 1: Replace `src/components/home/HomeHero.tsx`**

```tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Play, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { EASE } from "@/lib/motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SplitText from "@/components/ui/SplitText";
import Magnetic from "@/components/ui/Magnetic";

export default function HomeHero() {
  const { t } = useLocale();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Multi-layer parallax (disabled under reduced motion via the conditional styles below).
  const yGrid = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const yCopy = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const yCard = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 26 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section ref={ref} className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Tech atmosphere: faint grid + soft brand glows (parallax layers) */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={reduce ? undefined : { opacity: fade }}>
        <motion.div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(115% 80% at 50% 0%, #000 25%, transparent 75%)",
            ...(reduce ? {} : { y: yGrid }),
          }}
        />
        <motion.div className="absolute -top-24 right-[6%] h-72 w-72 rounded-full blur-[90px]" style={{ background: "var(--blue-soft)", ...(reduce ? {} : { y: yGlow }) }} />
        <motion.div className="absolute top-52 -left-12 h-64 w-64 rounded-full blur-[100px]" style={{ background: "var(--red-soft)", ...(reduce ? {} : { y: yGlow }) }} />
      </motion.div>

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left — copy */}
          <motion.div style={reduce ? undefined : { y: yCopy }}>
            <motion.span {...rise(0)} className="eyebrow">
              {t(ui.home.heroEyebrow)}
            </motion.span>
            <h1 className="text-hero mt-5 text-ink">
              <SplitText
                segments={[
                  { text: t(ui.home.heroLead) },
                  { text: t(ui.home.heroKw1), className: "text-red" },
                  { text: t(ui.home.heroKw2), className: "text-red" },
                  { text: t(ui.home.heroTail) },
                ]}
              />
            </h1>
            <motion.p {...rise(0.12)} className="mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
              {t(site.hero.subtitle)}
            </motion.p>
            <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Button href="/products" variant="blue">
                  {t(ui.hero.exploreCta)} <ArrowRight size={16} />
                </Button>
              </Magnetic>
              <Button href="/vr-tour" variant="red">
                <Play size={16} /> {t(ui.hero.vrCta)}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — VR spotlight card (real thumbnail) */}
          <motion.div {...rise(0.16)} style={reduce ? undefined : { y: yCard }} className="relative">
            <span className="font-mono absolute -top-3 right-3 z-10 inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-red px-3 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white">
              ★ {t(ui.home.featured)}
            </span>
            <Link
              href="/vr-tour"
              className="group block rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-lg)] transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative h-44 overflow-hidden rounded-[var(--radius-md)] border border-border">
                <Image src="/img/vr.jpg" alt={t(ui.home.vrCardTitle)} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-red shadow-[var(--shadow-md)]">
                    <Play size={18} className="ml-0.5" />
                  </span>
                </span>
                <span className="font-mono absolute bottom-2.5 left-3 text-[0.55rem] tracking-wider text-white/90">PTIT · VR</span>
              </div>
              <div className="font-mono mt-4 text-[0.66rem] tracking-wider text-blue">{"// "}{t(ui.home.vrCardLabel)}</div>
              <h2 className="text-display mt-1 text-lg text-ink">{t(ui.home.vrCardTitle)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{t(ui.home.vrCardBlurb)}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue">
                {t(ui.hero.vrCta)}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `npm run build` then `npm run dev`.
Expected: hero headline reveals word-by-word (red keywords preserved); the explore CTA gently follows the cursor (mouse only); scrolling out of the hero parallaxes the grid/glows/copy/card at different speeds and fades the background; the right card now shows the real VR thumbnail with a play button + hover sheen. With reduce-motion on: headline is a static heading, no parallax, no magnetic pull.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomeHero.tsx
git commit -m "feat(home): split-text headline, scroll parallax, real VR card, magnetic CTA"
```

---

## Task 16: `HomeStats` count-up + reveal; `StatBand` uses `CountUp`

**Files:**
- Modify: `src/components/ui/StatBand.tsx`
- Modify: `src/components/home/HomeStats.tsx`

**Interfaces:**
- Consumes: `CountUp` (Task 6), `Reveal` (Task 5).

- [ ] **Step 1: Use `CountUp` inside `src/components/ui/StatBand.tsx`**

```tsx
import CountUp from "@/components/ui/CountUp";

export interface Stat {
  value: string;
  unit?: string;
  label: string;
}

export default function StatBand({ items }: { items: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border md:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="bg-bg p-5">
          <div className="font-mono text-2xl font-bold text-ink">
            <CountUp value={s.value} />
            {s.unit && <span className="text-blue">{s.unit}</span>}
          </div>
          <div className="mt-1 text-xs text-dim">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wrap the stats + SSO card in `Reveal` in `src/components/home/HomeStats.tsx`**

Add `import Reveal from "@/components/ui/Reveal";`, then wrap `StatBand` and the SSO `<div>`:
```tsx
      <Container>
        <Reveal>
          <StatBand items={stats} />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-7 sm:p-10">
            <span className="eyebrow">{t(sso.caption)}</span>
            <h2 className="text-section mt-3 text-ink">{t(sso.title)}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(sso.description)}</p>
          </div>
        </Reveal>
      </Container>
```

- [ ] **Step 3: Build + manual check**

Run: `npm run build` then `npm run dev`. Expected: scrolling to the stats animates "164" (and the app count) counting up once; "PTIT" stays as-is; the SSO card reveals. Reduce-motion → final numbers shown immediately.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/StatBand.tsx src/components/home/HomeStats.tsx
git commit -m "feat(home): count-up stats and reveal the SSO card"
```

---

## Task 17: `ShowcaseSection` hover-preview tiles + re-added demo video

**Files:**
- Modify: `src/components/home/ShowcaseSection.tsx`

**Interfaces:**
- Consumes: `HoverPreview` (Task 11), `Stagger`/`StaggerItem` (Task 5), `site.videoUrl` (already in `site.ts`).

- [ ] **Step 1: Replace `src/components/home/ShowcaseSection.tsx`**

```tsx
"use client";

import { Play } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { showcase } from "@/content/showcase";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import HoverPreview from "@/components/ui/HoverPreview";

const FEATURED = ["robot-clover", "pcar", "vex", "vr"];

export default function ShowcaseSection() {
  const { t } = useLocale();
  const items = showcase.filter((s) => FEATURED.includes(s.id));
  return (
    <section className="section bg-surface">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.showcase.eyebrow)}</span>
          <h2 className="text-section mt-2 text-ink">{t(ui.showcase.title)}</h2>
          <p className="mt-3 mb-9 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.showcase.lead)}</p>
        </Reveal>

        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <StaggerItem key={s.id}>
              <div className="h-full rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)]">
                <HoverPreview
                  src={s.image.src}
                  alt={t(s.image.alt)}
                  overlay={
                    <p className="line-clamp-3 text-xs leading-relaxed text-white">{t(s.description)}</p>
                  }
                />
                <div className="px-1.5 pb-1">
                  <Badge tone="neutral">{t(s.category)}</Badge>
                  <h3 className="text-display mt-2 text-base text-ink">{s.title}</h3>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Demo video (re-added from the old site) */}
        <Reveal className="mt-6">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card p-2">
            <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-ink/90">
              <iframe
                src={site.videoUrl}
                title={`${site.siteNameShort} — ${t(ui.showcase.watchDemo)}`}
                className="h-full w-full border-0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-white/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-red backdrop-blur">
                <Play size={12} />
                {t(ui.showcase.watchDemo)}
              </span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `npm run build` then `npm run dev`. Expected: showcase cards cascade in on scroll; hovering (or keyboard-focusing) a tile zooms the image and reveals the description overlay; below the grid the YouTube demo video loads and plays.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/ShowcaseSection.tsx
git commit -m "feat(home): hover-preview showcase tiles + re-add demo video"
```

---

## Task 18: Reveals for `EcosystemBento`, `Partners`, `HomeCTA` (+ magnetic CTA)

**Files:**
- Modify: `src/components/home/EcosystemBento.tsx`
- Modify: `src/components/home/Partners.tsx`
- Modify: `src/components/home/HomeCTA.tsx`

**Interfaces:**
- Consumes: `Reveal`, `Stagger`/`StaggerItem`, `Magnetic`.

- [ ] **Step 1: `EcosystemBento` — cascade the cards**

In `src/components/home/EcosystemBento.tsx`, add:
```tsx
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
```
Change the grid `<div className="grid ...">` to `<Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">`, close it with `</Stagger>`, and wrap each child link in `StaggerItem`. The Gamehub feature card:
```tsx
          <StaggerItem className="sm:col-span-2 lg:col-span-1">
            <Link href="/games" className="block h-full">
              {/* ...existing Card... */}
            </Link>
          </StaggerItem>
```
And each ecosystem app:
```tsx
          {products.map((app) => (
            <StaggerItem key={app.id}>
              <Link href={`/products/${app.slug}`}>
                {/* ...existing Card... */}
              </Link>
            </StaggerItem>
          ))}
```

- [ ] **Step 2: `Partners` — staggered reveal of the name links**

In `src/components/home/Partners.tsx`, add `import { Stagger, StaggerItem } from "@/components/ui/Stagger";` and `import Reveal from "@/components/ui/Reveal";`. Wrap the heading block in `Reveal`, and change the links container to a `Stagger`, wrapping each `<a>` in a `StaggerItem`:
```tsx
        <Reveal>
          <span className="eyebrow">{t(ui.partners.eyebrow)}</span>
          <h2 className="text-section mt-2 text-ink">{t(ui.partners.title)}</h2>
        </Reveal>
        <Stagger className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-5">
          {partners.map((p) => (
            <StaggerItem key={p.name}>
              <a
                href={p.url}
                target={p.url.startsWith("http") ? "_blank" : undefined}
                rel={p.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-display text-base font-semibold text-dim transition-colors hover:text-ink sm:text-lg"
              >
                {p.name}
              </a>
            </StaggerItem>
          ))}
        </Stagger>
```

- [ ] **Step 3: `HomeCTA` — reveal, breathing glow, magnetic primary button**

In `src/components/home/HomeCTA.tsx`, add:
```tsx
import { motion, useReducedMotion } from "motion/react";
import Reveal from "@/components/ui/Reveal";
import Magnetic from "@/components/ui/Magnetic";
```
Inside the component, add `const reduce = useReducedMotion();`. Wrap the inner panel `<div className="relative overflow-hidden ...">` in `<Reveal>...</Reveal>`. Replace the static glow `<div aria-hidden .../>` with a breathing one:
```tsx
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ background: "radial-gradient(120% 90% at 50% 0%, var(--blue-soft), transparent 60%)" }}
            animate={reduce ? undefined : { opacity: [0.55, 0.85, 0.55], scale: [1, 1.04, 1] }}
            transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
```
Wrap the primary mailto `<a>` in `<Magnetic>...</Magnetic>`.

- [ ] **Step 4: Build + manual check**

Run: `npm run build` then `npm run dev`. Expected: ecosystem cards and partner links cascade in on scroll; the CTA panel reveals with a slow breathing glow; the "Email us" button gently follows the cursor. Reduce-motion → everything static, glow steady.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/EcosystemBento.tsx src/components/home/Partners.tsx src/components/home/HomeCTA.tsx
git commit -m "feat(home): reveals for ecosystem/partners/CTA + magnetic CTA + breathing glow"
```

---

## Task 19: Products grid hover-preview

**Files:**
- Modify: `src/components/products/ProductsGrid.tsx`

**Interfaces:**
- Consumes: `Stagger`/`StaggerItem`, `HoverPreview`.

- [ ] **Step 1: Replace `src/components/products/ProductsGrid.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import HoverPreview from "@/components/ui/HoverPreview";

export default function ProductsGrid() {
  const { t } = useLocale();
  const products = getProducts();
  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.products.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.products.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.products.intro)}</p>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <StaggerItem key={p.id}>
              <Link href={`/products/${p.slug}`} className="block h-full">
                <div className="h-full rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue">
                  <HoverPreview
                    src={p.image.src}
                    alt={t(p.image.alt)}
                    overlay={
                      <div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-white">{t(p.excerpt)}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {t(p.tags).slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-[var(--radius-pill)] bg-white/15 px-2 py-0.5 text-[0.6rem] font-medium text-white">{tag}</span>
                          ))}
                        </div>
                      </div>
                    }
                  />
                  <div className="px-1.5 pb-1">
                    <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
                    <h2 className="text-display mt-2 text-base text-ink">{p.name}</h2>
                    <p className="mt-1 text-sm text-ink-2">{t(p.excerpt)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t(p.tags).slice(0, 3).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Build + manual check**

Run: `npm run build` then `npm run dev`, open `/products`. Expected: cards cascade in; hover/focus zooms the image and reveals excerpt + tags overlay; clicking still routes to the detail page.

- [ ] **Step 3: Commit**

```bash
git add src/components/products/ProductsGrid.tsx
git commit -m "feat(products): hover-preview tiles + staggered reveal"
```

---

## Task 20: Reveals on Product detail, Team grid, Stub page

**Files:**
- Modify: `src/components/products/ProductDetail.tsx`
- Modify: `src/components/team/TeamGrid.tsx`
- Modify: `src/components/StubPage.tsx`

**Interfaces:**
- Consumes: `Reveal`, `Stagger`/`StaggerItem`.

- [ ] **Step 1: `ProductDetail` — reveal image + copy**

In `src/components/products/ProductDetail.tsx`, add `import Reveal from "@/components/ui/Reveal";`. Wrap the `<MediaFrame ... />` in `<Reveal direction="right">...</Reveal>` and the right-hand `<div>` (Badge…downloadHref block) in `<Reveal delay={0.1}>...</Reveal>`:
```tsx
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <Reveal direction="right">
            <MediaFrame src={p.image.src} alt={t(p.image.alt)} />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              {/* ...existing Badge / h1 / description / features / tags / download... */}
            </div>
          </Reveal>
        </div>
```

- [ ] **Step 2: `TeamGrid` — stagger the member cards**

In `src/components/team/TeamGrid.tsx`, add `import Reveal from "@/components/ui/Reveal";` and `import { Stagger, StaggerItem } from "@/components/ui/Stagger";`. Wrap the heading trio in `Reveal`, change the grid `<div>` to `<Stagger className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">`, and wrap each member `<div>` in `StaggerItem`:
```tsx
        <Reveal>
          <span className="eyebrow">{t(ui.team.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.team.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.team.lead)}</p>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((m) => (
            <StaggerItem key={m.id}>
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-3 transition duration-300 hover:-translate-y-1 hover:border-blue">
                <MediaFrame src={m.image.src} alt={t(m.image.alt)} ratio="3 / 4" />
                <h2 className="text-display mt-3 text-sm text-ink">{m.name}</h2>
                {m.role && <p className="mt-0.5 text-xs text-ink-2">{t(m.role)}</p>}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
```

- [ ] **Step 3: `StubPage` — reveal the empty state**

In `src/components/StubPage.tsx`, add `import Reveal from "@/components/ui/Reveal";` and wrap the `<div className="mt-10">` block in `<Reveal>...</Reveal>`.

- [ ] **Step 4: Build + manual check**

Run: `npm run build` then `npm run dev`. Open `/products/ptalk`, `/team`, `/games`. Expected: detail image/copy reveal, team cards cascade with a hover lift, the games stub reveals. Reduce-motion → static.

- [ ] **Step 5: Commit**

```bash
git add src/components/products/ProductDetail.tsx src/components/team/TeamGrid.tsx src/components/StubPage.tsx
git commit -m "feat(site): reveals for product detail, team grid, and stub pages"
```

---

## Task 21: Navbar animated active-link indicator

**Files:**
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `motion`, `useReducedMotion` from `motion/react`.

- [ ] **Step 1: Add a sliding underline to the desktop nav in `src/components/Navbar.tsx`**

Add to the imports:
```tsx
import { motion, useReducedMotion } from "motion/react";
```
Inside the component add `const reduce = useReducedMotion();`. Replace the desktop `<nav>` block (lines ~52-64) with one that renders a shared-layout underline under the active link:
```tsx
        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {site.nav.map((link) => {
            const active = isActive(link.id);
            return (
              <Link
                key={link.id}
                href={link.id}
                className={`relative rounded-[var(--radius-pill)] px-3.5 py-2 text-[0.82rem] font-medium transition-colors ${
                  active ? "text-blue" : "text-ink-2 hover:text-ink"
                }`}
              >
                {t(link.label)}
                {active && (
                  <motion.span
                    layoutId={reduce ? undefined : "nav-underline"}
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-blue"
                  />
                )}
              </Link>
            );
          })}
        </nav>
```

- [ ] **Step 2: Build + manual check**

Run: `npm run build` then `npm run dev`. Expected: a blue underline sits under the active nav item and **slides** to the new item when you navigate between `/`, `/products`, `/team`, `/games`. Reduce-motion → it simply appears under the active item (no slide).

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat(nav): animated active-link underline indicator"
```

---

## Task 22: VR tour loading-state polish

**Files:**
- Modify: `src/components/VRTourShell.tsx`

**Interfaces:**
- Consumes: `motion`, `useReducedMotion` from `motion/react`.

- [ ] **Step 1: Animate the loading shell in `src/components/VRTourShell.tsx`**

Add `import { motion, useReducedMotion } from "motion/react";`, add `const reduce = useReducedMotion();` in the component, and replace the loading-shell `<div>` (the `z-0` block) with a gentle pulsing reveal:
```tsx
      <motion.div
        className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
        initial={reduce ? false : { opacity: 0 }}
        animate={reduce ? undefined : { opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="eyebrow">{t(ui.vrTour.eyebrow)}</span>
        <p className="text-sm text-ink-2">{t(ui.vrTour.loading)}</p>
        <span className="mt-2 inline-block h-7 w-7 animate-spin rounded-full border-2 border-border border-t-blue" />
      </motion.div>
```

- [ ] **Step 2: Build + manual check**

Run: `npm run build` then `npm run dev`, open `/vr-tour`. Expected: the loading shell fades in behind the tour iframe; the back button is unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/VRTourShell.tsx
git commit -m "feat(vr): polish the VR tour loading state"
```

---

## Task 23: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: passes with no errors.

- [ ] **Step 2: Unit tests**

Run: `npm run test`
Expected: all suites pass (including `format`, `text`, `scrollSteps`, and the existing `products`/`theme` tests).

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; confirm in the route/chunk output that the home route's first-load JS does **not** include three.js/postprocessing (they should be in a separate lazy chunk loaded by `RobotViewer`).

- [ ] **Step 4: Manual matrix (`npm run dev`)**

- Desktop, light + dark: hero split-text + parallax; PTalk **pins** with advancing captions + model rotation + callouts + HUD + subtle bloom; stats count up; showcase hover-preview + demo video; ecosystem/partners/CTA reveals; magnetic CTAs; products hover-preview; team/detail/stub reveals; navbar underline slides; scroll-progress bar fills; route crossfades.
- Mobile width: PTalk non-pinned fallback with stacked steps; vertical scroll works over the canvas; sparkles reduced; no bloom.
- OS reduce-motion ON: no parallax, no split-text animation, no pin, no auto-rotate, no bloom, instant route changes; count-up shows final values; everything still readable.
- EN ⇄ VI: all new copy (spotlight + steps + watch-demo) switches.

- [ ] **Step 5: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "chore: verification fixes for 3D + motion system"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** motion foundation (§4 → Tasks 1,5–11), `ScrollProgress` (§4.6 → Task 8), `SplitText` (§4.7 → Tasks 3,9), `PageTransition` (§4.8 → Task 10), 3D `RobotViewer` + AR layer §5.1/§5.3 (→ Task 12), `SpotlightSection` non-pinned §5.2-fallback (→ Task 13) + pinned §5.2 (→ Task 14), hero parallax + split-text + card §6 (→ Task 15), stats §6 (→ Task 16), showcase hover-preview + demo video §6/§3 (→ Task 17), ecosystem/partners/CTA §6 (→ Task 18), products/detail/team/stub §7 (→ Tasks 19–20), navbar §7 (→ Task 21), VR loading §7 (→ Task 22), verification §9 (→ Task 23). Audit decisions §3.1 are reflected (no marquee/filter/carousel; dropped shader-hover/cursor/preloader).
- **Deviation noted:** the spec mentioned "light DOM assertions" for Reveal/Stagger; the repo's `node` test env can't run them, so testable logic was extracted into pure helpers (`format`, `text`, `scrollSteps`) that are TDD'd, and components are gated by build + manual checks. `site.videoUrl` already exists, so no `site.ts` change is needed (spec's "modify site.ts" item is a no-op).
- **Type consistency:** `RobotViewer` props (`progress`, `activeStep`, `callouts`, `effects`) and `Callout` are defined in Task 12 and consumed identically in Tasks 13–14; `parseCountValue`/`formatCount`, `splitWords`, `activeStepFromProgress` signatures match their consumers.
- **Placeholders:** none — every code step contains complete code; 3D anchor offsets/intensities are explicitly marked as visually-tunable constants, not missing values.
