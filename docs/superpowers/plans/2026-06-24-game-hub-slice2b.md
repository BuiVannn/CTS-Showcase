# Game Hub Slice 2b — Student Submissions + Moderation + Security Shields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Any signed-in user submits a WebGL game → it sits `pending` until an admin approves (→ public) or rejects (→ deleted), guarded by zip-bomb limits, per-user quotas, and (infra) a CSP frame-ancestors lock.

**Architecture:** Extend the slice-2a games DB with `owner`+`status`, a moderation queue, a public submission route (auth, quota, decompression-limited extract → `pending`), admin approve/reject actions, and submission/moderation UIs. All limits are env vars.

**Tech Stack:** Next.js 16 (route handlers `runtime="nodejs"`, server+client components), Auth.js v5 (`auth()`, `isAdmin`), `better-sqlite3`, `adm-zip`, Tailwind v4, Vitest.

## Global Constraints

- **Limits are env-configurable** (no hardcoded thresholds) — see the env list below; defaults: 300 MB uncompressed / 2000 files / 100 MB per file / 3 pending / 10 total per user.
- **Server safety:** uploads never execute server-side; `safeExtractZip` rejects path traversal (2a) AND now zip bombs (pre-write size/count caps). Quotas + moderation bound disk/abuse.
- **Moderation gate:** submissions are `pending`; only `published` games appear in `getCatalog()`/hub. Reject deletes files (via the `resolveInside` guard).
- **Eligibility:** submit route requires `auth()` (any user); approve/reject/delete/direct-upload require `session.isAdmin`. Gates fail closed.
- Bilingual UI; existing tokens; SQLite behind the store seam; no `eslint-disable`; no `react-hooks/set-state-in-effect`. `@/*`→`src/*`.
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build`; tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`; never `.env.local`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

**Env (add to `.env.example`, Task 3):** `GAMES_MAX_UNCOMPRESSED_MB=300`, `GAMES_MAX_FILES=2000`, `GAMES_MAX_FILE_MB=100`, `GAMES_MAX_PENDING_PER_USER=3`, `GAMES_MAX_TOTAL_PER_USER=10` (plus the 2a vars).

---

## File Structure

**Create:** `src/app/api/games/submit/route.ts`, `src/app/games/submit/page.tsx`, `src/components/games/SubmitGameForm.tsx`
**Modify:** `src/lib/games-db.ts` (+test), `src/lib/game-upload.ts` (+test), `src/app/api/admin/games/route.ts` (insert owner + PATCH), `src/components/admin/GameUploadManager.tsx` (pending queue), `src/app/admin/games/page.tsx` (pass pending), `src/components/games/GameHubView.tsx` (submit link), `.env.example`

---

## Task 1: DB — owner + status + moderation accessors

**Files:** Modify `src/lib/games-db.ts`, `src/lib/games-db.test.ts`, `src/app/api/admin/games/route.ts`

**Interfaces produced:** `DbGame` gains `owner_id`/`owner_email`; `GamesStore` gains `listByStatus`, `listByOwner`, `countByOwner`, `setStatus`.

- [ ] **Step 1: Write failing tests** — append to `src/lib/games-db.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { createGamesStore } from "./games-db";

describe("games store — owner + status (slice 2b)", () => {
  function seed() {
    const s = createGamesStore(":memory:");
    const base = { author: "x", cover: null, created_at: "2026-06-24T00:00:00Z" };
    s.insert({ id: "1", slug: "a", title: "A", status: "pending", owner_id: "u1", owner_email: "u1@x", ...base });
    s.insert({ id: "2", slug: "b", title: "B", status: "published", owner_id: "u1", owner_email: "u1@x", ...base });
    s.insert({ id: "3", slug: "c", title: "C", status: "pending", owner_id: "u2", owner_email: "u2@x", ...base });
    return s;
  }
  it("lists by status", () => {
    expect(seed().listByStatus("pending").map((g) => g.slug).sort()).toEqual(["a", "c"]);
  });
  it("lists + counts by owner", () => {
    const s = seed();
    expect(s.listByOwner("u1").map((g) => g.slug).sort()).toEqual(["a", "b"]);
    expect(s.countByOwner("u1")).toBe(2);
    expect(s.countByOwner("u1", "pending")).toBe(1);
  });
  it("sets status", () => {
    const s = seed();
    s.setStatus("a", "published");
    expect(s.get("a")?.status).toBe("published");
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/lib/games-db.test.ts`): owner fields / new methods missing.

