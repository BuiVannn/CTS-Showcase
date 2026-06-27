# GameHub Redesign C — Creator Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A creator Studio — a "my games" dashboard + a 5-tab create/edit form with draft / submit-for-review flow + owner-scoped update/delete API — with correct status-transition logic.

**Architecture:** A pure `nextStatusOnEdit` helper encodes the edit→status rules; a rich create route (`POST /api/games/studio`) supersedes the 2b basic submit; an owner-or-admin `PUT`/`DELETE /api/games/[slug]` handles edit/delete; a client `GameForm` (5 tabs) + `StudioDashboard` drive it. Reuses the A data model, the 2b upload pipeline (path-safe + zip-bomb-limited + quota), and the `games-db` `update()`/`listByOwner` seams.

**Tech Stack:** Next.js 16 (route handlers `runtime="nodejs"`, server+client components), Auth.js v5 (`auth()`, `session.isAdmin`), `better-sqlite3`, Tailwind v4, Vitest, lucide-react. Reuses `MessageContent`, `Badge`, `AmbientField`, `Container`, `EmptyState`.

## Global Constraints

- **Status logic (the core):** draft/pending/published/rejected. Create → `draft` (Lưu nháp) or `pending` (Gửi duyệt). Editing: new build → `pending` (re-moderation) only when the game is `published`; a published game's metadata-only edit stays `published`; draft/rejected → submit → `pending`; pending edits stay `pending`. Encoded in `nextStatusOnEdit`.
- **Ownership = security:** every owner-scoped route (PUT/DELETE) verifies `game.owner_id === (session.user.id||email)` OR `session.isAdmin`, else `403`. Slug is immutable after create.
- **Visibility:** `getCatalog()` shows only `published` (unchanged). Quota (2b) applies on create; edits don't consume quota.
- **Reuse:** `safeExtractZip(buffer, dest, LIMITS)` (zip-bomb), `resolveInside` (path guard), `slugify`, `getGamesStore().update/insert/listByOwner/get`. `description` renders via `MessageContent` (no raw HTML → no XSS).
- Bilingual via `ui.studio.*`; existing tokens; SQLite behind the seam; no `eslint-disable`; no `react-hooks/set-state-in-effect`. `@/*`→`src/*`.
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build`; tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:** `src/lib/game-status.ts` (+test), `src/app/api/games/studio/route.ts`, `src/app/api/games/[slug]/route.ts`, `src/components/games/studio/GameForm.tsx`, `src/components/games/studio/StudioDashboard.tsx`, `src/app/games/studio/page.tsx`, `src/app/games/studio/new/page.tsx`, `src/app/games/studio/[slug]/edit/page.tsx`
**Modify:** `src/content/ui.ts`, `src/components/games/GameHubView.tsx`, `src/app/games/submit/page.tsx` (→ redirect)
**Delete:** `src/app/api/games/submit/route.ts`, `src/components/games/SubmitGameForm.tsx`

---

## Task 1: Status-transition helper

**Files:** Create `src/lib/game-status.ts`, `src/lib/game-status.test.ts`

**Interfaces produced:** `EditIntent = "draft" | "pending" | "keep"`; `nextStatusOnEdit(current, submitted, hasNewBuild): string`.

- [ ] **Step 1: Write failing tests** `src/lib/game-status.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { nextStatusOnEdit } from "./game-status";

