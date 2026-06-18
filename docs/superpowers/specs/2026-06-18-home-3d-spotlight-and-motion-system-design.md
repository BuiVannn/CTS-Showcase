# CTS Lab — Interactive 3D PTalk spotlight + site-wide motion system

**Date:** 2026-06-18
**Status:** Approved direction; design for review.
**Owner:** namnx (frontend) · CTS Lab @ PTIT
**Builds on:** `2026-06-18-cts-lab-academic-tech-redesign-design.md` (the "Academic Tech" design system already shipped).

---

## 1. Context & goals

The "Academic Tech" redesign (red + blue, light/dark, clean) has shipped. It looks correct but
feels **under-animated and a little sparse**: only `HomeHero` and `ShowcaseSection` move, every
other home section and **all** sub-pages are static. The old site also had one well-loved feature
that the redesign dropped: an **interactive 3D model of the PTalk robot** ("Gặp gỡ PTalk") that
visitors could drag to rotate and scroll to zoom.

This spec covers two intertwined pieces of work:

1. **Re-introduce the interactive 3D PTalk spotlight** on the home page, restyled to the current
   Academic Tech system (not the old "Soft Futurism" glass look).
2. **Introduce a small, reusable motion foundation** and apply it consistently across the home page
   and every sub-page, so the whole site feels alive, premium ("sang"), and coherent.

### Decisions locked in (from brainstorming)

- **Scope:** whole site — build a shared motion layer, enrich the home page (incl. 3D), then apply
  the same vocabulary to Products, Product detail, Team, VR, Games.
- **Animation character:** **tasteful & elegant**, not cinematic. Smooth scroll reveals, the 3D
  model, light parallax, count-up stats, refined hover / CTA micro-interactions. Stays academic;
  never busy.
- **3D placement:** a **dedicated "Gặp gỡ PTalk" section immediately after the hero**, restyled to
  Academic Tech (border + soft brand glow instead of frosted glass).
- **Hero card:** the flat red placeholder card (red box + two white circles) is **replaced** with
  the real VR thumbnail (`public/img/vr.jpg`) in a media frame + play overlay.
- **Partners:** a **restrained staggered reveal** (no auto-scrolling marquee — keeps it academic).

### Success criteria ("done")

- The 3D PTalk model renders in a dedicated home section, is draggable (rotate), zoomable (scroll),
  auto-rotates gently, and is lazy-loaded (three.js stays out of the initial bundle; no SSR crash).
- A shared motion library (`Reveal`, `Stagger`/`StaggerItem`, `CountUp`, `Magnetic` + expanded
  `lib/motion.ts`) exists and is the single source of reveal/stagger behaviour.
- Every home section and every sub-page uses that library — consistent easing, timing, and hover
  language across the whole site. No section is visibly static anymore (except where motion would
  be inappropriate, e.g. the VR iframe).
- All motion is disabled / reduced under `prefers-reduced-motion`. Both light and dark themes intact.
- No new heavyweight dependencies (no GSAP). `npm run build`, `npm run lint`, `npm run test` pass.

---

## 2. Non-goals

- No change to the Academic Tech palette, typography, or the light/dark token system.
- No new routes or content restructuring. (Copy for the 3D section already exists in `ui.spotlight`.)
- No GSAP / ScrollTrigger or other scroll libraries — Motion (`motion/react`) + Lenis already cover
  the "tasteful" target.
- No scroll-scrubbed / pinned timelines or animated gradient-mesh backgrounds (that was the
  "cinematic" option, explicitly not chosen).
- No changes to the VR tour's underlying iframe experience (only its loading state may be polished).
- No new 3D assets — reuse the existing `public/model/robot.glb` + `public/draco/` decoder.

---

## 3. Existing assets & constraints (verified)

- `public/model/robot.glb` (≈2.18 MB) and `public/draco/` decoder **already present** in this repo.
- Deps already installed: `three`, `@react-three/fiber`, `@react-three/drei`, `motion`, `lenis`.
- `src/content/ui.ts` already contains `ui.spotlight` = `{ eyebrow: "Tương tác/Interactive",
  title: "Gặp gỡ PTalk/Meet PTalk", lead: …, hint: "Kéo để xoay · cuộn để phóng to/…" }`. **Reuse as-is.**
