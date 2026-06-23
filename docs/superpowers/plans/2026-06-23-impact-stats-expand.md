# Impact Stats Band — Expand to 6 Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the homepage Impact band from 4 to 6 metrics (users, downloads, schools + existing AI products, VR scenes, partner), dropping "Thành viên", with the count-up animation working for comma values like "10,000+".

**Architecture:** Enhance the tested `parseCountValue`/`formatCount` helpers to support thousands separators, add 3 bilingual stat labels, swap the `HomeStats` stat array to the 6 metrics, and re-tune the `StatBand` grid for 6 tiles.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TypeScript, Vitest (node), existing `CountUp`/`StatBand`/`useLocale`.

## Global Constraints

- **Bilingual:** new labels are `Localized` (`{ en, vi }`) via `t(...)`.
- **Count-up correctness:** comma values (`10,000+`) must animate 0 → "10,000+" WITH the comma; non-numeric ("PTIT") stays static; existing values ("164", zero-padded "07") behave exactly as before.
- **Figures 1–3 are positioning/illustrative** (user-approved): `10,000+`, `25,000+`, `30+` — single-sourced in `HomeStats` for easy later replacement.
- **Existing tokens only**; no new dependencies; no `eslint-disable`; no `react-hooks/set-state-in-effect`.
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; tasks with tests `npx vitest run` green; live `curl` 200. Deploy in the final task.
- **Commit after every task**; `git add` specific files only (NEVER `git add -A` — `game/` + stray images stay untracked). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Modify:**
- `src/lib/format.ts` + `src/lib/format.test.ts` — comma-aware parse + grouped format
- `src/content/ui.ts` — add `statUsers`, `statDownloads`, `statSchools`
- `src/components/home/HomeStats.tsx` — 6-stat array, drop `team`
- `src/components/ui/StatBand.tsx` — grid for 6 tiles

---

## Task 1: Comma-aware count helpers (TDD)

**Files:**
- Modify: `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**
- `parseCountValue("10,000+")` → `{ target: 10000, pad: 0, suffix: "+", raw: "10,000+" }`
- `formatCount(10000, 0, "+")` → `"10,000+"`; `formatCount(3521, 0, "")` → `"3,521"`; zero-pad path unchanged.

- [ ] **Step 1: Add the failing tests**

In `src/lib/format.test.ts`, add inside the existing describes:

```ts
  it("parses a comma-grouped number, stripping commas", () => {
    expect(parseCountValue("10,000+")).toEqual({ target: 10000, pad: 0, suffix: "+", raw: "10,000+" });
  });
