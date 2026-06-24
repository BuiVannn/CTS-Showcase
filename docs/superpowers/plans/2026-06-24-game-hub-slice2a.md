# Game Hub Slice 2a — Admin Upload + Sandboxed Serving Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An admin uploads a WebGL game ZIP through `/admin/games`; the server validates + safely extracts it into `GAMES_STORAGE_DIR/<slug>/`, records it in SQLite, and it appears in the Game Hub playing from the separate origin `games.ctslab.net`.

**Architecture:** A SQLite `games` table (behind a store seam) + a server-only `getCatalog()` that merges static lab games with DB user games into a unified `CatalogGame`. The hub/play views become prop-driven (server reads the catalog, passes it down). An admin-gated `nodejs` route handles upload (path-traversal-safe unzip) + delete. User games embed via an iframe pointed at `GAMES_ORIGIN`, sandboxed without `allow-same-origin`.

**Tech Stack:** Next.js 16 (route handlers, `runtime="nodejs"`, server components), React 19, Auth.js v5 (`auth()`, `session.isAdmin`), `better-sqlite3` (have), `adm-zip` (new), Tailwind v4, Vitest.

## Global Constraints

- **Verified infra:** `games.ctslab.net` → tunnel `CTS_Showcase` → local static server `:8090` (pm2 `games-sandbox`) serving `GAMES_STORAGE_DIR=/home/namnx/ctslab-games`. Iframe-able; auth cookies host-only.
- **Security:** untrusted games are served ONLY from `GAMES_ORIGIN` (separate origin); user-game iframes use `sandbox` WITHOUT `allow-same-origin`; ZIP extraction MUST reject path traversal (`..`/absolute/escaping entries); upload/delete are `session.isAdmin`-gated server-side; size ≤ `GAMES_MAX_UPLOAD_MB`. Errors are generic — no path/secret leakage.
- **No regression:** the lab game `tyrp` keeps playing same-origin (`sandboxed:false`).
- **DB behind a seam** (`games-db.ts`) — SQLite, swappable later; `*.db` already git-ignored.
- **Bilingual** admin UI; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect`. `@/*`→`src/*`.
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build`; tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`; never touch `.env.local`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:** `src/lib/games-db.ts` (+test), `src/lib/game-upload.ts` (+test), `src/lib/game-catalog.ts`, `src/app/api/admin/games/route.ts`, `src/app/admin/games/page.tsx`, `src/components/admin/GameUploadManager.tsx`
**Modify:** `src/components/games/GameHubView.tsx`, `src/components/games/GamePlayView.tsx`, `src/components/games/GameEmbed.tsx`, `src/components/games/GameCover.tsx`, `src/app/games/page.tsx`, `src/app/games/[slug]/page.tsx`, `.env.example`, `package.json`

---

## Task 1: Games DB store + slug/zip helpers + tests

**Files:** Create `src/lib/games-db.ts`, `src/lib/games-db.test.ts`, `src/lib/game-upload.ts`, `src/lib/game-upload.test.ts`; Modify `package.json`

**Interfaces produced:** `DbGame`; `GamesStore { listPublished(); get(slug); exists(slug); insert(g); remove(slug) }`; `createGamesStore(path)`, `getGamesStore()`; `slugify(s)`, `resolveInside(destDir,name)`, `safeExtractZip(buffer,destDir)`.

- [ ] **Step 1: Add dep** — `npm install adm-zip && npm install -D @types/adm-zip` (pure-JS; no native build). If install fails, report BLOCKED.

- [ ] **Step 2: Write failing tests**

`src/lib/games-db.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createGamesStore } from "./games-db";

describe("games store", () => {
  it("inserts, lists published, gets, and removes", () => {
    const s = createGamesStore(":memory:");
    expect(s.listPublished()).toEqual([]);
    s.insert({ id: "1", slug: "a", title: "A", author: "x", cover: null, status: "published", created_at: "2026-06-24T00:00:00Z" });
    expect(s.exists("a")).toBe(true);
    expect(s.get("a")?.title).toBe("A");
    expect(s.listPublished()).toHaveLength(1);
    s.remove("a");
    expect(s.exists("a")).toBe(false);
  });
});
```

`src/lib/game-upload.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { slugify, resolveInside } from "./game-upload";

describe("slugify", () => {
  it("strips Vietnamese diacritics to ascii dashes", () => {
    expect(slugify("Trò Chơi Đố Vui!")).toBe("tro-choi-do-vui");
  });
  it("falls back to 'game' for empty", () => {
    expect(slugify("  ***  ")).toBe("game");
  });
});

describe("resolveInside (path-traversal guard)", () => {
  it("allows paths inside destDir", () => {
    expect(resolveInside("/games/x", "Build/a.data")).toBe("/games/x/Build/a.data");
  });
  it("rejects traversal and absolute paths", () => {
    expect(resolveInside("/games/x", "../evil.txt")).toBeNull();
    expect(resolveInside("/games/x", "/etc/passwd")).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests → FAIL** (`npx vitest run src/lib/games-db.test.ts src/lib/game-upload.test.ts`) — modules missing.

- [ ] **Step 4: Implement `src/lib/games-db.ts`**
```ts
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface DbGame {
  id: string; slug: string; title: string; author: string;
  cover: string | null; status: string; created_at: string;
}

export interface GamesStore {
  listPublished(): DbGame[];
  get(slug: string): DbGame | undefined;
  exists(slug: string): boolean;
  insert(g: DbGame): void;
  remove(slug: string): void;
}

export function createGamesStore(dbPath: string): GamesStore {
  const db = new Database(dbPath);
  if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");
  db.exec(
    `CREATE TABLE IF NOT EXISTS games (
       id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
       author TEXT NOT NULL, cover TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL
     )`,
  );
  return {
    listPublished: () =>
      db.prepare("SELECT * FROM games WHERE status = 'published' ORDER BY created_at DESC").all() as DbGame[],
    get: (slug) => db.prepare("SELECT * FROM games WHERE slug = ?").get(slug) as DbGame | undefined,
    exists: (slug) => !!db.prepare("SELECT 1 FROM games WHERE slug = ?").get(slug),
    insert: (g) =>
      void db
        .prepare(
          `INSERT INTO games (id, slug, title, author, cover, status, created_at)
           VALUES (@id, @slug, @title, @author, @cover, @status, @created_at)`,
        )
        .run(g),
    remove: (slug) => void db.prepare("DELETE FROM games WHERE slug = ?").run(slug),
  };
}

let _store: GamesStore | null = null;
export function getGamesStore(): GamesStore {
  if (!_store) {
    const path = process.env.GAMES_DB || "./data/games.db";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    _store = createGamesStore(path);
  }
  return _store;
}
```

- [ ] **Step 5: Implement `src/lib/game-upload.ts`**
```ts
import AdmZip from "adm-zip";
import { resolve, sep, dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

/** ASCII slug from a (possibly Vietnamese) title. */
export function slugify(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "game";
}

