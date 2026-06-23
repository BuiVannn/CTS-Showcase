# PTalk chat demo (beside the 3D model) — 3.4

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Add a **login-gated chat demo** beside the PTalk 3D model on the home page. A logged-in visitor types a question; the website (server-side) calls the lab's existing **Dify** RAG/LLM endpoint and shows the answer. Usage is capped per account per day (stored in SQLite). A visible note tells users the demo chat isn't saved. **Excludes** voice/STT/TTS, anonymous access, streaming, and any new RAG building.

---

## 1. Goal

Let visitors experience PTalk directly on ctslab.net: ask a question, get a grounded answer from the lab's knowledge base — without exposing API keys, and with a daily per-account cap to control cost.

## 2. Key technical finding (de-risked)

The lab already runs a **Dify** app exposing the standard chat API:
- **Endpoint:** `https://aichat.ptit.edu.vn/v1/chat-messages` (Dify `chat-messages`).
- **Auth:** `Authorization: Bearer <dify-app-key>` (server-side secret).
- **Shape:** "question in → answer out" — Dify does retrieval (RAG) + the LLM internally. Supports `conversation_id` for multi-turn.
- (Discovered in `~/Ptalk_project/CloudPTalk/ptalk_dify_eldercare/pipeline.py`, which calls this same endpoint for the eldercare pipeline.)

So the website does **not** build RAG — it proxies to Dify from the server (hiding the key). The website provides the chat UI, auth-gating, and the per-account daily cap.

## 3. Decisions (settled with the user)

- **Provider:** call the lab's Dify endpoint (above). DeepSeek/RAG live inside Dify; the website never holds the model key beyond the Dify app key (server env).
- **Login-gated:** only signed-in users (existing Authentik SSO) can chat; count **per account per day**.
- **Storage:** **SQLite** (file, survives restart; `*.db` already git-ignored) — table `usage(user_id, day, count)`.
- **Placement:** in the "Meet PTalk" section — header (eyebrow/title/lead + the 3 feature chips) on top; below it a 2-column layout: **3D model left, chat right** (stacked on mobile).
- **Privacy note:** a visible line near the chat — "this demo chat isn't saved" — so users test freely.

## 4. Architecture & components

### 4.1 Env config (`.env.local`, documented in `.env.example`)
- `PTALK_DIFY_URL` (default `https://aichat.ptit.edu.vn/v1/chat-messages`)
- `PTALK_DIFY_KEY` — the Dify **app** API key (server-only secret; never sent to the client). The user provides the correct PTalk-knowledge-base app key.
- `PTALK_CHAT_DAILY_LIMIT` (default `8`; within the agreed 5–10).
- `PTALK_USAGE_DB` (default `./data/ptalk-usage.db`).

### 4.2 Usage store (`src/lib/ptalk-usage.ts`, new — uses `better-sqlite3`)
- Add dependency **`better-sqlite3`** (synchronous, tiny, reliable; prebuilt binaries for Linux). Lazily open the DB at `PTALK_USAGE_DB`, creating the `data/` dir + table on first use:
  - `CREATE TABLE IF NOT EXISTS usage (user_id TEXT NOT NULL, day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (user_id, day))`.
- API:
  - `getUsage(userId: string, day: string): number` — current count (0 if none).
  - `incrementUsage(userId: string, day: string): number` — upsert +1, returns new count.
  - `DAILY_LIMIT` read from env (default 8); `remaining = max(0, DAILY_LIMIT - count)`.
  - `day` = `YYYY-MM-DD` in a fixed timezone (Asia/Ho_Chi_Minh) computed by the caller (avoid `Date.now()`-in-lib testability issues by passing `day` in).
- A pure helper `todayKey(date: Date): string` (testable) for the `YYYY-MM-DD` derivation.

### 4.3 Chat API route (`src/app/api/ptalk-chat/route.ts`, new — `runtime = "nodejs"`)
- `POST` handler:
  1. **Auth:** `const session = await auth();` — if no `session?.user`, return `401` `{ error: "auth" }`.
  2. **Validate:** parse `{ message: string, conversationId?: string }`; reject empty / over ~1000 chars → `400`.
  3. **Rate-limit:** `day = todayKey(now)`, `count = getUsage(userId, day)`; if `count >= DAILY_LIMIT` → `429` `{ error: "limit", remaining: 0 }`.
  4. **Call Dify:** `POST PTALK_DIFY_URL` with `Authorization: Bearer PTALK_DIFY_KEY`, body `{ inputs: {}, query: message, response_mode: "blocking", user: userId, conversation_id: conversationId ?? "" }`. Timeout ~30s.
  5. On Dify success: `incrementUsage(userId, day)`; return `200` `{ answer: data.answer, conversationId: data.conversation_id, remaining }`.
  6. On Dify error/timeout: `502` `{ error: "upstream" }` (do **not** increment).