- Design tokens in `globals.css`: `--blue #2563eb`, `--red #e11b22`, `--blue-soft`, `--red-soft`,
  `--border`, `--card`, `--surface`, `--ink`, `--ink-2`, `--dim`, `--shadow-*`, radii. Dark-mode
  brand values: `--blue #5b8def`, `--red #f2555b`.
- `src/lib/motion.ts` exports `EASE = [0.2, 0.7, 0.2, 1]`, plus `staggerContainer` / `fadeUpItem`
  variants that are currently **defined but unused** (HomeHero/ShowcaseSection inline their own).
- The reference `YirLodt-Showcase/src/components/RobotViewer.tsx` and `Spotlight.tsx` use **removed
  tokens** (`--coral`, `--border-strong`, `--gradient-soft`, `text-coral-ink`, `.glass-strong`).
  These MUST be remapped to current tokens — do not reintroduce the old design system.

---

## 4. The motion foundation (new shared layer)

Goal: one small vocabulary every page imports, so motion is consistent and DRY. All components are
client components, live in `src/components/ui/`, and **no-op gracefully under reduced motion**.

### 4.1 `src/lib/motion.ts` (expand)

Keep `EASE`. Add a single canonical variant set and remove the dead/duplicated ones:

- `fadeUp(distance = 24)` → `{ hidden:{opacity:0,y:distance}, show:{opacity:1,y:0, transition:{duration:0.7, ease:EASE}} }`
- `fadeIn` → opacity only.
- `scaleIn` → `{opacity:0, scale:0.96}` → `{opacity:1, scale:1}`.
- `staggerContainer(stagger = 0.08, delayChildren = 0.05)` → factory.
- Re-export `fadeUpItem` semantics via the above so existing imports keep working, then migrate
  HomeHero/ShowcaseSection to the shared `Reveal`/`Stagger` components.

### 4.2 `src/components/ui/Reveal.tsx`

A scroll-reveal wrapper. Props:
`{ children, as?, direction?: "up"|"down"|"left"|"right"|"none", distance?=24, delay?=0,
  once?=true, className?, ... }`.

- Uses `motion.<as>` with `initial="hidden"`, `whileInView="show"`,
  `viewport={{ once, margin: "-60px" }}`.
- `useReducedMotion()` → when true, render a plain element (no transform, fully visible).
- This replaces the inline `whileInView` pattern in `ShowcaseSection` and the per-element `rise()`
  helper in `HomeHero`.

### 4.3 `src/components/ui/Stagger.tsx` + `StaggerItem`

- `Stagger` = a container using `staggerContainer()` with `whileInView` trigger.
- `StaggerItem` = a child using the `fadeUp` variant.
- For grids (Showcase, Ecosystem, Products, Team) so children cascade in. Reduced-motion → plain.

### 4.4 `src/components/ui/CountUp.tsx`

- `{ value: string, durationMs?=1400 }`. Parses the numeric portion of a stat (e.g. `"164"`,
  `"05"`) and animates 0→N when it scrolls into view (Motion `useInView` + `animate`/`useMotionValue`).
- Preserves non-numeric values verbatim (e.g. `"PTIT"`) and zero-padding (e.g. `"05"`).
- Reduced-motion → render the final value immediately. Used by `StatBand` / `HomeStats`.

### 4.5 `src/components/ui/Magnetic.tsx`

- Wraps a CTA; on pointer move within bounds, translates the child slightly toward the cursor
  (spring), resets on leave. Small amplitude (~6–10px). Pointer-fine devices only;
  reduced-motion / touch → passthrough (renders children, no transform).
- Applied to the single most-important CTA per screen (hero primary, HomeCTA primary).

**Isolation note:** each component answers "what does it do / how to use / what it depends on"
cleanly and is independently testable. `CountUp`'s number-parsing is pure and unit-tested.

---

## 5. The 3D PTalk spotlight

### 5.1 `src/components/home/RobotViewer.tsx` (client-only)

Ported from the reference, **restyled**:

- `Canvas` `camera={{ position:[0,0,4], fov:35 }}`, `dpr={[1,2]}`, `gl={{ antialias:true, alpha:true }}`,
  `style={{ touchAction:"pan-y" }}` (so vertical page scroll still works over the canvas on mobile).
