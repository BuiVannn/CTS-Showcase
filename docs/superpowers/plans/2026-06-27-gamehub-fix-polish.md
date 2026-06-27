# GameHub Fix + Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the GameHub bugs from user testing (detail 404, case-sensitive filter, cover/next-image, can't preview unpublished) and polish the Studio UX (nav, always-visible action bar, dashboard, delete errors) + quota split.

**Architecture:** Mostly surgical fixes to existing files — make the detail page `force-dynamic` + owner-preview-aware; make the filter case-insensitive; remove the cover URL field; move the form's save actions into a persistent bottom bar; polish the dashboard + add studio navigation; split the create quota.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Vitest, lucide-react. Reuses `Breadcrumb`, `Badge`, `EmptyState`, `GameDetailView`, `mapUserGame`, `getGamesStore`.

## Global Constraints

- **Cover deferred to D:** remove the cover URL input; keep `cover` in form state untouched (so editing preserves an existing cover) — no `next/image` external URLs are introduced.
- **Owner preview:** the detail page shows a game to the public only when `published`; the **owner or admin** may view their own game at any status, with a "Chưa công khai" banner.
- **Case-insensitive filtering:** matching + facet dedup compare lowercased; facets keep a canonical (first-seen) display value.
- **Quota split:** total limit blocks any create; pending limit blocks only `status==="pending"` (so drafts can be saved at the pending cap, under the total cap).
- Bilingual where chrome exists; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect`. `@/*`→`src/*`.
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build`; tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Modify:** `src/lib/game-filter.ts` (+test), `src/app/games/[slug]/page.tsx`, `src/components/games/GameDetailView.tsx`, `src/components/games/studio/GameForm.tsx`, `src/components/games/studio/StudioDashboard.tsx`, `src/app/games/studio/page.tsx`, `src/app/games/studio/new/page.tsx`, `src/app/games/studio/[slug]/edit/page.tsx`, `src/app/api/games/studio/route.ts`, `src/content/ui.ts`

---

## Task 1: Case-insensitive filter + wider search

**Files:** Modify `src/lib/game-filter.ts`, `src/lib/game-filter.test.ts`

- [ ] **Step 1: Add failing tests** — append to `src/lib/game-filter.test.ts`:
```ts
describe("filterGames — case-insensitive (fix)", () => {
  const mixed: CatalogGame[] = [
    g({ slug: "a", title: "Alpha", classification: "Game", genre: "Puzzle", tags: ["WebGL", "Unity"] }),
    g({ slug: "b", title: "Beta", classification: "game", genre: "puzzle", tags: ["webgl"] }),
  ];
  it("matches tag/classification/genre regardless of case", () => {
    expect(filterGames(mixed, { ...EMPTY_FILTER, tag: "webgl" }).map((x) => x.slug)).toEqual(["a", "b"]);
    expect(filterGames(mixed, { ...EMPTY_FILTER, classification: "GAME" }).map((x) => x.slug)).toEqual(["a", "b"]);
    expect(filterGames(mixed, { ...EMPTY_FILTER, genre: "PUZZLE" }).map((x) => x.slug)).toEqual(["a", "b"]);
  });
  it("search also matches genre + tags", () => {
    expect(filterGames(mixed, { ...EMPTY_FILTER, query: "unity" }).map((x) => x.slug)).toEqual(["a"]);
  });
});
describe("deriveFacets — collapses case (fix)", () => {
  it("dedups WebGL/webgl to one facet", () => {
    const f = deriveFacets([
      g({ slug: "a", tags: ["WebGL"], classification: "Game" }),
      g({ slug: "b", tags: ["webgl"], classification: "game" }),
    ]);
    expect(f.tags).toHaveLength(1);
    expect(f.classifications).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/lib/game-filter.test.ts`).

- [ ] **Step 3: Implement** — replace `filterGames` + `deriveFacets` in `src/lib/game-filter.ts`:
```ts
export function filterGames(games: CatalogGame[], f: GameFilterState): CatalogGame[] {
  const q = f.query.trim().toLowerCase();
  const cls = f.classification?.toLowerCase() ?? null;
  const gen = f.genre?.toLowerCase() ?? null;
  const tg = f.tag?.toLowerCase() ?? null;
  return games.filter((g) => {
    if (q) {
      const hay = `${g.title} ${g.tagline ?? ""} ${g.author} ${g.genre ?? ""} ${(g.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (cls && (g.classification ?? "").toLowerCase() !== cls) return false;
    if (gen && (g.genre ?? "").toLowerCase() !== gen) return false;
    if (tg && !(g.tags ?? []).some((t) => t.toLowerCase() === tg)) return false;
    return true;
  });
}

export function deriveFacets(games: CatalogGame[]): { classifications: string[]; genres: string[]; tags: string[] } {
  const dedup = (vals: string[]) => {
    const seen = new Map<string, string>(); // lowercased key → first-seen display value
    for (const v of vals) {
      const k = v.toLowerCase();
      if (!seen.has(k)) seen.set(k, v);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  };
  const classifications: string[] = [];
  const genres: string[] = [];
  const tags: string[] = [];
  for (const g of games) {
    if (g.classification) classifications.push(g.classification);
    if (g.genre) genres.push(g.genre);
    for (const t of g.tags ?? []) if (t) tags.push(t);
  }
  return { classifications: dedup(classifications), genres: dedup(genres), tags: dedup(tags) };
}
```
(The pill values passed in `GameFilterState` are the canonical facet strings; matching lowercases both sides, so a "WebGL" pill matches "webgl"-tagged games.)

- [ ] **Step 4: Run → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/game-filter.ts src/lib/game-filter.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/lib/game-filter.ts src/lib/game-filter.test.ts
git commit -m "fix(gamehub): case-insensitive filter + facet dedup + wider search

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Detail page force-dynamic + owner preview + banner

**Files:** Modify `src/app/games/[slug]/page.tsx`, `src/components/games/GameDetailView.tsx`, `src/content/ui.ts`

- [ ] **Step 1: Add a banner string** to the `games` block in `src/content/ui.ts`:
```ts
    notPublic: { en: "Not public yet — only you can see this.", vi: "Chưa công khai — chỉ bạn xem được." } as Localized,
```

- [ ] **Step 2: `GameDetailView` banner prop** — in `src/components/games/GameDetailView.tsx`, change the signature to accept `notPublic` and render a banner at the very top of the returned fragment:
```tsx
export default function GameDetailView({ game, notPublic = false }: { game: CatalogGame; notPublic?: boolean }) {
```
Then immediately inside the returned `<>` (before the first `<section>`), add:
```tsx
      {notPublic && (
        <div className="bg-red-soft px-4 py-2 text-center text-sm font-medium text-red" style={{ background: "var(--red-soft)" }}>
          {t(ui.games.notPublic)}
        </div>
      )}
```
(`t` and `ui` are already imported in this component.)

- [ ] **Step 3: Rewrite `src/app/games/[slug]/page.tsx`** — force-dynamic + owner-preview resolution:
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GameDetailView from "@/components/games/GameDetailView";
import { getCatalogGame } from "@/lib/game-catalog";
import { getGamesStore } from "@/lib/games-db";
import { mapUserGame } from "@/lib/game-catalog-map";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function resolve(slug: string): Promise<{ game: import("@/lib/game-catalog-map").CatalogGame; notPublic: boolean } | null> {
  const pub = getCatalogGame(slug);
  if (pub) return { game: pub, notPublic: false };
  const db = getGamesStore().get(slug);
  if (!db) return null;
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  const isAdmin = (session as { isAdmin?: boolean } | null)?.isAdmin === true;
  if (uid && (db.owner_id === uid || isAdmin)) return { game: mapUserGame(db), notPublic: true };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  return { title: r ? r.game.title : "Không tìm thấy" };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  return (
    <>
      <Navbar />
      <main><GameDetailView game={r.game} notPublic={r.notPublic} /></main>
      <Footer />
    </>
  );
}
```
(Drops `generateStaticParams`/`dynamicParams` — moot under `force-dynamic`.)

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run build && npx eslint "src/app/games/[slug]/page.tsx" src/components/games/GameDetailView.tsx src/content/ui.ts`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - A published user game now opens: find a published user slug `SLUG=$(node -e "const D=require('better-sqlite3');try{const db=new D('data/games.db');const r=db.prepare(\"SELECT slug FROM games WHERE status='published' LIMIT 1\").get();console.log(r?.slug||'')}catch(e){console.log('')}")` → `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games/$SLUG` → `200` (no longer 404).
  - An anonymous request for a draft/pending slug still 404s (no session → not owner).

- [ ] **Step 5: Commit**
```bash
git add "src/app/games/[slug]/page.tsx" src/components/games/GameDetailView.tsx src/content/ui.ts
git commit -m "fix(gamehub): detail page force-dynamic + owner preview of unpublished games

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: GameForm — remove cover + persistent action bar + tab polish

**Files:** Modify `src/components/games/studio/GameForm.tsx`

- [ ] **Step 1: Remove the cover input** — in `src/components/games/studio/GameForm.tsx`, delete the cover `<label>…<input … value={data.cover} …/></label>` block from tab 0 (the "Cơ bản" panel). Leave `cover` in `GameFormData`/`EMPTY_FORM` and in `data` (so editing preserves an existing cover; it's just not user-editable now).

- [ ] **Step 2: Move the save actions into a persistent bottom bar** — remove the action buttons from the `{tab === 4 && (…)}` panel (tab 4 now shows only a short explanation), and render the actions in an always-visible bar **after** the tab panels block. Replace the tab-4 panel + add the bar:
```tsx
        {tab === 4 && (
          <p className="text-sm text-ink-2">
            {showDraftSubmit
              ? "“Lưu nháp” lưu lại nhưng chưa gửi duyệt. “Gửi duyệt” gửi cho quản trị viên xem xét."
              : "“Lưu thay đổi” cập nhật ngay. Tải build mới sẽ đưa game đã đăng về chờ duyệt lại."}
          </p>
        )}
      </div>

      {/* Persistent action bar — visible on every tab */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {showDraftSubmit ? (
          <>
            <button type="button" disabled={busy} onClick={() => save("draft")} className="rounded-[var(--radius-pill)] border border-border px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">{t(ui.studio.saveDraft)}</button>
            <button type="button" disabled={busy} onClick={() => save("pending")} className="rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t(ui.studio.submitReview)}</button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => save("keep")} className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t(ui.studio.saveChanges)}</button>
        )}
        {msg && <p className="text-sm text-ink-2">{msg}</p>}
      </div>