- [ ] **Step 3: Extend `src/lib/games-db.ts`.** Update `DbGame`:
```ts
export interface DbGame {
  id: string; slug: string; title: string; author: string;
  cover: string | null; status: string; created_at: string;
  owner_id: string | null; owner_email: string | null;
}
```
In `createGamesStore`, after the `CREATE TABLE IF NOT EXISTS`, add an idempotent migration + the new methods:
```ts
  // Idempotent migration for columns added after slice 2a.
  const cols = new Set((db.prepare("PRAGMA table_info(games)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("owner_id")) db.exec("ALTER TABLE games ADD COLUMN owner_id TEXT");
  if (!cols.has("owner_email")) db.exec("ALTER TABLE games ADD COLUMN owner_email TEXT");
```
Add to the returned object:
```ts
    listByStatus: (status: string) =>
      db.prepare("SELECT * FROM games WHERE status = ? ORDER BY created_at DESC").all(status) as DbGame[],
    listByOwner: (ownerId: string) =>
      db.prepare("SELECT * FROM games WHERE owner_id = ? ORDER BY created_at DESC").all(ownerId) as DbGame[],
    countByOwner: (ownerId: string, status?: string) =>
      (status
        ? (db.prepare("SELECT COUNT(*) n FROM games WHERE owner_id = ? AND status = ?").get(ownerId, status) as { n: number })
        : (db.prepare("SELECT COUNT(*) n FROM games WHERE owner_id = ?").get(ownerId) as { n: number })).n,
    setStatus: (slug: string, status: string) =>
      void db.prepare("UPDATE games SET status = ? WHERE slug = ?").run(status, slug),
```
Add the four signatures to the `GamesStore` interface. The existing `insert` already inserts all `DbGame` keys via named params `@owner_id`/`@owner_email` — since the INSERT uses `@id,@slug,...` confirm it lists the new columns; update the INSERT to include `owner_id, owner_email` columns + `@owner_id, @owner_email` values.

- [ ] **Step 4: Update the admin direct-upload insert** in `src/app/api/admin/games/route.ts` — the existing `store.insert({...})` must now include owner (the admin) + the new fields:
```ts
  const session = await requireAdmin(); // already called; reuse its session
  // ...
  store.insert({
    id: randomUUID(), slug, title, author, cover: null,
    status: "published", created_at: new Date().toISOString(),
    owner_id: (session as { user?: { id?: string; email?: string } }).user?.id
      ?? (session as { user?: { email?: string } }).user?.email ?? "admin",
    owner_email: (session as { user?: { email?: string } }).user?.email ?? null,
  });
```
(Adjust `requireAdmin()` to RETURN the session if not already — it does per 2a. If it returns a boolean, change it to return the session or null and use it here.)

- [ ] **Step 5: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/games-db.ts src/lib/games-db.test.ts "src/app/api/admin/games/route.ts"`.

- [ ] **Step 6: Commit**
```bash
git add src/lib/games-db.ts src/lib/games-db.test.ts "src/app/api/admin/games/route.ts"
git commit -m "feat(gamehub): games DB owner + status (pending/published/rejected) + moderation accessors

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Zip-bomb limits in safeExtractZip

**Files:** Modify `src/lib/game-upload.ts`, `src/lib/game-upload.test.ts`

**Interfaces produced:** `safeExtractZip(buffer, destDir, limits?)` where `limits?: { maxTotalBytes: number; maxFiles: number; maxFileBytes: number }`.

- [ ] **Step 1: Write failing test** — append to `src/lib/game-upload.test.ts` (inside the `safeExtractZip` describe):
```ts
  it("rejects an over-limit zip without writing (zip-bomb guard)", () => {
    const zip = new AdmZip();
    zip.addFile("index.html", Buffer.from("<html><head></head></html>"));
    zip.addFile("big.bin", Buffer.alloc(2 * 1024 * 1024, 0)); // 2 MB
    const dest = makeTmpDir();
    const result = safeExtractZip(zip.toBuffer(), dest, { maxTotalBytes: 1024 * 1024, maxFiles: 100, maxFileBytes: 1024 * 1024 });
    expect(result).toEqual({ ok: false, error: "too-big-uncompressed" });
    expect(existsSync(join(dest, "big.bin"))).toBe(false);
    expect(existsSync(join(dest, "index.html"))).toBe(false); // nothing written
  });
  it("accepts a within-limit zip", () => {
    const zip = new AdmZip();
    zip.addFile("index.html", Buffer.from("<html><head></head></html>"));
    const dest = makeTmpDir();
    expect(safeExtractZip(zip.toBuffer(), dest, { maxTotalBytes: 1024 * 1024, maxFiles: 100, maxFileBytes: 1024 * 1024 }).ok).toBe(true);
  });
```