describe("nextStatusOnEdit", () => {
  it("published: metadata-only stays published; new build → pending", () => {
    expect(nextStatusOnEdit("published", "keep", false)).toBe("published");
    expect(nextStatusOnEdit("published", "keep", true)).toBe("pending");
    expect(nextStatusOnEdit("published", "pending", false)).toBe("published"); // metadata edit stays live
  });
  it("draft/rejected → submit goes pending; save-draft stays draft (even with new build)", () => {
    expect(nextStatusOnEdit("draft", "draft", false)).toBe("draft");
    expect(nextStatusOnEdit("draft", "draft", true)).toBe("draft");
    expect(nextStatusOnEdit("draft", "pending", false)).toBe("pending");
    expect(nextStatusOnEdit("rejected", "pending", false)).toBe("pending");
  });
  it("pending edits stay pending", () => {
    expect(nextStatusOnEdit("pending", "keep", false)).toBe("pending");
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npx vitest run src/lib/game-status.test.ts`).

- [ ] **Step 3: Implement `src/lib/game-status.ts`**:
```ts
export type EditIntent = "draft" | "pending" | "keep";

/**
 * Status of a game after an owner edits it.
 * - published: metadata-only edit stays published (live); a NEW build → pending (re-moderation).
 * - draft/rejected/pending: honour the submitted intent (submit → pending, save-draft → draft, keep → unchanged).
 */
export function nextStatusOnEdit(current: string, submitted: EditIntent, hasNewBuild: boolean): string {
  if (current === "published") return hasNewBuild ? "pending" : "published";
  if (submitted === "draft") return "draft";
  if (submitted === "pending") return "pending";
  return current; // "keep"
}
```

- [ ] **Step 4: Run tests → PASS** (`npx vitest run`), then `npx tsc --noEmit && npm run build && npx eslint src/lib/game-status.ts src/lib/game-status.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/lib/game-status.ts src/lib/game-status.test.ts
git commit -m "feat(gamehub): nextStatusOnEdit — edit status-transition rules

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Rich create route (supersedes 2b submit)

**Files:** Create `src/app/api/games/studio/route.ts`; Delete `src/app/api/games/submit/route.ts`

**Interfaces produced:** `POST /api/games/studio` → `201 { slug, status }` | `400|401|413|429`.

- [ ] **Step 1: Implement the create route** `src/app/api/games/studio/route.ts`:
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

function str(form: FormData, k: string): string {
  return String(form.get(k) || "").trim();
}

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

  const title = str(form, "title");
  const author = str(form, "author");
  const file = form.get("file");
  const status = str(form, "status") === "draft" ? "draft" : "pending";
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

  const now = new Date().toISOString();
  store.insert({
    id: randomUUID(), slug, title, author,
    cover: str(form, "cover") || null,
    status, created_at: now, owner_id: ownerId, owner_email: u?.email ?? null,
  });
  store.update(slug, {
    tagline: str(form, "tagline") || null,
    description: str(form, "description") || null,
    classification: str(form, "classification") || null,
    project_type: str(form, "projectType") || null,
    release_status: str(form, "releaseStatus") || null,
    genre: str(form, "genre") || null,
    tags: str(form, "tags") || null,
    external_url: str(form, "externalUrl") || null,
    video_url: str(form, "videoUrl") || null,
    updated_at: now,
  });
  return NextResponse.json({ slug, status }, { status: 201 });
}
```

- [ ] **Step 2: Remove the superseded submit route** — `git rm src/app/api/games/submit/route.ts`. (The page redirect + `SubmitGameForm` removal happen in Task 5.)

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run build && npx eslint "src/app/api/games/studio/route.ts"`; `npx vitest run`. Then `pm2 restart cts-redesign && sleep 3`: unauth POST gated `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/games/studio` → `401`.

- [ ] **Step 4: Commit**
```bash
git add "src/app/api/games/studio/route.ts"
git rm src/app/api/games/submit/route.ts
git commit -m "feat(gamehub): rich create route /api/games/studio (metadata + draft/submit), supersede submit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Owner update + delete route

**Files:** Create `src/app/api/games/[slug]/route.ts`

**Interfaces:** Consumes `nextStatusOnEdit` (Task 1), `getGamesStore`, `safeExtractZip`/`resolveInside`. Produces `PUT /api/games/[slug]` → `200 {slug,status}`; `DELETE /api/games/[slug]` → `{ok:true}`.

- [ ] **Step 1: Implement** `src/app/api/games/[slug]/route.ts`:
```ts
import { NextResponse } from "next/server";
import { rmSync } from "node:fs";
import { auth } from "@/auth";
import { getGamesStore, type DbGame } from "@/lib/games-db";
import { safeExtractZip, resolveInside } from "@/lib/game-upload";
import { nextStatusOnEdit, type EditIntent } from "@/lib/game-status";

export const runtime = "nodejs";

const STORAGE = process.env.GAMES_STORAGE_DIR || "/home/namnx/ctslab-games";
const MAX_MB = parseInt(process.env.GAMES_MAX_UPLOAD_MB || "100", 10) || 100;
const LIMITS = {
  maxTotalBytes: (parseInt(process.env.GAMES_MAX_UNCOMPRESSED_MB || "300", 10) || 300) * 1024 * 1024,
  maxFiles: parseInt(process.env.GAMES_MAX_FILES || "2000", 10) || 2000,
  maxFileBytes: (parseInt(process.env.GAMES_MAX_FILE_MB || "100", 10) || 100) * 1024 * 1024,
};

async function ownerOrAdmin(slug: string) {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  if (!uid) return { error: "auth" as const };
  const game = getGamesStore().get(slug);
  if (!game) return { error: "notfound" as const };
  const isAdmin = (session as { isAdmin?: boolean }).isAdmin === true;
  if (game.owner_id !== uid && !isAdmin) return { error: "forbidden" as const };
  return { game };
}

function str(form: FormData, k: string): string {
  return String(form.get(k) || "").trim();
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gate = await ownerOrAdmin(slug);
  if ("error" in gate) {
    const code = gate.error === "auth" ? 401 : gate.error === "notfound" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status: code });
  }
  const game = gate.game;

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }

  const file = form.get("file");
  const hasNewBuild = file instanceof File && file.size > 0;
  if (hasNewBuild && (file as File).size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }
  if (hasNewBuild) {
    const dest = resolveInside(STORAGE, slug);
    if (!dest || dest === resolveInside(STORAGE, "")) return NextResponse.json({ error: "bad" }, { status: 400 });
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
    const res = safeExtractZip(Buffer.from(await (file as File).arrayBuffer()), dest, LIMITS);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  }

  const submitted = (["draft", "pending", "keep"].includes(str(form, "status")) ? str(form, "status") : "keep") as EditIntent;
  const status = nextStatusOnEdit(game.status, submitted, hasNewBuild);
  const title = str(form, "title") || game.title;

  const patch: Partial<DbGame> = {
    title, author: str(form, "author") || game.author,
    cover: str(form, "cover") || null,
    tagline: str(form, "tagline") || null,
    description: str(form, "description") || null,
    classification: str(form, "classification") || null,
    project_type: str(form, "projectType") || null,
    release_status: str(form, "releaseStatus") || null,
    genre: str(form, "genre") || null,
    tags: str(form, "tags") || null,
    external_url: str(form, "externalUrl") || null,
    video_url: str(form, "videoUrl") || null,
    status,
    updated_at: new Date().toISOString(),
  };
  getGamesStore().update(slug, patch);
  return NextResponse.json({ slug, status });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gate = await ownerOrAdmin(slug);
  if ("error" in gate) {
    const code = gate.error === "auth" ? 401 : gate.error === "notfound" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status: code });
  }
  const dest = resolveInside(STORAGE, slug);
  if (dest && dest !== resolveInside(STORAGE, "")) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
  }
  getGamesStore().remove(slug);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify** — `npx tsc --noEmit && npm run build && npx eslint "src/app/api/games/[slug]/route.ts"`; `npx vitest run`. Then `pm2 restart cts-restart` … `pm2 restart cts-redesign && sleep 3`:
  - Unauth PUT → 401: `curl -s -o /dev/null -w "%{http_code}\n" -X PUT http://localhost:3001/api/games/tyrp` → `401`.
  - Unauth DELETE → 401: `curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:3001/api/games/tyrp` → `401`.

