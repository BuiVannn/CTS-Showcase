# Design System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the "Academic Tech" red+blue design system (light + dark, no-flash) and a verified set of UI primitives, viewable on a `/styleguide` page — the foundation every Phase-1 page builds on.

**Architecture:** Replace the Soft Futurism tokens in `globals.css` with red+blue light/dark CSS variables (Tailwind v4 `@theme inline` mapping). A no-flash inline script sets `data-theme` before paint; a client `ThemeProvider` (mirroring the existing `LocaleProvider`) drives a `ThemeToggle`. Pure theme helpers are unit-tested with Vitest. Stateless UI primitives (Button, Card, Badge, Tag, Container, SectionHeader, StatBand) are built to the tokens and exercised on a `/styleguide` route.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind v4 (`@tailwindcss/postcss`, no config file) · next/font · Vitest (new, for logic only).

## Global Constraints

- **Stack stays:** Next.js 16 + React 19 + Tailwind v4 + motion/react + Lenis. No new UI framework.
- **Bilingual pattern:** `Localized<T = string> = { en: T; vi: T }` only — strings as `Localized`, lists as `Localized<string[]>`. No mixing.
- **Colour 70/20/10:** ~70% neutral, ~20% blue (high-frequency UI), ~10% red (brand accent only). ≤ 2–3 red touches per screen.
- **Brand tokens (light → dark):** bg `#FFFFFF`→`#0B0D12`, surface `#F6F7F9`→`#12151C`, card `#FFFFFF`→`#181C25`, border `#E6E8EC`→`#262B36`, ink `#14161B`→`#ECEEF2`, ink-2 `#5B616E`→`#A2A8B4`, dim `#8A909C`→`#6B7280`, blue `#2563EB`→`#5B8DEF`, red `#E11B22`→`#F2555B`. **Never use raw `#2563EB`/`#E11B22` on dark.**
- **Semantic ≠ brand:** `--danger` (a darker red, distinct from brand `--red`), `--warning` amber, `--success` green — defined separately.
- **Type:** Unbounded (display, `--font-display`), Be Vietnam Pro (body, `--font-body`), JetBrains Mono (`--font-mono`, numbers/tags). All include the `vietnamese` subset.
- **Theme default:** Light. Explicit choice in `localStorage['cts-theme']` wins; system pref is NOT auto-followed on first load (one-line reversible in the inline script).
- **Verification:** `npm run build` and `npm run lint` must pass after every task. Visual checks happen on `/styleguide` (toggle light/dark). Pure logic is unit-tested (`npm run test`).
- **Reduced motion:** respect `prefers-reduced-motion` (keep the existing pattern).
- All work happens in the repo at `/home/namnx/ctslab-redesign` (origin `BuiVannn/CTS-Showcase`, branch off `main`).

---

### Task 1: Replace design tokens in `globals.css`

**Files:**
- Modify: `src/app/globals.css` (full rewrite of the token + utility layer)

**Interfaces:**
- Produces: CSS variables `--bg --surface --card --border --ink --ink-2 --dim --blue --red --danger --warning --success`, font vars consumed via `--font-display/-body/-mono`, radii `--radius-sm/-md/-lg/-pill`, shadows `--shadow-sm/-md/-lg`, and Tailwind utilities `bg-bg bg-surface bg-card border-border text-ink text-ink-2 text-dim text-blue text-red bg-blue bg-red` (via `@theme inline`). Helper classes: `.container-x .section .eyebrow .text-display .text-hero .text-section .hairline .focus-ring`.

- [ ] **Step 1: Rewrite `globals.css`**

Replace the entire file with:

