# Stage 2 — Navigable Shell + Home Front Door Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the global chrome (Navbar/Footer) to the Academic Tech system, rebuild the Home page as a polished front door using the Stage-1 primitives, and stub the not-yet-built routes with an on-brand "coming soon" so the whole site is coherent and demo-ready (no broken Soft Futurism pages, no 404s).

**Architecture:** Builds on Stage 1's design system (tokens, theme, primitives in `src/components/ui/`). Home is composed from small `"use client"` section components (they need `useLocale()` for bilingual copy) assembled by a Server Component `page.tsx`. Navigation moves from in-page anchors to real routes. Not-yet-built routes render a shared `EmptyState`.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind v4 · motion/react · Lenis · lucide-react. Bilingual content via the existing `LocaleProvider` (`useLocale().t`).

## Global Constraints

- **Design tokens & primitives are from Stage 1** — use the utilities (`bg-bg`, `bg-card`, `bg-surface`, `text-ink`, `text-ink-2`, `text-dim`, `bg-blue`, `bg-red`, `border-border`, `font-mono`) and components (`Button`, `Card`, `Badge`, `Tag`, `Container`, `SectionHeader`, `StatBand`, `ThemeToggle`). DO NOT reintroduce Soft Futurism (`glass`, `glass-strong`, `btn-gradient`, `--coral`, `--violet`, `aurora`, `grain`, `--gradient-accent`, `--shadow-coral`, `--border-strong`, `text-muted`, `text-coral-ink`).
- **Colour 70/20/10:** neutral base; blue = primary buttons/links/active nav; red = brand accent ONLY (logo wordmark, the VR Tour CTA, "MỚI/Sắp ra mắt" badges, the gamehub feature card). ≤ 2–3 red touches per screen.
- **Bilingual:** every user-facing string via `useLocale().t(Localized)`. Pattern `Localized<T> = { en: T; vi: T }`. New copy added to `src/content/ui.ts` / `src/content/site.ts` using that exact shape. Brand/proper nouns stay plain strings.
- **Routes (Stage 2 surface):** `/` (rebuilt), `/products` `/games` `/team` (stubbed with EmptyState), `/vr-tour` (unchanged, keep krpano iframe), `/styleguide` (unchanged). Nav links to routes, not anchors.
- **Server/Client:** section components that call `useLocale()` are `"use client"`. Route `page.tsx` files are Server Components that export `metadata` and render those sections. `Navbar`, `Footer` stay client.
- **Truthful content:** stats use only verifiable numbers (ecosystem app count, 164 VR scenes, PTIT). Do not invent metrics (no fabricated "students reached").
- **Verification:** `npm run build`, `npm run lint`, `npm run test` must all pass after every task. Visual checks via `npm run dev`.
- **Reduced motion** respected (existing pattern). All work in `/home/namnx/ctslab-redesign` on a branch off `main`.

---

### Task 1: Route-based nav config + Home/stub copy

**Files:**
- Modify: `src/content/site.ts` (the `nav` array)
- Modify: `src/content/ui.ts` (add a `home` block)

**Interfaces:**
- Produces: `site.nav` entries whose `id` is a route path (`/`, `/products`, `/games`, `/team`); `ui.home` localized copy consumed by Home sections and stub pages.

- [ ] **Step 1: Replace the `nav` array in `src/content/site.ts`**

```ts
  nav: [
    { id: "/", label: { en: "Home", vi: "Trang chủ" } },
    { id: "/products", label: { en: "Products", vi: "Sản phẩm" } },
    { id: "/games", label: { en: "Games", vi: "Games" } },
    { id: "/team", label: { en: "Team", vi: "Đội ngũ" } },
  ],
```

- [ ] **Step 2: Add a `home` block to the `ui` object in `src/content/ui.ts`** (insert before the closing `};`)

