# PTalk chat demo (beside the 3D model) — 3.4

**Date:** 2026-06-23
**Status:** Draft for review (updated: backend = local PTalk RAG)
**Scope:** Add a **login-gated text chat demo** beside the PTalk 3D model on the home page. A signed-in visitor types a question; the website (server-side) calls the lab's **local PTalk RAG** (retrieve from the knowledge base, then generate with Gemma) and shows the answer. Usage is capped per account per day (SQLite). A visible note states the demo chat isn't saved. **Excludes** voice/STT/TTS, anonymous access, streaming, and any new RAG building.

---

## 1. Goal

Let visitors experience PTalk's actual brain on ctslab.net: ask a question, get an answer grounded in the lab's education knowledge base — without exposing keys, and with a daily per-account cap to control load.

## 2. Key technical finding (verified, de-risked)

The ctslab web server runs on the **same machine** as the whole PTalk stack, and every backend is reachable from it (verified with live `curl`):

| Backend | Address | Role | Reachable |
|---|---|---|---|
| **PTalk RAG server** (`rag_server.py`) | `http://localhost:8888` | retrieval over Qdrant + Neo4j + Postgres → returns `context` | ✅ health 200 |
| **Gemma-4** (LLM) | `http://localhost:8080/v1/chat/completions` | generates the answer (OpenAI-compatible) | ✅ 401 (reachable; key required) |
| Qdrant (vector DB) | `localhost:6333` | knowledge vectors (used by rag_server) | ✅ 200 |

**Chosen backend (settled with user): the local PTalk RAG — two steps:**
1. **Retrieve:** `POST http://localhost:8888/v2/rag/retrieve` body `{ "query": <question>, "session_id": <userId> }` → `{ context: string, intent: object, sources: array }`.
2. **Generate:** `POST http://localhost:8080/v1/chat/completions` with `Authorization: Bearer <gemma key>`, body `{ model: "gemma-4", messages: [ {role:"system", content: <grounding + context>}, {role:"user", content: <question>} ], temperature: 0.3, max_tokens: 320 }` → `data.choices[0].message.content`.