- [ ] **Step 2: Run → FAIL** (limits arg not honoured).

- [ ] **Step 3: Implement** in `src/lib/game-upload.ts` — change the signature + add a pre-write check after `indexes` is validated, before the write loop:
```ts
export function safeExtractZip(
  buffer: Buffer,
  destDir: string,
  limits?: { maxTotalBytes: number; maxFiles: number; maxFileBytes: number },
): { ok: boolean; error?: string } {
```
After `const prefix = ...` and before the `for` write loop, add:
```ts
  if (limits) {
    const files = entries.filter((e) => !e.isDirectory && !isJunkEntry(e.entryName));
    if (files.length > limits.maxFiles) return { ok: false, error: "too-big-uncompressed" };
    let total = 0;
    for (const e of files) {
      const size = e.header.size; // uncompressed size
      if (size > limits.maxFileBytes) return { ok: false, error: "too-big-uncompressed" };
      total += size;
      if (total > limits.maxTotalBytes) return { ok: false, error: "too-big-uncompressed" };
    }
  }
```
(The check runs before any `writeFileSync`, so nothing is written when it fails.)

- [ ] **Step 4: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/game-upload.ts src/lib/game-upload.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/lib/game-upload.ts src/lib/game-upload.test.ts
git commit -m "feat(gamehub): zip-bomb guard — pre-write uncompressed size/count/per-file limits

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Public submission route + env

**Files:** Create `src/app/api/games/submit/route.ts`; Modify `.env.example`

- [ ] **Step 1: Implement the route**
```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import { slugify, safeExtractZip, resolveInside } from "@/lib/game-upload";

export const runtime = "nodejs";

const STORAGE = process.env.GAMES_STORAGE_DIR || "/home/namnx/ctslab-games";
const MAX_MB = parseInt(process.env.GAMES_MAX_UPLOAD_MB || "100", 10) || 100;
const LIMITS = {
  maxTotalBytes: (parseInt(process.env.GAMES_MAX_UNCOMPRESSED_MB || "300", 10) || 300) * 1024 * 1024,
  maxFiles: parseInt(process.env.GAMES_MAX_FILES || "2000", 10) || 2000,
  maxFileBytes: (parseInt(process.env.GAMES_MAX_FILE_MB || "100", 10) || 100) * 1024 * 1024,
};
const MAX_PENDING = parseInt(process.env.GAMES_MAX_PENDING_PER_USER || "3", 10) || 3;
const MAX_TOTAL = parseInt(process.env.GAMES_MAX_TOTAL_PER_USER || "10", 10) || 10;

export async function POST(req: Request) {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  if (!ownerId) return NextResponse.json({ error: "auth" }, { status: 401 });

  const store = getGamesStore();
  if (store.countByOwner(ownerId, "pending") >= MAX_PENDING || store.countByOwner(ownerId) >= MAX_TOTAL) {
    return NextResponse.json({ error: "quota" }, { status: 429 });
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  const file = form.get("file");
  if (!title || !author || !(file instanceof File)) return NextResponse.json({ error: "bad" }, { status: 400 });
  if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: "too-large" }, { status: 413 });

  const base = slugify(title);
  let slug = base;
  for (let i = 2; store.exists(slug); i++) slug = `${base}-${i}`;

  const dest = resolveInside(STORAGE, slug);
  if (!dest || dest === resolveInside(STORAGE, "")) return NextResponse.json({ error: "bad" }, { status: 400 });

  const res = safeExtractZip(Buffer.from(await file.arrayBuffer()), dest, LIMITS);
  if (!res.ok) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  store.insert({
    id: randomUUID(), slug, title, author, cover: null,
    status: "pending", created_at: new Date().toISOString(),
    owner_id: ownerId, owner_email: u?.email ?? null,
  });
  return NextResponse.json({ slug, status: "pending" }, { status: 202 });
}
```
(Note: `resolveInside(STORAGE, "")` resolves to the storage root, so the guard rejects an empty slug. `slug` from `slugify` is always non-empty.)

