# PTalk Chat Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A login-gated text chat demo beside the PTalk 3D model: the server retrieves context from the local PTalk RAG (`:8888`) then generates the answer via the DeepSeek API, capped per account per day (SQLite), with a visible "not saved" note.

**Architecture:** A Node-runtime API route orchestrates two HTTP calls (local retrieve → DeepSeek generate), gated by the existing Auth.js session and a SQLite per-user/day counter. A client `PTalkChat` island renders the conversation and lives in the home "Meet PTalk" section (3D left, chat right). All keys are server-only env vars.

**Tech Stack:** Next.js 16 (App Router, route handlers, `runtime = "nodejs"`), React 19, Auth.js v5 (`auth()` / `useSession`), `better-sqlite3`, Tailwind v4, TypeScript, Vitest (node), lucide-react.

## Global Constraints

- **Read the Next.js 16 docs before writing the route/config** (`node_modules/next/dist/docs/`): route handlers, `runtime`, and `serverExternalPackages` (native module externalization). Heed deprecations.
- **Secrets:** `PTALK_LLM_KEY` (DeepSeek) and all `PTALK_*` values live in `.env.local` (git-ignored) — NEVER commit. Document **names only** in `.env.example`. The key is read server-side only; never returned to the client or bundled.
- **Backend contract (verified):**
  - Retrieve: `POST http://localhost:8888/v2/rag/retrieve` `{ query, session_id }` → `{ context, intent, sources }`.
  - Generate: `POST https://api.deepseek.com/chat/completions` (Bearer key, model `deepseek-chat`), OpenAI chat shape → `data.choices[0].message.content`.
- **Auth:** only signed-in users may chat; identify the user by a stable session field (`session.user.id` ?? `session.user.email`).
- **Daily cap:** `PTALK_CHAT_DAILY_LIMIT` (default 8); per account per calendar day (Asia/Ho_Chi_Minh, UTC+7, no DST).
- **Bilingual:** every visible string via `t(ui.ptalkChat.*)`. No `eslint-disable`; no `react-hooks/set-state-in-effect` (an async fetch result set in an effect is fine; do not set render-derivable state in an effect).
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; tasks with tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/ptalk-usage.ts` (+ `src/lib/ptalk-usage.test.ts`) — SQLite per-user/day counter + `todayKey`.
- `src/app/api/ptalk-chat/route.ts` — the chat route (GET remaining, POST ask).
- `src/components/home/PTalkChat.tsx` — the client chat island.

**Modify:**
- `next.config.ts` — add `serverExternalPackages: ["better-sqlite3"]`.
- `.env.example` — document the `PTALK_*` env var names.
- `src/content/ui.ts` — add the `ptalkChat` strings block.
- `src/components/home/SpotlightSection.tsx` — header on top, 2-col [3D | chat].
- `package.json` — add `better-sqlite3` (+ `@types/better-sqlite3`).

---

## Task 1: Usage store (SQLite) + todayKey + tests

**Files:**
- Create: `src/lib/ptalk-usage.ts`, `src/lib/ptalk-usage.test.ts`
- Modify: `next.config.ts`, `package.json`

**Interfaces:**
- Produces: `todayKey(date: Date): string`; `DAILY_LIMIT: number`; `remaining(count: number): number`; `createUsageStore(dbPath: string): UsageStore`; `getUsageStore(): UsageStore`; `interface UsageStore { getUsage(userId, day): number; incrementUsage(userId, day): number }`.

- [ ] **Step 1: Add the dependency**

Run: `npm install better-sqlite3 && npm install -D @types/better-sqlite3`
Expected: installs with a prebuilt binary (no compile error). **If the native install/build fails**, stop and report BLOCKED (we will switch to `node:sqlite` or a JSON store) — do not hand-patch the build.

- [ ] **Step 2: Externalize the native module**

In `next.config.ts`, add a top-level `serverExternalPackages: ["better-sqlite3"]` to the config object (verify the exact key name in the Next 16 docs — it is `serverExternalPackages` in Next 15+). Keep existing config (viewTransition, allowedDevOrigins) intact.

- [ ] **Step 3: Write the failing tests**

`src/lib/ptalk-usage.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { todayKey, remaining, DAILY_LIMIT, createUsageStore } from "./ptalk-usage";

describe("todayKey (Asia/Ho_Chi_Minh, UTC+7)", () => {
  it("rolls to the next day after 17:00 UTC", () => {
    expect(todayKey(new Date("2026-06-23T10:00:00Z"))).toBe("2026-06-23");
    expect(todayKey(new Date("2026-06-23T17:30:00Z"))).toBe("2026-06-24");
  });
});

