# Game Hub & Play Page Polish + Bilingual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Game Hub (`/games`) and play page (`/games/[slug]`) — nicer cards + a two-column play layout — and make both fully bilingual via client view components, keeping the route files as server wrappers.

**Architecture:** Add `tags?` to the game data; extract each page's content into a client `*View` component using `useLocale` + `ui.games` (mirrors `ProductDetail`); the route files stay server (params/notFound/metadata/staticParams) and render the view. Reuse existing `Badge`/`Tag`/`GameCover`/`GameEmbed`/`Stagger` + tokens.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, TypeScript, Vitest, lucide-react, existing `useLocale` i18n.

## Global Constraints

- **Bilingual:** every visible string on both pages via `t(...)` (the EN/VI toggle must switch the Games pages). `title`/`author`/`tags` are plain strings; `blurb` is `Localized`.
- **Single source of truth:** hub + play + `generateStaticParams` derive from `getGames()`.
- **Server/client split:** route files are server components (no `useLocale`); the view components are `"use client"` and receive plain serializable data (`GamePlayView` takes a `Game` prop).
- **Existing tokens/components only** (`Container`/`Breadcrumb`/`Badge`/`Tag`/`GameCover`/`GameEmbed`/`Stagger`/`AmbientField`); no new dependencies; no `eslint-disable`; no `react-hooks/set-state-in-effect`.
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; tasks with tests `npx vitest run` green; live `curl` checks. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/components/games/GameHubView.tsx` — client hub content
- `src/components/games/GamePlayView.tsx` — client play content

**Modify:**
- `src/content/types.ts` — add `tags?: string[]` to `Game`
- `src/content/games.ts` — set `tags` on tyrp
- `src/content/games.test.ts` — assert tags
- `src/content/ui.ts` — add `backToHub`, `fullscreenHint` to `ui.games`
- `src/app/games/page.tsx` — render `<GameHubView />`
- `src/app/games/[slug]/page.tsx` — render `<GamePlayView game={g} />`

---

## Task 1: Data tags + strings + test

**Files:**
- Modify: `src/content/types.ts`, `src/content/games.ts`, `src/content/games.test.ts`, `src/content/ui.ts`

**Interfaces:**
- Produces: `Game.tags?: string[]` (tyrp → `["Unity","WebGL"]`); `ui.games.backToHub`, `ui.games.fullscreenHint`.

- [ ] **Step 1: Add the failing test**

In `src/content/games.test.ts`, add inside the `describe`:

```ts
  it("tags the tyrp game with its tech", () => {
    expect(getGame("tyrp")?.tags).toEqual(["Unity", "WebGL"]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/games.test.ts`
Expected: FAIL — `tags` is undefined.

- [ ] **Step 3: Add the type field + data**

In `src/content/types.ts`, add to the `Game` interface:

```ts
  tags?: string[]; // plain tech/genre labels, e.g. ["Unity", "WebGL"]
```

In `src/content/games.ts`, add to the `tyrp` entry (e.g. after `embedPath`):

```ts
    tags: ["Unity", "WebGL"],
```

- [ ] **Step 4: Add the strings**

In `src/content/ui.ts`, inside the existing `games` block, add:

```ts
    backToHub: { en: "Back to Game Hub", vi: "Quay lại Game Hub" } as Localized,
    fullscreenHint: { en: "Tap the ⛶ button to play fullscreen.", vi: "Bấm nút ⛶ để chơi toàn màn hình." } as Localized,
```

- [ ] **Step 5: Run test + verify**

Run: `npx vitest run src/content/games.test.ts` → PASS; `npx vitest run` → green. Then `npx tsc --noEmit && npm run build && npx eslint src/content/types.ts src/content/games.ts src/content/games.test.ts src/content/ui.ts` → clean.

- [ ] **Step 6: Commit**

```bash
git add src/content/types.ts src/content/games.ts src/content/games.test.ts src/content/ui.ts
git commit -m "feat(games): game tags + hub/play polish strings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: GameHubView + hub route

**Files:**
- Create: `src/components/games/GameHubView.tsx`
- Modify: `src/app/games/page.tsx`

**Interfaces:**
- Consumes: `getGames`, `ui.games`, `GameCover`, `Badge`, `Stagger`, `AmbientField`.

- [ ] **Step 1: Implement the hub view**

`src/components/games/GameHubView.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { getGames } from "@/content/games";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import GameCover from "@/components/games/GameCover";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AmbientField from "@/components/fx/AmbientField";

export default function GameHubView() {
  const { t } = useLocale();
  const games = getGames();

  return (
    <section className="section relative overflow-hidden pt-28">
      <AmbientField tone="warm" />
      <Container>
        <span className="eyebrow eyebrow-draw">{t(ui.games.breadcrumb)}</span>
        <h1 className="text-section mt-3 text-ink">{t(ui.games.hubTitle)}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">{t(ui.games.hubLead)}</p>

        <Stagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <StaggerItem key={g.id}>
              <Link
                href={`/games/${g.slug}`}
                className="group block rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:border-blue"
              >
                <div className="relative">
                  <GameCover game={g} />
                  {g.tags && g.tags.length > 0 && (
                    <span className="absolute left-2 top-2">
                      <Badge tone="neutral">{g.tags.join(" · ")}</Badge>
                    </span>
                  )}
                </div>
                <h2 className="text-display mt-3 text-lg text-ink">{g.title}</h2>
                <p className="mt-1 text-sm text-ink-2">{t(ui.games.by)} {g.author} · {g.year}</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Render it in the route**

Replace the body of `src/app/games/page.tsx` so the page is a thin server wrapper:

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GameHubView from "@/components/games/GameHubView";

export const metadata: Metadata = { title: "Game Hub — CTS Lab" };

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main><GameHubView /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/games/GameHubView.tsx src/app/games/page.tsx`; `npx vitest run` green. Then `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "hub: %{http_code}\n" http://localhost:3001/games` → `200`
- `curl -s http://localhost:3001/games | grep -c "Unity · WebGL\|Unity"` → ≥ 1 (badge present)

- [ ] **Step 4: Commit**

```bash
git add src/components/games/GameHubView.tsx src/app/games/page.tsx
git commit -m "feat(games): polished Game Hub view (cards + badge + bilingual)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: GamePlayView + play route

**Files:**
- Create: `src/components/games/GamePlayView.tsx`
- Modify: `src/app/games/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Game` (prop), `ui.games`, `GameEmbed`, `Tag`, `Breadcrumb`, `Container`.

- [ ] **Step 1: Implement the play view**

`src/components/games/GamePlayView.tsx`:

```tsx
"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { Game } from "@/content/types";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Tag from "@/components/ui/Tag";
import GameEmbed from "@/components/games/GameEmbed";

export default function GamePlayView({ game }: { game: Game }) {
  const { t } = useLocale();

  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: t(ui.games.breadcrumb), href: "/games" }, { label: game.title }]} />
        <Link href="/games" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-blue">
          <ArrowLeft size={15} /> {t(ui.games.backToHub)}
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <GameEmbed src={game.embedPath} title={game.title} />
            <p className="mt-3 text-xs text-dim">{t(ui.games.heavyNote)}</p>
          </div>
          <aside>
            <h1 className="text-section text-ink">{game.title}</h1>
            <p className="mt-1 text-sm text-dim">{t(ui.games.by)} {game.author} · {game.year}</p>
            {game.blurb && <p className="mt-4 text-base leading-relaxed text-ink-2">{t(game.blurb)}</p>}
            {game.tags && game.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {game.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>
            )}
            <p className="mt-5 text-sm text-ink-2">{t(ui.games.fullscreenHint)}</p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Render it in the route**

Replace `src/app/games/[slug]/page.tsx` so it is a server wrapper that resolves the game and passes it to the view:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GamePlayView from "@/components/games/GamePlayView";
import { getGames, getGame } from "@/content/games";

export function generateStaticParams() {
  return getGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGame(slug);
  return { title: g ? `${g.title} — CTS Lab` : "Không tìm thấy — CTS Lab" };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGame(slug);
  if (!g) notFound();
  return (
    <>
      <Navbar />
      <main><GamePlayView game={g} /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/games/GamePlayView.tsx "src/app/games/[slug]/page.tsx"`; `npx vitest run` green. Then `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "play: %{http_code}\n" http://localhost:3001/games/tyrp` → `200`
- `curl -s http://localhost:3001/games/tyrp | grep -c "/games/tyrp/index.html"` → ≥ 1 (iframe still present)
- `curl -s http://localhost:3001/games/tyrp | grep -c "Quay lại Game Hub\|Back to Game Hub"` → ≥ 1 (back link present)

- [ ] **Step 4: Commit**

```bash
git add src/components/games/GamePlayView.tsx "src/app/games/[slug]/page.tsx"
git commit -m "feat(games): two-column bilingual play page (embed + info panel)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. the games tags test). No stray `eslint-disable`.

- [ ] **Step 2: Behaviour audit (code level)**

Confirm: hub cards show cover + "Unity · WebGL" badge + author; play page is two-column on `lg` (`lg:grid-cols-[1.6fr_1fr]`) and stacked on mobile (no overflow at 375px); the iframe + back link + fullscreen still present; bilingual — both pages route all visible text through `t(...)` (no leftover hardcoded VI in the view components). Spot-check by toggling: the served HTML defaults to EN, so the labels should appear in English (`Back to Game Hub`, `Users`-style) — confirm the back link's EN form is reachable.

- [ ] **Step 3: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/tyrp`, `/games/tyrp/index.html` → all `200`.

- [ ] **Step 4: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(games): hub/play audit fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes, do not create an empty commit — report results.

> **USER check:** open `ctslab.net/games` and `ctslab.net/games/tyrp` to confirm the polished look + the EN/VI toggle now switches the Games pages, and the game still plays.

---

## Self-Review (completed during planning)

**Spec coverage:**
- §3.1 tags → Task 1. §3.2 strings (backToHub/fullscreenHint, reuse existing) → Task 1. §3.3 hub view → Task 2. §3.4 play view → Task 3. §3.5 route wrappers → Tasks 2/3. §3.6 badges (Badge on cards, Tag in panel) → Tasks 2/3.
- §4 behaviour (single source, cover fallback, bilingual, responsive, motion/a11y) → Tasks 2/3 + Task 4 audit.
- §6 testing (tags unit + manual) → Task 1 + Task 4 + user check.

**Placeholder scan:** No TBD/TODO; complete code in every step. The play route keeps the inline VI fallback metadata title ("Không tìm thấy") — that is a `<title>` for a 404-ish case, acceptable.

**Type consistency:** `Game.tags?: string[]` defined (Task 1), read in hub/play views (Tasks 2/3). `GameHubView` (no props) and `GamePlayView({game: Game})` consistent between the view and the route wrapper. `ui.games.{backToHub,fullscreenHint,by,breadcrumb,hubTitle,hubLead,heavyNote}` defined (Task 1 + existing), read in the views.

**Note:** `GamePlayView` receives the full `Game` object from the server route — it is plain serializable data (strings + optional `Localized` blurb + string[] tags), safe to pass across the server→client boundary.
```