```
(Remove the old `{msg && …}` line that was inside the tab block, since `msg` now shows in the bar. Keep the validation that jumps to the offending tab.)

- [ ] **Step 3: Polish the tab strip** — make the tab buttons scroll horizontally on mobile + clearer active state. Replace the tab-strip wrapper `<div className="flex flex-wrap gap-2 border-b border-border">` with:
```tsx
      <div className="flex gap-1 overflow-x-auto border-b border-border">
```
(keeps the existing per-tab button markup; `overflow-x-auto` lets the 5 tabs scroll on narrow screens instead of wrapping awkwardly.)

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/components/games/studio/GameForm.tsx`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games` → `200`.

- [ ] **Step 5: Commit**
```bash
git add src/components/games/studio/GameForm.tsx
git commit -m "fix(gamehub): remove cover URL field; persistent save bar on every tab; scrollable tabs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: StudioDashboard polish + delete errors + studio navigation

**Files:** Modify `src/components/games/studio/StudioDashboard.tsx`, `src/app/games/studio/page.tsx`, `src/app/games/studio/new/page.tsx`, `src/app/games/studio/[slug]/edit/page.tsx`

- [ ] **Step 1: Dashboard — coloured badges, empty state, delete error** — rewrite `src/components/games/studio/StudioDashboard.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

type Item = { slug: string; title: string; status: string };
const STATUS_VI: Record<string, string> = { draft: "Nháp", pending: "Chờ duyệt", published: "Đã đăng", rejected: "Bị từ chối" };
const STATUS_TONE: Record<string, "red" | "blue" | "neutral"> = { draft: "neutral", pending: "neutral", published: "blue", rejected: "red" };

export default function StudioDashboard({ games }: { games: Item[] }) {
  const { t } = useLocale();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onDelete(slug: string) {
    if (!confirm(t(ui.studio.confirmDelete))) return;
    setErr(null);
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setErr("❌ Xoá không thành công.");
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-lg text-ink">{t(ui.studio.myGames)} ({games.length})</h2>
        <Link href="/games/studio/new" className="rounded-[var(--radius-pill)] bg-red px-4 py-2 text-sm font-semibold text-white">{t(ui.studio.newGame)}</Link>
      </div>
      {err && <p className="mt-3 text-sm text-red">{err}</p>}
      {games.length === 0 ? (
        <div className="mt-8"><EmptyState title={t(ui.studio.empty)} icon={<Gamepad2 size={28} aria-hidden />}>
          <Link href="/games/studio/new" className="text-sm text-blue hover:underline">{t(ui.studio.newGame)}</Link>
        </EmptyState></div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {games.map((g) => (
            <li key={g.slug} className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-display text-base text-ink">{g.title}</h3>
                <Badge tone={STATUS_TONE[g.status] ?? "neutral"}>{STATUS_VI[g.status] ?? g.status}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <Link href={`/games/${g.slug}`} className="inline-flex items-center gap-1 text-ink-2 hover:text-blue"><Eye size={14} /> {t(ui.studio.preview)}</Link>
                <Link href={`/games/studio/${g.slug}/edit`} className="inline-flex items-center gap-1 text-ink-2 hover:text-blue"><Pencil size={14} /> {t(ui.studio.edit)}</Link>
                <button type="button" onClick={() => onDelete(g.slug)} className="ml-auto inline-flex items-center gap-1 text-dim hover:text-red"><Trash2 size={14} /> {t(ui.studio.del)}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Studio dashboard nav** — in `src/app/games/studio/page.tsx`, add a breadcrumb + back link above the `<h1>` (in the signed-in branch's `<Container>`), importing `Breadcrumb`:
```tsx
import Breadcrumb from "@/components/ui/Breadcrumb";
// ...inside the signed-in <Container>, before <h1>:
          <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: "Games", href: "/games" }, { label: "Studio" }]} />