- [ ] **Step 3: Commit**
```bash
git add "src/app/api/games/[slug]/route.ts"
git commit -m "feat(gamehub): owner-scoped PUT/DELETE /api/games/[slug] (edit/delete + status rules)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: ui.studio strings + GameForm (5 tabs)

**Files:** Modify `src/content/ui.ts`; Create `src/components/games/studio/GameForm.tsx`

- [ ] **Step 1: Add strings** to `src/content/ui.ts` — a new top-level `studio` block on the exported `ui` object (sibling of `games`):
```ts
  studio: {
    myGames: { en: "My games", vi: "Game của tôi" } as Localized,
    newGame: { en: "+ New game", vi: "+ Tạo game mới" } as Localized,
    empty: { en: "You haven't created any games yet.", vi: "Bạn chưa tạo game nào." } as Localized,
    edit: { en: "Edit", vi: "Sửa" } as Localized,
    preview: { en: "Preview", vi: "Xem thử" } as Localized,
    del: { en: "Delete", vi: "Xoá" } as Localized,
    confirmDelete: { en: "Delete this game?", vi: "Xoá game này?" } as Localized,
    tabBasic: { en: "Basics", vi: "Cơ bản" } as Localized,
    tabClassify: { en: "Classification", vi: "Phân loại" } as Localized,
    tabUpload: { en: "Build", vi: "Tải lên" } as Localized,
    tabDetails: { en: "Description", vi: "Mô tả" } as Localized,
    tabVisibility: { en: "Publish", vi: "Hiển thị" } as Localized,
    fTitle: { en: "Title", vi: "Tên game" } as Localized,
    fAuthor: { en: "Author / team", vi: "Tác giả / nhóm" } as Localized,
    fTagline: { en: "Tagline", vi: "Mô tả ngắn" } as Localized,
    fCover: { en: "Cover image URL", vi: "URL ảnh bìa" } as Localized,
    fGenre: { en: "Genre", vi: "Thể loại" } as Localized,
    fTags: { en: "Tags (comma-separated)", vi: "Tags (phân tách bằng dấu phẩy)" } as Localized,
    fDescription: { en: "Description (Markdown)", vi: "Mô tả (Markdown)" } as Localized,
    fBuild: { en: "Build (.zip with index.html)", vi: "Bản build (.zip có index.html)" } as Localized,
    fBuildKeep: { en: "Leave empty to keep the current build", vi: "Để trống để giữ build hiện tại" } as Localized,
    preview2: { en: "Preview", vi: "Xem trước" } as Localized,
    saveDraft: { en: "Save draft", vi: "Lưu nháp" } as Localized,
    submitReview: { en: "Submit for review", vi: "Gửi duyệt" } as Localized,
    saveChanges: { en: "Save changes", vi: "Lưu thay đổi" } as Localized,
    rebuildNote: { en: "Uploading a new build sends a published game back for review.", vi: "Tải build mới sẽ đưa game đã đăng về chờ duyệt lại." } as Localized,
    errNetwork: { en: "Network error", vi: "Lỗi mạng" } as Localized,
    classGame: { en: "Game", vi: "Game" } as Localized,
    classApp: { en: "App / interactive", vi: "App / tương tác" } as Localized,
    classTool: { en: "Tool", vi: "Công cụ" } as Localized,
    classDemo: { en: "Demo", vi: "Demo" } as Localized,
    classEdu: { en: "Educational", vi: "Giáo dục" } as Localized,
    typeWeb: { en: "Web build (HTML)", vi: "Bản web (HTML)" } as Localized,
    typeExternal: { en: "External link", vi: "Liên kết ngoài" } as Localized,
    typeVideo: { en: "Video", vi: "Video" } as Localized,
    relInDev: { en: "In development", vi: "Đang phát triển" } as Localized,
    relReleased: { en: "Released", vi: "Đã phát hành" } as Localized,
    relPrototype: { en: "Prototype", vi: "Nguyên mẫu" } as Localized,
  },
