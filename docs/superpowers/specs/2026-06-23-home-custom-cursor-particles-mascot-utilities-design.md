# Home — Custom Cursor, Particle Network, Games Mascot & Scroll Utilities

**Date:** 2026-06-23 (round 2)
**Status:** Draft for review
**Scope:** Homepage atmosphere + two site-wide scroll utilities. Builds on the round-1 motion work (spec `2026-06-23-home-premium-motion-and-effects-design.md`). No palette/font changes (Plus Jakarta Sans display, Be Vietnam Pro body, JetBrains Mono utility; red+blue brand).

---

## 1. Why this round

Round 1 shipped a cursor-following radial **spotlight** and a reactive grid + aurora ambient field. Feedback:
- The cursor spotlight reads as an **ugly soft smudge** on the light theme — remove it.
- The background motion is **too subtle** — the user wants visibly alive atmosphere (particles, drifting elements, a playful mascot).
- Two utility gaps: clicking the header logo should scroll to top (when already home), and there should be a **scroll-to-top button** bottom-right.

Decisions taken with the user:
- **Cursor:** replace the spotlight with a **custom dot + trailing ring** that morphs (and can show a label) on hover. Native cursor hidden only on capable devices.
- **Background:** an **interactive particle network** (drifting points connected by lines, reacting to the cursor) as the primary motif.
- **Mascot:** a small **robot mascot in the Games area only** (eyes follow cursor).
- **Performance:** **controlled `<canvas>`** — capped particle count, rAF, auto-pause off-screen, fully off under reduced-motion / touch.

---

## 2. Signature evolution — "the lab responds to you," made literal

A living **particle network** (reads as neurons / a constellation / connected knowledge) drifts behind the page and **links to the cursor**; a precise **custom cursor** makes the pointer itself feel like an instrument. In the **play zone** (Games) the particles turn warm and a small **robot mascot** watches the cursor. This keeps the academic-tech base with a game accent exactly where it belongs, and replaces the round-1 effects that didn't land.

---

## 3. Custom cursor (replaces round-1 CursorSpotlight)

**Component:** `src/components/fx/CustomCursor.tsx` (mounted once in `layout.tsx`, replacing `CursorSpotlight`, which is deleted).

**Behaviour:**
- A small **dot** tracks the pointer near-instantly; a larger **outline ring** trails it with spring/lerp smoothing.
- On hover over interactive targets (`a`, `button`, `[role="button"]`, `[data-cursor]`), the ring **grows / fills**. Elements may opt into a **label** via `data-cursor="Xem"` (or `Play`, `Kéo`) — the label renders inside/beside the ring (e.g. the hero VR card → "Xem", the PTalk 3D stage → "Kéo", the demo video → "Play").
- The **native cursor is hidden** (`cursor: none`) ONLY while the custom cursor is active.

**Implementation constraints:**
- Single `pointermove` listener + Motion motion values / `useSpring` (or one rAF) — position is written to transforms/motion values, **never** per-move React state.
- Mounted/active ONLY when `(hover: hover) and (pointer: fine)` matches AND `prefers-reduced-motion` is not set. On touch / reduced-motion the component renders nothing and the native cursor is untouched.
- `aria-hidden`, `pointer-events: none`, top-most z-index; must never intercept clicks or be lost behind content.
- Hover detection via event delegation (one set of listeners), or `useState` for the discrete hover/label state only (allowed — it changes on enter/leave, not per pixel). Position must not go through React state.
- Label text is content-driven and bilingual where it's real UI copy; short imperative verbs (`data-cursor` values) may be authored inline per element.

---

## 4. Particle network background (canvas)

**Component:** `src/components/fx/ParticleNetwork.tsx` — an `aria-hidden`, absolutely-positioned `<canvas>` that fills its `position: relative` parent. Prop `tone?: "cool" | "warm"` (blue default / red for play zones).

**Behaviour:**
- N points drift slowly; any two points within a distance threshold are joined by a line whose opacity fades with distance. Points and lines **near the cursor brighten** and connect to the pointer.
- Colors derive from brand tokens (`--blue` / `--red`) read once; subtle, not garish.

**Where used:**
- **Hero** — replaces the round-1 `AmbientField` grid layer (`tone="cool"`). A soft **aurora** underlay (kept from `AmbientField`) stays behind for color depth.
- **Games teaser** — `tone="warm"`, paired with the mascot.
- (Optional) **Impact band** — a low-density instance; if it complicates perf, keep the round-1 aurora there instead.

**Performance constraints (hard):**
- One `requestAnimationFrame` loop per canvas instance; **pause** when the canvas is off-screen (`IntersectionObserver`) and on tab blur.
- Particle count **scales to viewport area and is capped** (≈ 70 desktop / ≈ 30 small screens); never unbounded.
- Honor `devicePixelRatio` but cap at 2 for crispness without overdraw.
- **Disabled** under `prefers-reduced-motion` (render nothing, or a single static faint frame) and on touch / coarse pointer.
- Resize handling debounced; canvas cleared and loop cancelled on unmount.
- Animates pixels on its own canvas only — no layout, no scroll coupling, no per-frame React state.