```

and in the `formatCount` describe:

```ts
  it("groups thousands when not zero-padded", () => {
    expect(formatCount(10000, 0, "+")).toBe("10,000+");
    expect(formatCount(3521, 0, "")).toBe("3,521");
  });
  it("keeps zero-padding without grouping", () => {
    expect(formatCount(7, 2, "")).toBe("07");
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL on the comma-parse (target would be 10) and the grouping (no comma in output).

- [ ] **Step 3: Implement**

Edit `src/lib/format.ts`. Update `parseCountValue` to allow commas in the number group and strip them:

```ts
export function parseCountValue(value: string): CountParts {
  const match = value.match(/^([\d,]+)(.*)$/);
  if (!match) return { target: null, pad: 0, suffix: "", raw: value };
  const digits = match[1].replace(/,/g, "");
  if (digits.length === 0) return { target: null, pad: 0, suffix: "", raw: value };
  const pad = digits.length > 1 && digits.startsWith("0") ? digits.length : 0;
  return { target: parseInt(digits, 10), pad, suffix: match[2] ?? "", raw: value };
}
```

Update `formatCount` to group thousands when not zero-padded:

```ts
export function formatCount(n: number, pad: number, suffix: string): string {
  const rounded = Math.round(n);
  const body = pad > 0 ? String(rounded).padStart(pad, "0") : rounded.toLocaleString("en-US");
  return body + suffix;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/format.test.ts` → PASS (incl. the original cases). Then `npx vitest run` → full suite green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat(format): comma-aware count parse + thousands grouping

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Strings + 6-stat band + grid

**Files:**
- Modify: `src/content/ui.ts`, `src/components/home/HomeStats.tsx`, `src/components/ui/StatBand.tsx`

**Interfaces:**
- Consumes: comma-aware helpers (Task 1, via `CountUp`/`StatBand`).
- Produces: `ui.home.statUsers/statDownloads/statSchools`; HomeStats renders 6 stats.

- [ ] **Step 1: Add the labels**

In `src/content/ui.ts`, inside the `home` block (near the existing `statApps`/`statScenes`/`statPartner`), add:

```ts
    statUsers: { en: "Users", vi: "Người dùng" } as Localized,
    statDownloads: { en: "Downloads", vi: "Lượt tải" } as Localized,
    statSchools: { en: "Schools & classes", vi: "Trường / lớp học" } as Localized,
```

(Leave `statTeam` in place — harmless if unused.)

- [ ] **Step 2: Swap the stat array + drop team**

In `src/components/home/HomeStats.tsx`, replace the `stats` array with the 6 metrics and remove the `team` import.

Remove this import line:

```tsx
import { team } from "@/content/team";
```

Replace the `stats` array with:

```tsx
  const stats = [
    { value: "10,000+", label: t(ui.home.statUsers) },
    { value: "25,000+", label: t(ui.home.statDownloads) },
    { value: "30+", label: t(ui.home.statSchools) },
    { value: String(getProducts().length).padStart(2, "0"), label: t(ui.home.statApps) },
    { value: "164", label: t(ui.home.statScenes) },
    { value: "PTIT", label: t(ui.home.statPartner) },
  ];
```

(Keep `getProducts` import — still used. Run eslint to confirm no unused imports remain.)

- [ ] **Step 3: Re-tune the grid for 6 tiles**

In `src/components/ui/StatBand.tsx`, change the grid wrapper classes from `grid-cols-2 ... md:grid-cols-4` to:

```tsx
className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-3 lg:grid-cols-6"
```

(Match the existing class string; only the column counts change: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/content/ui.ts src/components/home/HomeStats.tsx src/components/ui/StatBand.tsx` — clean (no unused `team`); `npx vitest run` green.

- [ ] **Step 5: Verify live**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/` → `200`. The Impact band shows 6 tiles; numbers count up (10,000+ with comma); reflows on mobile.

- [ ] **Step 6: Commit**

```bash
git add src/content/ui.ts src/components/home/HomeStats.tsx src/components/ui/StatBand.tsx
git commit -m "feat(home): expand Impact band to 6 metrics (users/downloads/schools)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. new format cases). No stray `eslint-disable`.

- [ ] **Step 2: Behaviour audit (code level)**

Confirm: 6 stats render; grid is `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` (clean reflow, no overflow at 375px); the comma value's count-up ends at "10,000+" (the `formatCount` grouping path). Grep the served HTML for the labels: `curl -s http://localhost:3001/ | grep -oE "10,000\+|25,000\+|30\+" | sort -u` → shows the three (final rendered values). Fix any gap minimally.

- [ ] **Step 3: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/` → `200`.

- [ ] **Step 4: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(home): impact band audit fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes were needed, do not create an empty commit — report the audit results.

---

## Self-Review (completed during planning)

**Spec coverage:**
- §3.1 comma-aware helpers → Task 1 (TDD). §3.2 strings → Task 2 Step 1. §3.3 6-stat data (drop team) → Task 2 Step 2. §3.4 grid → Task 2 Step 3.
- §4 behaviour (count-up correctness, responsive, bilingual) → Tasks 2/3.
- §6 testing (format unit cases + manual) → Task 1 + Task 3.

**Placeholder scan:** No TBD/TODO; complete code in every step. Positioning numbers (10,000+/25,000+/30+) are the user-approved literals, single-sourced in HomeStats.

**Type consistency:** `parseCountValue`/`formatCount` signatures unchanged (behaviour extended); `CountParts` shape unchanged. `StatBand`'s `Stat[]` items unchanged in shape (value/label). `ui.home.stat*` keys read in HomeStats.

**Note:** the comma value "10,000+" relies on Task 1 shipping first (CountUp uses parseCountValue/formatCount); Task 2's band will animate correctly only after Task 1. The plan orders Task 1 before Task 2.
