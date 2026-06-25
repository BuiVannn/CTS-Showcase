# GameHub Redesign A — Data Model + Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the game data model with curated metadata fields and redesign the game detail page (`/games/[slug]`) into a premium project page (hero, badges, playable build, Markdown description, meta sidebar, community stub).

**Architecture:** Add nullable columns to the SQLite games table (idempotent migration) + an `update()` seam; extend the static `Game` type + backfill `tyrp`; move the catalog mappers into a pure, testable module and add the new fields; replace `GamePlayView` with a richer `GameDetailView` that degrades gracefully when fields are absent.

**Tech Stack:** Next.js 16 (server+client components), React 19, `better-sqlite3`, Tailwind v4, Vitest, lucide-react. Reuses `GameEmbed`, `GameCover`, `MessageContent` (markdown+KaTeX), `AmbientField`, `Badge`, `Tag`, `Breadcrumb`, `Reveal`.

## Global Constraints

- **Graceful degradation:** every new field is optional/nullable; a missing field omits its block (no empty headers). Only `tyrp` is backfilled.
- **Single source of truth:** the detail page reads only `getCatalogGame()`; lab + user games render through the same `GameDetailView`.
- **Security:** `description` renders via `MessageContent` (react-markdown, NO raw HTML → no XSS). `external_url`/`video_url` links use `target="_blank" rel="noopener noreferrer"`.
- **Simplification (v1):** the game's own prose (`tagline`, `description`) is a single resolved string — lab games map the Vietnamese variant; user games use the as-entered text. Page **chrome** labels stay bilingual via `ui.games.*`.
- **No regression:** the playable embed keeps the slice-2a sandbox (`allow-same-origin`); `tyrp` still plays.
- DB behind the store seam; `*.db` git-ignored. Bilingual chrome; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect`. `@/*`→`src/*`.
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build`; tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:** `src/lib/game-catalog-map.ts` (+test), `src/components/games/GameDetailView.tsx`
**Modify:** `src/lib/games-db.ts` (+test), `src/lib/game-catalog.ts`, `src/content/types.ts`, `src/content/games.ts`, `src/content/ui.ts`, `src/app/games/[slug]/page.tsx`
**Delete:** `src/components/games/GamePlayView.tsx`

---

## Task 1: DB metadata columns + update() seam

**Files:** Modify `src/lib/games-db.ts`, `src/lib/games-db.test.ts`

**Interfaces produced:** `DbGame` gains optional metadata fields; `GamesStore` gains `update(slug, patch)`.

- [ ] **Step 1: Write failing test** — append to `src/lib/games-db.test.ts`:
```ts
describe("games store — metadata update (redesign A)", () => {
  it("updates only whitelisted fields, leaves others intact", () => {
    const s = createGamesStore(":memory:");
    s.insert({ id: "1", slug: "a", title: "A", author: "x", cover: null, status: "published", created_at: "2026-06-24T00:00:00Z", owner_id: "u1", owner_email: "u1@x" });
    s.update("a", { tagline: "Quick game", genre: "Puzzle", project_type: "web", evil: "DROP" } as never);
    const g = s.get("a")!;
    expect(g.tagline).toBe("Quick game");
    expect(g.genre).toBe("Puzzle");
    expect(g.project_type).toBe("web");
    expect(g.title).toBe("A"); // untouched
    expect((g as Record<string, unknown>).evil).toBeUndefined(); // non-column ignored
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/lib/games-db.test.ts`): `update` missing.

- [ ] **Step 3: Implement.** In `src/lib/games-db.ts`:

Extend `DbGame` with the new optional fields:
```ts
export interface DbGame {
  id: string; slug: string; title: string; author: string;
  cover: string | null; status: string; created_at: string;
  owner_id: string | null; owner_email: string | null;
  tagline?: string | null; description?: string | null;
  classification?: string | null; project_type?: string | null;
  release_status?: string | null; genre?: string | null; tags?: string | null;
  video_url?: string | null; external_url?: string | null; updated_at?: string | null;
}
```
Add to the migration block (after the owner_id/owner_email ALTERs) — a fixed column list (safe, not user input):
```ts
  for (const col of ["tagline","description","classification","project_type","release_status","genre","tags","video_url","external_url","updated_at"]) {
    if (!cols.has(col)) db.exec(`ALTER TABLE games ADD COLUMN ${col} TEXT`);
  }
```
Add `update(slug: string, patch: Partial<DbGame>): void;` to the `GamesStore` interface, and implement it in the returned object (whitelist columns → safe):
```ts
    update: (slug, patch) => {
      const allowed = ["title","author","cover","status","tagline","description","classification","project_type","release_status","genre","tags","video_url","external_url","updated_at"];
      const keys = Object.keys(patch).filter((k) => allowed.includes(k));
      if (keys.length === 0) return;
      const setClause = keys.map((k) => `${k} = @${k}`).join(", ");
      db.prepare(`UPDATE games SET ${setClause} WHERE slug = @slug`).run({ ...patch, slug });
    },
```
(Leave `insert` unchanged — the new columns default to NULL on insert and are filled via `update`.)

- [ ] **Step 4: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/games-db.ts src/lib/games-db.test.ts`.

- [ ] **Step 5: Verify live DB migrates** — `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games` → `200` (existing rows survive, new columns NULL).

- [ ] **Step 6: Commit**
```bash
git add src/lib/games-db.ts src/lib/games-db.test.ts
git commit -m "feat(gamehub): metadata columns (tagline/description/genre/...) + update() seam

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Static Game fields + tyrp backfill + catalog mappers

**Files:** Modify `src/content/types.ts`, `src/content/games.ts`, `src/lib/game-catalog.ts`; Create `src/lib/game-catalog-map.ts`, `src/lib/game-catalog-map.test.ts`

**Interfaces produced:** `CatalogGame` (moved here) gains the new fields; `mapLabGame(g)`, `mapUserGame(g)` (pure, testable).

- [ ] **Step 1: Extend the static `Game` type** in `src/content/types.ts` — add to the `Game` interface:
```ts
  tagline?: Localized;
  description?: Localized; // Markdown
  classification?: string;
  projectType?: string;
  releaseStatus?: string;
  genre?: string;
  externalUrl?: string;
  videoUrl?: string;
```

- [ ] **Step 2: Backfill `tyrp`** in `src/content/games.ts` — add to the tyrp entry:
```ts
    tagline: {
      en: "A bite-sized Unity puzzle-platformer — playable right here.",
      vi: "Game giải đố – đi cảnh cỡ nhỏ dựng bằng Unity, chơi ngay tại đây.",
    },
    description: {
      en: "**To Your Right Places!** is a compact browser puzzle game built in Unity.\n\n- Guide each piece to its right place\n- Quick levels, easy to pick up\n\nBuilt by a CTS Lab student.",
      vi: "**To Your Right Places!** là một game giải đố gọn nhẹ trên trình duyệt, dựng bằng Unity.\n\n- Đưa từng mảnh về đúng vị trí\n- Màn chơi nhanh, dễ làm quen\n\nThực hiện bởi sinh viên CTS Lab.",
    },
    classification: "game",
    projectType: "web",
    releaseStatus: "released",
    genre: "Puzzle",
```

- [ ] **Step 3: Write the mapper test** `src/lib/game-catalog-map.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mapLabGame, mapUserGame } from "./game-catalog-map";
import type { Game } from "@/content/types";
import type { DbGame } from "@/lib/games-db";

const lab: Game = {
  id: "g", slug: "g", title: "G", author: "A", year: 2024, embedPath: "/games/g/index.html",
  tags: ["Unity"], tagline: { en: "EN", vi: "VI tagline" }, description: { en: "e", vi: "v desc" },
  classification: "game", projectType: "web", releaseStatus: "released", genre: "Puzzle",
};

describe("mapLabGame", () => {
  it("maps lab fields (VI prose, same-origin, not sandboxed)", () => {
    const c = mapLabGame(lab);
    expect(c.source).toBe("lab");
    expect(c.sandboxed).toBe(false);
    expect(c.embedUrl).toBe("/games/g/index.html");
    expect(c.tagline).toBe("VI tagline");
    expect(c.description).toBe("v desc");
    expect(c.classification).toBe("game");
    expect(c.genre).toBe("Puzzle");
  });
});

describe("mapUserGame", () => {
  it("maps DB fields (CSV tags, cross-origin, sandboxed)", () => {
    const db: DbGame = {
      id: "1", slug: "u", title: "U", author: "B", cover: null, status: "published",
      created_at: "2026-06-24T00:00:00Z", owner_id: "x", owner_email: null,
      tagline: "tag", description: "**md**", genre: "Action", tags: "a, b ,c",
      project_type: "web", release_status: "in_dev", classification: "demo",
    };
    const c = mapUserGame(db);
    expect(c.source).toBe("user");
    expect(c.sandboxed).toBe(true);
    expect(c.embedUrl).toContain("/u/index.html");
    expect(c.tags).toEqual(["a", "b", "c"]);
    expect(c.tagline).toBe("tag");
    expect(c.projectType).toBe("web");
    expect(c.releaseStatus).toBe("in_dev");
  });
});
```

- [ ] **Step 4: Run → FAIL** (`npx vitest run src/lib/game-catalog-map.test.ts`): module missing.

- [ ] **Step 5: Create `src/lib/game-catalog-map.ts`** (pure — NO `server-only`, NO DB/Game-data imports beyond types):
```ts
import type { Localized } from "@/content/types";
import type { Game } from "@/content/types";
import type { DbGame } from "@/lib/games-db";

const GAMES_ORIGIN = process.env.GAMES_ORIGIN || "https://games.ctslab.net";

export interface CatalogGame {
  id: string;
  slug: string;
  title: string;
  author: string;
  year?: number;
  cover?: string;
  tags?: string[];
  blurb?: Localized;
  source: "lab" | "user";
  embedUrl: string;
  sandboxed: boolean;
  tagline?: string;
  description?: string;
  classification?: string;
  projectType?: string;
  releaseStatus?: string;
  genre?: string;
  externalUrl?: string;
  videoUrl?: string;
}

export function mapLabGame(g: Game): CatalogGame {
  return {
    id: g.id, slug: g.slug, title: g.title, author: g.author, year: g.year,
    cover: g.cover, tags: g.tags, blurb: g.blurb,
    source: "lab", embedUrl: g.embedPath, sandboxed: false,
    tagline: g.tagline?.vi, description: g.description?.vi,
    classification: g.classification, projectType: g.projectType,
    releaseStatus: g.releaseStatus, genre: g.genre,
    externalUrl: g.externalUrl, videoUrl: g.videoUrl,
  };
}

export function mapUserGame(g: DbGame): CatalogGame {
  return {
    id: g.id, slug: g.slug, title: g.title, author: g.author,
    year: g.created_at ? new Date(g.created_at).getFullYear() : undefined,
    cover: g.cover ?? undefined,
    tags: g.tags ? g.tags.split(",").map((s) => s.trim()).filter(Boolean) : [],
    source: "user", embedUrl: `${GAMES_ORIGIN}/${g.slug}/index.html`, sandboxed: true,
    tagline: g.tagline ?? undefined, description: g.description ?? undefined,
    classification: g.classification ?? undefined, projectType: g.project_type ?? undefined,
    releaseStatus: g.release_status ?? undefined, genre: g.genre ?? undefined,
    externalUrl: g.external_url ?? undefined, videoUrl: g.video_url ?? undefined,
  };
}
```

- [ ] **Step 6: Rewrite `src/lib/game-catalog.ts`** to use the mappers + re-export the type:
```ts
import "server-only";
import { getGames } from "@/content/games";
import { getGamesStore } from "@/lib/games-db";
import { mapLabGame, mapUserGame } from "@/lib/game-catalog-map";

export type { CatalogGame } from "@/lib/game-catalog-map";

export function getCatalog() {
  return [...getGames().map(mapLabGame), ...getGamesStore().listPublished().map(mapUserGame)];
}

export function getCatalogGame(slug: string) {
  return getCatalog().find((g) => g.slug === slug);
}
```
(Existing importers of `CatalogGame` from `@/lib/game-catalog` keep working via the re-export.)

- [ ] **Step 7: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/game-catalog-map.ts src/lib/game-catalog-map.test.ts src/lib/game-catalog.ts src/content/types.ts src/content/games.ts`.

- [ ] **Step 8: Commit**
```bash
git add src/lib/game-catalog-map.ts src/lib/game-catalog-map.test.ts src/lib/game-catalog.ts src/content/types.ts src/content/games.ts
git commit -m "feat(gamehub): catalog metadata fields + pure mappers + tyrp backfill

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: GameDetailView + strings + route

**Files:** Modify `src/content/ui.ts`, `src/app/games/[slug]/page.tsx`; Create `src/components/games/GameDetailView.tsx`; Delete `src/components/games/GamePlayView.tsx`

- [ ] **Step 1: Add strings** to the `games` block in `src/content/ui.ts`:
```ts
    about: { en: "About", vi: "Giới thiệu" } as Localized,
    info: { en: "Details", vi: "Thông tin" } as Localized,
    creator: { en: "Creator", vi: "Tác giả" } as Localized,
    genre: { en: "Genre", vi: "Thể loại" } as Localized,
    classification: { en: "Type", vi: "Phân loại" } as Localized,
    releaseStatus: { en: "Status", vi: "Trạng thái" } as Localized,
    links: { en: "Links", vi: "Liên kết" } as Localized,
    play: { en: "Play now", vi: "Chơi ngay" } as Localized,
    openLink: { en: "Open link", vi: "Mở liên kết" } as Localized,
    watchVideo: { en: "Watch video", vi: "Xem video" } as Localized,
    noDescription: { en: "No description yet.", vi: "Chưa có mô tả." } as Localized,
    comingSoonComments: { en: "Comments — coming soon", vi: "Bình luận — sắp ra mắt" } as Localized,
```

- [ ] **Step 2: Create `src/components/games/GameDetailView.tsx`**:
```tsx
"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Play, Video } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog-map";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import Reveal from "@/components/ui/Reveal";
import AmbientField from "@/components/fx/AmbientField";
import GameCover from "@/components/games/GameCover";
import GameEmbed from "@/components/games/GameEmbed";
import MessageContent from "@/components/home/MessageContent";

const PRIMARY = "inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90";
const SECONDARY = "inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue";

export default function GameDetailView({ game }: { game: CatalogGame }) {
  const { t } = useLocale();
  const badges = [game.releaseStatus, game.classification, game.projectType].filter(Boolean) as string[];
  const isExternal = game.projectType === "external" && !!game.externalUrl;

  return (
    <>
      <section className="section relative overflow-hidden pt-28 pb-0">
        <AmbientField tone="warm" />
        <Container>
          <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: t(ui.games.breadcrumb), href: "/games" }, { label: game.title }]} />
          <Link href="/games" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-blue">
            <ArrowLeft size={15} /> {t(ui.games.backToHub)}
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <Reveal>
              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-[var(--shadow-lg)]">
                <GameCover game={game} />
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => <Badge key={b} tone="neutral"><span className="capitalize">{b.replace(/_/g, " ")}</span></Badge>)}
                </div>
              )}
              <h1 className="text-section mt-3 text-ink">{game.title}</h1>
              {game.tagline && <p className="mt-2 text-lg leading-relaxed text-ink-2">{game.tagline}</p>}
              <p className="mt-3 text-sm text-dim">{t(ui.games.by)} {game.author}{game.year ? ` · ${game.year}` : ""}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {isExternal ? (
                  <a href={game.externalUrl} target="_blank" rel="noopener noreferrer" className={PRIMARY}><ExternalLink size={16} /> {t(ui.games.openLink)}</a>
                ) : (
                  <a href="#play" className={PRIMARY}><Play size={16} /> {t(ui.games.play)}</a>
                )}
                {game.videoUrl && <a href={game.videoUrl} target="_blank" rel="noopener noreferrer" className={SECONDARY}><Video size={16} /> {t(ui.games.watchVideo)}</a>}
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section pt-12">
        <Container>
          {!isExternal && (
            <div id="play" className="scroll-mt-24">
              <GameEmbed src={game.embedUrl} title={game.title} />
              <p className="mt-3 text-xs text-dim">{t(ui.games.heavyNote)}</p>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <h2 className="text-display text-xl text-ink">{t(ui.games.about)}</h2>
              {game.description
                ? <div className="mt-3"><MessageContent content={game.description} /></div>
                : <p className="mt-3 text-sm text-dim">{t(ui.games.noDescription)}</p>}
            </Reveal>

            <aside className="space-y-4">
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
                <h3 className="text-display text-sm text-ink">{t(ui.games.info)}</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <MetaRow label={t(ui.games.creator)} value={game.author} />
                  {game.genre && <MetaRow label={t(ui.games.genre)} value={game.genre} />}
                  {game.classification && <MetaRow label={t(ui.games.classification)} value={game.classification} />}
                  {game.releaseStatus && <MetaRow label={t(ui.games.releaseStatus)} value={game.releaseStatus.replace(/_/g, " ")} />}
                </dl>
                {game.tags && game.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">{game.tags.map((tg) => <Tag key={tg}>{tg}</Tag>)}</div>
                )}
              </div>

              {(game.externalUrl || game.videoUrl) && (
                <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
                  <h3 className="text-display text-sm text-ink">{t(ui.games.links)}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {game.externalUrl && <li><a href={game.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue hover:underline"><ExternalLink size={14} /> {t(ui.games.openLink)}</a></li>}
                    {game.videoUrl && <li><a href={game.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue hover:underline"><Video size={14} /> {t(ui.games.watchVideo)}</a></li>}
                  </ul>
                </div>
              )}

              <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-5 text-center">
                <p className="text-sm text-dim">{t(ui.games.comingSoonComments)}</p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-dim">{label}</dt>
      <dd className="text-right capitalize text-ink-2">{value}</dd>
    </div>
  );
}
```

- [ ] **Step 3: Point the route at `GameDetailView`** in `src/app/games/[slug]/page.tsx` — replace the `GamePlayView` import + usage:
```tsx
import GameDetailView from "@/components/games/GameDetailView";
// ...
      <main><GameDetailView game={g} /></main>
```
(Keep `generateStaticParams`, `generateMetadata`, `getCatalogGame`, `notFound`, Navbar/Footer.)

- [ ] **Step 4: Delete the old view** — `git rm src/components/games/GamePlayView.tsx` (it's superseded; confirm nothing else imports it: `grep -rn "GamePlayView" src` → no results after deletion).

- [ ] **Step 5: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/content/ui.ts src/components/games/GameDetailView.tsx "src/app/games/[slug]/page.tsx"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - `/games/tyrp` → 200; rich content present: `curl -s http://localhost:3001/games/tyrp | grep -c "Giới thiệu\|About"` → ≥1; embed still present: `curl -s http://localhost:3001/games/tyrp | grep -c "/games/tyrp/index.html"` → ≥1.
  - A minimal user game still renders + plays: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games/test` → `200`.

- [ ] **Step 6: Commit**
```bash
git add src/content/ui.ts src/components/games/GameDetailView.tsx "src/app/games/[slug]/page.tsx"
git rm src/components/games/GamePlayView.tsx
git commit -m "feat(gamehub): redesigned detail page (hero + badges + markdown + meta sidebar)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Audit + deploy

**Files:** Modify any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite** — `npx tsc --noEmit && npx eslint src && npx vitest run` (all clean; incl. the games-db update + catalog-map tests; no stray `eslint-disable`).
- [ ] **Step 2: Behaviour audit (code level):** graceful degradation (a game with no tagline/description/genre omits those blocks — `GameDetailView` guards every new field); `description` renders via `MessageContent` (no raw HTML); external/video links use `rel="noopener noreferrer"`; `tyrp` plays (web build, `GameEmbed` sandbox intact); no leftover `GamePlayView` import (`grep -rn "GamePlayView" src` → empty). Reflow OK at 375px (hero + body stack).
- [ ] **Step 3: Production build + deploy** — `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/tyrp`, `/games/test` → all `200`; `/games/tyrp` shows the redesigned hero/about (grep "Giới thiệu" ≥1).
- [ ] **Step 4: Final commit (only if fixes were made).** Else report.

> **USER check:** open `ctslab.net/games/tyrp` — the redesigned project page (hero with cover + tagline + badges, the playable game, the Markdown "Giới thiệu", the meta sidebar + "Bình luận — sắp ra mắt" stub). A user game (e.g. `/games/test`) renders gracefully (no metadata → those blocks hidden) and still plays.

---

## Self-Review (completed during planning)

**Spec coverage:** §2.1 DB columns + update → Task 1. §2.2 static fields + tyrp backfill → Task 2. §2.3 CatalogGame + mappers → Task 2 (pure module for testability — refinement over the spec's inline-mapping note, same behavior). §3.1 route → Task 3. §3.2 GameDetailView → Task 3. §3.3 retire GamePlayView → Task 3. §4 graceful degradation / security / no-regression → Tasks 3 + 4. §6 testing (migration/update + mapper units; manual) → Tasks 1/2 + 4 + user check.

**Placeholder scan:** complete code each step; `tyrp` description is real Markdown. The `Game` type's `description` is `Localized` but mapped to a single VI string in `CatalogGame` per the v1 simplification (Global Constraints) — intentional, not a gap.

**Type consistency:** `DbGame` new optional fields (Task 1) consumed by `mapUserGame` (Task 2). `CatalogGame` defined in `game-catalog-map.ts` (Task 2), re-exported by `game-catalog.ts`, imported by `GameDetailView` (Task 3) from `@/lib/game-catalog-map`. `update(slug, patch)` defined Task 1 (seam for sub-project C; not consumed in A). `ui.games.*` keys added Task 3 are exactly those read by `GameDetailView`.

**Note:** `CatalogGame.blurb` is retained (still mapped) though `GameDetailView` uses `tagline`/`description` instead — kept for the not-yet-redesigned `GameHubView` (sub-project B) which imports `CatalogGame`; harmless.