describe("remaining", () => {
  it("never goes below zero", () => {
    expect(remaining(0)).toBe(DAILY_LIMIT);
    expect(remaining(DAILY_LIMIT + 5)).toBe(0);
  });
});

describe("usage store", () => {
  it("counts per user and per day, isolated", () => {
    const s = createUsageStore(":memory:");
    expect(s.getUsage("u1", "2026-06-23")).toBe(0);
    expect(s.incrementUsage("u1", "2026-06-23")).toBe(1);
    expect(s.incrementUsage("u1", "2026-06-23")).toBe(2);
    expect(s.getUsage("u1", "2026-06-23")).toBe(2);
    expect(s.getUsage("u2", "2026-06-23")).toBe(0); // other user isolated
    expect(s.getUsage("u1", "2026-06-24")).toBe(0); // other day isolated
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run src/lib/ptalk-usage.test.ts`
Expected: FAIL — cannot find module `./ptalk-usage`.

- [ ] **Step 5: Implement the store**

`src/lib/ptalk-usage.ts`:

```ts
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const DAILY_LIMIT = Math.max(
  1,
  parseInt(process.env.PTALK_CHAT_DAILY_LIMIT || "8", 10) || 8,
);

/** YYYY-MM-DD for Asia/Ho_Chi_Minh (UTC+7, no DST). */
export function todayKey(date: Date): string {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 10);
}

export function remaining(count: number): number {
  return Math.max(0, DAILY_LIMIT - count);
}

export interface UsageStore {
  getUsage(userId: string, day: string): number;
  incrementUsage(userId: string, day: string): number;
}

export function createUsageStore(dbPath: string): UsageStore {
  const db = new Database(dbPath);
  if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");
  db.exec(
    `CREATE TABLE IF NOT EXISTS usage (
       user_id TEXT NOT NULL,
       day     TEXT NOT NULL,
       count   INTEGER NOT NULL DEFAULT 0,
       PRIMARY KEY (user_id, day)
     )`,
  );
  const getStmt = db.prepare("SELECT count FROM usage WHERE user_id = ? AND day = ?");
  const incStmt = db.prepare(
    `INSERT INTO usage (user_id, day, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`,
  );
  return {
    getUsage(userId, day) {
      const row = getStmt.get(userId, day) as { count: number } | undefined;
      return row?.count ?? 0;
    },
    incrementUsage(userId, day) {
      incStmt.run(userId, day);
      const row = getStmt.get(userId, day) as { count: number } | undefined;
      return row?.count ?? 0;
    },
  };
}

let _store: UsageStore | null = null;
/** Lazily-opened singleton store from PTALK_USAGE_DB (creates the dir). */
export function getUsageStore(): UsageStore {
  if (!_store) {
    const path = process.env.PTALK_USAGE_DB || "./data/ptalk-usage.db";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    _store = createUsageStore(path);
  }
  return _store;
}
```

- [ ] **Step 6: Run tests + verify**

Run: `npx vitest run src/lib/ptalk-usage.test.ts` → PASS; `npx vitest run` → green. Then `npx tsc --noEmit && npm run build && npx eslint src/lib/ptalk-usage.ts src/lib/ptalk-usage.test.ts next.config.ts` → clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/ptalk-usage.ts src/lib/ptalk-usage.test.ts next.config.ts package.json package-lock.json
git commit -m "feat(ptalk-chat): SQLite per-user/day usage store + todayKey

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Chat API route + env docs

**Files:**
- Create: `src/app/api/ptalk-chat/route.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `auth` from `@/auth`; `getUsageStore`, `todayKey`, `remaining`, `DAILY_LIMIT` from `@/lib/ptalk-usage`.
- Produces: `POST /api/ptalk-chat` → `200 { answer, remaining }` | `400|401|429|502`; `GET /api/ptalk-chat` → `{ authed, remaining }`.

- [ ] **Step 1: Implement the route**

`src/app/api/ptalk-chat/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsageStore, todayKey, remaining, DAILY_LIMIT } from "@/lib/ptalk-usage";

export const runtime = "nodejs";

const RAG_URL = process.env.PTALK_RAG_URL || "http://localhost:8888/v2/rag/retrieve";
const LLM_URL = process.env.PTALK_LLM_URL || "https://api.deepseek.com/chat/completions";
const LLM_KEY = process.env.PTALK_LLM_KEY || "";
const LLM_MODEL = process.env.PTALK_LLM_MODEL || "deepseek-chat";

function userIdOf(session: { user?: { id?: string; email?: string | null } } | null): string | null {
  const u = session?.user;
  if (!u) return null;
  return u.id || u.email || null;
}

export async function GET() {
  const session = await auth();
  const userId = userIdOf(session);
  if (!userId) return NextResponse.json({ authed: false, remaining: 0 });
  const count = getUsageStore().getUsage(userId, todayKey(new Date()));
  return NextResponse.json({ authed: true, remaining: remaining(count) });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = userIdOf(session);
  if (!userId) return NextResponse.json({ error: "auth" }, { status: 401 });

  let message = "";
  try {
    const body = await req.json();
    message = typeof body?.message === "string" ? body.message : "";
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  if (!message.trim() || message.length > 1000) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const store = getUsageStore();
  const day = todayKey(new Date());
  if (store.getUsage(userId, day) >= DAILY_LIMIT) {
    return NextResponse.json({ error: "limit", remaining: 0 }, { status: 429 });
  }

  // 1) Retrieve local RAG context (graceful: empty context on failure).
  let context = "";
  try {
    const r = await fetch(RAG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: message.trim(), session_id: userId }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      if (typeof d?.context === "string") context = d.context;
    }
  } catch {
    // proceed without context
  }

  // 2) Generate via DeepSeek (OpenAI-compatible).
  const system =
    "Bạn là PTalk — trợ lý AI giáo dục của CTS Lab cho học sinh Việt Nam. " +
    "Trả lời NGẮN GỌN, thân thiện, bằng tiếng Việt (hoặc theo ngôn ngữ người hỏi). " +
    "Ưu tiên dựa vào NGỮ CẢNH dưới đây; nếu ngữ cảnh không đủ, hãy nói bạn chưa có thông tin và gợi ý hỏi cách khác. Không bịa.\n\n" +
    "NGỮ CẢNH:\n" +
    (context || "(không có)");

  let answer = "";
  try {
    const r = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message.trim() },
        ],
        temperature: 0.3,
        max_tokens: 320,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const d = await r.json();
    answer = (d?.choices?.[0]?.message?.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  if (!answer) return NextResponse.json({ error: "upstream" }, { status: 502 });

  const newCount = store.incrementUsage(userId, day);
  return NextResponse.json({ answer, remaining: remaining(newCount) });
}
```

- [ ] **Step 2: Document env names**

Append to `.env.example` (names only, no secret values):

```
# PTalk chat demo (3.4) — real values go in .env.local (never commit)
PTALK_RAG_URL=http://localhost:8888/v2/rag/retrieve
PTALK_LLM_URL=https://api.deepseek.com/chat/completions
PTALK_LLM_KEY=
PTALK_LLM_MODEL=deepseek-chat
PTALK_CHAT_DAILY_LIMIT=8
PTALK_USAGE_DB=./data/ptalk-usage.db
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint "src/app/api/ptalk-chat/route.ts"`; `npx vitest run` green. Then `pm2 restart cts-redesign && sleep 3`:
- Unauth GET returns authed:false: `curl -s http://localhost:3001/api/ptalk-chat` → contains `"authed":false`.
- Unauth POST is gated 401: `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/api/ptalk-chat -H 'Content-Type: application/json' -d '{"message":"hi"}'` → `401`.

(Authenticated end-to-end answer needs the user's real `PTALK_LLM_KEY` in `.env.local` — that is the user's manual check in Task 5.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/ptalk-chat/route.ts" .env.example
git commit -m "feat(ptalk-chat): API route (auth + daily cap + local RAG retrieve + DeepSeek)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: PTalkChat UI component + strings

**Files:**
- Create: `src/components/home/PTalkChat.tsx`
- Modify: `src/content/ui.ts`

**Interfaces:**
- Consumes: `useSession`/`signIn` from `next-auth/react`; `useLocale`; `ui.ptalkChat`; `POST/GET /api/ptalk-chat`.
- Produces: `<PTalkChat />` (no props).

- [ ] **Step 1: Add the strings**

In `src/content/ui.ts`, add a `ptalkChat` block inside the exported `ui` object:

```ts
  ptalkChat: {
    intro: { en: "Ask PTalk", vi: "Hỏi thử PTalk" } as Localized,
    placeholder: { en: "Type a question…", vi: "Nhập câu hỏi…" } as Localized,
    send: { en: "Send", vi: "Gửi" } as Localized,
    emptyHint: {
      en: "Ask about learning, CTS products, or anything PTalk knows.",
      vi: "Hỏi về học tập, sản phẩm CTS, hay bất cứ điều gì PTalk biết.",
    } as Localized,
    signInPrompt: {
      en: "Sign in to try chatting with PTalk.",
      vi: "Đăng nhập để chat thử với PTalk.",
    } as Localized,
    signInCta: { en: "Sign in", vi: "Đăng nhập" } as Localized,
    quota: { en: "{n} tries left today", vi: "Còn {n} lượt hôm nay" } as Localized,
    limitReached: {
      en: "You've used all your tries today. Come back tomorrow!",
      vi: "Bạn đã dùng hết lượt thử hôm nay. Quay lại vào ngày mai nhé!",
    } as Localized,
    error: { en: "PTalk is busy — please try again.", vi: "PTalk đang bận, thử lại sau giây lát." } as Localized,
    privacyNote: {
      en: "This demo chat isn't saved.",
      vi: "Đoạn chat thử này không được lưu lại.",
    } as Localized,
    thinking: { en: "PTalk is thinking…", vi: "PTalk đang trả lời…" } as Localized,
  },
```

- [ ] **Step 2: Implement the component**

`src/components/home/PTalkChat.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Send, Lock, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

type Msg = { role: "user" | "assistant"; content: string };

export default function PTalkChat() {
  const { t } = useLocale();
  const { status } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limited, setLimited] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch the remaining quota once authenticated (side effect — async, not render-derivable).
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/ptalk-chat")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (typeof d.remaining === "number") {
          setRemaining(d.remaining);
          setLimited(d.remaining <= 0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const msg = input.trim();
    if (!msg || busy || limited) return;
    setInput("");
    setError(false);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ptalk-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (res.status === 429) {
        setLimited(true);
        setRemaining(0);
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
        setLimited(data.remaining <= 0);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const shell =
    "flex h-[420px] flex-col rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-lg)]";

  if (status !== "authenticated") {
    return (
      <div className={`${shell} items-center justify-center gap-4 p-8 text-center`}>
        <Lock size={28} className="text-blue" aria-hidden />
        <p className="max-w-xs text-base text-ink-2">{t(ui.ptalkChat.signInPrompt)}</p>
        <button
          type="button"
          onClick={() => signIn("authentik")}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          disabled={status === "loading"}
        >
          {t(ui.ptalkChat.signInCta)}
        </button>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles size={16} className="text-red" aria-hidden />
        <span className="text-display text-sm text-ink">{t(ui.ptalkChat.intro)}</span>
        {remaining !== null && (
          <span className="ml-auto font-mono text-[0.7rem] text-dim">
            {t(ui.ptalkChat.quota).replace("{n}", String(remaining))}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-dim">{t(ui.ptalkChat.emptyHint)}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block max-w-[85%] rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                m.role === "user" ? "bg-blue text-white" : "border border-border bg-surface text-ink"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {busy && <p className="text-sm text-dim">{t(ui.ptalkChat.thinking)}</p>}
        {limited && <p className="text-sm text-red">{t(ui.ptalkChat.limitReached)}</p>}
        {error && <p className="text-sm text-red">{t(ui.ptalkChat.error)}</p>}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={t(ui.ptalkChat.placeholder)}
            disabled={busy || limited}
            aria-label={t(ui.ptalkChat.placeholder)}
            className="flex-1 rounded-[var(--radius-pill)] border border-border bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-blue disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || limited || !input.trim()}
            aria-label={t(ui.ptalkChat.send)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] bg-red text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-[0.7rem] text-dim">{t(ui.ptalkChat.privacyNote)}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/home/PTalkChat.tsx src/content/ui.ts`; `npx vitest run` green. (No `react-hooks/set-state-in-effect` warning — the quota fetch is an async side effect.)

- [ ] **Step 4: Commit**

```bash
git add src/components/home/PTalkChat.tsx src/content/ui.ts
git commit -m "feat(ptalk-chat): PTalkChat UI island (login-gated, quota, privacy note)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Integrate into SpotlightSection

**Files:**
- Modify: `src/components/home/SpotlightSection.tsx`

- [ ] **Step 1: Restructure the layout**

In `src/components/home/SpotlightSection.tsx`: import `PTalkChat` (`import PTalkChat from "./PTalkChat";`). Replace the returned JSX body (the `<Container>…</Container>` content) so the header sits on top and a 2-col grid holds the 3D (left, with steps + hint beneath) and the chat (right):

```tsx
      <Container>
        <Reveal>
          <span className="eyebrow eyebrow-draw">{t(ui.spotlight.eyebrow)}</span>
          <h2 className="text-section mt-4 text-ink">{t(ui.spotlight.title)}</h2>
        </Reveal>
        <RevealLines
          text={t(ui.spotlight.lead)}
          className="mt-5 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg"
        />

        <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <div>
            <Reveal delay={0.1}>
              <Stage callouts={callouts} effects={false} />
            </Reveal>
            <Reveal delay={0.05}>
              <ul className="mt-8 space-y-4">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 h-6 w-0.5 rounded-full bg-red" />
                    <span>
                      <span className="text-display text-base text-ink">{t(s.title)}</span>
                      <span className="block text-sm text-ink-2">{t(s.desc)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div
                className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-4 py-2 text-xs font-medium text-red"
                style={{ background: "var(--red-soft)" }}
              >
                <Rotate3d size={14} />
                {t(ui.spotlight.hint)}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <PTalkChat />
          </Reveal>
        </div>
      </Container>
```

(Keep the file's existing imports, `Stage`, `ANCHORS`, `callouts`, and the `<section className="section overflow-hidden">` wrapper. Only the inner content changes; the previous `items-center` two-column split is replaced by the header + `items-start` grid above.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/home/SpotlightSection.tsx`; `npx vitest run` green. Then `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "home: %{http_code}\n" http://localhost:3001/` → `200`.
- Chat island present (privacy note or sign-in prompt rendered): `curl -s http://localhost:3001/ | grep -c "không được lưu lại\|Đăng nhập để chat\|Sign in to try"` → ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/SpotlightSection.tsx
git commit -m "feat(ptalk-chat): place chat beside the 3D model in the Meet PTalk section

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. ptalk-usage tests). No stray `eslint-disable`; no `react-hooks/set-state-in-effect`.

- [ ] **Step 2: Security + behaviour audit (code level)**

Confirm: `PTALK_LLM_KEY` is read only in the route (server) — `grep -rn "PTALK_LLM_KEY" src` shows only `src/app/api/ptalk-chat/route.ts`; it never appears in any client component. The route is `runtime = "nodejs"`. Unauth POST → 401, GET → authed:false. The home page renders the chat island. `.env.example` documents names only (no secret values). `data/` (the SQLite file) is git-ignored (`*.db`).

- [ ] **Step 3: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/` and `/api/ptalk-chat` (GET → `{"authed":false,...}` when called without a cookie) → `200`; unauth POST → `401`.

- [ ] **Step 4: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(ptalk-chat): audit fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes, do not create an empty commit — report results.

> **USER steps (manual, needs the real key):** add to `.env.local` — `PTALK_LLM_KEY=<your DeepSeek key>` (and optionally override `PTALK_LLM_MODEL`/`PTALK_CHAT_DAILY_LIMIT`) — then `pm2 restart cts-redesign`. Sign in on the home page, open the "Meet PTalk" section, ask PTalk a question, and confirm: a grounded answer appears, the quota decrements, the privacy note shows, and the DeepSeek key never appears in the page source / network response body.

---

## Self-Review (completed during planning)

**Spec coverage:**
- §4.1 env → Task 1 (defaults) + Task 2 (.env.example). §4.2 usage store → Task 1. §4.3 route (auth, validate, rate-limit, retrieve, generate, increment, GET) → Task 2. §4.4 UI (states, quota, privacy note, errors, no persistence) → Task 3. §4.5 SpotlightSection layout → Task 4. §4.6 strings → Task 3.
- §5 quality (security key server-only, privacy, rate limit, production safety via DeepSeek, resilience, a11y, bilingual) → Tasks 2/3 + Task 5 audit.
- §7 testing (todayKey + usage store units; route limit logic via `remaining`/`DAILY_LIMIT`; manual live) → Task 1 + Task 5 + user check.

**Placeholder scan:** No TBD/TODO; complete code in every step. Grounding prompt is concrete. The native-dep contingency (Step 1 BLOCKED path) is explicit, not a placeholder.

**Type consistency:** `UsageStore` + `todayKey`/`remaining`/`DAILY_LIMIT`/`getUsageStore` defined in Task 1, consumed by the Task 2 route. `userIdOf` is route-local. `Msg` is component-local (Task 3). `ui.ptalkChat.*` keys defined in Task 3 are exactly those read by `PTalkChat`. `PTalkChat` (no props) imported in Task 4.

**Note for implementer:** the live "PTalk answers" check needs the user's DeepSeek key (Task 5 user step). The automated checks verify wiring (401 gate, GET shape, island rendered, key not leaked) — that is the controller-verifiable surface.
```