```ts
  home: {
    heroWord1: { en: "Learn.", vi: "Học." } as Localized,
    heroWord2: { en: "Create.", vi: "Sáng tạo." } as Localized,
    heroWordAccent: { en: "Play.", vi: "Chơi." } as Localized, // rendered in brand red
    gamehubName: { en: "CTS Gamehub", vi: "CTS Gamehub" } as Localized,
    gamehubBlurb: {
      en: "Browse and play the lab's games — rolling out soon.",
      vi: "Duyệt và chơi game của lab — sắp ra mắt.",
    } as Localized,
    statApps: { en: "AI products", vi: "Sản phẩm AI" } as Localized,
    statScenes: { en: "360° VR scenes", vi: "Cảnh VR 360°" } as Localized,
    statPartner: { en: "Academic partner", vi: "Đối tác học thuật" } as Localized,
    comingSoon: { en: "Coming soon", vi: "Sắp ra mắt" } as Localized,
    underConstruction: {
      en: "This section is being rebuilt — check back soon.",
      vi: "Mục này đang được hoàn thiện — quay lại sau nhé.",
    } as Localized,
  },
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass. (Navbar still reads `site.nav` via `scrollTo`; it will be rewritten in Task 5. The route ids starting with `/` are valid strings — no type break.)

- [ ] **Step 4: Commit**

```bash
git add src/content/site.ts src/content/ui.ts
git commit -m "feat(content): route-based nav + home/stub copy"
```

---

### Task 2: Shared primitives — EmptyState, Breadcrumb, MediaFrame

**Files:**
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/Breadcrumb.tsx`
- Create: `src/components/ui/MediaFrame.tsx`

**Interfaces:**
- Produces:
  - `<EmptyState title icon? children?>` — centered card-ish block for thin/coming-soon areas. `title: string`, optional `icon: ReactNode`, optional `children` (e.g. a Button).
  - `<Breadcrumb items>` — `items: { label: string; href?: string }[]`; last item is current (no link).
  - `<MediaFrame src alt ratio? className?>` — `next/image` wrapper enforcing a fixed aspect ratio (default `"16 / 9"`), `object-cover`, rounded, bordered.

- [ ] **Step 1: Create `src/components/ui/EmptyState.tsx`**

```tsx
import type { ReactNode } from "react";

export default function EmptyState({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-border bg-surface px-8 py-16 text-center">
      {icon && <div className="text-dim">{icon}</div>}
      <h2 className="text-display text-xl text-ink">{title}</h2>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/Breadcrumb.tsx`**

```tsx
import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-xs text-dim">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link href={c.href} className="transition-colors hover:text-blue">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "text-ink-2" : undefined}>{c.label}</span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 3: Create `src/components/ui/MediaFrame.tsx`**

```tsx
import Image from "next/image";

