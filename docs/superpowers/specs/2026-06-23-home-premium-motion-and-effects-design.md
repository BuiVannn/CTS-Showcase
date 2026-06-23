# Home — Premium Motion, Ambient Effects & Text Choreography

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Homepage (`src/app/page.tsx` and `src/components/home/*`), shared UI primitives, and the global design system (`globals.css`, `layout.tsx`). No palette or font changes — those are locked (Plus Jakarta Sans display, Be Vietnam Pro body, JetBrains Mono utility; red+blue brand).

---

## 1. Goal

The leader wants the site to feel **more alive, premium ("sang, xịn"), and dynamic** — richer ambient background and cursor motion, with vibes spanning **tech, academic, and game**. Three concrete problems and asks:

1. **Atmosphere is flat.** No cursor interaction, no living background beyond a static hero grid + glow.
2. **Section labels read too small.** The `.eyebrow` labels ("Tương tác", "Hợp tác", "Tiêu biểu", and the inline "Đăng nhập một lần") sit at 0.7rem and get lost next to body and headlines — weak visual hierarchy.
3. **Empty space on the homepage** is under-used.
4. **Text should feel alive as you read it** — content reveals that draw attention section by section.

### Direction decided with the user
- **Vibe:** Hybrid — tech-academic as the default voice; game/arcade energy concentrated in the Games & Showcase areas.
- **Cursor:** Ambient spotlight that follows the pointer + magnetic hover on key elements. Native cursor stays (no custom cursor).
- **Empty space:** Both — add atmosphere *and* new content modules.
- **New modules:** "What we do" 4-pillar grid, an upgraded big Impact stats band, and a Games teaser (arcade) strip.

---

## 2. Signature element — "The lab responds to you"

A faint **living technical grid** runs behind the page. It is nearly invisible at rest, but the **area around the cursor illuminates** — like an instrument/oscilloscope coming alive. This single motif unifies the cursor spotlight and the reactive grid into one idea: *the lab reacts to your presence*.

- Default areas glow **cool (blue)**.
- **Games & Showcase** areas swap to **warm neon (red/pink)** to signal "play".

Everything else stays quiet and disciplined so this signature is the one thing remembered. This deliberately avoids the generic AI-design defaults (cream+serif, acid-green-on-black, broadsheet).

---

## 3. Ambient effect system (global, performance-first)

All ambient layers live in one mounted component tree so they share a single pointer listener and a single rAF loop.

### 3.1 Components
- **`CursorSpotlight`** (new, `src/components/fx/CursorSpotlight.tsx`)
  - A fixed, full-viewport layer with a soft radial gradient (blue→red blend) tracking the pointer.
  - Pointer position written to CSS variables (`--mx`, `--my`) via a single `pointermove` + `requestAnimationFrame` loop. **No React state per move** (this is what caused prior scroll stutter).
  - `pointer-events: none`, `z-index` below content, above background.
  - Spring/lerp smoothing for a premium trailing feel.
- **`AmbientField`** (new, `src/components/fx/AmbientField.tsx`)
  - The living grid + slow-drifting aurora blobs. Grid brightness near the cursor driven by the same `--mx/--my` vars (CSS radial mask), so it costs nothing extra.
  - Aurora blobs animate with CSS `transform`/`opacity` keyframes only (GPU-friendly, no scroll coupling).
  - Accepts a `tone` prop: `"cool" | "warm"` to switch glow color per section.
- **`GrainOverlay`** (new, `src/components/fx/GrainOverlay.tsx`)
  - A static, tiled SVG/PNG noise at very low opacity over the whole page for tactile "xịn". Zero runtime cost.

### 3.2 Where they mount
- `CursorSpotlight` + `GrainOverlay`: mounted once in `layout.tsx` (page-wide).
- `AmbientField`: hero uses it (`tone="cool"`); Games teaser & Showcase use it (`tone="warm"`). Other sections inherit only the page-wide grain + occasional aurora.

### 3.3 Magnetic hover
- Reuse the existing `Magnetic` component on: hero CTAs (already), the 4 pillar cards, the VR card, Games teaser CTA. Used sparingly — primary actions only.

---

## 4. Section header & type hierarchy fix

Root cause: tiny eyebrow + modest section title. Fix in `globals.css` + a unified `SectionHeader`.

### 4.1 Type scale
- `.text-section`: `clamp(1.7rem, 4vw, 2.8rem)` → **`clamp(2rem, 5vw, 3.6rem)`** (bigger, more presence).
- `.eyebrow`: `0.7rem` → **`0.78rem`**, keep uppercase + tracking; render as a **marker** (see below).

### 4.2 Eyebrow as a "marker"
The eyebrow becomes a label with a **leading rule line** that draws in on reveal, plus the existing brand dot:

```
──────  ✦ TƯƠNG TÁC
        Meet PTalk            ← title, much larger
```

- Rule line: a 1px gradient hairline, width animates `0 → ~3rem` on enter.
- The label gets a touch more weight and a hover/idle micro-glow tied to the signature (desktop only, optional).

### 4.3 Inline emphasis
Inline strong phrases like **"Đăng nhập một lần"** (SSO) get a subtle **chip**: tinted `--blue-soft` background, rounded, bold — so they stop reading as plain small text.