```
(Place it right after the opening `<Container>`; keep the existing `<h1>Game Studio</h1>` below it.)

- [ ] **Step 3: New + Edit page nav** — in `src/app/games/studio/new/page.tsx` and `src/app/games/studio/[slug]/edit/page.tsx`, add the same `Breadcrumb` import + a breadcrumb above the `<h1>` inside the `<Container>`:
  - new: items `[{label:"CTS Lab",href:"/"},{label:"Games",href:"/games"},{label:"Studio",href:"/games/studio"},{label:"Tạo mới"}]`.
  - edit: items `[…,{label:"Studio",href:"/games/studio"},{label:"Sửa"}]`.

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/components/games/studio/StudioDashboard.tsx src/app/games/studio/page.tsx src/app/games/studio/new/page.tsx "src/app/games/studio/[slug]/edit/page.tsx"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`: `/games/studio` → 200; breadcrumb present `curl -s http://localhost:3001/games/studio | grep -c "Game Hub\|Games"` (note: unauth shows sign-in — check the build lists the routes; the breadcrumb shows for signed-in users).

- [ ] **Step 5: Commit**
```bash
git add src/components/games/studio/StudioDashboard.tsx src/app/games/studio/page.tsx src/app/games/studio/new/page.tsx "src/app/games/studio/[slug]/edit/page.tsx"
git commit -m "fix(gamehub): studio dashboard cards + status tones + delete error + breadcrumb nav

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Quota split + audit + deploy

**Files:** Modify `src/app/api/games/studio/route.ts`; then audit + deploy

- [ ] **Step 1: Split the quota** — in `src/app/api/games/studio/route.ts`, replace the single quota check (the `if (store.countByOwner(...) >= MAX_PENDING || ... >= MAX_TOTAL)` block) so the pending cap only blocks submissions, after `status` is known. Move the check to after `status` is parsed:
```ts
  // (after `const status = ... ? "draft" : "pending";`)
  if (store.countByOwner(ownerId) >= MAX_TOTAL) {
    return NextResponse.json({ error: "quota" }, { status: 429 });
  }
  if (status === "pending" && store.countByOwner(ownerId, "pending") >= MAX_PENDING) {
    return NextResponse.json({ error: "quota" }, { status: 429 });
  }
