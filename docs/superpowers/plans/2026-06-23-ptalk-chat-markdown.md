# PTalk Chat — Markdown + Math Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render PTalk's chat answers as Markdown + KaTeX math (instead of raw text); user bubbles stay plain.

**Architecture:** A pure `normalizeMath` helper converts the model's LaTeX delimiters (`\[…\]`/`\(…\)`) to `$$…$$`/`$…$`, then a client `MessageContent` component renders the answer via `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` (no raw HTML → no XSS), styled by a small `.ptalk-md` CSS block. Wired into the assistant bubbles in `PTalkChat`.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TypeScript, Vitest, `react-markdown`/`remark-gfm`/`remark-math`/`rehype-katex`/`katex`.

## Global Constraints

- **Safety:** do NOT enable raw HTML (no `rehype-raw`) — react-markdown's default (escaped HTML) prevents XSS from model output.
- **Only assistant bubbles** get Markdown; user bubbles stay plain text.
- No `eslint-disable`; no `react-hooks/set-state-in-effect`. Existing design tokens for styling.
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; tasks with tests `npx vitest run` green. Deploy in the final task.
- **Commit after every task**; `git add` specific paths only (NEVER `git add -A`). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/normalize-math.ts` (+ `src/lib/normalize-math.test.ts`)
- `src/components/home/MessageContent.tsx`

**Modify:**
- `src/app/globals.css` — `.ptalk-md` styles
- `src/components/home/PTalkChat.tsx` — assistant bubbles use `MessageContent`
- `package.json` — add the 5 deps

---

## Task 1: Deps + normalizeMath + MessageContent + styles

**Files:**
- Create: `src/lib/normalize-math.ts`, `src/lib/normalize-math.test.ts`, `src/components/home/MessageContent.tsx`
- Modify: `src/app/globals.css`, `package.json`

**Interfaces:**
- Produces: `normalizeMath(input: string): string`; `<MessageContent content={string} />`.

- [ ] **Step 1: Add dependencies**

Run: `npm install react-markdown remark-gfm remark-math rehype-katex katex`
Expected: installs cleanly (all are React-19-compatible). If the production `npm run build` later fails on ESM interop for these packages, add them to `transpilePackages` in `next.config.ts` (contingency — verify against the Next 16 docs); do not hand-edit node_modules.

- [ ] **Step 2: Write the failing test**

`src/lib/normalize-math.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normalizeMath } from "./normalize-math";