```css
@import "tailwindcss";

/* ============================================================
   CTS Lab — "Academic Tech" design system
   Red + blue brand (from logo) · 70/20/10 · light + dark
   ============================================================ */

:root,
[data-theme="light"] {
  --bg: #ffffff;
  --surface: #f6f7f9;
  --card: #ffffff;
  --border: #e6e8ec;
  --ink: #14161b;
  --ink-2: #5b616e;
  --dim: #8a909c;
  --blue: #2563eb;
  --red: #e11b22;
  --blue-soft: rgba(37, 99, 235, 0.1);
  --red-soft: rgba(225, 27, 34, 0.1);
  /* semantic — distinct from brand --red */
  --danger: #c01722;
  --warning: #b7791f;
  --success: #1a7f4b;
  --shadow-sm: 0 1px 2px rgba(20, 22, 27, 0.06), 0 1px 3px rgba(20, 22, 27, 0.08);
  --shadow-md: 0 6px 24px -10px rgba(20, 22, 27, 0.18);
  --shadow-lg: 0 30px 60px -28px rgba(20, 22, 27, 0.28);
  color-scheme: light;
}

[data-theme="dark"] {
  --bg: #0b0d12;
  --surface: #12151c;
  --card: #181c25;
  --border: #262b36;
  --ink: #eceef2;
  --ink-2: #a2a8b4;
  --dim: #6b7280;
  --blue: #5b8def;
  --red: #f2555b;
  --blue-soft: rgba(91, 141, 239, 0.14);
  --red-soft: rgba(242, 85, 91, 0.14);
  --danger: #f2555b;
  --warning: #e0b252;
  --success: #4ec98a;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 28px -12px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 34px 70px -30px rgba(0, 0, 0, 0.7);
  color-scheme: dark;
}

:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-pill: 999px;
  --background: var(--bg);
  --foreground: var(--ink);
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-border: var(--border);
  --color-ink: var(--ink);
  --color-ink-2: var(--ink-2);
  --color-dim: var(--dim);
  --color-blue: var(--blue);
  --color-red: var(--red);
  --color-danger: var(--danger);
  --color-warning: var(--warning);
  --color-success: var(--success);
  --color-background: var(--bg);
  --color-foreground: var(--ink);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);
}

/* ===== Base ===== */
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.3s ease, color 0.3s ease;
}
* { scroll-margin-top: 6rem; }
::selection { background: var(--blue-soft); color: var(--ink); }
*:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ===== Typography ===== */
.text-display { font-family: var(--font-display), system-ui, sans-serif; font-weight: 700; letter-spacing: -0.03em; }
.text-hero {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 800; letter-spacing: -0.04em; line-height: 1.0;
  font-size: clamp(2.4rem, 6.5vw, 5rem);
}
.text-section {
  font-family: var(--font-display), system-ui, sans-serif;
  font-weight: 700; letter-spacing: -0.03em; line-height: 1.05;
  font-size: clamp(1.7rem, 4vw, 2.8rem);
}
.font-mono { font-family: var(--font-mono), ui-monospace, monospace; }

.eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--blue);
}
.eyebrow::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--blue);
}

/* ===== Layout helpers ===== */
.container-x { margin-inline: auto; max-width: 80rem; padding-inline: 1.5rem; }
@media (min-width: 1024px) { .container-x { padding-inline: 2rem; } }
.section { padding: 6rem 0; position: relative; }
@media (max-width: 768px) { .section { padding: 4rem 0; } }
.hairline {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border) 15%, var(--border) 85%, transparent);
}

/* ===== Reduced motion ===== */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Build completes with no errors. (Existing Soft Futurism pages may render unstyled — that is expected; they are re-skinned in later stages. Build must still pass.)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): replace tokens with Academic Tech red+blue light/dark system"
```

---

### Task 2: Add JetBrains Mono + clean Soft Futurism artifacts from layout

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: token utilities from Task 1.
- Produces: `--font-mono` variable available on `<html>`; `<body>` no longer renders `AuroraBackground` or the `grain` class.

- [ ] **Step 1: Update `layout.tsx` fonts + body**

In `src/app/layout.tsx`:

1. Change the font import line to include JetBrains Mono:

```tsx
import { Unbounded, Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
```

2. Add the mono font config after the `body` font block:

```tsx
// Mono — numbers, tags, code-like meta.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});
```

3. Remove the `AuroraBackground` import (line 6) and its usage. Update `<html>` className and `<body>`:

```tsx
return (
  <html
    lang="en"
    data-scroll-behavior="smooth"
    className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
  >
    <body className="min-h-screen bg-bg text-ink">
      <LocaleProvider>
        <SmoothScroll />
        {children}
      </LocaleProvider>
    </body>
  </html>
);
```

- [ ] **Step 2: Delete the now-unused AuroraBackground component**

Run: `git rm src/components/AuroraBackground.tsx`
(It is a Soft Futurism artifact with no place in the new system. `FloatingShape.tsx` and `Spotlight.tsx` are also Soft-Futurism-only but are removed when their consuming pages are re-skinned — leave them for now.)

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: Both pass. (Pages importing `AuroraBackground` — if any besides layout — would error; if the build flags one, remove that import too as part of this task.)

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): add JetBrains Mono, drop aurora/grain from layout"
```

---

### Task 3: Theme logic helpers + Vitest setup (TDD)

**Files:**
- Create: `src/lib/theme.ts`
- Create: `src/lib/theme.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script + dev deps)

