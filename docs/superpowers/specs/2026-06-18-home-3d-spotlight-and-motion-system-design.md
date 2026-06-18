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
- **Scrollytelling (added):** a curated, tasteful subset of scroll-driven storytelling —
  multi-layer **hero parallax**, a thin site-wide **scroll-progress bar**, and **one pinned
  "scrollytelling moment" on the PTalk 3D section** (sticky stage + feature captions revealed on
  scroll + scroll-driven model rotation). Explicitly **rejected**: scroll-hijacking horizontal
  galleries, pervasive pinning, animated gradient-mesh backgrounds. Scroll-linked motion must stay
  in service of real content, never effect-for-effect's-sake.
- **3D placement:** a **dedicated "Gặp gỡ PTalk" section immediately after the hero**, restyled to
  Academic Tech (border + soft brand glow instead of frosted glass).
- **Hero card:** the flat red placeholder card (red box + two white circles) is **replaced** with
  the real VR thumbnail (`public/img/vr.jpg`) in a media frame + play overlay.
- **Partners:** a **restrained staggered reveal** (no auto-scrolling marquee — keeps it academic).

### Success criteria ("done")

- The 3D PTalk model renders in a dedicated home section, is draggable (rotate), zoomable (scroll),
  auto-rotates gently, and is lazy-loaded (three.js stays out of the initial bundle; no SSR crash).
- A shared motion library (`Reveal`, `Stagger`/`StaggerItem`, `CountUp`, `Magnetic`,
  `ScrollProgress` + expanded `lib/motion.ts`) exists and is the single source of reveal/stagger
  behaviour.
- Scrollytelling works and degrades gracefully: multi-layer hero parallax, a site-wide scroll-progress
  bar, and the **pinned PTalk moment** (sticky stage + scroll-advanced captions + scroll-driven model
  rotation) on desktop — with a clean non-pinned fallback on mobile and under reduced motion.
- Every home section and every sub-page uses that library — consistent easing, timing, and hover
  language across the whole site. No section is visibly static anymore (except where motion would
  be inappropriate, e.g. the VR iframe).
- All motion is disabled / reduced under `prefers-reduced-motion`. Both light and dark themes intact.
- No new heavyweight dependencies (no GSAP). `npm run build`, `npm run lint`, `npm run test` pass.

---

## 2. Non-goals

- No change to the Academic Tech palette, typography, or the light/dark token system.
- No new routes or content restructuring. (Copy for the 3D section already exists in `ui.spotlight`.)
- No GSAP / ScrollTrigger or other scroll libraries — Motion (`motion/react`) `useScroll` /
  `useTransform` / `useSpring` + Lenis already cover the curated scrollytelling target.
- No animated gradient-mesh backgrounds, no scroll-hijacking horizontal galleries, and no
  *pervasive* pinning. Scroll-scrubbed motion is limited to **one** curated moment (the PTalk 3D
  section) plus light hero parallax and the progress bar — not a site-wide cinematic timeline.
- No changes to the VR tour's underlying iframe experience (only its loading state may be polished).
- No new 3D assets — reuse the existing `public/model/robot.glb` + `public/draco/` decoder.

---

## 3. Existing assets & constraints (verified)

- `public/model/robot.glb` (≈2.18 MB) and `public/draco/` decoder **already present** in this repo.
- Deps already installed: `three`, `@react-three/fiber`, `@react-three/drei`, `motion`, `lenis`.
- `src/content/ui.ts` already contains `ui.spotlight` = `{ eyebrow: "Tương tác/Interactive",
  title: "Gặp gỡ PTalk/Meet PTalk", lead: …, hint: "Kéo để xoay · cuộn để phóng to/…" }`. Reuse;
  **extend** it with a `steps` array (3 bilingual feature captions for the pinned scrollytelling
  moment, §5.2) — proposed:
  `[{title:"Trò chuyện giọng nói/Voice-native", desc:"Đối thoại tự nhiên bằng giọng nói/Natural spoken dialogue"},
    {title:"Thời gian thực/Realtime", desc:"Phản hồi tức thì, độ trễ thấp/Instant, low-latency responses"},
    {title:"Học tập/Built for learning", desc:"Trợ lý đồng hành cho lớp học STEM/A companion for STEM classrooms"}]`.
  (Final wording confirmed with the user before/at implementation.)
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