(Contract confirmed from `CloudPTalk/rag_server.py`: `/v2/rag/retrieve` shape + its own `call_gemma` payload — model `gemma-4`, Bearer key, OpenAI chat format. Dashboard's `api/rag-query/route.ts` is a proven Next.js precedent for the Gemma call.)

This means **no RAG is built on the website** — it orchestrates two local HTTP calls server-side. Faster than a public dependency; the keys stay server-only.

## 3. Decisions (settled with the user)

- **Backend:** local PTalk RAG (`rag_server :8888` retrieve → `Gemma :8080` generate). Not Dify, not raw-Gemma.
- **Login-gated:** only signed-in users (existing Authentik SSO) can chat; count **per account per day**.
- **Storage:** **SQLite** (file, survives restart; `*.db` already git-ignored) — `usage(user_id, day, count)`.
- **Daily limit:** default **8** (env-overridable, within the agreed 5–10).
- **Placement:** in the "Meet PTalk" section — header (eyebrow/title/lead + the 3 feature chips) on top; below it a 2-column layout: **3D model left, chat right** (stacked on mobile).
- **Privacy note:** a visible line near the chat — "this demo chat isn't saved" — so users test freely.

## 4. Architecture & components

### 4.1 Env config (`.env.local`, documented in `.env.example`)
- `PTALK_RAG_URL` (default `http://localhost:8888/v2/rag/retrieve`)
- `PTALK_LLM_URL` (default `http://localhost:8080/v1/chat/completions`)
- `PTALK_LLM_KEY` — Gemma gateway key (server-only; the local value is `gemma4-openclaw-2026`, kept in `.env.local`).
- `PTALK_LLM_MODEL` (default `gemma-4`)
- `PTALK_CHAT_DAILY_LIMIT` (default `8`)
- `PTALK_USAGE_DB` (default `./data/ptalk-usage.db`)

### 4.2 Usage store (`src/lib/ptalk-usage.ts`, new — uses `better-sqlite3`)
- Add dependency **`better-sqlite3`** (synchronous, tiny; prebuilt Linux binaries). Lazily open the DB at `PTALK_USAGE_DB`, creating the `data/` dir + table on first use:
  - `CREATE TABLE IF NOT EXISTS usage (user_id TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day))`.
- API:
  - `getUsage(userId, day): number` — current count (0 if none).
  - `incrementUsage(userId, day): number` — upsert +1, returns new count.
  - `DAILY_LIMIT` from env (default 8); `remaining = max(0, DAILY_LIMIT - count)`.
  - `todayKey(date: Date): string` — pure helper returning `YYYY-MM-DD` for Asia/Ho_Chi_Minh (testable; the caller passes the `Date`).

### 4.3 Chat API route (`src/app/api/ptalk-chat/route.ts`, new — `export const runtime = "nodejs"`)
- `POST`:
  1. **Auth:** `const session = await auth();` — no `session?.user` → `401 { error: "auth" }`.
  2. **Validate:** `{ message: string }`; reject empty / > ~1000 chars → `400`.
  3. **Rate-limit:** `day = todayKey(new Date())`, `count = getUsage(userId, day)`; if `count >= DAILY_LIMIT` → `429 { error: "limit", remaining: 0 }`.
  4. **Retrieve:** `POST PTALK_RAG_URL { query: message, session_id: userId }` (timeout ~8s). On failure, proceed with empty context (graceful — Gemma still answers) but log it.
  5. **Generate:** `POST PTALK_LLM_URL` (Bearer `PTALK_LLM_KEY`) with the grounding system prompt + retrieved `context` + the user question (timeout ~30s). Grounding prompt (Vietnamese, concise): instruct it to answer as PTalk using the provided context, briefly, in the user's language, and to say it doesn't know if the context lacks the answer.
  6. On success: `incrementUsage(userId, day)`; return `200 { answer, remaining }`.
  7. On generate error/timeout: `502 { error: "upstream" }` (do **not** increment).
- Keys read server-side only; generic error codes (no upstream details leaked).
- `GET`: returns `{ authed: boolean, remaining: number }` for the current session (for the UI to show remaining on load; no generation, no increment).

### 4.4 Chat UI (`src/components/home/PTalkChat.tsx`, new, client)
- States:
  - **Not signed in:** panel with a short prompt + "Sign in to try" button (links to existing sign-in). Reads `useSession()`.
  - **Signed in:** message list (user + PTalk bubbles), input + send, a **quota line** ("còn N lượt hôm nay" / "N tries left today"), and the **privacy note** ("Đoạn chat thử này không được lưu lại" / "This demo chat isn't saved").
- Behaviour:
  - Submit → optimistic user bubble → `POST /api/ptalk-chat { message }` → typing indicator → append answer → update `remaining`.
  - Errors: `401` → sign-in state; `429` → "đã hết lượt hôm nay" + disable input; `502`/network → "PTalk đang bận, thử lại sau" inline, keep input.
  - Enter-to-send; input disabled while awaiting; nothing persisted (no localStorage, no server chat store) — refresh clears the conversation (consistent with the privacy note).
- Bilingual via `useLocale`; existing tokens; lucide icons (`Send`, `Lock`).

### 4.5 SpotlightSection layout (`src/components/home/SpotlightSection.tsx`, modify)
- Restructure to: a header block (existing eyebrow + title + lead + 3 feature chips, kept), then a `grid lg:grid-cols-2` with **Stage (3D) left** and **`<PTalkChat />` right**; single column on mobile (3D then chat). Keep the existing 3D `Stage`/`RobotViewer` (callouts unchanged).

### 4.6 Strings (`src/content/ui.ts`)
- New `ui.ptalkChat` block (`Localized`): intro line, `placeholder`, `send`, `signInPrompt`, `signInCta`, `quota` (interpolate n), `limitReached`, `error`, `privacyNote`, `thinking`.

## 5. Behaviour & quality
- **Security:** the Gemma key is server-only (env), never in client bundles or responses. The route gates on a real session; the per-user counter caps load. Generic error codes.
- **Privacy:** the website stores no chat content — only an integer per user/day. The visible note says so.
- **Rate limit:** enforced server-side (the client quota line is advisory). Per account per calendar day (Asia/Ho_Chi_Minh).
- **Resilience:** retrieve failure → still answers (empty context); generate failure → graceful 502, no increment; the rest of the home page is unaffected (chat is an isolated island). All upstream calls are localhost (low latency).
- **Accessibility:** labelled input; real send button; readable message region; focus states; reduced motion respected.
- **Bilingual**; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect`.

## 6. Out of scope
- **Voice** (STT/TTS) — text only.
- **Anonymous** access / IP limits — login required.
- **Streaming** responses — `blocking`/single-response for slice 1; streaming is a later enhancement.
- **Dify** path and **raw-Gemma-without-RAG** path — not chosen.
- **Web-side moderation** — relies on the RAG/LLM layer; can be added later.
- **Persisting chat history**; building/altering the RAG or Qdrant content.

## 7. Testing
- **Unit (Vitest, node):**
  - `todayKey(new Date("2026-06-23T20:00:00Z"))` → correct `YYYY-MM-DD` for Asia/Ho_Chi_Minh (boundary check around midnight).
  - `getUsage`/`incrementUsage` against a temp/`:memory:` DB: increments, isolates per `user_id`+`day`, `remaining` math.
- **Route limit logic:** a thin testable helper (`remaining`, `limitReached`) unit-tested; the upstream fetches exercised manually.
- **Manual/live (keys are local, already reachable):** signed-out → sign-in state; signed-in → ask a question → grounded answer appears (verify it reflects retrieved context); quota decrements; after the limit → friendly block; privacy note visible; refresh clears conversation; mobile reflow OK; the Gemma key never appears in page source / network body. Verified via `npm run build` + `pm2 restart cts-redesign`.