**Interfaces:**
- Produces:
  - `type Theme = "light" | "dark"`
  - `THEME_STORAGE_KEY = "cts-theme"` (string const)
  - `resolveTheme(stored: string | null): Theme` — `"dark"` only if stored is exactly `"dark"`, else `"light"`.
  - `nextTheme(current: Theme): Theme` — toggles light↔dark.

- [ ] **Step 1: Install Vitest dev dependencies**

Run:
```bash
npm install -D vitest@^2 @vitejs/plugin-react@^4
```
Expected: installs without peer-dependency errors.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 3: Add the `test` script to `package.json`**

In the `"scripts"` block add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/theme.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveTheme, nextTheme, THEME_STORAGE_KEY } from "./theme";

describe("resolveTheme", () => {
  it("returns dark only for the exact 'dark' string", () => {
    expect(resolveTheme("dark")).toBe("dark");
  });
  it("defaults to light for null, '', or anything else", () => {
    expect(resolveTheme(null)).toBe("light");
    expect(resolveTheme("")).toBe("light");
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("DARK")).toBe("light");
  });
});

describe("nextTheme", () => {
  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is the stable cts-theme key", () => {
    expect(THEME_STORAGE_KEY).toBe("cts-theme");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npm run test`
Expected: FAIL — cannot resolve `./theme` (module does not exist yet).

- [ ] **Step 6: Implement `src/lib/theme.ts`**

```ts
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "cts-theme";

/** Resolve a stored value to a concrete theme. Default light; system pref is
 *  intentionally NOT consulted here (brand decision — see design spec §4). */
export function resolveTheme(stored: string | null): Theme {
  return stored === "dark" ? "dark" : "light";
}

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npm run test`
Expected: PASS — all 3 suites green.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/theme.ts src/lib/theme.test.ts
git commit -m "feat(theme): add tested theme resolver helpers + Vitest"
```

---

### Task 4: ThemeProvider + no-flash inline script

**Files:**
- Create: `src/lib/theme-context.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `Theme`, `THEME_STORAGE_KEY`, `resolveTheme`, `nextTheme` from `src/lib/theme.ts`.
- Produces:
  - `<ThemeProvider>` (client) — wraps children, syncs `data-theme` on `<html>`.
  - `useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }`.

- [ ] **Step 1: Create `src/lib/theme-context.tsx`** (mirrors the `LocaleProvider` external-store pattern)

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { THEME_STORAGE_KEY, resolveTheme, nextTheme, type Theme } from "./theme";

const EVENT = "cts-theme-change";

function readTheme(): Theme {
  try {
    return resolveTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Server snapshot is "light" — matches the inline no-flash script default,
  // so no hydration mismatch.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => setTheme(nextTheme(readTheme())), [setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Add the no-flash script + ThemeProvider to `layout.tsx`**

> Next 16 note: an inline `<script dangerouslySetInnerHTML>` as the first child of `<body>` runs synchronously before paint — the standard no-flash pattern. Verify against `node_modules/next/dist/docs/` if the build complains.

Update the returned JSX in `src/app/layout.tsx`:

```tsx
import { ThemeProvider } from "@/lib/theme-context";
// ...existing imports...

return (
  <html
    lang="en"
    data-scroll-behavior="smooth"
    data-theme="light"
    className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
  >
    <body className="min-h-screen bg-bg text-ink">
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var k='cts-theme',s=localStorage.getItem(k);var t=(s==='dark')?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
        }}
      />
      <ThemeProvider>
        <LocaleProvider>
          <SmoothScroll />
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </body>
  </html>
);
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme-context.tsx src/app/layout.tsx
git commit -m "feat(theme): ThemeProvider + no-flash inline script"
```

---

### Task 5: ThemeToggle component

**Files:**
- Create: `src/components/ThemeToggle.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `src/lib/theme-context.tsx`.
- Produces: `<ThemeToggle />` — default-exported client component (a button that toggles theme, shows sun/moon).

- [ ] **Step 1: Create `src/components/ThemeToggle.tsx`**

```tsx
"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-border bg-surface text-ink-2 transition-colors hover:text-ink"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeToggle.tsx
git commit -m "feat(ui): ThemeToggle button"
```

---

### Task 6: Button primitive

**Files:**
- Create: `src/components/ui/Button.tsx`

**Interfaces:**
- Produces: `<Button variant? size? as? href? ...>` default export.
  - `variant: "blue" | "red" | "ghost"` (default `"blue"`)
  - `size: "sm" | "md"` (default `"md"`)
  - Renders an `<a>` (via `next/link`) when `href` is set, else a `<button>`.

- [ ] **Step 1: Create `src/components/ui/Button.tsx`**