/** Resolve `name` under `destDir`; return null if it escapes (path traversal / absolute). */
export function resolveInside(destDir: string, name: string): string | null {
  const root = resolve(destDir);
  const target = resolve(root, name);
  if (target === root || target.startsWith(root + sep)) return target;
  return null;
}

/**
 * Extract a WebGL build ZIP into destDir. Locates the directory containing
 * index.html (flattening a single wrapper folder) and writes its contents,
 * rejecting any entry that escapes destDir.
 */
export function safeExtractZip(buffer: Buffer, destDir: string): { ok: boolean; error?: string } {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return { ok: false, error: "invalid-zip" };
  }
  const entries = zip.getEntries();
  const indexes = entries.filter(
    (e) => !e.isDirectory && e.entryName.split("/").pop()?.toLowerCase() === "index.html",
  );
  if (indexes.length === 0) return { ok: false, error: "no-index" };
  indexes.sort((a, b) => a.entryName.split("/").length - b.entryName.split("/").length);
  const prefix = indexes[0].entryName.replace(/index\.html$/i, ""); // "MyGame/" or ""

  for (const e of entries) {
    if (e.isDirectory) continue;
    let name = e.entryName;
    if (prefix) {
      if (!name.startsWith(prefix)) continue; // outside the build root
      name = name.slice(prefix.length);
    }
    if (!name) continue;
    const target = resolveInside(destDir, name);
    if (!target) return { ok: false, error: "unsafe-path" };
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, e.getData());
  }
  return { ok: true };
}
```

- [ ] **Step 6: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/games-db.ts src/lib/games-db.test.ts src/lib/game-upload.ts src/lib/game-upload.test.ts`.