export default function MediaFrame({
  src,
  alt,
  ratio = "16 / 9",
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
    </div>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/EmptyState.tsx src/components/ui/Breadcrumb.tsx src/components/ui/MediaFrame.tsx
git commit -m "feat(ui): EmptyState, Breadcrumb, MediaFrame primitives"
```

---

### Task 3: Re-skin Footer

**Files:**
- Modify: `src/components/Footer.tsx` (replace Soft Futurism classes with new tokens)

**Interfaces:**
- Consumes: `useLocale`, `site`, `ui`. Produces: a re-skinned `<Footer />` (same content, new tokens).

- [ ] **Step 1: Replace the markup classes in `src/components/Footer.tsx`**

Keep the imports, the three SVG icon components, the `socials` array, and `useLocale`/`year` logic exactly as-is. Replace ONLY the returned JSX (from `return (` to the closing `);`) with:

```tsx
  return (
    <footer className="section pb-12">
      <div className="container-x">
        <div className="rounded-[var(--radius-lg)] border border-border bg-card p-7 shadow-[var(--shadow-sm)] sm:p-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <Image src="/img/cts-logo.jpg" alt="CTS Lab" width={36} height={36} className="h-9 w-9 rounded-[10px] object-contain" />
                <span className="text-display text-sm font-semibold text-ink">{site.siteNameShort}</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">{t(site.footerDescription)}</p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-dim">{t(ui.footer.contact)}</h3>
              <div className="mt-4 space-y-3 text-sm text-ink-2">
                <a href={`mailto:${site.contact.email}`} className="flex items-center gap-3 transition-colors hover:text-blue">
                  <Mail size={14} /> {site.contact.email}
                </a>
                <p className="flex items-center gap-3"><Phone size={14} /> {site.contact.phone}</p>
                <p className="flex items-start gap-3"><MapPin size={14} className="mt-0.5 flex-shrink-0" /> {t(site.contact.address)}</p>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-dim">{t(ui.footer.follow)}</h3>
              <div className="mt-4 flex gap-2.5">
                {socials.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                    className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-ink-2 transition-colors hover:border-blue hover:text-blue">
                    <Icon />
                  </a>
                ))}
                <a href={`mailto:${site.social.email}`} title="Email"
                  className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface text-ink-2 transition-colors hover:border-blue hover:text-blue">
                  <Mail size={16} />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-7 sm:flex-row">
            <p className="text-xs text-dim">© {year} {site.siteNameShort}, PTIT. {t(ui.footer.rights)}</p>
            <p className="text-xs text-ink-2">{t(site.footerTagline)}</p>
          </div>
        </div>
      </div>
    </footer>
  );
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat(design): re-skin Footer to Academic Tech tokens"
```

---

### Task 4: Re-skin Navbar (route links + ThemeToggle)

**Files:**
- Rewrite: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: `useLocale`, `site.nav`, `ui`, `getLenis` (for scroll-state shadow), `next/link`, `usePathname`, `ThemeToggle`, `LanguageToggle`, `Button`.
- Produces: a client `<Navbar />` with route-based links (active state on current path), `ThemeToggle`, `LanguageToggle`, a red VR Tour CTA, and a mobile menu. Removes Soft Futurism glass/gradient and `DownloadDropdown`.

- [ ] **Step 1: Rewrite `src/components/Navbar.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Play } from "lucide-react";
import { getLenis } from "@/lib/lenis";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import Button from "./ui/Button";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const lenis = getLenis();
    if (lenis) {
      const onScroll = ({ scroll }: { scroll: number }) => setScrolled(scroll > 40);
      lenis.on("scroll", onScroll);
      return () => lenis.off("scroll", onScroll);
    }
    const handle = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-border bg-bg/80 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/img/cts-logo.jpg" alt="CTS Lab" width={32} height={32} className="h-8 w-8 rounded-[8px] object-contain" />
          <span className="text-display text-sm font-bold tracking-tight">
            <span className="text-red">CTS</span> <span className="text-ink">LAB</span>
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {site.nav.map((link) => (
            <Link
              key={link.id}
              href={link.id}
              className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-[0.82rem] font-medium transition-colors ${
                isActive(link.id) ? "text-blue" : "text-ink-2 hover:text-ink"
              }`}
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <ThemeToggle />
          <Button href="/vr-tour" variant="red" size="sm">
            <Play size={14} /> {t(ui.hero.vrCta)}
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <LanguageToggle />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] text-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`overflow-hidden border-border bg-bg transition-all duration-300 lg:hidden ${mobileOpen ? "max-h-96 border-b" : "max-h-0"}`}>
        <div className="container-x space-y-1 py-3">
          {site.nav.map((link) => (
            <Link
              key={link.id}
              href={link.id}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium transition-colors ${
                isActive(link.id) ? "bg-surface text-blue" : "text-ink-2 hover:bg-surface hover:text-ink"
              }`}
            >
              {t(link.label)}
            </Link>
          ))}
          <Button href="/vr-tour" variant="red" className="mt-2 w-full" onClick={() => setMobileOpen(false)}>
            <Play size={14} /> {t(ui.hero.vrCta)}
          </Button>
        </div>
      </div>
    </header>
  );
}
```

> Note: `Button` with `href` renders a `<Link>` and (per Stage 1 Task 6) accepts anchor props — `onClick` on the mobile CTA is a valid anchor handler. Build will confirm the types.

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass. If the build errors on `DownloadDropdown` being unused elsewhere, ignore (only Navbar imported it; it is simply no longer imported — leave the file in place, it is removed in Stage 3 cleanup).

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat(design): re-skin Navbar with route links, ThemeToggle, red VR CTA"
```