```tsx
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "blue" | "red" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-semibold transition duration-200 active:scale-[0.98]";

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-[0.8rem]",
  md: "px-5 py-2.5 text-[0.9rem]",
};

const variants: Record<Variant, string> = {
  blue: "bg-blue text-white hover:brightness-110",
  red: "bg-red text-white hover:brightness-110 shadow-[var(--shadow-sm)]",
  ghost: "bg-transparent text-ink border border-border hover:bg-surface",
};

type CommonProps = { variant?: Variant; size?: Size; children: ReactNode; className?: string };

export default function Button({
  variant = "blue",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: CommonProps & { href?: string } & ComponentPropsWithoutRef<"button">) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat(ui): Button primitive (blue/red/ghost)"
```

---

### Task 7: Card, Badge, and Tag primitives

**Files:**
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Tag.tsx`

**Interfaces:**
- Produces:
  - `<Card variant? className? children>` — `variant: "standard" | "feature"` (default `"standard"`); hover lift + blue border on hover; `position: relative` so a `<Badge>` can be slotted.
  - `<Badge tone? children>` — `tone: "red" | "blue" | "neutral"` (default `"red"`); mono, pill.
  - `<Tag children>` — small mono outlined chip.

- [ ] **Step 1: Create `src/components/ui/Card.tsx`**

```tsx
import type { ReactNode } from "react";

type Variant = "standard" | "feature";

const variants: Record<Variant, string> = {
  standard: "bg-card",
  feature: "bg-gradient-to-br from-card to-surface",
};