### 4.4 Unification
All home sections route their headers through the upgraded `SectionHeader` (currently Spotlight/Ecosystem/Partners hand-roll eyebrow+title). One component, consistent rhythm.

---

## 5. Text motion system — "đọc tới đâu sống tới đó"

**Principle (from design discipline):** orchestrated, not scattered. Each section has **one lead choreography**; effects run **once** (on enter), collapse to a plain fade under `prefers-reduced-motion`, and **never** char-animate body copy (readability first).

A single reusable mechanism (extend the existing `Reveal` + `SplitText`) exposes variants:

| Variant | Applies to | Effect |
|---|---|---|
| `title` | section titles, hero | Word/line rise behind a clip mask; brand keyword settles into color with a single highlight sweep |
| `marker` | eyebrows | Rule line draws in, dot pops, label fades up |
| `lines` | body / lead paragraphs | Line-by-line rise + fade, ~40ms stagger (no per-char) |
| `scramble` | tiny mono labels (`// …`, `PTIT · VR`, `LIVE`) | Short scramble/typing reveal — terminal/tech signature, tiny labels only |
| `count` | stats / impact numbers | Count-up on enter |
| `stagger` | lists, feature rows, card grids | Children fade-up in sequence |

- **Choreography order per section:** marker → title → lead → supporting (stats/lists/cards). Gives a readable "wave" as each section enters.
- **Optional signature tie-in (desktop, nice-to-have):** brand keywords brighten when the cursor is near, reusing `--mx/--my`.

New/extended primitives:
- `src/components/ui/Scramble.tsx` (new) — the mono-label scramble.
- `src/components/ui/CountUp.tsx` (new, or fold into the impact band) — number count-up.
- Extend `SplitText` / `Reveal` to support the `title`/`lines` clip-rise variants.

---

## 6. New content modules

### 6.1 "Chúng tôi làm gì" — 4-pillar thesis grid (NEW)
- Placed **right after the hero** as the page's thesis.
- Four pillars: **Robot · Thế giới VR · Công cụ AI · Games** (bilingual via the content layer).
- Each: icon, one-line description, hover micro-interaction (magnetic + tone glow). Games pillar uses the warm tone.
- Component: `src/components/home/WhatWeDo.tsx`; copy in `src/content/ui.ts` (or a small `home` content block).

### 6.2 Impact band (UPGRADE of `HomeStats`)
- Full-width band, **large count-up numbers** on a living-grid background.
- Reuses existing stat copy (`ui.home.statApps/statScenes/statTeam/statPartner`).
- Count-up via `CountUp`, triggered on enter.

### 6.3 Games teaser — arcade strip (NEW)
- Placed near Ecosystem, linking to `/games`.
- Game-vibe accents: neon edge-glow cards, springy hover (scale + slight tilt), warm `AmbientField`.
- If game content isn't ready, ships as an inviting teaser ("Sắp ra mắt" already exists in copy) rather than empty.
- Component: `src/components/home/GamesTeaser.tsx`.

### 6.4 Resulting home order
`Hero → WhatWeDo (4 pillars) → Spotlight (PTalk 3D) → Impact band → Showcase → Ecosystem → GamesTeaser → Partners → CTA → Footer`

---

## 7. Quality floor — performance & accessibility (REQUIRED)

These are acceptance criteria, not nice-to-haves. The site previously had scroll stutter; motion must not regress it.

- **`prefers-reduced-motion: reduce`** disables: cursor spotlight, aurora drift, grain shimmer (grain may stay static), text choreography → simple fade or none, count-up → final value shown immediately.
- **Touch / no-hover devices:** cursor spotlight + grid-follow disabled (gated on `(hover: hover) and (pointer: fine)`).
- **Animate only `transform` / `opacity`.** No layout-thrashing properties; no animation bound to scroll event handlers.
- **Single pointer listener + single rAF** across ambient layers; pointer writes to CSS vars, not React state.
- **Once-only reveals** (`whileInView`, `viewport={{ once: true }}`).
- **Keyboard focus** stays clearly visible; ambient layers are `pointer-events: none` and `aria-hidden`.
- **Mobile:** ambient effects degrade gracefully; new modules reflow to single column.

---

## 8. Implementation phases

1. **Foundation:** `globals.css` type-scale + marker eyebrow; upgraded `SectionHeader`; route all home sections through it. *(Lowest risk, immediate hierarchy win.)*
2. **Ambient FX:** `CursorSpotlight`, `AmbientField`, `GrainOverlay`; mount in `layout.tsx`; wire hero + warm sections. Verify no scroll jank.
3. **Text choreography:** `Scramble`, `CountUp`, extend `Reveal`/`SplitText`; apply the per-section choreography.
4. **New modules:** `WhatWeDo`, Impact band upgrade, `GamesTeaser`; update `page.tsx` order.
5. **Polish & verify:** reduced-motion pass, touch pass, mobile reflow, performance check; deploy (`npm run build` + `pm2 restart cts-redesign`).

Each phase is independently shippable and independently verifiable in the live app.

---

## 9. Out of scope
- Palette / font changes (locked).
- Building out the actual Games page content (teaser only).
- Non-home pages (products, team, vr-tour) — may inherit the global cursor spotlight + grain, but their layouts are unchanged here.