- Lighting: keep soft studio setup but recolor the two rim `pointLight`s to **brand** tints —
  red `#f2555b` and blue `#5b8def` (read well in both themes) instead of the old coral/violet.
- `<Bounds fit clip margin={1}><Center><primitive object={scene} /></Center></Bounds>` to frame once.
- `OrbitControls`: `makeDefault`, `enablePan={false}`, `autoRotate={!reduce}`, `autoRotateSpeed≈1.1`,
  `enableDamping`, `dampingFactor≈0.08`, `zoomSpeed≈0.8`. (Drag = rotate, wheel = zoom.)
- `useGLTF(MODEL, DRACO)` with `useGLTF.preload`. `MODEL = "/model/robot.glb"`, `DRACO = "/draco/"`.
- `Loader` (drei `Html` + `useProgress`): spinner border `var(--border)` + `var(--red)` top, `%` in
  `text-dim`. **Swap removed tokens** `--border-strong`→`--border`, `--coral`→`--red`, `text-muted`→`text-dim`.

### 5.2 `src/components/home/SpotlightSection.tsx`

The "Gặp gỡ PTalk" section. Layout mirrors the screenshot, restyled to Academic Tech:

- `<section className="section">`, `Container`, two-column grid
  (`lg:grid-cols-2`, `items-center`, `gap-12`).
- **Left (copy)** wrapped in `Reveal`: `eyebrow` = `t(ui.spotlight.eyebrow)`; `h2.text-section` =
  `t(ui.spotlight.title)`; `p.text-ink-2` = `t(ui.spotlight.lead)`; a hint pill with `Rotate3d` icon =
  `t(ui.spotlight.hint)` styled `bg` `var(--red-soft)`, text `text-red`, `rounded-[var(--radius-pill)]`.
- **Right (3D stage)** wrapped in `Reveal delay={0.1}`:
  - Outer frame: `rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-lg)]`.
  - Behind the canvas, a soft **dual radial glow** ground: red + blue (`--red`/`--blue` at low alpha),
    plus the faint grid motif used in the hero (consistency).
  - Canvas area: `relative aspect-square w-full` (responsive: `sm:aspect-[4/3] lg:aspect-square`).
  - `RobotViewer` loaded via `next/dynamic(() => import("./RobotViewer"), { ssr:false, loading:<spinner/> })`.
  - A small "PTalk" chip top-right: `Sparkles` icon + label, `border bg-card/90` (matches the screenshot
    badge), not the old `.glass-strong`.
- Mounted in `src/app/page.tsx` **between `HomeHero` and `HomeStats`**.

### 5.3 Performance / safety

- three.js never enters the initial bundle (dynamic `ssr:false`); the section renders a lightweight
  spinner until the chunk + model load.
- Draco decoder served locally (no CDN). Model preloaded on the client only.
- Auto-rotate disabled under reduced motion. `touchAction: pan-y` preserves page scroll on mobile.

---

## 6. Home page enrichment (per section)

`src/app/page.tsx` order becomes: `HomeHero → SpotlightSection → HomeStats → ShowcaseSection →
EcosystemBento → Partners → HomeCTA`.

- **HomeHero** — migrate `rise()` to shared `Reveal`/`Stagger`. **Replace** the flat red placeholder
  card: use `MediaFrame` with `public/img/vr.jpg`, a centered play-button overlay, a subtle sheen
  sweep on hover, and the existing `★ Featured` chip + caption. Add light **mouse-parallax** to the
  two ambient background glows (reduced-motion → static). Wrap the hero primary CTA in `Magnetic`.
- **HomeStats** — `StatBand` numbers animate via `CountUp` on view; reveal the SSO card.
- **ShowcaseSection** — keep reveal (migrate to `Stagger`); add gentle media zoom-on-hover in `MediaFrame`/`Card`.
- **EcosystemBento** — currently static → wrap cards in `Stagger`/`StaggerItem`; keep `Card` hover lift.
- **Partners** — wrap links in `Stagger` (restrained, no marquee); keep hover color shift.
- **HomeCTA** — wrap in `Reveal`; animate the radial glow subtly (slow opacity/scale breathing,
  reduced-motion → static); `Magnetic` + sheen on the primary "Email us" button.

---