describe("normalizeMath", () => {
  it("converts display delimiters \\[ \\] to $$", () => {
    expect(normalizeMath("\\[ x^2 \\]")).toBe("$$ x^2 $$");
  });
  it("converts inline delimiters \\( \\) to $", () => {
    expect(normalizeMath("\\(3x+5\\)")).toBe("$3x+5$");
  });
  it("leaves plain text and emoji untouched", () => {
    expect(normalizeMath("Chào em 🌼 **đậm**")).toBe("Chào em 🌼 **đậm**");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/normalize-math.test.ts`
Expected: FAIL — cannot find module `./normalize-math`.

- [ ] **Step 4: Implement the helper**

`src/lib/normalize-math.ts`:

```ts
/**
 * Convert the LaTeX delimiters models emit (\[ \] for display, \( \) for inline)
 * to the $$…$$ / $…$ syntax remark-math understands. Function replacers keep
 * "$" from being treated as a replacement token.
 */
export function normalizeMath(input: string): string {
  return input
    .replace(/\\\[/g, () => "$$")
    .replace(/\\\]/g, () => "$$")
    .replace(/\\\(/g, () => "$")
    .replace(/\\\)/g, () => "$");
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/normalize-math.test.ts` → PASS; `npx vitest run` → green.

- [ ] **Step 6: Create MessageContent**

`src/components/home/MessageContent.tsx`:

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { normalizeMath } from "@/lib/normalize-math";

/** Renders an assistant answer as Markdown + KaTeX math. Raw HTML stays disabled (no XSS). */
export default function MessageContent({ content }: { content: string }) {
  return (
    <div className="ptalk-md">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {normalizeMath(content)}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 7: Add the markdown styles**

Append to `src/app/globals.css`:

```css
/* PTalk chat — rendered Markdown + KaTeX answers */
.ptalk-md { font-size: 0.875rem; line-height: 1.6; }
.ptalk-md > :first-child { margin-top: 0; }
.ptalk-md > :last-child { margin-bottom: 0; }
.ptalk-md p { margin: 0.5em 0; }
.ptalk-md ul { list-style: disc; padding-left: 1.25rem; margin: 0.5em 0; }
.ptalk-md ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5em 0; }
.ptalk-md li { margin: 0.2em 0; }
.ptalk-md strong { font-weight: 700; }
.ptalk-md em { font-style: italic; }
.ptalk-md a { color: var(--blue); text-decoration: underline; }
.ptalk-md code { font-family: var(--font-mono), monospace; font-size: 0.85em; background: var(--surface); padding: 0.1em 0.35em; border-radius: var(--radius-sm); }
.ptalk-md pre { background: var(--surface); padding: 0.75rem; border-radius: var(--radius-md); overflow-x: auto; margin: 0.5em 0; }
.ptalk-md pre code { background: none; padding: 0; }
.ptalk-md h1, .ptalk-md h2, .ptalk-md h3, .ptalk-md h4 { font-weight: 700; margin: 0.6em 0 0.3em; line-height: 1.3; }
.ptalk-md h1 { font-size: 1.15rem; }
.ptalk-md h2 { font-size: 1.05rem; }
.ptalk-md h3 { font-size: 1rem; }
.ptalk-md .katex-display { overflow-x: auto; overflow-y: hidden; margin: 0.5em 0; }
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/lib/normalize-math.ts src/lib/normalize-math.test.ts src/components/home/MessageContent.tsx`; `npx vitest run` green. (MessageContent isn't mounted yet — Task 2 — this confirms it compiles + the KaTeX CSS import resolves in the build.)

- [ ] **Step 9: Commit**

```bash
git add src/lib/normalize-math.ts src/lib/normalize-math.test.ts src/components/home/MessageContent.tsx src/app/globals.css package.json package-lock.json
git commit -m "feat(ptalk-chat): MessageContent — Markdown + KaTeX renderer + math normalization

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Wire MessageContent into the chat bubbles

**Files:**
- Modify: `src/components/home/PTalkChat.tsx`

- [ ] **Step 1: Render assistant bubbles via MessageContent**

In `src/components/home/PTalkChat.tsx`: add `import MessageContent from "./MessageContent";`. Replace the existing `messages.map(...)` block (the one rendering each `<div className={m.role === "user" ? "text-right" : "text-left"}>` with a `<span>` bubble) with a branch so assistant bubbles use `MessageContent` (a block element needs a `<div>` bubble, not `<span>`), while user bubbles stay plain:

```tsx
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="text-right">
              <span className="inline-block max-w-[85%] rounded-[var(--radius-md)] bg-blue px-3 py-2 text-sm text-white">
                {m.content}
              </span>
            </div>
          ) : (
            <div key={i} className="text-left">
              <div className="inline-block max-w-[85%] rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-ink">
                <MessageContent content={m.content} />
              </div>
            </div>
          ),
        )}
```

Leave everything else (header, quota, empty/thinking/limited/error lines, input, privacy note, sign-in state, the submit/effect logic) unchanged.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/home/PTalkChat.tsx`; `npx vitest run` green. Then `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "home: %{http_code}\n" http://localhost:3001/` → `200`.
- Chat island still renders: `curl -s http://localhost:3001/ | grep -c "Sign in to try\|Đăng nhập để chat\|không được lưu lại"` → ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/PTalkChat.tsx
git commit -m "feat(ptalk-chat): render assistant answers with Markdown + math

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. normalize-math tests). No stray `eslint-disable`.

- [ ] **Step 2: Safety + behaviour audit (code level)**

Confirm: `MessageContent` does NOT use `rehype-raw` / `dangerouslySetInnerHTML` (raw HTML stays escaped → no XSS from model output); only assistant bubbles use `MessageContent` (user bubbles plain); the KaTeX CSS import resolves; `.ptalk-md .katex-display` has `overflow-x:auto` (wide math scrolls inside the bubble). `grep -rn "rehype-raw\|dangerouslySetInnerHTML" src` → no results.

- [ ] **Step 3: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/` → `200`; chat island present (grep as in Task 2).

- [ ] **Step 4: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(ptalk-chat): markdown render audit fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes, do not create an empty commit — report results.

> **USER check:** sign in, ask PTalk something that returns bold/list/math (e.g. "viết hằng đẳng thức (a+b)^2") → the bold/list render formatted and the formula typesets; wide formulas scroll inside the bubble; user messages stay plain.

---

## Self-Review (completed during planning)

**Spec coverage:** §3.1 deps → Task 1. §3.2 normalizeMath + test → Task 1. §3.3 MessageContent → Task 1. §3.4 `.ptalk-md` styles → Task 1. §3.5 wire into PTalkChat → Task 2. §4 safety/quality → Task 1/2 + Task 3 audit. §6 testing → Task 1 (unit) + Task 3 + user check.

**Placeholder scan:** No TBD/TODO; complete code in every step. ESM-build contingency (Step 1) is explicit, not a placeholder.

**Type consistency:** `normalizeMath(string): string` defined Task 1, used by `MessageContent` (Task 1) which is imported by `PTalkChat` (Task 2). `MessageContent({content: string})` prop matches the call site `<MessageContent content={m.content} />`.

**Note for implementer:** `react-markdown` v9 children API takes the markdown string as the child (`<ReactMarkdown>{md}</ReactMarkdown>`), per the version installed — verify against its README if the installed major differs.
