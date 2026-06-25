# GameHub Redesign B — Hub + Search/Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the public hub (`/games`) into a polished showcase with client-side search + auto-hiding filter pills (classification, genre, tags) and richer game cards.

**Architecture:** A pure, tested filter module (`filterGames`/`deriveFacets`); a presentational `GameCard`; a controlled `GameFilters`; and a redesigned `GameHubView` that holds the filter state and composes them, using the existing `EmptyState`. No backend change — the `/games` server page already passes `getCatalog()`.

**Tech Stack:** Next.js 16 (client components), React 19 (`useState`/`useMemo`), Tailwind v4, Vitest, lucide-react. Reuses `GameCover`, `Badge`, `Tag`, `Stagger`, `AmbientField`, `EmptyState`, `Container`.

## Global Constraints

- **Filters:** Search (title/tagline/author) + Classification + Genre + Tag. Each filter control **auto-hides** when `deriveFacets` returns <2 values for it.
- **Client-side** filtering over the `CatalogGame[]` prop; combined filters are AND.
- **Single source of truth:** the hub reads `getCatalog()` (lab + published user games); cards link to `/games/[slug]` (A's detail page); the submit link points to `/games/submit`.
- `CatalogGame` is imported from `@/lib/game-catalog-map` (pure module).
- Bilingual via `ui.games.*`; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect` (filter state is event-driven; derived lists use `useMemo`, not effects). `@/*`→`src/*`.
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build`; tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:** `src/lib/game-filter.ts` (+test), `src/components/games/GameCard.tsx`, `src/components/games/GameFilters.tsx`
**Modify:** `src/components/games/GameHubView.tsx`, `src/content/ui.ts`

---

## Task 1: Pure filter module

**Files:** Create `src/lib/game-filter.ts`, `src/lib/game-filter.test.ts`

**Interfaces produced:** `GameFilterState`; `EMPTY_FILTER`; `filterGames(games, f)`; `deriveFacets(games)`.

- [ ] **Step 1: Write failing tests** `src/lib/game-filter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { filterGames, deriveFacets, EMPTY_FILTER } from "./game-filter";
import type { CatalogGame } from "@/lib/game-catalog-map";

function g(p: Partial<CatalogGame>): CatalogGame {
  return { id: p.slug ?? "x", slug: p.slug ?? "x", title: p.title ?? "T", author: p.author ?? "A", source: "user", embedUrl: "u", sandboxed: true, ...p };
}
const games: CatalogGame[] = [
  g({ slug: "a", title: "Alpha", tagline: "a puzzle", author: "Lan", classification: "game", genre: "Puzzle", tags: ["Unity"] }),
  g({ slug: "b", title: "Beta", author: "Minh", classification: "app", genre: "Tool", tags: ["Web"] }),
  g({ slug: "c", title: "Gamma", tagline: "learn math", author: "Lan", classification: "game", genre: "Educational", tags: ["Unity", "Math"] }),
];

describe("filterGames", () => {
  it("empty filter returns all", () => {
    expect(filterGames(games, EMPTY_FILTER)).toHaveLength(3);
  });
  it("query matches title/tagline/author (case-insensitive)", () => {
    expect(filterGames(games, { ...EMPTY_FILTER, query: "puzzle" }).map((x) => x.slug)).toEqual(["a"]);
    expect(filterGames(games, { ...EMPTY_FILTER, query: "lan" }).map((x) => x.slug)).toEqual(["a", "c"]);
  });
  it("classification + genre exact; tag membership; combined AND", () => {
    expect(filterGames(games, { ...EMPTY_FILTER, classification: "game" }).map((x) => x.slug)).toEqual(["a", "c"]);
    expect(filterGames(games, { ...EMPTY_FILTER, genre: "Tool" }).map((x) => x.slug)).toEqual(["b"]);
    expect(filterGames(games, { ...EMPTY_FILTER, tag: "Math" }).map((x) => x.slug)).toEqual(["c"]);
    expect(filterGames(games, { ...EMPTY_FILTER, classification: "game", tag: "Math" }).map((x) => x.slug)).toEqual(["c"]);
  });
});

describe("deriveFacets", () => {
  it("returns distinct sorted values, drops empties", () => {
    const f = deriveFacets(games);
    expect(f.classifications).toEqual(["app", "game"]);
    expect(f.genres).toEqual(["Educational", "Puzzle", "Tool"]);
    expect(f.tags).toEqual(["Math", "Unity", "Web"]);
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/lib/game-filter.test.ts`): module missing.

- [ ] **Step 3: Implement `src/lib/game-filter.ts`**:
```ts
import type { CatalogGame } from "@/lib/game-catalog-map";

export interface GameFilterState {
  query: string;
  classification: string | null;
  genre: string | null;
  tag: string | null;
}

export const EMPTY_FILTER: GameFilterState = { query: "", classification: null, genre: null, tag: null };

export function filterGames(games: CatalogGame[], f: GameFilterState): CatalogGame[] {
  const q = f.query.trim().toLowerCase();
  return games.filter((g) => {
    if (q) {
      const hay = `${g.title} ${g.tagline ?? ""} ${g.author}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.classification && g.classification !== f.classification) return false;
    if (f.genre && g.genre !== f.genre) return false;
    if (f.tag && !(g.tags ?? []).includes(f.tag)) return false;
    return true;
  });
}

export function deriveFacets(games: CatalogGame[]): { classifications: string[]; genres: string[]; tags: string[] } {
  const classifications = new Set<string>();
  const genres = new Set<string>();
  const tags = new Set<string>();
  for (const g of games) {
    if (g.classification) classifications.add(g.classification);
    if (g.genre) genres.add(g.genre);
    for (const t of g.tags ?? []) if (t) tags.add(t);
  }
  const sort = (s: Set<string>) => [...s].sort((a, b) => a.localeCompare(b));
  return { classifications: sort(classifications), genres: sort(genres), tags: sort(tags) };
}
```

- [ ] **Step 4: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/game-filter.ts src/lib/game-filter.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/lib/game-filter.ts src/lib/game-filter.test.ts
git commit -m "feat(gamehub): pure filter module (filterGames + deriveFacets)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: GameCard + GameFilters + strings

**Files:** Create `src/components/games/GameCard.tsx`, `src/components/games/GameFilters.tsx`; Modify `src/content/ui.ts`

**Interfaces:**
- Consumes: `CatalogGame` (`@/lib/game-catalog-map`); `GameFilterState` (`@/lib/game-filter`).
- Produces: `<GameCard game={CatalogGame} />`; `<GameFilters facets state onChange />`.

- [ ] **Step 1: Add strings** to the `games` block in `src/content/ui.ts`:
```ts
    searchPlaceholder: { en: "Search games…", vi: "Tìm game…" } as Localized,
    allFilter: { en: "All", vi: "Tất cả" } as Localized,
    filterClassification: { en: "Type", vi: "Phân loại" } as Localized,
    filterGenre: { en: "Genre", vi: "Thể loại" } as Localized,
    filterTag: { en: "Tag", vi: "Thẻ" } as Localized,
    gamesCount: { en: "{n} games", vi: "{n} game" } as Localized,
    noResults: { en: "No games match your filters", vi: "Không có game khớp bộ lọc" } as Localized,
    clearFilters: { en: "Clear filters", vi: "Xoá bộ lọc" } as Localized,
```

- [ ] **Step 2: Create `src/components/games/GameCard.tsx`**:
```tsx
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import GameCover from "@/components/games/GameCover";

export default function GameCard({ game }: { game: CatalogGame }) {
  const { t } = useLocale();
  const badge = game.releaseStatus ?? game.classification;
  return (
    <Link
      href={`/games/${game.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:border-blue"
    >
      <div className="relative">
        <GameCover game={game} />
        {badge && (
          <span className="absolute left-2 top-2">
            <Badge tone="neutral"><span className="capitalize">{badge.replace(/_/g, " ")}</span></Badge>
          </span>
        )}
      </div>
      <div className="p-4">
        <h2 className="text-display line-clamp-1 text-lg text-ink">{game.title}</h2>
        {game.tagline && <p className="mt-1 line-clamp-2 text-sm text-ink-2">{game.tagline}</p>}
        {(game.genre || (game.tags && game.tags.length > 0)) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {game.genre && <Tag>{game.genre}</Tag>}
            {game.tags?.slice(0, 3).map((tg) => <Tag key={tg}>{tg}</Tag>)}
          </div>
        )}
        <p className="mt-3 text-xs text-dim">{t(ui.games.by)} {game.author}{game.year ? ` · ${game.year}` : ""}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 3: Create `src/components/games/GameFilters.tsx`** (module-level `PillGroup` — no nested component):
```tsx
"use client";

import { Search, X } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import type { GameFilterState } from "@/lib/game-filter";

type Facets = { classifications: string[]; genres: string[]; tags: string[] };

const pill = (active: boolean) =>
  `rounded-[var(--radius-pill)] border px-3 py-1 text-xs capitalize transition-colors ${
    active ? "border-blue bg-blue text-white" : "border-border text-ink-2 hover:border-blue hover:text-blue"
  }`;

function PillGroup({ label, allLabel, options, value, onPick }: {
  label: string; allLabel: string; options: string[]; value: string | null; onPick: (v: string | null) => void;
}) {
  if (options.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-dim">{label}:</span>
      <button type="button" onClick={() => onPick(null)} className={pill(value === null)}>{allLabel}</button>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onPick(o)} className={pill(value === o)}>{o.replace(/_/g, " ")}</button>
      ))}
    </div>
  );
}

export default function GameFilters({ facets, state, onChange }: {
  facets: Facets; state: GameFilterState; onChange: (s: GameFilterState) => void;
}) {
  const { t } = useLocale();
  const allLabel = t(ui.games.allFilter);
  const hasActive = !!(state.query || state.classification || state.genre || state.tag);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
        <input
          value={state.query}
          onChange={(e) => onChange({ ...state, query: e.target.value })}
          placeholder={t(ui.games.searchPlaceholder)}
          aria-label={t(ui.games.searchPlaceholder)}
          className="w-full rounded-[var(--radius-pill)] border border-border bg-card py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-blue"
        />
      </div>
      <PillGroup label={t(ui.games.filterClassification)} allLabel={allLabel} options={facets.classifications} value={state.classification} onPick={(v) => onChange({ ...state, classification: v })} />
      <PillGroup label={t(ui.games.filterGenre)} allLabel={allLabel} options={facets.genres} value={state.genre} onPick={(v) => onChange({ ...state, genre: v })} />
      <PillGroup label={t(ui.games.filterTag)} allLabel={allLabel} options={facets.tags} value={state.tag} onPick={(v) => onChange({ ...state, tag: v })} />
      {hasActive && (
        <button type="button" onClick={() => onChange({ query: "", classification: null, genre: null, tag: null })} className="inline-flex items-center gap-1 text-xs text-blue hover:underline">
          <X size={12} /> {t(ui.games.clearFilters)}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/content/ui.ts src/components/games/GameCard.tsx src/components/games/GameFilters.tsx`; `npx vitest run`. (Not mounted yet — Task 3 — this confirms they compile.)

- [ ] **Step 5: Commit**
```bash
git add src/content/ui.ts src/components/games/GameCard.tsx src/components/games/GameFilters.tsx
git commit -m "feat(gamehub): GameCard + GameFilters (search + auto-hiding pills) + strings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: GameHubView redesign

**Files:** Modify `src/components/games/GameHubView.tsx`

**Interfaces:** Consumes `GameCard`, `GameFilters`, `filterGames`/`deriveFacets`/`EMPTY_FILTER`/`GameFilterState`, `EmptyState`.

- [ ] **Step 1: Rewrite `src/components/games/GameHubView.tsx`**:
```tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AmbientField from "@/components/fx/AmbientField";
import EmptyState from "@/components/ui/EmptyState";
import GameCard from "@/components/games/GameCard";
import GameFilters from "@/components/games/GameFilters";
import { filterGames, deriveFacets, EMPTY_FILTER, type GameFilterState } from "@/lib/game-filter";

export default function GameHubView({ games }: { games: CatalogGame[] }) {
  const { t } = useLocale();
  const [filter, setFilter] = useState<GameFilterState>(EMPTY_FILTER);
  const facets = useMemo(() => deriveFacets(games), [games]);
  const filtered = useMemo(() => filterGames(games, filter), [games, filter]);

  return (
    <section className="section relative overflow-hidden pt-28">
      <AmbientField tone="warm" />
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow eyebrow-draw">{t(ui.games.breadcrumb)}</span>
            <h1 className="text-section mt-3 text-ink">{t(ui.games.hubTitle)}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{t(ui.games.hubLead)}</p>
            <p className="mt-2 font-mono text-xs text-dim">{t(ui.games.gamesCount).replace("{n}", String(games.length))}</p>
          </div>
          <Link href="/games/submit" className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-blue hover:text-blue">
            + Đăng game của bạn
          </Link>
        </div>

        <div className="mt-8">
          <GameFilters facets={facets} state={filter} onChange={setFilter} />
        </div>

        {filtered.length > 0 ? (
          <Stagger className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g) => (
              <StaggerItem key={g.id}><GameCard game={g} /></StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="mt-12">
            <EmptyState title={t(ui.games.noResults)} icon={<Gamepad2 size={28} aria-hidden />}>
              <button type="button" onClick={() => setFilter(EMPTY_FILTER)} className="text-sm text-blue hover:underline">
                {t(ui.games.clearFilters)}
              </button>
            </EmptyState>
          </div>
        )}
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/components/games/GameHubView.tsx` clean (no `react-hooks/set-state-in-effect`); `npx vitest run` green. Then `pm2 restart cts-redesign && sleep 3`:
  - `/games` → 200; redesigned: search present `curl -s http://localhost:3001/games | grep -c "Tìm game\|Search games"` → ≥1; the lab game card shows its tagline `curl -s http://localhost:3001/games | grep -c "Unity puzzle-platformer\|giải đố"` → ≥1; submit link present `grep -c "Đăng game của bạn"` → ≥1.
  - A card still links to a detail page: `curl -s http://localhost:3001/games | grep -c "/games/tyrp"` → ≥1.

- [ ] **Step 3: Commit**
```bash
git add src/components/games/GameHubView.tsx
git commit -m "feat(gamehub): redesigned hub — header + search/filters + GameCard grid + empty state

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Audit + deploy

**Files:** Modify any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite** — `npx tsc --noEmit && npx eslint src && npx vitest run` (all clean; incl. the game-filter tests; no stray `eslint-disable`; no `react-hooks/set-state-in-effect`).
- [ ] **Step 2: Behaviour audit (code level):** filter controls auto-hide when `<2` values (`PillGroup` returns null for `options.length < 2`); search matches title/tagline/author; combined filters AND; the empty state renders with a clear-filters action; cards route to `/games/[slug]` and the submit link to `/games/submit`. Reflow 1/2/3 cols at 375/768/1024. No regression to the detail page (A) or submit flow (2b).
- [ ] **Step 3: Production build + deploy** — `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/tyrp`, `/games/submit` → all `200`; `/games` shows the search box (grep "Tìm game\|Search games" ≥1).
- [ ] **Step 4: Final commit (only if fixes were made).** Else report.

> **USER check:** open `ctslab.net/games` — the redesigned hub (header + count + submit CTA, search box, richer cards with cover/badge/tagline/genre/tags). Type in the search box to filter live. (Filter pills appear once ≥2 distinct classifications/genres/tags exist — sparse now with few games; they'll show as the catalog grows.) A card opens the A-redesigned detail page.

---

## Self-Review (completed during planning)

**Spec coverage:** §3.1 filter module → Task 1. §3.2 GameCard → Task 2. §3.3 GameFilters (auto-hide <2) → Task 2. §3.4 GameHubView redesign → Task 3. §3.5 strings → Task 2. §4 behaviour (auto-hide, search, AND, empty state, no-regression) → Tasks 2/3 + Task 4 audit. §6 testing (filterGames/deriveFacets units + manual) → Task 1 + Task 4 + user check.

**Placeholder scan:** complete code each step; no TBD. The "+ Đăng game của bạn" link text stays inline VI (as shipped in 2b) — consistent, not a placeholder.

**Type consistency:** `GameFilterState`/`EMPTY_FILTER`/`filterGames`/`deriveFacets` defined in Task 1, consumed by `GameFilters` (Task 2) + `GameHubView` (Task 3). `GameCard({game: CatalogGame})` (Task 2) consumed by `GameHubView` (Task 3). `GameFilters({facets, state, onChange})` — `facets` shape `{classifications, genres, tags}` matches `deriveFacets`'s return (Task 1). `ui.games.*` keys added in Task 2 are exactly those read by `GameCard`/`GameFilters`/`GameHubView`. `EmptyState({title, icon?, children?})` matches the existing component.

**Note:** `GameHubView`'s prop signature (`{ games: CatalogGame[] }`) is unchanged, so the `/games` server page (which passes `getCatalog()`) needs no edit.