- [ ] **Step 2: `.env.example`** — append the new names/defaults:
```
GAMES_MAX_UNCOMPRESSED_MB=300
GAMES_MAX_FILES=2000
GAMES_MAX_FILE_MB=100
GAMES_MAX_PENDING_PER_USER=3
GAMES_MAX_TOTAL_PER_USER=10
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run build && npx eslint "src/app/api/games/submit/route.ts"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - Unauth POST gated: `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/games/submit` → `401`.

- [ ] **Step 4: Commit**
```bash
git add "src/app/api/games/submit/route.ts" .env.example
git commit -m "feat(gamehub): public submission route (auth + quota + zip-bomb-limited extract -> pending)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Moderation actions (approve/reject) on the admin route

**Files:** Modify `src/app/api/admin/games/route.ts`

- [ ] **Step 1: Add a `PATCH` handler** (admin-only) alongside the existing POST/DELETE:
```ts
import { getGamesStore } from "@/lib/games-db";
// (rmSync, resolveInside, STORAGE already imported in this file)

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: { slug?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const { slug, action } = body;
  if (!slug || (action !== "approve" && action !== "reject")) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const store = getGamesStore();
  if (action === "approve") {
    store.setStatus(slug, "published");
  } else {
    store.setStatus(slug, "rejected");
    const dest = resolveInside(STORAGE, slug);
    if (dest && dest !== resolveInside(STORAGE, "")) {
      try { rmSync(dest, { recursive: true, force: true }); } catch {}
    }
  }
  return NextResponse.json({ ok: true });
}
```
(Ensure `getGamesStore` is imported in this file — the existing route already imports it for POST/DELETE.)

- [ ] **Step 2: Verify** — `npx tsc --noEmit && npm run build && npx eslint "src/app/api/admin/games/route.ts"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - Unauth PATCH gated: `curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:3001/api/admin/games -H 'Content-Type: application/json' -d '{"slug":"x","action":"approve"}'` → `403`.

- [ ] **Step 3: Commit**
```bash
git add "src/app/api/admin/games/route.ts"
git commit -m "feat(gamehub): admin moderation actions (approve -> published, reject -> deleted)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Admin moderation UI (pending queue)

**Files:** Modify `src/app/admin/games/page.tsx`, `src/components/admin/GameUploadManager.tsx`

- [ ] **Step 1: Pass pending games to the manager** in `src/app/admin/games/page.tsx`. Use the store directly for the queue (server component):
```tsx
import { getGamesStore } from "@/lib/games-db";
// ...
  const pending = getGamesStore().listByStatus("pending").map((g) => ({
    slug: g.slug, title: g.title, author: g.author, owner: g.owner_email ?? "—",
  }));
  // existing: const games = getCatalog().filter((g) => g.source === "user")....
  return (
    // ...
      <GameUploadManager games={/* existing published list */} pending={pending} />
  );
```