- The Dify key is only ever read server-side. Errors return generic codes (no upstream details leaked).
- `GET` handler (optional, for the UI to show remaining on load): returns `{ authed: boolean, remaining: number }` for the current session (no message sent, no increment).

### 4.4 Chat UI (`src/components/home/PTalkChat.tsx`, new, client)
- States:
  - **Not signed in:** a panel with a short prompt + a "Sign in to try" button (links to the existing sign-in). (Reads `useSession()`.)
  - **Signed in:** a message list (user + PTalk bubbles), an input + send button, a small **quota line** ("còn N lượt hôm nay" / "N tries left today"), and the **privacy note** ("Đoạn chat thử này không được lưu lại" / "This demo chat isn't saved").
- Behaviour:
  - On submit: optimistic user bubble; `POST /api/ptalk-chat` with `{ message, conversationId }`; show a typing indicator; append the answer; update `remaining`; keep `conversationId` in **React state only** (in-memory — multi-turn within the session, nothing persisted; lost on refresh → consistent with "not saved").
  - Errors: `401` → switch to the sign-in state; `429` → friendly "đã hết lượt hôm nay, quay lại ngày mai" and disable input; `502`/network → "PTalk đang bận, thử lại sau" inline, keep input.
  - Empty/disabled states handled; Enter-to-send; input disabled while awaiting.
  - No chat persistence: nothing written to localStorage or a server store beyond the usage counter.
- Bilingual via `useLocale`. Reuse existing tokens/bubbleable styles; lucide icons (e.g. `Send`, `Lock`).

### 4.5 SpotlightSection layout (`src/components/home/SpotlightSection.tsx`, modify)
- Restructure to: a header block (existing eyebrow + title + lead + the 3 feature chips, kept), then a `grid lg:grid-cols-2` with **Stage (3D) on the left** and **`<PTalkChat />` on the right**; single column on mobile (3D then chat). Keep the existing 3D `Stage`/`RobotViewer` intact (callouts unchanged).

### 4.6 Strings (`src/content/ui.ts`)
- New `ui.ptalkChat` block (all `Localized`): `title`/intro line, `placeholder` (input), `send`, `signInPrompt`, `signInCta`, `quota` ("{n} tries left today" / "còn {n} lượt hôm nay" — interpolate n), `limitReached`, `error`, `privacyNote`, `thinking`.

## 5. Behaviour & quality
- **Security:** the Dify app key is server-only (env), never in client bundles or responses. The route gates on a real session; the per-user counter prevents abuse/cost blowout. Generic error codes (no upstream leakage).
- **Privacy:** no chat content is stored by the website (only an integer per user/day). The visible note states this.
- **Rate limit:** enforced server-side (client quota line is advisory only). Per account per calendar day (Asia/Ho_Chi_Minh).
- **Accessibility:** input has a label; send is a real button; messages region is readable; focus states; reduced motion respected (typing indicator is subtle).
- **Bilingual**; existing tokens; no `eslint-disable`; no `react-hooks/set-state-in-effect`.
- **Resilience:** Dify timeout/error degrades gracefully; the rest of the home page is unaffected (chat is an isolated island).

## 6. Out of scope
- **Voice** (STT/TTS) — text only.
- **Anonymous** access / IP-based limits — login required.
- **Streaming** responses (typewriter) — use Dify `blocking` mode for slice 1; streaming is a future enhancement.
- **Web-side moderation / banned-words** — handled inside the Dify app; can be added later.
- **Persisting chat history** — explicitly not stored (per the privacy note).
- Building/altering RAG or the Dify app itself; multi-app chat.

## 7. Testing
- **Unit (Vitest, node):**
  - `todayKey(new Date("2026-06-23T20:00:00Z"))` → correct `YYYY-MM-DD` for Asia/Ho_Chi_Minh.
  - `getUsage`/`incrementUsage` against a temp DB (`:memory:` or a tmp file): increments, isolates per `user_id`+`day`, `remaining` math.
- **Route logic:** a thin testable helper for the limit decision (`remaining`, `limit reached`) covered by unit tests; the Dify fetch is exercised manually (needs the real key).
- **Manual/live (after the user supplies `PTALK_DIFY_KEY`):** signed-out → sign-in state; signed-in → ask a question → grounded answer appears; quota decrements; after the limit → friendly block; the privacy note is visible; refresh clears the conversation; mobile reflow OK; the Dify key never appears in the page source / network response body. Verified via `npm run build` + `pm2 restart cts-redesign`.
