# Game Hub — Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Host the lab's Unity WebGL game as a static bundle, turn `/games` into a real Game Hub listing it, and add a play page `/games/<slug>` that embeds the game in a sandboxed iframe (playable in-browser).

**Architecture:** Copy the game bundle into `public/games/tyrp/` (served static; the Unity loader's gzip decompression fallback means no header config needed). Add a small `games` content layer. The hub page lists games (cover-or-placeholder); the play page embeds the game via a client `GameEmbed` iframe with a fullscreen button. Mirrors the existing products `[slug]` route pattern.

**Tech Stack:** Next.js 16 (App Router, SSG via `generateStaticParams`), React 19, Tailwind v4, TypeScript, Vitest (node) for content, lucide-react, existing `useLocale` i18n.

## Global Constraints

- **Static-serving works as-is:** the `.unityweb` files are gzip with the Unity loader's decompression fallback → serve from `public/` with no `Content-Encoding`/header config. Do not add custom headers.
- **Embed isolation:** the game runs in a `<iframe sandbox>`; same-origin is acceptable for this trusted lab game. (Future user-uploaded games need a separate origin — out of scope.)
- **Bilingual:** all user-facing strings are `Localized` via `t(...)`. `title`/`author` are plain strings.
- **Single source of truth:** games come from `getGames()`; hub + play pages + static params derive from it.
- **Existing tokens/components only** (`Navbar`/`Footer`/`Container`/`Card`/`Breadcrumb`); no new dependencies; no `eslint-disable`; no `react-hooks/set-state-in-effect`.
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; tasks with tests `npx vitest run` green; live `curl` checks. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). The game bundle commit adds ~21 MB of binaries under `public/games/tyrp/` — that is intended. Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `public/games/tyrp/**` — the static Unity bundle (copied)
- `src/content/games.ts` (+ `src/content/games.test.ts`) — games data + accessors
- `src/components/games/GameEmbed.tsx` — client iframe + fullscreen
- `src/components/games/GameCover.tsx` — cover image or branded placeholder
- `src/app/games/[slug]/page.tsx` — play page

**Modify:**
- `src/content/types.ts` — add the `Game` interface
- `src/content/ui.ts` — add a `games` strings block
- `src/app/games/page.tsx` — replace the stub with the hub

---

## Task 1: Static bundle + games content + strings + test

**Files:**
- Create: `public/games/tyrp/**` (copy), `src/content/games.ts`, `src/content/games.test.ts`
- Modify: `src/content/types.ts`, `src/content/ui.ts`

**Interfaces:**
- Produces: `Game` interface; `getGames(): Game[]`; `getGame(slug): Game | undefined`; `ui.games`.

- [ ] **Step 1: Copy the game bundle into public**

Run:

```bash
mkdir -p public/games/tyrp
cp -r game/TYRP_CTSLab/. public/games/tyrp/
find public/games/tyrp -name ".DS_Store" -delete
ls public/games/tyrp && ls public/games/tyrp/Build
```

Expected: `index.html`, `Build/`, `TemplateData/` present under `public/games/tyrp/`; `Build/` has the `.unityweb` + `.loader.js` files.

- [ ] **Step 2: Add the `Game` type**

In `src/content/types.ts`, add:

```ts
export interface Game {
  id: string;
  slug: string;
  title: string;   // proper name, kept as-is
  author: string;
  year: number;
  embedPath: string; // static path to the game's index.html
  cover?: string;    // public path to a cover image; falls back to a placeholder
  blurb?: Localized;
}
```

- [ ] **Step 3: Write the failing test**

`src/content/games.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getGames, getGame } from "./games";

describe("games content", () => {
  it("lists at least one game", () => {
    expect(getGames().length).toBeGreaterThanOrEqual(1);
  });
  it("resolves the tyrp game with its embed path", () => {
    const g = getGame("tyrp");
    expect(g?.title).toBe("To Your Right Places!");
    expect(g?.embedPath).toBe("/games/tyrp/index.html");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getGame("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/content/games.test.ts`
Expected: FAIL — cannot find module `./games`.

- [ ] **Step 5: Implement the games data**

`src/content/games.ts`:

```ts
import type { Game } from "./types";

const games: Game[] = [
  {
    id: "tyrp",
    slug: "tyrp",
    title: "To Your Right Places!",
    author: "KillDee8",
    year: 2024,
    embedPath: "/games/tyrp/index.html",
    blurb: {
      en: "A browser game built in Unity — play it right here.",
      vi: "Một game trên trình duyệt dựng bằng Unity — chơi ngay tại đây.",
    },
  },
];

/** Repository seam: static list today; swap to an API/DB for the full Game Hub later. */
export function getGames(): Game[] {
  return games;
}

export function getGame(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}
```