```
(Remove the old combined check that ran before parsing. Keep the auth check first; the quota now runs after parsing title/status — still before the file extraction, so no wasted extraction.)

- [ ] **Step 2: Full suite** — `npx tsc --noEmit && npx eslint src && npx vitest run` (all clean; incl. game-filter + game-status tests; no stray `eslint-disable`).

- [ ] **Step 3: Behaviour/regression audit (code level):**
  - Detail page is `force-dynamic` + owner-preview; filter case-insensitive (greps); cover input removed from GameForm; action bar outside the tab panels; dashboard delete checks `res.ok`.
  - No regression: lab `tyrp` still plays; the hub still lists + filters; admin moderation (`/admin/games`) unchanged.
- [ ] **Step 4: Deploy** — `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/studio`, `/games/studio/new`, `/games/<published-user-slug>` (now 200) → all `200`; `/games/tyrp` still plays; unauth `POST /api/games/studio` → 401.
- [ ] **Step 5: Commit (if fixes) + report.**
```bash
git add "src/app/api/games/studio/route.ts"
git commit -m "fix(gamehub): quota split — pending cap blocks submit only, total cap blocks create

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> **USER check:** create a game in Studio → **Xem thử** shows it before approval (with the "Chưa công khai" banner); admin approves → `/games/<slug>` opens (no 404); hub filters work across mixed-case tags; the form saves from any tab via the bottom bar; studio pages have a breadcrumb back to Games/Hub; deleting a game you don't own is blocked. A creator at the pending cap can still save a draft.

---

## Self-Review (completed during planning)

**Spec coverage:** §3.1 detail force-dynamic → Task 2. §3.2 case-insensitive filter → Task 1. §3.3 remove cover → Task 3. §3.4 owner preview + banner → Task 2. §4.1 studio nav → Task 4. §4.2 action bar + tabs → Task 3. §4.3 dashboard polish + delete error → Task 4. §5.1 quota split → Task 5. §5.2 search scope → Task 1. §7 testing → Task 1 units + Task 5 + user check.

**Placeholder scan:** complete code each step. The tab-4 explanation strings are inline VI (a short helper sentence) — acceptable; the action labels use `ui.studio.*`.

**Type consistency:** `GameDetailView({game, notPublic?})` (Task 2) — the route passes both. `filterGames`/`deriveFacets` signatures unchanged (Task 1) — `GameFilters`/`GameHubView` consume them unchanged. `mapUserGame(DbGame): CatalogGame` (existing) used by the detail route (Task 2). `ui.games.notPublic` + the existing `ui.studio.*` keys are the only strings referenced.
```