### 4.6 `src/components/ui/ScrollProgress.tsx`

- A thin (2–3px) fixed bar at the very top of the viewport tracking page scroll progress.
- `useScroll()` → `scaleX` bound to `scrollYProgress` (transform-origin left), spring-smoothed.
- Brand gradient fill (`--blue` → `--red`), `z` above content, `pointer-events-none`,
  `aria-hidden`. Reduced-motion → still tracks position (it's an indicator, not decoration) but
  without spring overshoot.
- Mounted **once in the root layout** (`src/app/layout.tsx`) so it is consistent on every route.

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
- `OrbitControls`: `makeDefault`, `enablePan={false}`, `autoRotate={!reduce && !scrollDriven}`,
  `autoRotateSpeed≈1.1`, `enableDamping`, `dampingFactor≈0.08`, `zoomSpeed≈0.8`.
  (Drag = rotate, wheel = zoom. User interaction always overrides scroll-driven rotation.)
- **Scroll-driven rotation (for §5.2 pinned moment):** optional prop
  `progress?: MotionValue<number>` (0→1). When provided, an inner `useFrame` reads it and eases the
  model's `rotation.y` across a target arc (≈ -0.5 → +0.5 rad) — so scrolling "turns the robot to
  face you." `progress` absent (or reduced-motion) → fall back to `autoRotate`. While the user is
  actively dragging (`OrbitControls` "start"/"end" events), pause scroll application so input wins.
- `useGLTF(MODEL, DRACO)` with `useGLTF.preload`. `MODEL = "/model/robot.glb"`, `DRACO = "/draco/"`.
- `Loader` (drei `Html` + `useProgress`): spinner border `var(--border)` + `var(--red)` top, `%` in
  `text-dim`. **Swap removed tokens** `--border-strong`→`--border`, `--coral`→`--red`, `text-muted`→`text-dim`.

### 5.2 `src/components/home/SpotlightSection.tsx` — pinned scrollytelling moment

The "Gặp gỡ PTalk" section. On desktop it is the home page's one **pinned scrollytelling moment**:
the 3D stage stays put while feature captions scroll past and the model turns with scroll. Restyled
to Academic Tech (border + soft brand glow, not frosted glass).

**Structure (desktop / pointer-fine, motion allowed):**
- Outer `<section ref={sectionRef}>` is **tall** (≈ `h-[280vh]`) to give the pin scroll room.
- `useScroll({ target: sectionRef, offset: ["start start", "end end"] })` → `scrollYProgress`.
- A **sticky inner wrapper** (`sticky top-0 h-screen flex items-center`) holds a two-column grid:
  - **Left (copy + steps):** `eyebrow` = `t(ui.spotlight.eyebrow)`; `h2.text-section` =
    `t(ui.spotlight.title)`; `p.text-ink-2` = `t(ui.spotlight.lead)`. Below, the **step captions**
    from `ui.spotlight.steps`: each step's active state is derived from `scrollYProgress` (segment
    the 0→1 range by step count). The active step is fully opaque with a brand accent bar; inactive
    steps are dimmed (`text-dim`, low opacity). Transitions are opacity/translate only.
  - **Right (3D stage):** the framed canvas.
    - Outer frame: `rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-lg)]`.
    - Behind the canvas, a soft **dual radial glow** ground (red + blue, low alpha) + the faint grid
      motif from the hero (consistency).
    - Canvas area: `relative aspect-square w-full`.
    - `RobotViewer` loaded via `next/dynamic(() => import("./RobotViewer"), { ssr:false, loading:<spinner/> })`,
      passed `progress={scrollYProgress}` so the model rotates with scroll (§5.1).
    - "PTalk" chip top-right: `Sparkles` + label, `border bg-card/90` (not `.glass-strong`).
  - A hint pill with `Rotate3d` icon = `t(ui.spotlight.hint)` (`bg var(--red-soft)`, `text-red`,
    `rounded-[var(--radius-pill)]`).