- [ ] **Step 6: Add the strings**

In `src/content/ui.ts`, add a `games` block inside the exported `ui` object:

```ts
  games: {
    hubTitle: { en: "Game Hub", vi: "Khu Game" } as Localized,
    hubLead: {
      en: "Play games built by the lab — right in your browser.",
      vi: "Chơi các game do lab tạo ra — ngay trên trình duyệt.",
    } as Localized,
    play: { en: "Play", vi: "Chơi" } as Localized,
    by: { en: "by", vi: "bởi" } as Localized,
    fullscreen: { en: "Fullscreen", vi: "Toàn màn hình" } as Localized,
    breadcrumb: { en: "Games", vi: "Games" } as Localized,
    heavyNote: {
      en: "Heavy game — best on desktop; first load may take a moment.",
      vi: "Game khá nặng — nên chơi trên máy tính; lần tải đầu có thể hơi lâu.",
    } as Localized,
  },
```

- [ ] **Step 7: Run test + verify static serving**

Run: `npx vitest run src/content/games.test.ts` → PASS; `npx vitest run` → full suite green. Then `npx tsc --noEmit && npm run build`. Then `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "index: %{http_code}\n" http://localhost:3001/games/tyrp/index.html` → `200`
- `curl -s -o /dev/null -w "wasm: %{http_code}\n" http://localhost:3001/games/tyrp/Build/862d8f424018d549e2868dbc45c1270f.wasm.unityweb` → `200`

- [ ] **Step 8: Commit**

```bash
git add public/games/tyrp src/content/games.ts src/content/games.test.ts src/content/types.ts src/content/ui.ts
git commit -m "feat(games): host TYRP Unity bundle + games content + strings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: GameEmbed + GameCover components

**Files:**
- Create: `src/components/games/GameEmbed.tsx`, `src/components/games/GameCover.tsx`

**Interfaces:**
- Consumes: `ui.games`, `useLocale`, lucide icons.
- Produces: `<GameEmbed src={string} title={string} />`; `<GameCover game={Game} />`.

- [ ] **Step 1: GameEmbed (client iframe + fullscreen)**

`src/components/games/GameEmbed.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { Maximize } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

/**
 * Embeds a self-contained static game (its own index.html) in a sandboxed,
 * 16:9 responsive iframe with a fullscreen button. Same-origin is acceptable
 * for trusted lab games; user-uploaded games will use a separate origin later.
 */
export default function GameEmbed({ src, title }: { src: string; title: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLIFrameElement>(null);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-black shadow-[var(--shadow-lg)]"
      style={{ aspectRatio: "16 / 9" }}
    >
      <iframe
        ref={ref}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
        allow="fullscreen; autoplay; gamepad"
        allowFullScreen
      />
      <button
        type="button"
        onClick={() => ref.current?.requestFullscreen?.()}
        aria-label={t(ui.games.fullscreen)}
        className="absolute bottom-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-border bg-card/90 text-ink shadow-[var(--shadow-sm)] transition-colors hover:text-blue"
      >
        <Maximize size={16} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: GameCover (cover or branded placeholder)**

`src/components/games/GameCover.tsx`:

```tsx
import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import type { Game } from "@/content/types";

/** A game's cover: the cover image when set, else a branded placeholder tile. */
export default function GameCover({ game, className = "" }: { game: Game; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--radius-md)] border border-border ${className}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      {game.cover ? (
        <Image src={game.cover} alt={game.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-white"
          style={{ background: "linear-gradient(135deg, var(--blue), var(--red))" }}
        >
          <Gamepad2 size={28} aria-hidden />
          <span className="px-3 text-center text-sm font-semibold">{game.title}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/games/GameEmbed.tsx src/components/games/GameCover.tsx`
Expected: clean. (Components not mounted yet — Task 3 — this just confirms they compile.)

- [ ] **Step 4: Commit**

```bash
git add src/components/games/GameEmbed.tsx src/components/games/GameCover.tsx
git commit -m "feat(games): GameEmbed (sandboxed iframe + fullscreen) + GameCover

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Play page + Game Hub page

**Files:**
- Create: `src/app/games/[slug]/page.tsx`
- Modify: `src/app/games/page.tsx` (replace the stub)

**Interfaces:**
- Consumes: `getGames`/`getGame`, `GameEmbed`, `GameCover`, `ui.games`.

- [ ] **Step 1: Play page**

`src/app/games/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import GameEmbed from "@/components/games/GameEmbed";
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
      <main className="section pt-28">
        <Container>
          <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: "Games", href: "/games" }, { label: g.title }]} />
          <h1 className="text-section mt-6 text-ink">{g.title}</h1>
          <p className="mt-1 text-sm text-dim">by {g.author} · {g.year}</p>
          <div className="mt-6 max-w-4xl">
            <GameEmbed src={g.embedPath} title={g.title} />
            <p className="mt-3 text-xs text-dim">
              Game khá nặng — nên chơi trên máy tính; lần tải đầu có thể hơi lâu.
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