**Round-1 cleanup:** remove the cursor-reactive **grid highlight** layer from `AmbientField` (the particle/cursor interaction supersedes it). Keep the aurora blobs (now an underlay) and the static grid may stay or be dropped per visual judgment.

---

## 5. Robot mascot (Games area only)

**Component:** `src/components/home/GamesMascot.tsx`, rendered inside `GamesTeaser`.

**Behaviour:**
- A small, lightweight **SVG/CSS robot** (on-brand — the lab builds robots) with an idle **bob** animation and **eyes that follow the cursor** while the pointer is within the games strip.
- Pure SVG + CSS transforms / one rAF for eye tracking (reusing the same pointer math pattern). No heavy art assets, no animation library.

**Constraints:**
- Reduced motion: no bob, eyes static (centered).
- Decorative → `aria-hidden`; does not affect layout/readability of the teaser copy or CTA.
- This is the most experimental piece — built **last**, easy to remove if it reads as cheesy. If a clean result isn't achievable quickly, ship the warm particle network alone and defer the mascot.

---

## 6. Scroll utilities (site-wide)

### 6.1 Header logo → scroll to top
- The header brand is already `<Link href="/">`. Add an `onClick`: when `usePathname() === "/"`, prevent navigation and smooth-scroll to top via the existing Lenis instance (`getLenis()?.scrollTo(0, …)`), falling back to `window.scrollTo({ top: 0 })`. On other routes, normal navigation to home (lands at top). Reduced motion → instant jump.

### 6.2 Scroll-to-top button (bottom-right)
- **Component:** `src/components/ui/ScrollToTop.tsx`, mounted once in `layout.tsx`.
- A fixed bottom-right circular button (brand-styled, matches the design system: `--radius-pill`, border/`bg-card`, shadow) with an up-arrow (lucide `ArrowUp`).
- **Hidden until** the user has scrolled past ~1 viewport; fades/slides in, fades out near the top. Visibility driven by the Lenis scroll event (or a passive `scroll` listener) — a discrete `useState(boolean)` toggled at a threshold is fine (it flips rarely, not per pixel).
- Click → smooth-scroll to top (Lenis / `window.scrollTo`); reduced motion → instant.
- Accessible: `aria-label` ("Lên đầu trang" / "Back to top" via `t(...)`), visible focus, ≥ 44px touch target, sits clear of the footer and other fixed UI; respects safe-area insets on mobile.

---

## 7. Quality floor (REQUIRED — acceptance criteria)

- **`prefers-reduced-motion: reduce`** disables: custom cursor (native cursor restored), particle network, mascot bob, and converts both scroll-to-top behaviors to instant jumps.
- **Touch / coarse pointer** (`(hover: hover) and (pointer: fine)` is false): custom cursor and particle-cursor interaction disabled; native cursor untouched; scroll-to-top button still works.
- **Performance:** one rAF per canvas; off-screen + tab-blur pause; capped particle counts; cursor position via transforms/motion values, never per-move React state; canvas work never causes layout/scroll jank (the site previously stuttered — this is a hard bar).
- **No `react-hooks/set-state-in-effect`** violations and no stray `eslint-disable` (project lints this as an error).
- **Cursor never lost / never blocks input:** custom cursor is `pointer-events: none`; `cursor: none` is applied only while the custom cursor is mounted and active.
- **Bilingual:** all real UI strings (`Back to top`, etc.) via `t(...)`.
- Clean keyboard focus everywhere; ambient/cursor/mascot layers are `aria-hidden`.

---

## 8. Implementation phases

1. **Scroll utilities** (lowest risk, immediate value): header-logo-to-top + `ScrollToTop` button.
2. **Custom cursor:** `CustomCursor` + delete `CursorSpotlight`; wire `data-cursor` labels on the hero VR card, PTalk stage, demo video.
3. **Particle network:** `ParticleNetwork` canvas; wire into hero (cool) + games (warm); remove the round-1 reactive-grid layer from `AmbientField`; keep aurora.
4. **Mascot:** `GamesMascot` in the games teaser (built last; optional).
5. **Polish & verify:** reduced-motion, touch, mobile, performance (frame-rate sanity on scroll); production build + `pm2 restart cts-redesign`.

Each phase is independently shippable and verifiable in the live app.

---

## 9. Out of scope
- Palette / font changes (locked).
- WebGL/shader/fluid backgrounds (the user chose controlled canvas; revisit only if canvas proves insufficient).
- Site-wide mascot / mascot following the cursor across all pages (games-area only this round).
- Reworking round-1 deliverables that the user is happy with (hierarchy, Scramble/RevealLines choreography, WhatWeDo, Impact band copy, GamesTeaser layout) beyond the specific changes named above.
- Building out the actual Games page content.
