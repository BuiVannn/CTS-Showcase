# Game Hub & play page — UI polish + bilingual (3.7a.2)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Polish the Game Hub (`/games`) and the game play page (`/games/[slug]`) to look finished and consistent with the rest of the site, and make both fully bilingual (they are currently Vietnamese-only). No backend; same single game. Sets the visual bar for when the upload feature later populates the hub.

---

## 1. Goal

Make the Game Hub feel like a real product surface: a tidy hub with attractive game cards, and a play page with the game framed cleanly beside an info panel. Both pages localize via the existing `ui.games` tokens. Keep it consistent with the site's existing components/tokens — no new aesthetic.

## 2. Decisions (settled with the user)

- **Polish first** (before the big student-upload feature). Scoped, consistent, not gold-plated for a one-game hub.
- **Hub:** small hero + game cards with a 16:9 cover (branded placeholder for now), hover lift, a "Unity · WebGL" badge, title + "by author · year".
- **Play page:** two-column on desktop (game embed left, info panel right: title, author/year, blurb, badges, fullscreen hint, back-to-hub); stacked on mobile. Keep the fullscreen button + heavy-game note.
- **Bilingual:** move each page's content into a client view component (using `useLocale` + `ui.games`), keeping the route files as server wrappers — mirrors the existing `ProductDetail` pattern.

## 3. Architecture & components

### 3.1 Data (`src/content/types.ts`, `src/content/games.ts`)
- Add `tags?: string[]` to the `Game` interface; set `tags: ["Unity", "WebGL"]` on the `tyrp` entry (plain tech labels — not localized).

### 3.2 Strings (`src/content/ui.ts`)
- Reuse existing `ui.games` (`hubTitle`, `hubLead`, `play`, `by`, `fullscreen`, `breadcrumb`, `heavyNote`).
- Add: `about` ("About" / "Giới thiệu"), `backToHub` ("Back to Game Hub" / "Quay lại Game Hub"), `fullscreenHint` ("Tap ⛶ for fullscreen" / "Bấm nút ⛶ để chơi toàn màn hình").

### 3.3 Hub view (`src/components/games/GameHubView.tsx`, new, client)
- Reads `getGames()` + `useLocale`. Renders: eyebrow ("Games", with `eyebrow-draw`) + `hubTitle` + `hubLead`; then a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) of game cards.
- Each card (a `<Link href={'/games/'+slug}>`): `<GameCover game={g} />` with a small **"Unity · WebGL"** badge overlaid (from `g.tags`, joined with " · ", shown only if tags exist); below: title + "{by} {author} · {year}". Hover lift (existing card style).
- Optional: a subtle `AmbientField tone="warm"` behind the hero (consistent with the games warm tone) — keep light.

### 3.4 Play view (`src/components/games/GamePlayView.tsx`, new, client)
- Props: `game: Game` (server passes the resolved entry — plain serializable data).
- Layout: breadcrumb (CTS Lab › `breadcrumb` › title) + a back-to-hub link (`backToHub`); then a two-column grid on `lg` (game embed in the wider column, info panel in the other), single column on mobile.
- Embed column: `<GameEmbed src={game.embedPath} title={game.title} />` + the `heavyNote` + `fullscreenHint`.
- Info panel: title, "{by} {author} · {year}", the `blurb`, tag badges (`game.tags`), and a clear note that it plays in the browser.
- Bilingual via `useLocale`.

### 3.5 Route wrappers
- `src/app/games/page.tsx` (server): keep `metadata`; render `<Navbar/><main…><GameHubView/></main><Footer/>`.
- `src/app/games/[slug]/page.tsx` (server): keep `generateStaticParams`, `generateMetadata`, `getGame`+`notFound`; render `<Navbar/><main…><GamePlayView game={g}/></main><Footer/>`. (The inline VI breadcrumb/back/notes move into `GamePlayView` and become bilingual.)

### 3.6 Badge component (optional small)
- A tiny inline badge (reuse the existing `Badge`/`Tag` component if it fits) for the "Unity · WebGL" tags on cards + the info panel.

## 4. Behaviour & quality
- **Single source of truth:** hub + play + static params still derive from `getGames()`.
- **Cover fallback:** unchanged — `GameCover` shows the branded placeholder when no `cover` (tyrp has none).
- **Bilingual:** every visible string via `t(...)`; the EN/VI toggle now switches the Games pages too.
- **Responsive:** hub grid reflows; play page is 2-col on `lg`, stacked below; the embed stays 16:9.
- **Motion/a11y:** reuse existing `Reveal`/`Stagger`/tokens; the back link + fullscreen button are real labelled controls; respects reduced motion via existing components.
- Existing tokens/components only; no new dependencies; no `eslint-disable`; no `react-hooks/set-state-in-effect`.

## 5. Out of scope
- The student game-upload / registration / moderation / sandbox-origin platform (the big feature — separate project, later).
- Real cover art / screenshots (placeholder stays; user can drop a `cover` later → drop-in).
- The in-iframe canvas sizing (already fixed); changing the Unity bundle.
- Adding more games (only the one exists).

## 6. Testing
- **Unit (Vitest):** extend `src/content/games.test.ts` — `getGame("tyrp")?.tags` includes "Unity"/"WebGL".
- **Manual/live:** hub shows the polished card (cover + badge + author); play page shows the 2-col layout (embed + info), the back-to-hub link works, fullscreen works; toggling EN/VI switches all Games-page text; mobile reflow OK. Verified via `npm run build` + `pm2 restart cts-redesign` + a click-through. (The game still plays — the iframe content is unchanged.)