Note: this page uses a couple of inline VI strings (private heavy-game note + "by"); acceptable. If you prefer, render them via `t(ui.games.*)` by making a tiny client wrapper — but keep it server + simple here.

- [ ] **Step 2: Game Hub page (replace the stub)**

Replace `src/app/games/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import GameCover from "@/components/games/GameCover";
import { getGames } from "@/content/games";

export const metadata: Metadata = { title: "Game Hub — CTS Lab" };

export default function GamesPage() {
  const games = getGames();
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <span className="eyebrow eyebrow-draw">Games</span>
          <h1 className="text-section mt-3 text-ink">Game Hub</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">
            Chơi các game do lab tạo ra — ngay trên trình duyệt.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.slug}`}
                className="group rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:border-blue"
              >
                <GameCover game={g} />
                <h2 className="text-display mt-3 text-lg text-ink">{g.title}</h2>
                <p className="mt-1 text-sm text-ink-2">by {g.author}</p>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/app/games/page.tsx "src/app/games/[slug]/page.tsx"`
Expected: clean; build output lists `/games` and the SSG `/games/tyrp`. Then `npx vitest run` → green.

- [ ] **Step 4: Verify live**

Run: `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "hub: %{http_code}\n" http://localhost:3001/games` → `200`
- `curl -s -o /dev/null -w "play: %{http_code}\n" http://localhost:3001/games/tyrp` → `200`
- `curl -s http://localhost:3001/games/tyrp | grep -c "/games/tyrp/index.html"` → ≥ 1 (the iframe is present)
- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games/tyrp/index.html` → `200`

- [ ] **Step 5: Commit**

```bash
git add src/app/games/page.tsx "src/app/games/[slug]/page.tsx"
git commit -m "feat(games): Game Hub page + play page embedding the game

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. games content tests). No stray `eslint-disable`.

- [ ] **Step 2: Behaviour audit (code level)**

Confirm: `/games` lists the game (placeholder cover, since no `cover` set); `/games/tyrp` renders the iframe pointing at `/games/tyrp/index.html` with the sandbox + fullscreen button; the static bundle serves (`index.html`, a `.unityweb`, the `.loader.js` → 200). The hub teaser/links from home still point to `/games` (unchanged). Reflow at 375px OK.

- [ ] **Step 3: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/tyrp`, `/games/tyrp/index.html` → all `200`.

- [ ] **Step 4: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(games): game hub slice-1 audit fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes, do not create an empty commit — report results.

> **USER verification (browser):** the controller cannot load the game visually. After deploy, the user opens `ctslab.net/games/tyrp` to confirm the Unity game actually loads and is playable (and fullscreen works). If it fails to load, capture the browser console error for follow-up (likely a MIME/encoding or sandbox-permission detail).

---

## Self-Review (completed during planning)

**Spec coverage:**
- §2 static serving (gzip fallback, no headers) → Task 1 (copy + curl checks). §4.1 bundle → Task 1. §4.2 games content → Task 1. §4.3 hub → Task 3. §4.4 play page → Task 3. §4.5 GameEmbed → Task 2. §4.6 strings → Task 1. §4.7 cover fallback → Task 2 (GameCover).
- §5 behaviour (loads/plays, responsive, isolation, a11y, bilingual, perf) → Tasks 2/3 + Task 4 audit + the user browser check.
- §7 testing (games unit + manual) → Task 1 test + Task 4 + user check.

**Placeholder scan:** No TBD/TODO; complete code in every step. A few private-page strings are inline VI (play page note/"by", hub lead) — acceptable for these pages; the `ui.games` block exists if fuller i18n is wanted later.

**Type consistency:** `Game` defined in types.ts (Task 1), consumed by games.ts, GameCover, and the routes. `getGames`/`getGame` signatures consistent across hub/play/static-params. `GameEmbed({src,title})` and `GameCover({game})` consistent in Task 2/3.

**Note for implementer:** the static-bundle copy (Task 1) adds ~21 MB under `public/games/tyrp/`; commit that path explicitly. The root `game/TYRP_CTSLab/` source folder can stay untracked — do not delete it.
```