## 7. Site-wide consistency (apply the same vocabulary)

- **Products (`ProductsGrid`)** — wrap cards in `Stagger`; media zoom-on-hover.
- **Product detail (`ProductDetail`)** — `Reveal` the image block and the spec/feature blocks (slight
  stagger); breadcrumb unchanged.
- **Team (`TeamGrid`)** — `Stagger` the member cards; subtle hover lift (reuse `Card` language).
- **Games / `StubPage`** — `Reveal` the `EmptyState`.
- **Navbar** — add an animated active-link indicator (Motion `layoutId` underline) that slides between
  links; keep existing scroll-aware blur + mobile menu.
- **VR tour (`VRTourShell`)** — polish the loading state only (the iframe experience is unchanged).
- **UI primitives** — `Button` primary variants get a consistent sheen/press language; ensure
  `MediaFrame` supports an optional `hover-zoom` so Showcase/Products share one implementation.

Everything uses the same `EASE`, the same reveal distances/timings, and the same hover idioms →
visual coherence across routes.

---

## 8. Accessibility & quality bar

- `useReducedMotion()` honored in every new component; CSS `@media (prefers-reduced-motion: reduce)`
  already globally clamps durations — new JS-driven motion must independently no-op too.
- 3D: keyboard users aren't trapped; the canvas is decorative-interactive (the section's meaning is
  in the copy). Provide the text hint ("Kéo để xoay · cuộn để phóng to").
- No layout shift from reveals (elements occupy final space; only opacity/transform animate).
- Maintain focus-visible rings and existing color-contrast.

---

## 9. Testing & verification

- **Unit (vitest):** `CountUp` number parsing (`"164"`→164, `"05"`→preserves pad, `"PTIT"`→passthrough);
  `Reveal`/`Stagger` reduced-motion fallback (renders children, no motion props) — light DOM assertions.
- **Build/lint:** `npm run build` (verifies dynamic import + three.js chunking + SSR safety),
  `npm run lint`, `npm run test` all green.
- **Manual:** drag-rotate + scroll-zoom the model; toggle light/dark (rim lights + glows read well in
  both); toggle EN/VI (spotlight copy switches); set `prefers-reduced-motion` and confirm everything is
  static and the model doesn't auto-rotate; mobile — vertical page scroll works over the canvas.

---

## 10. Files

**New**
- `src/components/ui/Reveal.tsx`
- `src/components/ui/Stagger.tsx` (exports `Stagger` + `StaggerItem`)
- `src/components/ui/CountUp.tsx`
- `src/components/ui/Magnetic.tsx`
- `src/components/home/RobotViewer.tsx`
- `src/components/home/SpotlightSection.tsx`
- tests: `src/components/ui/CountUp.test.ts` (+ reveal reduced-motion test)

**Modified**
- `src/lib/motion.ts` (expand variants)
- `src/app/page.tsx` (insert `SpotlightSection`)
- `src/components/home/HomeHero.tsx`, `HomeStats.tsx`, `ShowcaseSection.tsx`,
  `EcosystemBento.tsx`, `Partners.tsx`, `HomeCTA.tsx`
- `src/components/ui/StatBand.tsx` (use `CountUp`), `MediaFrame.tsx` (optional hover-zoom),
  `Button.tsx` (sheen), `Navbar.tsx` (active-link indicator)
- `src/components/products/ProductsGrid.tsx`, `ProductDetail.tsx`,
  `src/components/team/TeamGrid.tsx`, `src/components/StubPage.tsx`,
  `src/components/VRTourShell.tsx` (loading state)

**Unchanged (reuse):** `public/model/robot.glb`, `public/draco/*`, `src/content/ui.ts` (`ui.spotlight`).

---

## 11. Rollout / sequencing (for the implementation plan)

1. Motion foundation (`lib/motion.ts`, `Reveal`, `Stagger`, `CountUp`, `Magnetic`) + tests.
2. 3D: `RobotViewer` + `SpotlightSection`, wire into `page.tsx`. Verify drag/zoom/lazy-load.
3. Home enrichment (hero card swap, stats count-up, ecosystem/partners/CTA reveals).
4. Site-wide application (products, detail, team, games, navbar indicator, VR loading).
5. Full verification pass (build/lint/test + manual matrix in §9).