---

### Task 5: Home — Hero section

**Files:**
- Create: `src/components/home/HomeHero.tsx`

**Interfaces:**
- Consumes: `useLocale`, `site.hero`, `ui.hero`, `ui.home`, `Button`, `Container`.
- Produces: a `"use client"` `<HomeHero />` (eyebrow + big display headline with red accent word + subtitle + two CTAs: blue "Explore ecosystem" → `/products`, red "VR Tour" → `/vr-tour`).

- [ ] **Step 1: Create `src/components/home/HomeHero.tsx`**

```tsx
"use client";

import { Play } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function HomeHero() {
  const { t } = useLocale();
  return (
    <section className="relative pt-32 pb-20">
      <Container>
        <span className="eyebrow">{t(site.hero.eyebrow)}</span>
        <h1 className="text-hero mt-5 text-ink">
          {t(ui.home.heroWord1)} {t(ui.home.heroWord2)}{" "}
          <span className="text-red">{t(ui.home.heroWordAccent)}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2 sm:text-lg">
          {t(site.hero.subtitle)}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/products" variant="blue">{t(ui.hero.exploreCta)}</Button>
          <Button href="/vr-tour" variant="red"><Play size={16} /> {t(ui.hero.vrCta)}</Button>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomeHero.tsx
git commit -m "feat(home): hero section"
```

---

### Task 6: Home — Ecosystem bento (apps + gamehub teaser)

**Files:**
- Create: `src/components/home/EcosystemBento.tsx`

**Interfaces:**
- Consumes: `useLocale`, `ecosystem` (from `@/content/ecosystem`), `ui.ecosystem`, `ui.home`, `Container`, `SectionHeader`, `Card`, `Badge`, `Tag`.
- Produces: a `"use client"` `<EcosystemBento />` — a `SectionHeader` ("Ecosystem" / "App highlights", CTA → `/products`), a grid with a red-accented **Gamehub feature card** (badge "Coming soon", links to `/games`) followed by the 4 ecosystem apps as standard cards (each linking to `/products`).

- [ ] **Step 1: Create `src/components/home/EcosystemBento.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ecosystem } from "@/content/ecosystem";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";

export default function EcosystemBento() {
  const { t } = useLocale();
  return (
    <section className="section">
      <Container>
        <SectionHeader
          eyebrow={t(ui.ecosystem.eyebrow)}
          title={t(ui.ecosystem.title)}
          cta={{ label: t(ui.nav.viewAll), href: "/products" }}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Gamehub feature card */}
          <Link href="/games" className="sm:col-span-2 lg:col-span-1">
            <Card variant="feature" className="h-full">
              <span className="absolute right-4 top-4"><Badge tone="red">{t(ui.home.comingSoon)}</Badge></span>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-red-soft text-red">
                <Gamepad2 size={18} />
              </div>
              <h3 className="text-display text-base text-ink">{t(ui.home.gamehubName)}</h3>
              <p className="mt-2 text-sm text-ink-2">{t(ui.home.gamehubBlurb)}</p>
            </Card>
          </Link>

          {/* Ecosystem apps */}
          {ecosystem.map((app) => (
            <Link key={app.id} href="/products">
              <Card className="h-full">
                <h3 className="text-display text-base text-ink">{app.name}</h3>
                <p className="mt-2 text-sm text-ink-2">{t(app.excerpt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t(app.tags).slice(0, 3).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

> Note: `bg-red-soft` is not a token utility — use an inline style fallback if the class doesn't resolve. Replace `className="... bg-red-soft text-red"` on the icon wrapper with `style={{ background: "var(--red-soft)" }}` + `text-red`. Use the inline-style form to be safe:
> `<div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-red" style={{ background: "var(--red-soft)" }}>`

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass. Confirm `app.tags` is `Localized<string[]>` so `t(app.tags)` is `string[]` (it is, per `EcosystemApp`).