- [ ] **Step 2: Render the queue** in `src/components/admin/GameUploadManager.tsx`. Add a `pending` prop + a queue section with Preview/Approve/Reject:
```tsx
type Pending = { slug: string; title: string; author: string; owner: string };

export default function GameUploadManager({ games, pending }: { games: Item[]; pending: Pending[] }) {
  // ...existing state/onSubmit/onDelete...
  const GAMES_ORIGIN = "https://games.ctslab.net"; // preview origin (display only)

  async function moderate(slug: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm(`Từ chối & xoá "${slug}"?`)) return;
    await fetch("/api/admin/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action }),
    });
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Pending queue */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <h2 className="text-display text-lg text-ink">Chờ duyệt ({pending.length})</h2>
        <ul className="mt-4 space-y-2">
          {pending.length === 0 && <li className="text-sm text-dim">Không có game chờ duyệt.</li>}
          {pending.map((g) => (
            <li key={g.slug} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
              <span className="text-sm text-ink">{g.title} <span className="text-dim">· {g.author} · {g.owner}</span></span>
              <span className="ml-auto flex items-center gap-2">
                <a href={`${GAMES_ORIGIN}/${g.slug}/index.html`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue underline">Xem thử</a>
                <button type="button" onClick={() => moderate(g.slug, "approve")} className="rounded-[var(--radius-pill)] bg-blue px-3 py-1 text-xs font-semibold text-white">Duyệt</button>
                <button type="button" onClick={() => moderate(g.slug, "reject")} className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-xs text-red">Từ chối</button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* existing upload form + published list — keep, wrapped in the same grid as before */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* ...existing <form> ... and published <div> ... */}
      </div>
    </div>
  );
}
```
(Preserve the existing upload form + published-delete list; just nest them under the new wrapper after the queue.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/app/admin/games/page.tsx src/components/admin/GameUploadManager.tsx`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`: build lists `/admin/games`; unauth `/admin/games` still redirects (grep "Chờ duyệt" → 0 unauthenticated).

- [ ] **Step 4: Commit**
```bash
git add src/app/admin/games/page.tsx src/components/admin/GameUploadManager.tsx
git commit -m "feat(gamehub): admin moderation queue (preview / approve / reject)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Submission UI (/games/submit) + hub link

**Files:** Create `src/app/games/submit/page.tsx`, `src/components/games/SubmitGameForm.tsx`; Modify `src/components/games/GameHubView.tsx`

- [ ] **Step 1: Submission page** `src/app/games/submit/page.tsx` (server; soft-gate — prompt sign-in, don't redirect):
```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import SubmitGameForm from "@/components/games/SubmitGameForm";

export const metadata: Metadata = { title: "Đăng game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function SubmitGamePage() {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  const mine = ownerId
    ? getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }))
    : [];
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <h1 className="text-section text-ink">Đăng game của bạn</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-2">Tải lên bản build WebGL (.zip có index.html). Game sẽ chờ duyệt trước khi công khai.</p>
          <SubmitGameForm signedIn={!!ownerId} mine={mine} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Client form** `src/components/games/SubmitGameForm.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Upload, Lock } from "lucide-react";

type Mine = { slug: string; title: string; status: string };
const STATUS_VI: Record<string, string> = { pending: "Chờ duyệt", published: "Đã đăng", rejected: "Bị từ chối" };

export default function SubmitGameForm({ signedIn, mine }: { signedIn: boolean; mine: Mine[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <div className="mt-8 flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-6">
        <Lock size={24} className="text-blue" aria-hidden />
        <p className="text-sm text-ink-2">Đăng nhập để đăng game.</p>
        <button type="button" onClick={() => signIn("authentik")} className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white">Đăng nhập</button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/games/submit", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ Đã gửi! Game đang chờ duyệt.");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        const m: Record<string, string> = { quota: "Bạn đã đạt giới hạn số game.", "too-large": "File quá lớn.", "too-big-uncompressed": "Game giải nén quá lớn.", "no-index": "Zip thiếu index.html.", "invalid-zip": "File zip không hợp lệ.", "unsafe-path": "Zip chứa đường dẫn không an toàn." };
        setMsg(`❌ ${m[data.error] ?? "Lỗi: " + (data.error ?? res.status)}`);
      }
    } catch {
      setMsg("❌ Lỗi mạng");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <div className="space-y-3">
          <input name="title" required placeholder="Tên game" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="author" required placeholder="Tác giả" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="file" type="file" accept=".zip" required className="w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-blue file:px-4 file:py-2 file:text-white" />
        </div>
        <button type="submit" disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Upload size={16} /> {busy ? "Đang gửi…" : "Gửi duyệt"}
        </button>
        {msg && <p className="mt-3 text-sm text-ink-2">{msg}</p>}
      </form>

      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <h2 className="text-display text-lg text-ink">Game của bạn ({mine.length})</h2>
        <ul className="mt-4 space-y-2">
          {mine.length === 0 && <li className="text-sm text-dim">Bạn chưa đăng game nào.</li>}
          {mine.map((g) => (
            <li key={g.slug} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm">
              <span className="text-ink">{g.title}</span>
              <span className="text-dim">{STATUS_VI[g.status] ?? g.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Link from the hub** in `src/components/games/GameHubView.tsx` — add a "Submit your game" link near the header (after the lead paragraph):
```tsx
        <Link href="/games/submit" className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-blue hover:text-blue">
          + Đăng game của bạn
        </Link>
```
(`Link` is already imported in GameHubView.)

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/app/games/submit/page.tsx src/components/games/SubmitGameForm.tsx src/components/games/GameHubView.tsx`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`:
  - `/games/submit` → 200; signed-out shows the sign-in prompt: `curl -s http://localhost:3001/games/submit | grep -c "Đăng nhập để đăng game"` → ≥1.
  - Hub has the submit link: `curl -s http://localhost:3001/games | grep -c "Đăng game của bạn"` → ≥1.