export default function Card({
  variant = "standard",
  className = "",
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-[var(--radius-lg)] border border-border ${variants[variant]} p-5 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Badge.tsx`**

```tsx
import type { ReactNode } from "react";

type Tone = "red" | "blue" | "neutral";

const tones: Record<Tone, string> = {
  red: "bg-red text-white",
  blue: "bg-blue text-white",
  neutral: "bg-surface text-ink-2 border border-border",
};

export default function Badge({
  tone = "red",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`font-mono inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/Tag.tsx`**

```tsx
import type { ReactNode } from "react";

export default function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono inline-flex items-center rounded-[var(--radius-sm)] border border-border bg-surface px-2 py-1 text-[0.6rem] text-ink-2">
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Card.tsx src/components/ui/Badge.tsx src/components/ui/Tag.tsx
git commit -m "feat(ui): Card, Badge, Tag primitives"
```

---

### Task 8: Container, SectionHeader, StatBand primitives

**Files:**
- Create: `src/components/ui/Container.tsx`
- Create: `src/components/ui/SectionHeader.tsx`
- Create: `src/components/ui/StatBand.tsx`

**Interfaces:**
- Produces:
  - `<Container children className?>` — wraps `.container-x`.
  - `<SectionHeader eyebrow title cta?>` — eyebrow (blue) + display title + optional right-aligned `{ label, href }` link.
  - `<StatBand items>` — `items: { value: string; unit?: string; label: string }[]`; renders a bordered grid with mono numerals.

- [ ] **Step 1: Create `src/components/ui/Container.tsx`**

```tsx
import type { ReactNode } from "react";

export default function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container-x ${className}`}>{children}</div>;
}
```

- [ ] **Step 2: Create `src/components/ui/SectionHeader.tsx`**

```tsx
import Link from "next/link";

export default function SectionHeader({
  eyebrow,
  title,
  cta,
}: {
  eyebrow: string;
  title: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="text-section mt-2 text-ink">{title}</h2>
      </div>
      {cta && (
        <Link href={cta.href} className="shrink-0 text-sm font-semibold text-blue hover:underline">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/StatBand.tsx`**

```tsx
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
            {s.value}
            {s.unit && <span className="text-blue">{s.unit}</span>}
          </div>
          <div className="mt-1 text-xs text-dim">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Container.tsx src/components/ui/SectionHeader.tsx src/components/ui/StatBand.tsx
git commit -m "feat(ui): Container, SectionHeader, StatBand primitives"
```

---

### Task 9: `/styleguide` page — visual verification surface

**Files:**
- Create: `src/app/styleguide/page.tsx`

**Interfaces:**
- Consumes: all primitives from Tasks 5–8 + `ThemeToggle`.
- Produces: a route rendering every primitive in both tones, with a theme toggle, so the design system can be reviewed visually before pages are built.

- [ ] **Step 1: Create `src/app/styleguide/page.tsx`**

```tsx
import type { Metadata } from "next";
import ThemeToggle from "@/components/ThemeToggle";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import StatBand from "@/components/ui/StatBand";

export const metadata: Metadata = { title: "Styleguide — CTS Lab", robots: { index: false } };

export default function StyleguidePage() {
  return (
    <main className="section">
      <Container>
        <div className="mb-10 flex items-center justify-between">
          <div>
            <span className="eyebrow">Design system</span>
            <h1 className="text-hero text-ink">Academic Tech</h1>
          </div>
          <ThemeToggle />
        </div>

        <SectionHeader eyebrow="Buttons" title="Nút" cta={{ label: "Xem tất cả →", href: "#" }} />
        <div className="mb-12 flex flex-wrap gap-3">
          <Button variant="blue">Khám phá</Button>
          <Button variant="red">Tham quan VR ▸</Button>
          <Button variant="ghost">Đăng nhập</Button>
          <Button variant="blue" size="sm">Nhỏ</Button>
        </div>

        <SectionHeader eyebrow="Surfaces" title="Thẻ & nhãn" />
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          <Card>
            <Badge tone="blue">AI</Badge>
            <h3 className="text-display mt-3 text-lg text-ink">Card chuẩn</h3>
            <p className="mt-2 text-sm text-ink-2">Mô tả ngắn dùng tông trung tính.</p>
            <div className="mt-3 flex gap-2"><Tag>STEM</Tag><Tag>VR</Tag></div>
          </Card>
          <Card variant="feature">
            <span className="absolute right-4 top-4"><Badge tone="red">MỚI</Badge></span>
            <h3 className="text-display text-lg text-ink">Card feature</h3>
            <p className="mt-2 text-sm text-ink-2">Điểm nhấn đỏ — dùng tiết chế.</p>
          </Card>
          <Card>
            <h3 className="text-display text-lg text-ink">Tông chữ</h3>
            <p className="mt-2 text-sm text-ink">Ink chính</p>
            <p className="text-sm text-ink-2">Ink phụ</p>
            <p className="text-sm text-dim">Dim</p>
          </Card>
        </div>

        <SectionHeader eyebrow="Data" title="Dải số liệu" />
        <StatBand
          items={[
            { value: "04", unit: "+", label: "Sản phẩm AI" },
            { value: "164", label: "Cảnh VR 360°" },
            { value: "12", unit: "k", label: "Học sinh tiếp cận" },
            { value: "PTIT", label: "Đối tác học thuật" },
          ]}
        />
      </Container>
    </main>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 3: Visual check in both themes**

Run: `npm run dev`, open `http://localhost:3000/styleguide`.
Verify: primitives render; clicking the toggle switches light↔dark with **no flash on reload**; blue is the high-frequency accent, red appears only on the VR button + "MỚI" badge; text uses neutral ink tones; numerals are mono.

- [ ] **Step 4: Commit**

```bash
git add src/app/styleguide/page.tsx
git commit -m "feat(design): styleguide page exercising all primitives in light/dark"
```

---

## Self-Review

**Spec coverage (design spec §3, §4, §8):**
- §3 tokens (light/dark, 70/20/10, semantic≠brand, mono) → Task 1. ✓
- §4 theme system (one global theme, light default, no-flash, no next-themes, toggle) → Tasks 3–5. ✓
- §8 component system primitives (Button, Card, Badge, Tag, Container, SectionHeader, StatBand, ThemeToggle) → Tasks 5–8. ✓
- Deferred to later stages (out of scope here, tracked): `FilterBar`, `EmptyState`, `MediaFrame`, `Breadcrumb`, `Navbar`/`Footer` re-skin, content layer/repository, pages, `Game` type. These belong to Stage 2+ plans.

**Placeholder scan:** No "TBD/TODO/handle edge cases" — every step has complete code or an exact command. (`cta` href `"#"` on the styleguide is intentional demo content, not a placeholder.)

**Type consistency:** `Theme` / `THEME_STORAGE_KEY` / `resolveTheme` / `nextTheme` defined in Task 3 and consumed unchanged in Tasks 4–5. `useTheme()` shape `{ theme, setTheme, toggle }` defined Task 4, consumed Task 5. Token utility names (`bg-bg`, `text-ink`, `text-ink-2`, `text-dim`, `bg-blue`, `bg-red`, `border-border`) defined via `@theme inline` in Task 1 and used consistently in Tasks 5–9.

**Note on intermediate state:** Tasks 1–2 remove Soft Futurism tokens/aurora, so pre-existing pages (home, products, vr-tour shell) will look unstyled until re-skinned in Stage 2+. This is expected for a ground-up redesign; `npm run build` stays green throughout, and `/styleguide` is the Stage 1 acceptance surface.