- [ ] **Step 3: Commit**

```bash
git add src/components/home/EcosystemBento.tsx
git commit -m "feat(home): ecosystem bento with gamehub teaser"
```

---

### Task 7: Home — Stats + One-Account section

**Files:**
- Create: `src/components/home/HomeStats.tsx`

**Interfaces:**
- Consumes: `useLocale`, `ecosystem` (for app count), `ui.home`, `sso` (from `@/content/sso`), `Container`, `StatBand` + its `Stat` type.
- Produces: a `"use client"` `<HomeStats />` — a `StatBand` (apps count, 164 VR scenes, PTIT) followed by a compact "One Account / Single Sign-On" marketing strip (NO login button — SSO is a future phase).

- [ ] **Step 1: Create `src/components/home/HomeStats.tsx`**

```tsx
"use client";

import { useLocale } from "@/lib/locale";
import { ecosystem } from "@/content/ecosystem";
import { ui } from "@/content/ui";
import { sso } from "@/content/sso";
import Container from "@/components/ui/Container";
import StatBand from "@/components/ui/StatBand";

export default function HomeStats() {
  const { t } = useLocale();
  const stats = [
    { value: String(ecosystem.length).padStart(2, "0"), unit: "+", label: t(ui.home.statApps) },
    { value: "164", label: t(ui.home.statScenes) },
    { value: "PTIT", label: t(ui.home.statPartner) },
  ];
  return (
    <section className="section pt-0">
      <Container>
        <StatBand items={stats} />
        <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-7 sm:p-10">
          <span className="eyebrow">{t(sso.caption)}</span>
          <h2 className="text-section mt-3 text-ink">{t(sso.title)}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(sso.description)}</p>
        </div>
      </Container>
    </section>
  );
}
```

> Note: `StatBand` renders `grid-cols-2 md:grid-cols-4` — with 3 items the last row balances fine. `sso.caption`/`title`/`description` are `Localized` (verified in `src/content/sso.ts`).

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/HomeStats.tsx
git commit -m "feat(home): stats band + one-account section"
```

---

### Task 8: Assemble the Home page

**Files:**
- Rewrite: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Navbar`, `Footer`, `HomeHero`, `EcosystemBento`, `HomeStats`. Produces: the Server-Component Home route with `metadata`.

- [ ] **Step 1: Rewrite `src/app/page.tsx`**

```tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHero from "@/components/home/HomeHero";
import EcosystemBento from "@/components/home/EcosystemBento";
import HomeStats from "@/components/home/HomeStats";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="relative">
        <HomeHero />
        <HomeStats />
        <EcosystemBento />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify build + lint + test + dev smoke**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass; `/` prerenders. Then `npm run dev` → open `/`, toggle light/dark — hero, stats, one-account, bento render on-brand; red appears only on the VR CTA, gamehub badge, and CTS wordmark.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): assemble new home page (hero, stats, ecosystem bento)"
```

---

### Task 9: Coming-soon stubs for `/products`, `/games`, `/team`

**Files:**
- Rewrite: `src/app/products/page.tsx`
- Create: `src/app/games/page.tsx`
- Create: `src/app/team/page.tsx`

**Interfaces:**
- Consumes: `Navbar`, `Footer`, `Container`, `Breadcrumb`, `EmptyState`, `Button`, `ui.home`. Each is a Server Component with `metadata`. (Stub copy is in `ui.home.underConstruction` / `ui.home.comingSoon` but those are `Localized`; since these stub pages are Server Components they cannot call `useLocale()`. Use a tiny `"use client"` `StubBody` wrapper that does.)