**Fallback (mobile `< lg`, OR `prefers-reduced-motion`):** no pin, no scroll-scrub. Render a normal
short `section` with the same two columns via `Reveal` (copy) + `Reveal delay={0.1}` (stage), and the
steps as a simple stacked list (all visible). `RobotViewer` gets no `progress` (auto-rotate, or static
under reduced motion). This is the §5.2 behaviour the original design described — kept intact as the
graceful baseline. The choice is made with a `lg` media query + `useReducedMotion()` (render the
non-pinned variant when either applies) so mobile never inherits a janky sticky/scrub.

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
  sweep on hover, and the existing `★ Featured` chip + caption. Wrap the hero primary CTA in `Magnetic`.
  **Multi-layer scroll parallax:** `useScroll` on the hero → `useTransform` drives the background grid,
  the two brand glows, the headline, and the VR card at **different `y` speeds** (back layers move
  more, foreground less) with a slight opacity fade as the hero exits — creating depth on scroll.
  Plus light **mouse-parallax** on the glows. All parallax is `transform`/`opacity` only and is
  **disabled under `prefers-reduced-motion`** (static layers).
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
  Pure step-segmentation helper for `SpotlightSection` (map progress 0→1 to active step index) unit-tested.
- **Build/lint:** `npm run build` (verifies dynamic import + three.js chunking + SSR safety),
  `npm run lint`, `npm run test` all green.
- **Manual:** drag-rotate + scroll-zoom the model; toggle light/dark (rim lights + glows read well in
  both); toggle EN/VI (spotlight copy + step captions switch); scroll-progress bar fills 0→100%;
  hero layers parallax at different speeds; **PTalk pin** holds while captions advance and the model
  turns with scroll, then releases cleanly; set `prefers-reduced-motion` → everything static, no
  auto-rotate, **no pin** (stacked fallback); mobile (`< lg`) → non-pinned fallback, and vertical page
  scroll works over the canvas (no scroll trap).

---

## 10. Files

**New**
- `src/components/ui/Reveal.tsx`
- `src/components/ui/Stagger.tsx` (exports `Stagger` + `StaggerItem`)
- `src/components/ui/CountUp.tsx`
- `src/components/ui/Magnetic.tsx`
- `src/components/ui/ScrollProgress.tsx`
- `src/components/home/RobotViewer.tsx`
- `src/components/home/SpotlightSection.tsx`
- tests: `src/components/ui/CountUp.test.ts` (+ reveal reduced-motion test + spotlight step-segmentation test)

**Modified**
- `src/lib/motion.ts` (expand variants)
- `src/content/ui.ts` (add `ui.spotlight.steps` — 3 bilingual feature captions)
- `src/app/layout.tsx` (mount `ScrollProgress`)
- `src/app/page.tsx` (insert `SpotlightSection`)
- `src/components/home/HomeHero.tsx`, `HomeStats.tsx`, `ShowcaseSection.tsx`,
  `EcosystemBento.tsx`, `Partners.tsx`, `HomeCTA.tsx`
- `src/components/ui/StatBand.tsx` (use `CountUp`), `MediaFrame.tsx` (optional hover-zoom),
  `Button.tsx` (sheen), `Navbar.tsx` (active-link indicator)
- `src/components/products/ProductsGrid.tsx`, `ProductDetail.tsx`,
  `src/components/team/TeamGrid.tsx`, `src/components/StubPage.tsx`,
  `src/components/VRTourShell.tsx` (loading state)

**Unchanged (reuse):** `public/model/robot.glb`, `public/draco/*`, `src/content/site.ts`.

---

## 11. Rollout / sequencing (for the implementation plan)

1. Motion foundation (`lib/motion.ts`, `Reveal`, `Stagger`, `CountUp`, `Magnetic`, `ScrollProgress`)
   + tests; mount `ScrollProgress` in the layout.
2. 3D base: `RobotViewer` (with optional `progress` rotation prop) + the **non-pinned fallback**
   `SpotlightSection`, wired into `page.tsx`. Verify drag/zoom/lazy-load first.
3. Scrollytelling: upgrade `SpotlightSection` to the pinned/scroll-scrub variant (sticky stage,
   `ui.spotlight.steps` captions, scroll-driven rotation) with the mobile/reduced-motion fallback;
   add hero multi-layer parallax. Verify pin + fallbacks.
4. Home enrichment (hero card swap, stats count-up, ecosystem/partners/CTA reveals).
5. Site-wide application (products, detail, team, games, navbar indicator, VR loading).
6. Full verification pass (build/lint/test + manual matrix in §9).
