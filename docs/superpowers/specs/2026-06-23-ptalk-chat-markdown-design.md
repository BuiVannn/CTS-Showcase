# PTalk chat — render Markdown + math in answers (3.4 follow-up)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Render PTalk's chat answers as **Markdown** (bold/italic/lists/headings/code) and **math** (KaTeX), instead of raw text. The model returns Markdown + LaTeX (`\[…\]`, `\(…\)`); the current bubble shows the raw markup. User bubbles stay plain text. No backend/route changes.

---

## 1. Goal

Answers like `**Ý nghĩa**`, `- bullet`, and `\[ (a+b)^2 = a^2 + 2ab + b^2 \]` should display as formatted text and typeset math, so the demo looks finished.

## 2. Decision (settled with user)

Full **Markdown + KaTeX math** rendering for assistant bubbles.

## 3. Architecture & components

### 3.1 Dependencies (new)
- `react-markdown` (Markdown → React; **does not render raw HTML by default → no XSS**), `remark-gfm` (GFM lists/tables/strikethrough), `remark-math` + `rehype-katex` + `katex` (math). React 19 compatible (react-markdown v9+).

### 3.2 Math-delimiter normalization (`src/lib/normalize-math.ts`, new, pure + testable)
- The model emits LaTeX `\[ … \]` (display) and `\( … \)` (inline); `remark-math` expects `$$…$$` / `$…$`. A pure helper converts them:
  - `normalizeMath(s: string): string` — `\[`/`\]` → `$$`, `\(`/`\)` → `$` (global, function replacers so `$` isn't interpreted as a replacement token).
- Unit-tested.

### 3.3 Message renderer (`src/components/home/MessageContent.tsx`, new, client)
- `MessageContent({ content }: { content: string })`: wraps `<ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{normalizeMath(content)}</ReactMarkdown>` in a `<div className="ptalk-md">`.
- Imports the KaTeX stylesheet: `import "katex/dist/katex.min.css"` (third-party CSS from node_modules — allowed in any component in the App Router).
- No `rehypeRaw` (keep raw HTML disabled for safety).

### 3.4 Styling (`src/app/globals.css`)
- A small `.ptalk-md` block (no typography plugin needed): readable spacing for `p`, `ul`/`ol`/`li` (list markers visible), `strong`/`em`, inline `code` + `pre` (mono, subtle bg), `a` (blue, underline), `h1`–`h4` (sizing), and `.katex-display { overflow-x: auto }` so wide display math scrolls inside the narrow bubble instead of overflowing.

### 3.5 Wire into the chat (`src/components/home/PTalkChat.tsx`, modify)
- Assistant bubbles render `<MessageContent content={m.content} />`; **user** bubbles keep plain `{m.content}`. Keep the existing bubble container/colors; the markdown sits inside the assistant bubble.

## 4. Behaviour & quality
- **Safety:** no raw HTML execution (react-markdown default; no `rehype-raw`).
- **Math:** `\[…\]`/`\(…\)`/`$$…$$`/`$…$` typeset via KaTeX; display math scrolls horizontally if wide.
- **Markdown:** bold, italics, lists, headings, links, inline/blocks of code render cleanly; emoji already work (Unicode).
- **No regressions:** user messages, quota line, privacy note, sign-in state, error/limit handling unchanged.
- Existing tokens for the wrapper; no `eslint-disable`; no `react-hooks/set-state-in-effect`. KaTeX CSS adds ~a stylesheet + fonts (loaded only where MessageContent is used).

## 5. Out of scope
- Streaming/typewriter rendering.
- Syntax-highlighted code blocks (plain `code`/`pre` styling is enough).
- Changing the route, the model, or the grounding prompt (a separate optional tweak; not part of this).
- Rendering Markdown in the **user's** own messages.

## 6. Testing
- **Unit (Vitest):** `normalizeMath("\\[ x^2 \\]")` → `"$$ x^2 $$"`; `normalizeMath("\\(3x+5\\)")` → `"$3x+5$"`; leaves plain text and existing `$…$` untouched.
- **Manual/live:** ask PTalk a question that returns bold/list/math (e.g. the `(a+b)^2` identity) → the bold/list render formatted and the formula typesets; wide math scrolls inside the bubble; user bubbles stay plain; sign-in/quota/privacy unaffected. Verified via `npm run build` + `pm2 restart cts-redesign`.