```

- [ ] **Step 2: Create `src/components/games/studio/GameForm.tsx`**:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import MessageContent from "@/components/home/MessageContent";

export type GameFormData = {
  title: string; author: string; tagline: string; cover: string;
  classification: string; projectType: string; releaseStatus: string; genre: string; tags: string;
  description: string; externalUrl: string; videoUrl: string;
};

export const EMPTY_FORM: GameFormData = {
  title: "", author: "", tagline: "", cover: "",
  classification: "game", projectType: "web", releaseStatus: "in_dev", genre: "", tags: "",
  description: "", externalUrl: "", videoUrl: "",
};

const inputCls = "w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue";

function errorMsg(code: string | undefined): string {
  const m: Record<string, string> = {
    quota: "Bạn đã đạt giới hạn số game.", "too-large": "File quá lớn.",
    "too-big-uncompressed": "Game giải nén quá lớn.", "no-index": "Zip thiếu index.html.",
    "invalid-zip": "File zip không hợp lệ.", "unsafe-path": "Zip chứa đường dẫn không an toàn.",
    bad: "Thiếu thông tin bắt buộc.", forbidden: "Bạn không có quyền.",
  };
  return `❌ ${m[code ?? ""] ?? "Lỗi: " + (code ?? "")}`;
}

export default function GameForm({
  mode, initial, slug, status,
}: { mode: "create" | "edit"; initial?: GameFormData; slug?: string; status?: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [data, setData] = useState<GameFormData>(initial ?? EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof GameFormData, v: string) => setData((d) => ({ ...d, [k]: v }));

  const tabs = [t(ui.studio.tabBasic), t(ui.studio.tabClassify), t(ui.studio.tabUpload), t(ui.studio.tabDetails), t(ui.studio.tabVisibility)];
  const showDraftSubmit = mode === "create" || status === "draft" || status === "rejected";

  async function save(intent: "draft" | "pending" | "keep") {
    if (!data.title.trim() || !data.author.trim()) { setTab(0); setMsg(errorMsg("bad")); return; }
    if (mode === "create" && !file) { setTab(2); setMsg("❌ Cần tải lên bản build (.zip)."); return; }
    setBusy(true); setMsg(null);
    const form = new FormData();
    (Object.keys(data) as (keyof GameFormData)[]).forEach((k) => form.append(k, data[k]));
    form.append("status", intent);
    if (file) form.append("file", file);
    const url = mode === "create" ? "/api/games/studio" : `/api/games/${slug}`;
    try {
      const res = await fetch(url, { method: mode === "create" ? "POST" : "PUT", body: form });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/games/studio"); router.refresh(); }
      else setMsg(errorMsg(d.error));
    } catch { setMsg(`❌ ${t(ui.studio.errNetwork)}`); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-8 max-w-3xl">
      <div className="flex flex-wrap gap-2 border-b border-border">
        {tabs.map((label, i) => (
          <button key={label} type="button" onClick={() => setTab(i)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === i ? "border-blue text-blue" : "border-transparent text-ink-2 hover:text-ink"}`}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tab === 0 && (
          <>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fTitle)} *</span>
              <input className={`mt-1 ${inputCls}`} value={data.title} onChange={(e) => set("title", e.target.value)} /></label>
            {mode === "edit" && <p className="text-xs text-dim">URL: /games/{slug}</p>}
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fAuthor)} *</span>
              <input className={`mt-1 ${inputCls}`} value={data.author} onChange={(e) => set("author", e.target.value)} /></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fTagline)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.tagline} onChange={(e) => set("tagline", e.target.value)} /></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fCover)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.cover} onChange={(e) => set("cover", e.target.value)} placeholder="https://…" /></label>
          </>
        )}

        {tab === 1 && (
          <>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.tabClassify)}</span>
              <select className={`mt-1 ${inputCls}`} value={data.classification} onChange={(e) => set("classification", e.target.value)}>
                <option value="game">{t(ui.studio.classGame)}</option><option value="app">{t(ui.studio.classApp)}</option>
                <option value="tool">{t(ui.studio.classTool)}</option><option value="demo">{t(ui.studio.classDemo)}</option>
                <option value="educational">{t(ui.studio.classEdu)}</option>
              </select></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.tabUpload)}</span>
              <select className={`mt-1 ${inputCls}`} value={data.projectType} onChange={(e) => set("projectType", e.target.value)}>
                <option value="web">{t(ui.studio.typeWeb)}</option><option value="external">{t(ui.studio.typeExternal)}</option>
                <option value="video">{t(ui.studio.typeVideo)}</option>
              </select></label>
            <label className="block text-sm"><span className="text-ink-2">Status</span>
              <select className={`mt-1 ${inputCls}`} value={data.releaseStatus} onChange={(e) => set("releaseStatus", e.target.value)}>
                <option value="in_dev">{t(ui.studio.relInDev)}</option><option value="released">{t(ui.studio.relReleased)}</option>
                <option value="prototype">{t(ui.studio.relPrototype)}</option>
              </select></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fGenre)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.genre} onChange={(e) => set("genre", e.target.value)} /></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fTags)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Unity, WebGL" /></label>
          </>
        )}

        {tab === 2 && (
          <>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fBuild)}</span>
              <input type="file" accept=".zip" className="mt-1 w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-blue file:px-4 file:py-2 file:text-white"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            {mode === "edit" && <p className="text-xs text-dim">{t(ui.studio.fBuildKeep)} — {t(ui.studio.rebuildNote)}</p>}
            <label className="block text-sm"><span className="text-ink-2">External URL</span>
              <input className={`mt-1 ${inputCls}`} value={data.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://…" /></label>
            <label className="block text-sm"><span className="text-ink-2">Video URL</span>
              <input className={`mt-1 ${inputCls}`} value={data.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" /></label>
          </>
        )}

        {tab === 3 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fDescription)}</span>
              <textarea className={`mt-1 h-72 ${inputCls}`} value={data.description} onChange={(e) => set("description", e.target.value)} /></label>
            <div><p className="text-sm text-ink-2">{t(ui.studio.preview2)}</p>
              <div className="mt-1 h-72 overflow-auto rounded-[var(--radius-md)] border border-border bg-surface p-3">
                {data.description ? <MessageContent content={data.description} /> : <p className="text-sm text-dim">—</p>}
              </div></div>
          </div>
        )}

        {tab === 4 && (
          <div className="flex flex-wrap items-center gap-3">
            {showDraftSubmit ? (
              <>
                <button type="button" disabled={busy} onClick={() => save("draft")} className="rounded-[var(--radius-pill)] border border-border px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">{t(ui.studio.saveDraft)}</button>
                <button type="button" disabled={busy} onClick={() => save("pending")} className="rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t(ui.studio.submitReview)}</button>
              </>
            ) : (
              <button type="button" disabled={busy} onClick={() => save("keep")} className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t(ui.studio.saveChanges)}</button>
            )}
          </div>
        )}

        {msg && <p className="text-sm text-ink-2">{msg}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/content/ui.ts src/components/games/studio/GameForm.tsx`; `npx vitest run`. (Not mounted yet — Task 5.)

- [ ] **Step 4: Commit**
```bash
git add src/content/ui.ts src/components/games/studio/GameForm.tsx
git commit -m "feat(gamehub): GameForm (5-tab create/edit, markdown preview, draft/submit) + studio strings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: StudioDashboard + studio routes + wiring

**Files:** Create `src/components/games/studio/StudioDashboard.tsx`, `src/app/games/studio/page.tsx`, `src/app/games/studio/new/page.tsx`, `src/app/games/studio/[slug]/edit/page.tsx`; Modify `src/components/games/GameHubView.tsx`, `src/app/games/submit/page.tsx`; Delete `src/components/games/SubmitGameForm.tsx`

- [ ] **Step 1: `StudioDashboard`** `src/components/games/studio/StudioDashboard.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Badge from "@/components/ui/Badge";

type Item = { slug: string; title: string; status: string };
const STATUS_VI: Record<string, string> = { draft: "Nháp", pending: "Chờ duyệt", published: "Đã đăng", rejected: "Bị từ chối" };

export default function StudioDashboard({ games }: { games: Item[] }) {
  const { t } = useLocale();
  const router = useRouter();

  async function onDelete(slug: string) {
    if (!confirm(t(ui.studio.confirmDelete))) return;
    await fetch(`/api/games/${encodeURIComponent(slug)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-lg text-ink">{t(ui.studio.myGames)} ({games.length})</h2>
        <Link href="/games/studio/new" className="rounded-[var(--radius-pill)] bg-red px-4 py-2 text-sm font-semibold text-white">{t(ui.studio.newGame)}</Link>
      </div>
      {games.length === 0 ? (
        <p className="mt-6 text-sm text-dim">{t(ui.studio.empty)}</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {games.map((g) => (
            <li key={g.slug} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3">
              <span className="text-sm font-medium text-ink">{g.title}</span>
              <Badge tone="neutral">{STATUS_VI[g.status] ?? g.status}</Badge>
              <span className="ml-auto flex items-center gap-3">
                <Link href={`/games/${g.slug}`} className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-blue"><Eye size={14} /> {t(ui.studio.preview)}</Link>
                <Link href={`/games/studio/${g.slug}/edit`} className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-blue"><Pencil size={14} /> {t(ui.studio.edit)}</Link>
                <button type="button" onClick={() => onDelete(g.slug)} className="inline-flex items-center gap-1 text-xs text-dim hover:text-red"><Trash2 size={14} /> {t(ui.studio.del)}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Studio dashboard page** `src/app/games/studio/page.tsx`:
```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { signIn } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import StudioDashboard from "@/components/games/studio/StudioDashboard";

export const metadata: Metadata = { title: "Studio — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  if (!ownerId) {
    return (
      <>
        <Navbar />
        <main className="section pt-28"><Container>
          <h1 className="text-section text-ink">Game Studio</h1>
          <form action={async () => { "use server"; await signIn("authentik"); }} className="mt-6">
            <button type="submit" className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white">Đăng nhập</button>
          </form>
        </Container></main>
        <Footer />
      </>
    );
  }
  const games = getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }));
  return (
    <>
      <Navbar />
      <main className="section pt-28"><Container>
        <h1 className="text-section text-ink">Game Studio</h1>
        <StudioDashboard games={games} />
      </Container></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: New-game page** `src/app/games/studio/new/page.tsx`:
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import GameForm from "@/components/games/studio/GameForm";

export const metadata: Metadata = { title: "Tạo game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!(session?.user)) redirect("/games/studio");
  return (
    <>
      <Navbar />
      <main className="section pt-28"><Container>
        <h1 className="text-section text-ink">Tạo game mới</h1>
        <GameForm mode="create" />
      </Container></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Edit page** `src/app/games/studio/[slug]/edit/page.tsx` (owner-or-admin gate):
```tsx
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import GameForm, { type GameFormData } from "@/components/games/studio/GameForm";

export const metadata: Metadata = { title: "Sửa game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function EditGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  if (!uid) redirect("/games/studio");
  const g = getGamesStore().get(slug);
  if (!g) notFound();
  const isAdmin = (session as { isAdmin?: boolean }).isAdmin === true;
  if (g.owner_id !== uid && !isAdmin) notFound();

  const initial: GameFormData = {
    title: g.title, author: g.author, tagline: g.tagline ?? "", cover: g.cover ?? "",
    classification: g.classification ?? "game", projectType: g.project_type ?? "web",
    releaseStatus: g.release_status ?? "in_dev", genre: g.genre ?? "", tags: g.tags ?? "",
    description: g.description ?? "", externalUrl: g.external_url ?? "", videoUrl: g.video_url ?? "",
  };
  return (
    <>
      <Navbar />
      <main className="section pt-28"><Container>
        <h1 className="text-section text-ink">Sửa: {g.title}</h1>
        <GameForm mode="edit" slug={slug} status={g.status} initial={initial} />
      </Container></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Redirect the old submit page + retire SubmitGameForm.** Replace `src/app/games/submit/page.tsx` with a redirect:
```tsx
import { redirect } from "next/navigation";
export default function SubmitRedirect() {
  redirect("/games/studio/new");
}
```
Then `git rm src/components/games/SubmitGameForm.tsx`. Update the hub link in `src/components/games/GameHubView.tsx` — change `href="/games/submit"` to `href="/games/studio"`.

- [ ] **Step 6: Verify** — `npx tsc --noEmit && npm run build && npx eslint src/components/games/studio/StudioDashboard.tsx src/app/games/studio/page.tsx src/app/games/studio/new/page.tsx "src/app/games/studio/[slug]/edit/page.tsx" src/app/games/submit/page.tsx src/components/games/GameHubView.tsx`; `npx vitest run`. Confirm no `SubmitGameForm` refs: `grep -rn "SubmitGameForm" src` → empty. Then `pm2 restart cts-redesign && sleep 3`:
  - `/games/studio` → 200; unauth shows sign-in (grep "Đăng nhập"); build lists `/games/studio`, `/games/studio/new`.
  - `/games/submit` redirects to `/games/studio/new`: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/games/submit` → `307`/`200` after redirect; hub link updated: `curl -s http://localhost:3001/games | grep -c "/games/studio"` → ≥1.

- [ ] **Step 7: Commit**
```bash
git add src/components/games/studio/StudioDashboard.tsx src/app/games/studio src/app/games/submit/page.tsx src/components/games/GameHubView.tsx
git rm src/components/games/SubmitGameForm.tsx
git commit -m "feat(gamehub): Creator Studio dashboard + new/edit pages; retire 2b submit form

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Audit + deploy

**Files:** Modify any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite** — `npx tsc --noEmit && npx eslint src && npx vitest run` (all clean; incl. game-status tests; no stray `eslint-disable`; no `react-hooks/set-state-in-effect`).
- [ ] **Step 2: Security/logic audit (code level):**
  - Ownership: `grep -n "ownerOrAdmin\|owner_id" "src/app/api/games/[slug]/route.ts"` — PUT + DELETE both gate owner-or-admin (403 else); the edit page also re-checks (notFound for non-owner).
  - Status rules: `nextStatusOnEdit` used in PUT; new-build → pending only for published; create honours draft/pending.
  - Catalog still published-only (`grep -n listPublished src/lib/game-catalog.ts`).
  - No `SubmitGameForm`/`/api/games/submit` refs left: `grep -rn "SubmitGameForm\|api/games/submit" src` → empty.
  - `description` rendered via `MessageContent` (no raw HTML).
- [ ] **Step 3: Deploy** — `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/games`, `/games/studio`, `/games/studio/new` → all `200`; `/games/tyrp` still plays (no regression); unauth `POST /api/games/studio` → 401, `PUT/DELETE /api/games/tyrp` → 401.
- [ ] **Step 4: Final commit (only if fixes were made).** Else report.

> **USER check:** sign in (non-admin) → `/games/studio` → "Tạo game mới" → 5 tabs → upload a small WebGL zip → **Lưu nháp** (appears as Nháp, not in the public hub) → edit → **Gửi duyệt** (Chờ duyệt) → admin (`/admin/games`) approves → public + plays. Edit the published game's description → stays live; replace its build → back to Chờ duyệt. A non-owner cannot open `/games/studio/<other>/edit` (404) nor PUT/DELETE it (403). Delete removes it + files.

---

## Self-Review (completed during planning)

**Spec coverage:** §3 status logic → Task 1 (`nextStatusOnEdit`) + Task 3 (PUT uses it). §4.1 routes → Task 5 (pages) + Task 2/3 (APIs). §4.2 GameForm/StudioDashboard/tabs → Task 4 + Task 5. §4.3 create/update/delete APIs → Tasks 2/3. §4.4 strings → Task 4. §5 ownership/security/aesthetic → Tasks 3/4/5 + Task 6 audit. §7 testing → Task 1 unit + Task 6 + user check.

**Placeholder scan:** complete code each step. The release-status/"Status" label in the classify tab uses a literal "Status" (a select label) — acceptable; all user-facing copy of substance is via `ui.studio.*`.

**Type consistency:** `nextStatusOnEdit(current, EditIntent, hasNewBuild)` (Task 1) consumed by the PUT route (Task 3). `GameFormData`/`EMPTY_FORM` (Task 4) consumed by the edit page (Task 5). `GameForm({mode, initial?, slug?, status?})` (Task 4) used by new/edit pages (Task 5). `StudioDashboard({games: {slug,title,status}[]})` (Task 5) fed by `listByOwner` (Task 5 page). The create route reads form keys exactly matching `GameFormData` field names (`projectType`/`releaseStatus`/`externalUrl`/`videoUrl` → mapped to snake_case columns).

**Note:** the create route maps camelCase form keys (`projectType`) to snake_case columns (`project_type`) explicitly; the PUT route does the same — both consistent with the `DbGame` column names. `signIn` imported from `@/auth` in a server action (the studio page) — Auth.js v5 exposes `signIn` from the `NextAuth(...)` export (already destructured in `src/auth.ts`).
```