- [ ] **Step 5: Commit**
```bash
git add src/app/games/submit/page.tsx src/components/games/SubmitGameForm.tsx src/components/games/GameHubView.tsx
git commit -m "feat(gamehub): student submission page + form + hub link

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Audit + deploy + CSP documentation

**Files:** Modify any file needing a fix; create `docs/game-hub-csp-setup.md`

- [ ] **Step 1: Full suite** — `npx tsc --noEmit && npx eslint src && npx vitest run` (all clean; incl. the new DB + zip-limit tests; no stray `eslint-disable`).

- [ ] **Step 2: Security audit (code level):**
  - Submit route requires `auth()` (any user) → 401 unauth; admin route POST/DELETE/PATCH require `isAdmin` → 403/forbidden. `grep -n "isAdmin\|auth()" src/app/api/games/submit/route.ts src/app/api/admin/games/route.ts`.
  - Quota enforced before extract; zip-bomb limits passed to `safeExtractZip` in the submit route. Reject deletes files via `resolveInside` guard (no bare startsWith).
  - `getCatalog()` shows only `published` (pending/rejected hidden) — confirm.
  - `.env.example` documents all new limits; no secrets; `*.db` git-ignored.
- [ ] **Step 3: Behaviour audit:** lab tyrp + 2a admin upload unchanged; submit → pending (not in hub); reflow OK at 375px.
- [ ] **Step 4: Deploy** — `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/submit`, `/api/games/submit` (POST unauth → 401), `/api/admin/games` (PATCH unauth → 403). `games-sandbox` still serves `https://games.ctslab.net/_test/` → 200.
- [ ] **Step 5: Write the CSP setup doc** `docs/game-hub-csp-setup.md` — the exact Cloudflare Response-Header Transform Rule for the user/leader:
  > On Cloudflare → the zone `ctslab.net` → Rules → Transform Rules → Response Header → Create. **When** hostname equals `games.ctslab.net`. **Then** set static header `Content-Security-Policy: frame-ancestors https://ctslab.net` and `X-Content-Type-Options: nosniff`. Save & deploy. Verify: `curl -I https://games.ctslab.net/<slug>/index.html` shows the headers.
  Explain it blocks hotlinking/phishing-frame of user games.
- [ ] **Step 6: Final commit (code fixes if any) + the doc**
```bash
git add docs/game-hub-csp-setup.md <any fixes>
git commit -m "docs(gamehub): Cloudflare CSP frame-ancestors setup for games origin + slice-2b audit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> **USER steps:** (1) add the Cloudflare CSP response-header rule (Step 5 doc). (2) Test the flow: sign in as a NON-admin → `/games/submit` → upload a game → it's `pending` (not in hub); sign in as admin → `/admin/games` → Preview → Approve → it appears in the hub + plays; Reject deletes it; the 4th pending submission is blocked (quota).

---

## Self-Review (completed during planning)

**Spec coverage:** §4.0 env → Task 3 (.env.example) + used across Tasks 2/3. §4.1 DB owner/status + accessors → Task 1. §4.2 zip-bomb limits → Task 2. §4.3 quota → Task 3. §4.4 submission route → Task 3. §4.5 submission UI → Task 6. §4.6 moderation UI → Task 5. §4.7 moderation actions → Task 4. §4.8 CSP → Task 7 (doc). §5 security/quality → all + Task 7 audit. §7 testing → Tasks 1/2 units + Task 7 + user check.

**Placeholder scan:** complete code each step; the existing upload-form/published-list in GameUploadManager are preserved (Task 5 nests them, not re-pasted) — the implementer reads the current file. CSP is a documented infra step (not code), explicitly so.

**Type consistency:** `DbGame` gains `owner_id`/`owner_email` (Task 1) — every `insert()` call site updated (admin route Task 1; submit route Task 3). `GamesStore` new methods (Task 1) consumed by submit route (Task 3), admin PATCH (Task 4), admin page (Task 5), submit page (Task 6). `safeExtractZip(buffer,dest,limits?)` (Task 2) — submit route passes LIMITS (Task 3); 2a admin route still calls it without limits (backward-compatible optional arg). `GameUploadManager({games,pending})` (Task 5) — admin page passes both (Task 5).

**Note:** the admin direct-upload route still calls `safeExtractZip` WITHOUT limits (trusted admin) — acceptable; only the public submit route enforces zip-bomb limits. The optional `limits?` keeps that backward-compatible.