- [ ] **Step 7: Commit**
```bash
git add src/lib/games-db.ts src/lib/games-db.test.ts src/lib/game-upload.ts src/lib/game-upload.test.ts package.json package-lock.json
git commit -m "feat(gamehub): SQLite games store + slugify + path-safe zip extract

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Catalog + prop-driven hub/play refactor

**Files:** Create `src/lib/game-catalog.ts`; Modify `GameHubView.tsx`, `GamePlayView.tsx`, `GameEmbed.tsx`, `GameCover.tsx`, `games/page.tsx`, `games/[slug]/page.tsx`

**Interfaces consumed:** `getGamesStore` (Task 1), `getGames` (static). **Produced:** `CatalogGame`, `getCatalog()`, `getCatalogGame(slug)`.

- [ ] **Step 1: Create `src/lib/game-catalog.ts`** (server-only — reads the DB)
```ts
import "server-only";
import type { Localized } from "@/content/types";
import { getGames } from "@/content/games";
import { getGamesStore } from "@/lib/games-db";

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
}

export function getCatalog(): CatalogGame[] {
  const lab: CatalogGame[] = getGames().map((g) => ({
    id: g.id, slug: g.slug, title: g.title, author: g.author, year: g.year,
    cover: g.cover, tags: g.tags, blurb: g.blurb,
    source: "lab", embedUrl: g.embedPath, sandboxed: false,
  }));
  const user: CatalogGame[] = getGamesStore().listPublished().map((g) => ({
    id: g.id, slug: g.slug, title: g.title, author: g.author,
    year: g.created_at ? new Date(g.created_at).getFullYear() : undefined,
    cover: g.cover ?? undefined, tags: ["Unity", "WebGL"],
    source: "user", embedUrl: `${GAMES_ORIGIN}/${g.slug}/index.html`, sandboxed: true,
  }));
  return [...lab, ...user];
}