- [ ] **Step 1: Create a shared client stub body `src/components/StubPage.tsx`**

```tsx
"use client";

import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function StubPage({ titleVi, titleEn }: { titleVi: string; titleEn: string }) {
  const { t, locale } = useLocale();
  const title = locale === "vi" ? titleVi : titleEn;
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: title }]} />
        <div className="mt-10">
          <EmptyState title={t(ui.home.comingSoon)}>
            <p className="text-sm text-ink-2">{t(ui.home.underConstruction)}</p>
            <Button href="/" variant="ghost" size="sm">← {locale === "vi" ? "Về trang chủ" : "Back home"}</Button>
          </EmptyState>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/products/page.tsx`** (replaces the old Soft Futurism products page)

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StubPage from "@/components/StubPage";

export const metadata: Metadata = { title: "Sản phẩm — CTS Lab" };

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main><StubPage titleVi="Sản phẩm" titleEn="Products" /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Create `src/app/games/page.tsx`**

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StubPage from "@/components/StubPage";

export const metadata: Metadata = { title: "Games — CTS Lab" };

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main><StubPage titleVi="Games" titleEn="Games" /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Create `src/app/team/page.tsx`**

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StubPage from "@/components/StubPage";

export const metadata: Metadata = { title: "Đội ngũ — CTS Lab" };

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main><StubPage titleVi="Đội ngũ" titleEn="Team" /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Verify build + lint + dev smoke**

Run: `npm run build && npm run lint`
Expected: both pass; routes `/products`, `/games`, `/team` build. `npm run dev` → each shows a clean on-brand "coming soon" with breadcrumb + back-home, navbar active state highlights the current link, no 404s.

- [ ] **Step 6: Commit**

```bash
git add src/app/products/page.tsx src/app/games/page.tsx src/app/team/page.tsx src/components/StubPage.tsx
git commit -m "feat(pages): on-brand coming-soon stubs for products, games, team"
```

---

## Self-Review

**Spec coverage:** Navbar/Footer re-skin (Tasks 3–4) ✓; multi-page route nav (Task 1) ✓; Breadcrumb/EmptyState/MediaFrame shared components (Task 2) ✓; Home rebuilt with hero + ecosystem bento + stats + one-account marketing (no live login) (Tasks 5–8) ✓; coming-soon stubs so no broken pages / 404s (Task 9) ✓. Deferred (Stage 3+, intentionally out of scope): `Content`/`Game` types + repositories, real `/games` catalog + `/games/[slug]`, `/products` + `/products/[slug]` content, `/team` content, `/about`+`/contact`, content cleanup pass, removing `DownloadDropdown` and other Soft Futurism leftovers.

**Placeholder scan:** No TODO/TBD. The `bg-red-soft` non-token is flagged with the exact inline-style replacement in Task 6. Stub copy is real (`ui.home`). No "handle edge cases" vagueness.

**Type consistency:** `Crumb` (Task 2) consumed by `StubPage` (Task 9). `Stat` (Stage 1) consumed by `HomeStats` (Task 7). `Button` href/anchor-props (Stage 1 discriminated union) used with `onClick` on the mobile CTA in Task 4 — valid anchor prop. `t(app.tags)` → `string[]` because `EcosystemApp.tags: Localized<string[]>`. `MediaFrame` is created in Task 2 but only consumed in Stage 3 (built now per spec component-set; acceptable foundational primitive).

**Scope:** One coherent stage — navigable shell + front door. Independently shippable: the site is fully navigable and on-brand after Task 9.

**Intermediate note:** `MediaFrame` ships unused this stage (consumed in Stage 3 product/game cards). This is a deliberate foundational primitive, not dead code — flagged so the reviewer doesn't treat it as unused-export waste.
