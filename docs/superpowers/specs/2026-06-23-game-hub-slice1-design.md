# Game Hub — Slice 1: host the lab's game (Quick win 3.7a)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** First slice of the Game Hub: host the leader-provided Unity WebGL game ("To Your Right Places!") as a static bundle, turn `/games` (currently a stub) into a real **Game Hub** listing it, and add a **play page** `/games/<slug>` that embeds the game in a sandboxed iframe (playable in-browser). **Excludes** the full platform (student registration, user uploads, deploy, moderation) — those are later slices.

---

## 1. Goal

Give the leader a visible, working result: a Game Hub page that lists the lab's game and a play page where it runs in the browser. This validates the Unity-WebGL hosting + sandboxed-iframe approach that the full user-upload Game Hub will reuse, while deferring the hard/risky parts.

## 2. Key technical finding (de-risked)

The game's `.unityweb` files are **gzip-compressed** (magic `1f 8b 08`) and the Unity loader ships with a **decompression fallback** (it decompresses in JS when the server doesn't send `Content-Encoding`). Therefore the bundle **works served as plain static files** from `public/` — **no server header configuration needed**. (If a future build lacks fallback, headers or pre-decompression would be required — out of scope here.)

## 3. Decisions (settled with the user)

- **Embed:** sandboxed `<iframe>` pointing at the game's own static `index.html` (self-contained, isolated, sets the pattern for future user games).
- **Cover:** placeholder now (branded fallback tile); the user supplies a real cover image later (drop-in, no code change).
- **Scope:** Hub `/games` + play page `/games/<slug>` only. The homepage Games teaser is unchanged (it already links to `/games`, which becomes the real hub).

## 4. Architecture & components

### 4.1 Static game bundle
- Copy the bundle `game/TYRP_CTSLab/` → **`public/games/tyrp/`** (its `index.html`, `Build/`, `TemplateData/`). Next.js serves it statically; the iframe loads `/games/tyrp/index.html`.
- This commits ~21 MB of Unity binaries to git — acceptable for one game; **note:** for many games later, move to external/object storage or git-lfs.

### 4.2 Games content (`src/content/games.ts`, new)
- A `Game` type: `{ id, slug, title, author, year, embedPath, cover?, blurb? }` (`blurb` localized; `title`/`author` plain).
- One entry: `tyrp` → title "To Your Right Places!", author "KillDee8", `embedPath: "/games/tyrp/index.html"`, no `cover` yet (→ placeholder).
- `getGames()` / `getGame(slug)` accessors (same repository-seam pattern as products).

### 4.3 Game Hub page (`src/app/games/page.tsx`, replace the stub)
- Replace `StubPage` with a real hub: heading + lead, then a grid of **game cards** (cover image if `game.cover`, else a branded placeholder tile with the title + a gamepad icon), each linking to `/games/<slug>`. Reuse `Navbar`/`Footer`/`Container`/`Card`.

### 4.4 Play page (`src/app/games/[slug]/page.tsx`, new)
- Server component: `getGame(slug)` or `notFound()`; `generateStaticParams` from `getGames()`.
- Breadcrumb (CTS Lab › Games › title) + title/author + the embed + a "back to hub" link. A light note that the game is heavy / best on desktop.
- `metadata` per game.

### 4.5 Embed component (`src/components/games/GameEmbed.tsx`, new, client)
- A responsive 16:9 container holding the `<iframe src={embedPath}>` with:
  - `sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"`, `allow="fullscreen; autoplay; gamepad"`, `allowFullScreen`, `title`.
  - A **fullscreen button** (parent control calling `iframe.requestFullscreen()`).
- Same-origin is acceptable here (trusted lab game). **Future user-uploaded games must be served from a separate sandbox origin** — noted for the next slice.

### 4.6 Strings (`src/content/ui.ts` or a small block)
- Bilingual: hub title/lead, "Play"/"Chơi", "Fullscreen"/"Toàn màn hình", "by"/"bởi", the heavy-game/desktop note, breadcrumb "Games".

### 4.7 Cover fallback
- A `GameCover` (or inline) that renders `<Image src={game.cover}>` when set, else a branded placeholder (gradient + title + icon). Drop a file + set `cover` later to upgrade.

## 5. Behaviour & quality
- **Loads & plays:** the iframe loads the game; the Unity loader decompresses the gzip `.unityweb` via its fallback; the game is playable.
- **Responsive:** the embed is a 16:9 container that scales to width; on mobile it still loads (Unity handles mobile canvas) with the "best on desktop" note.
- **Isolation:** the game runs in an iframe (sandbox attrs above); it cannot navigate or restyle the host page.
- **Accessibility:** the iframe has a `title`; the fullscreen button is a real labelled button; hub cards are real links.
- **Bilingual**; existing tokens only; no new dependencies; no `eslint-disable`.
- **Performance:** the 21 MB bundle loads only on the play page (not the hub or home); the hub shows lightweight cover tiles.

## 6. Out of scope (explicitly)
- Student registration, **user game uploads**, auto-deploy, moderation, per-user dashboards — the full itch.io-style platform (later slices).
- A separate sandbox serving origin (needed only for untrusted user games later).
- Changes to the homepage Games teaser / EcosystemBento gamehub card (they already point to `/games`).
- Real cover art (placeholder now).
- Optimising/repacking the Unity bundle or moving it to external storage (note for scaling).

## 7. Testing
- **Unit (Vitest):** `getGame("tyrp")` returns the entry with the right `embedPath`/`slug`; `getGames().length >= 1`. (Pure data, repo pattern.)
- **Manual/live:** `/games` lists the game (placeholder cover); clicking opens `/games/tyrp`; the iframe loads and the game becomes playable; fullscreen works; the static assets serve (`/games/tyrp/index.html` → 200, a `.unityweb` → 200). Verified via `npm run build` + `pm2 restart cts-redesign`.