export function getCatalogGame(slug: string): CatalogGame | undefined {
  return getCatalog().find((g) => g.slug === slug);
}
```

- [ ] **Step 2: `GameEmbed.tsx`** — add `sandboxed` prop; pick attrs accordingly. Change the signature + the `<iframe sandbox=...>`:
```tsx
export default function GameEmbed({ src, title, sandboxed = false }: { src: string; title: string; sandboxed?: boolean }) {
```
and the iframe's `sandbox`:
```tsx
        sandbox={sandboxed ? "allow-scripts allow-pointer-lock allow-popups" : "allow-scripts allow-same-origin allow-pointer-lock allow-popups"}
```
(leave `allow`, `allowFullScreen`, the fullscreen button, and the rest unchanged.)

- [ ] **Step 3: `GameCover.tsx`** — widen the prop type so it accepts catalog items. Change `game: Game` (or whatever it is) to a minimal shape:
```tsx
export default function GameCover({ game }: { game: { title: string; cover?: string } }) {
```
(keep the body — it uses `game.cover` and `game.title`.)

- [ ] **Step 4: `GameHubView.tsx`** — take a `games` prop; drop the `getGames` import; year optional:
```tsx
"use client";
import Link from "next/link";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import GameCover from "@/components/games/GameCover";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import AmbientField from "@/components/fx/AmbientField";

export default function GameHubView({ games }: { games: CatalogGame[] }) {
  const { t } = useLocale();
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
                <p className="mt-1 text-sm text-ink-2">
                  {t(ui.games.by)} {g.author}{g.year ? ` · ${g.year}` : ""}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
```

- [ ] **Step 5: `GamePlayView.tsx`** — take `CatalogGame`; use `embedUrl`+`sandboxed`; year optional:
```tsx
"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/locale";
import type { CatalogGame } from "@/lib/game-catalog";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Tag from "@/components/ui/Tag";
import GameEmbed from "@/components/games/GameEmbed";

export default function GamePlayView({ game }: { game: CatalogGame }) {
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
            <GameEmbed src={game.embedUrl} title={game.title} sandboxed={game.sandboxed} />
            <p className="mt-3 text-xs text-dim">{t(ui.games.heavyNote)}</p>
          </div>
          <aside>
            <h1 className="text-section text-ink">{game.title}</h1>
            <p className="mt-1 text-sm text-dim">{t(ui.games.by)} {game.author}{game.year ? ` · ${game.year}` : ""}</p>
            {game.blurb && <p className="mt-4 text-base leading-relaxed text-ink-2">{t(game.blurb)}</p>}
            {game.tags && game.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">{game.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
            )}
            <p className="mt-5 text-sm text-ink-2">{t(ui.games.fullscreenHint)}</p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 6: `src/app/games/page.tsx`** — read the catalog server-side, pass it down:
```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GameHubView from "@/components/games/GameHubView";
import { getCatalog } from "@/lib/game-catalog";

export const metadata: Metadata = { title: "Game Hub" };
export const dynamic = "force-dynamic"; // catalog includes DB rows

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main><GameHubView games={getCatalog()} /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 7: `src/app/games/[slug]/page.tsx`** — resolve from the catalog; allow dynamic slugs:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GamePlayView from "@/components/games/GamePlayView";
import { getGames } from "@/content/games";
import { getCatalogGame } from "@/lib/game-catalog";

export const dynamicParams = true;
export function generateStaticParams() {
  return getGames().map((g) => ({ slug: g.slug })); // pre-render lab games; user games render on demand
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getCatalogGame(slug);
  return { title: g ? g.title : "Không tìm thấy" };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getCatalogGame(slug);
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

- [ ] **Step 8: Verify (no regression for the lab game)** — `npx tsc --noEmit && npm run build && npx eslint src/lib/game-catalog.ts src/components/games/GameHubView.tsx src/components/games/GamePlayView.tsx src/components/games/GameEmbed.tsx src/components/games/GameCover.tsx src/app/games/page.tsx "src/app/games/[slug]/page.tsx"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - `/games` → 200; lists tyrp: `curl -s http://localhost:3001/games | grep -c "To Your Right Places"` → ≥1.
  - `/games/tyrp` → 200; same-origin embed unchanged: `curl -s http://localhost:3001/games/tyrp | grep -c "/games/tyrp/index.html"` → ≥1.

- [ ] **Step 9: Commit**
```bash
git add src/lib/game-catalog.ts src/components/games/GameHubView.tsx src/components/games/GamePlayView.tsx src/components/games/GameEmbed.tsx src/components/games/GameCover.tsx src/app/games/page.tsx "src/app/games/[slug]/page.tsx"
git commit -m "refactor(gamehub): unified catalog (lab + DB) feeds hub/play; sandboxed embed flag

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Admin upload + delete API route

**Files:** Create `src/app/api/admin/games/route.ts`; Modify `.env.example`

**Interfaces consumed:** `auth` (`@/auth`), `getGamesStore`, `slugify`/`safeExtractZip` (Task 1).

- [ ] **Step 1: Implement the route**
```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import { slugify, safeExtractZip } from "@/lib/game-upload";

export const runtime = "nodejs";

const STORAGE = process.env.GAMES_STORAGE_DIR || "/home/namnx/ctslab-games";
const MAX_MB = parseInt(process.env.GAMES_MAX_UPLOAD_MB || "100", 10) || 100;

async function requireAdmin() {
  const session = await auth();
  return session?.user && (session as { isAdmin?: boolean }).isAdmin ? session : null;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  const file = form.get("file");
  const rawSlug = String(form.get("slug") || "").trim();
  if (!title || !author || !(file instanceof File)) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const store = getGamesStore();
  const base = slugify(rawSlug || title);
  let slug = base;
  for (let i = 2; store.exists(slug); i++) slug = `${base}-${i}`;

  const dest = resolve(STORAGE, slug);
  if (!dest.startsWith(resolve(STORAGE))) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = safeExtractZip(buffer, dest);
  if (!res.ok) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  store.insert({
    id: randomUUID(), slug, title, author, cover: null,
    status: "published", created_at: new Date().toISOString(),
  });
  return NextResponse.json({ slug }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "bad" }, { status: 400 });
  const dest = resolve(STORAGE, slug);
  if (dest.startsWith(resolve(STORAGE)) && dest !== resolve(STORAGE)) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
  }
  getGamesStore().remove(slug);
  return NextResponse.json({ ok: true });
}
```
(Cover upload is deferred to keep the route lean — `cover: null` for now; a follow-up can add it. The spec's optional cover lands when the manager sends a `cover` file; wiring it is non-blocking and can be a Task-5 polish if time permits.)

- [ ] **Step 2: `.env.example`** — append (names/defaults, no secrets):
```
# Game Hub slice 2a — user games (real paths can stay in .env.local)
GAMES_ORIGIN=https://games.ctslab.net
GAMES_STORAGE_DIR=/home/namnx/ctslab-games
GAMES_DB=./data/games.db
GAMES_MAX_UPLOAD_MB=100
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run build && npx eslint "src/app/api/admin/games/route.ts"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - Unauth POST gated: `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/admin/games` → `403`.
  - Unauth DELETE gated: `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE "http://localhost:3001/api/admin/games?slug=x"` → `403`.

- [ ] **Step 4: Commit**
```bash
git add "src/app/api/admin/games/route.ts" .env.example
git commit -m "feat(gamehub): admin upload + delete API (path-safe extract, isAdmin-gated)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Admin UI (/admin/games)

**Files:** Create `src/app/admin/games/page.tsx`, `src/components/admin/GameUploadManager.tsx`

- [ ] **Step 1: Server page** `src/app/admin/games/page.tsx` (admin-gated by `proxy.ts`; re-check defensively)
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { getCatalog } from "@/lib/game-catalog";
import GameUploadManager from "@/components/admin/GameUploadManager";

export const metadata: Metadata = { title: "Quản lý Game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const session = await auth();
  if (!session?.user || !(session as { isAdmin?: boolean }).isAdmin) redirect("/");
  const games = getCatalog().filter((g) => g.source === "user");
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <h1 className="text-section text-ink">Quản lý Game</h1>
          <p className="mt-2 text-sm text-ink-2">Tải lên bản build WebGL (.zip có index.html). Game phục vụ từ origin tách biệt.</p>
          <GameUploadManager games={games.map((g) => ({ slug: g.slug, title: g.title, author: g.author }))} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Client manager** `src/components/admin/GameUploadManager.tsx`
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";

type Item = { slug: string; title: string; author: string };

export default function GameUploadManager({ games }: { games: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/games", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`✅ Đã đăng game: ${data.slug}`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setMsg(`❌ Lỗi: ${data.error ?? res.status}`);
      }
    } catch {
      setMsg("❌ Lỗi mạng");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(slug: string) {
    if (!confirm(`Xoá game "${slug}"?`)) return;
    await fetch(`/api/admin/games?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <h2 className="text-display text-lg text-ink">Tải game lên</h2>
        <div className="mt-4 space-y-3">
          <input name="title" required placeholder="Tên game" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="author" required placeholder="Tác giả" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="slug" placeholder="Slug (tùy chọn)" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="file" type="file" accept=".zip" required className="w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-blue file:px-4 file:py-2 file:text-white" />
        </div>
        <button type="submit" disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Upload size={16} /> {busy ? "Đang tải…" : "Đăng game"}
        </button>
        {msg && <p className="mt-3 text-sm text-ink-2">{msg}</p>}
      </form>

      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <h2 className="text-display text-lg text-ink">Game đã đăng ({games.length})</h2>
        <ul className="mt-4 space-y-2">
          {games.length === 0 && <li className="text-sm text-dim">Chưa có game nào.</li>}
          {games.map((g) => (
            <li key={g.slug} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
              <span className="text-sm text-ink">{g.title} <span className="text-dim">· {g.author}</span></span>
              <button type="button" onClick={() => onDelete(g.slug)} aria-label={`Xoá ${g.title}`} className="text-dim transition-colors hover:text-red">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/app/admin/games/page.tsx src/components/admin/GameUploadManager.tsx`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`: unauth `/admin/games` redirects (not 200 content): `curl -s -o /dev/null -w "%{http_code}\n" -L http://localhost:3001/admin/games` → `200` (redirected to home) and `curl -s http://localhost:3001/admin/games | grep -c "Quản lý Game"` → `0` when unauthenticated (proxy/redirect). Confirm the build lists `/admin/games`.

- [ ] **Step 4: Commit**
```bash
git add src/app/admin/games/page.tsx src/components/admin/GameUploadManager.tsx
git commit -m "feat(gamehub): admin games manager UI (upload form + delete list)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Audit + deploy

**Files:** Modify any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite** — `npx tsc --noEmit && npx eslint src && npx vitest run` (all clean; vitest incl. games-db + game-upload tests; no stray `eslint-disable`).

- [ ] **Step 2: Security audit (code level):**
  - Path-traversal guard active: `game-upload.ts` `resolveInside` returns null for escaping paths and `safeExtractZip` aborts on it (tests cover this).
  - Untrusted serving: user-game catalog entries have `sandboxed:true` + `embedUrl` on `GAMES_ORIGIN`; `GameEmbed` omits `allow-same-origin` when `sandboxed`. `grep -n "allow-same-origin" src/components/games/GameEmbed.tsx` → only in the non-sandboxed branch.
  - Admin gating: `grep -rn "isAdmin" src/app/api/admin/games/route.ts src/app/admin/games/page.tsx` → both gate; unauth POST/DELETE → 403; `/admin/games` redirects unauth.
  - No secrets in `.env.example` (paths only); `*.db` git-ignored; `data/` + `GAMES_STORAGE_DIR` not committed.
- [ ] **Step 3: Behaviour audit:** lab tyrp unchanged (same-origin); hub merges lab + user; reflow OK at 375px.
- [ ] **Step 4: Production build + deploy** — `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/tyrp`, `/api/admin/games` (POST unauth → 403). Confirm `games-sandbox` (pm2) still serving `https://games.ctslab.net/_test/` → 200.
- [ ] **Step 5: Final commit (only if fixes were made).** If none, report.

> **USER manual test (admin):** sign in as an admin → open `/admin/games` → upload a small WebGL `.zip` (with index.html) → confirm: it appears in `/games`, the play page embeds it from `games.ctslab.net/<slug>/index.html` and plays, and delete removes it. (Files land in `GAMES_STORAGE_DIR/<slug>/`, served by the `games-sandbox` pm2 server.)

---

## Self-Review (completed during planning)

**Spec coverage:** §4.2 DB → Task 1. §4.3 catalog → Task 2. §4.4 slug/zip helpers → Task 1. §4.5 upload/delete route → Task 3. §4.6 admin UI → Task 4. §4.7 hub/play/embed integration → Task 2. §4.1 env → Task 1/3. §5 security/quality → Tasks 1–4 + Task 5 audit. §7 testing → Task 1 (units) + Task 5 + user check.

**Placeholder scan:** complete code each step. Cover-image upload is explicitly deferred (DB column exists, `cover:null`) — a stated scope trim, not a placeholder.

**Type consistency:** `DbGame`/`GamesStore` (Task 1) → consumed by `game-catalog.ts` (Task 2) + route (Task 3). `CatalogGame` (Task 2) → `GameHubView`/`GamePlayView` props + pages. `GameEmbed({src,title,sandboxed})` matches the Task-5 call. `slugify`/`safeExtractZip`/`resolveInside` (Task 1) → route (Task 3).

**Note:** `getCatalog()`/`getGamesStore()` are server-only (better-sqlite3) — only ever called in server components/route handlers (`games/page.tsx`, `[slug]/page.tsx`, `admin/games/page.tsx`, the API route), never in a client component. `import "server-only"` in `game-catalog.ts` enforces this at build time.
