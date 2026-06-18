# Stage 3 — Real Products & Team Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the `/products` and `/team` "coming soon" stubs with real, polished pages driven by the existing typed content, introduce a products data-source repository (the swap-to-API-later seam), add product detail routes, and delete the now-orphaned Soft Futurism components.

**Architecture:** Pages are Server Components (`metadata` / `generateMetadata` / `generateStaticParams`) that render `"use client"` section components (they need `useLocale().t`). Content is read through `src/content/products.ts` repository functions, not the raw `ecosystem` array. Built entirely from Stage-1 primitives + Stage-2 shared components.

**Tech Stack:** Next.js 16 (App Router, async `params`) · React 19 · TS 5 · Tailwind v4 · Vitest. Content via `LocaleProvider` `t()`.

## Global Constraints

- **Stage 1/2 system only.** Use primitives (`Container`, `Card`, `Badge`, `Tag`, `Button`, `MediaFrame`, `Breadcrumb`, `SectionHeader`, `StatBand`) + tokens (`bg-card`, `bg-surface`, `text-ink`, `text-ink-2`, `text-dim`, `bg-blue`, `border-border`, `text-blue`, `font-mono`). NO Soft Futurism (`glass`, `btn-gradient`, `--coral`, `--violet`, `text-muted`, `coral-ink`, `SectionReveal`, aurora/grain).
- **Colour 70/20/10:** neutral base; blue for links/active/category accents; red ONLY brand (these pages need ~0 red — the persistent nav already carries the brand red). ≤ 2–3 red touches/screen.
- **Bilingual:** every user-facing string via `useLocale().t(Localized)`. Brand/proper nouns (product names, people names) stay plain. Do NOT fabricate content (team roles are absent in data → don't invent them).
- **Data through the repository:** components import `getProducts()`/`getProduct(slug)` from `src/content/products.ts`, never the `ecosystem` array directly. This is the seam that lets static data become an API/DB later without touching UI.
- **Server/Client:** route `page.tsx` = Server Component (metadata/params). Section components calling `useLocale()` = `"use client"`. `getProduct`/`getProducts` are pure sync functions over imported static data — safe to call from either.
- **Next 16 params are async:** `params` is a `Promise`; `await` it in `generateMetadata` and the page. Verify the exact signature against `node_modules/next/dist/docs/` before coding if the build complains.
- **Each real page has exactly one `<h1>`.**
- **Images:** products use `app.image` (`/img/ptalk.jpg`, `/img/vietCreative.jpg`, `/img/unilearn.jpg`); team uses `member.image` (portraits → render at `3 / 4` ratio). All assets already exist in `public/img/`.
- **Verification:** `npm run build`, `npm run lint`, `npm run test` pass after every task. All work in `/home/namnx/ctslab-redesign` on a branch off `main`.

---

### Task 1: Products repository (TDD)

**Files:**
- Create: `src/content/products.ts`
- Create: `src/content/products.test.ts`

**Interfaces:**
- Produces: `getProducts(): EcosystemApp[]` (all products); `getProduct(slug: string): EcosystemApp | undefined`.

- [ ] **Step 1: Write the failing test** — `src/content/products.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { getProducts, getProduct } from "./products";

describe("getProducts", () => {
  it("returns all ecosystem products", () => {
    expect(getProducts().length).toBeGreaterThanOrEqual(4);
  });
});

describe("getProduct", () => {
  it("finds a product by slug", () => {
    expect(getProduct("ptalk")?.name).toBe("PTalk");
  });
  it("returns undefined for an unknown slug", () => {
    expect(getProduct("does-not-exist")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL — cannot resolve `./products`.

- [ ] **Step 3: Implement `src/content/products.ts`**

```ts
import { ecosystem } from "./ecosystem";
import type { EcosystemApp } from "./types";

/** Repository seam: today reads the static `ecosystem` array; swap to an API/DB
 *  later without touching consumers. */
export function getProducts(): EcosystemApp[] {
  return ecosystem;
}

export function getProduct(slug: string): EcosystemApp | undefined {
  return ecosystem.find((p) => p.slug === slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS (3 new tests + the 4 existing theme tests = 7).

- [ ] **Step 5: Commit**

```bash
git add src/content/products.ts src/content/products.test.ts
git commit -m "feat(content): products repository (getProducts/getProduct) + tests"
```

---

### Task 2: `/products` grid page

**Files:**
- Create: `src/components/products/ProductsGrid.tsx`
- Rewrite: `src/app/products/page.tsx` (replace the Stage-2 stub)

**Interfaces:**
- Consumes: `getProducts`, `useLocale`, `ui.products`, `Container`, `Card`, `Badge`, `Tag`, `MediaFrame`.
- Produces: `<ProductsGrid />` (`"use client"`) — page `<h1>` + a responsive grid of product cards linking to `/products/[slug]`.

- [ ] **Step 1: Create `src/components/products/ProductsGrid.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { getProducts } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Tag from "@/components/ui/Tag";
import MediaFrame from "@/components/ui/MediaFrame";

export default function ProductsGrid() {
  const { t } = useLocale();
  const products = getProducts();
  return (
    <section className="section pt-28">
      <Container>
        <span className="eyebrow">{t(ui.products.eyebrow)}</span>
        <h1 className="text-section mt-2 text-ink">{t(ui.products.title)}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.products.intro)}</p>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`}>
              <Card className="h-full">
                <MediaFrame src={p.image.src} alt={t(p.image.alt)} className="mb-4" />
                <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
                <h2 className="text-display mt-3 text-base text-ink">{p.name}</h2>
                <p className="mt-2 text-sm text-ink-2">{t(p.excerpt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t(p.tags).slice(0, 3).map((tag) => (
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

- [ ] **Step 2: Rewrite `src/app/products/page.tsx`**

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/products/ProductsGrid";

export const metadata: Metadata = {
  title: "Sản phẩm — CTS Lab",
  description: "Hệ sinh thái ứng dụng AI của CTS Lab: PTalk, VietCreative, Vision Tale, Unilearn.",
};

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main><ProductsGrid /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass; `/products` prerenders.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/ProductsGrid.tsx src/app/products/page.tsx
git commit -m "feat(products): real /products grid from repository"
```

---

### Task 3: `/products/[slug]` detail page

**Files:**
- Create: `src/components/products/ProductDetail.tsx`
- Create: `src/app/products/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getProducts`, `getProduct`, `useLocale`, `ui.products`, `Container`, `Breadcrumb`, `MediaFrame`, `Badge`, `Button`, `Tag`.
- Produces: `<ProductDetail slug>` (`"use client"`); a Server page with `generateStaticParams` (one per product slug), `generateMetadata` (per-product title), and `notFound()` for unknown slugs.

- [ ] **Step 1: Create `src/components/products/ProductDetail.tsx`**

```tsx
"use client";

import { Download, Check } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { getProduct } from "@/content/products";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import MediaFrame from "@/components/ui/MediaFrame";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";

export default function ProductDetail({ slug }: { slug: string }) {
  const { t, locale } = useLocale();
  const p = getProduct(slug);
  if (!p) return null; // the route already guards with notFound()
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb
          items={[
            { label: "CTS Lab", href: "/" },
            { label: locale === "vi" ? "Sản phẩm" : "Products", href: "/products" },
            { label: p.name },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <MediaFrame src={p.image.src} alt={t(p.image.alt)} />
          <div>
            <Badge tone="neutral">{t(p.categoryLabel)}</Badge>
            <h1 className="text-section mt-3 text-ink">{p.name}</h1>
            <p className="mt-4 text-sm leading-relaxed text-ink-2">{t(p.description)}</p>
            <ul className="mt-6 space-y-2">
              {t(p.features).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-blue" /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-2">
              {t(p.tags).map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
            {p.downloadHref !== "#" && (
              <div className="mt-7">
                <Button href={p.downloadHref} variant="blue">
                  <Download size={16} /> {t(ui.products.download)}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/app/products/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/products/ProductDetail";
import { getProducts, getProduct } from "@/content/products";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return { title: p ? `${p.name} — CTS Lab` : "Không tìm thấy — CTS Lab" };
}

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!getProduct(slug)) notFound();
  return (
    <>
      <Navbar />
      <main><ProductDetail slug={slug} /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass; `/products/ptalk`, `/products/viet-creative`, `/products/vision-tale`, `/products/unilearn` prerender as static.

- [ ] **Step 4: Commit**

```bash
git add src/components/products/ProductDetail.tsx "src/app/products/[slug]/page.tsx"
git commit -m "feat(products): /products/[slug] detail with generateMetadata + static params"
```

---

### Task 4: `/team` page

**Files:**
- Create: `src/components/team/TeamGrid.tsx`
- Rewrite: `src/app/team/page.tsx` (replace the Stage-2 stub)

**Interfaces:**
- Consumes: `team` (from `@/content/team`), `useLocale`, `ui.team`, `Container`, `MediaFrame`.
- Produces: `<TeamGrid />` (`"use client"`) — page `<h1>` + a grid of member cards (portrait photo `3 / 4` + name; role only if present in data).

- [ ] **Step 1: Create `src/components/team/TeamGrid.tsx`**

```tsx
"use client";

import { useLocale } from "@/lib/locale";
import { team } from "@/content/team";
import { ui } from "@/content/ui";
import Container from "@/components/ui/Container";
import MediaFrame from "@/components/ui/MediaFrame";

export default function TeamGrid() {
  const { t } = useLocale();
  return (
    <section className="section pt-28">
      <Container>
        <span className="eyebrow">{t(ui.team.eyebrow)}</span>
        <h1 className="text-section mt-2 text-ink">{t(ui.team.title)}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.team.lead)}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {team.map((m) => (
            <div key={m.id} className="rounded-[var(--radius-lg)] border border-border bg-card p-3">
              <MediaFrame src={m.image.src} alt={t(m.image.alt)} ratio="3 / 4" />
              <h2 className="text-display mt-3 text-sm text-ink">{m.name}</h2>
              {m.role && <p className="mt-0.5 text-xs text-ink-2">{t(m.role)}</p>}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/team/page.tsx`**

```tsx
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeamGrid from "@/components/team/TeamGrid";

export const metadata: Metadata = {
  title: "Đội ngũ — CTS Lab",
  description: "Đội ngũ giảng viên và sinh viên xây dựng CTS Lab tại PTIT.",
};

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main><TeamGrid /></main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass; `/team` prerenders.

- [ ] **Step 4: Commit**

```bash
git add src/components/team/TeamGrid.tsx src/app/team/page.tsx
git commit -m "feat(team): real /team page from team content"
```

---

### Task 5: Delete orphaned Soft Futurism components

**Files:**
- Delete (the dead island unreachable from any live route after Stages 1–2):
  `src/components/Hero.tsx`, `AboutSection.tsx`, `ShowcaseSection.tsx`, `Spotlight.tsx`, `SplitSection.tsx`,
  `ProductShowcase.tsx`, `Team.tsx`, `Partners.tsx`, `Contact.tsx`, `ProductsView.tsx`,
  `DownloadDropdown.tsx`, `FloatingShape.tsx`, `RobotViewer.tsx`, `SectionReveal.tsx`, `SectionHeader.tsx`
  *(the OLD `src/components/SectionHeader.tsx` — NOT `src/components/ui/SectionHeader.tsx`, which stays).*

**Interfaces:** none (pure removal). Live routes (`/`, `/products`, `/team`, `/games`, `/about`?, `/vr-tour`, `/styleguide`) must still build.

- [ ] **Step 1: Confirm each file is unreferenced by live code, then delete**

Run this to verify nothing live imports them (each should print only matches inside the dead set itself, or nothing):
```bash
cd /home/namnx/ctslab-redesign
for f in Hero AboutSection ShowcaseSection Spotlight SplitSection ProductShowcase Team Partners Contact ProductsView DownloadDropdown FloatingShape RobotViewer SectionReveal; do
  echo "== $f =="; grep -rln "components/$f\"\|\./$f\"\|/$f'" src/app src/components/ui src/components/home src/components/products src/components/team src/components/Navbar.tsx src/components/Footer.tsx src/components/StubPage.tsx src/components/ThemeToggle.tsx 2>/dev/null || true
done
```
If any live file (under `src/app`, `src/components/ui`, `home`, `products`, `team`, or the kept top-level components) imports one of these, STOP and report — do not delete that one.

Then delete the dead set:
```bash
cd /home/namnx/ctslab-redesign
git rm src/components/Hero.tsx src/components/AboutSection.tsx src/components/ShowcaseSection.tsx \
  src/components/Spotlight.tsx src/components/SplitSection.tsx src/components/ProductShowcase.tsx \
  src/components/Team.tsx src/components/Partners.tsx src/components/Contact.tsx \
  src/components/ProductsView.tsx src/components/DownloadDropdown.tsx src/components/FloatingShape.tsx \
  src/components/RobotViewer.tsx src/components/SectionReveal.tsx src/components/SectionHeader.tsx
```

- [ ] **Step 2: Verify build + lint + test**

Run: `npm run build && npm run lint && npm run test`
Expected: all pass. If the build fails on a remaining import of a deleted file, that importer is ALSO dead — report it (do not delete unrelated files without confirming they're orphaned).

> Note: `three` / `@react-three/*` deps in `package.json` become unused after deleting `RobotViewer`. Leave the deps for now (a separate dependency-pruning decision); this task only removes the dead component files.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete orphaned Soft Futurism components"
```

---

### Task 6: Heading-level a11y for stub pages

**Files:**
- Modify: `src/components/StubPage.tsx`

**Interfaces:** Consumes the existing `useLocale`, `ui.home`, `Container`, `Breadcrumb`, `EmptyState`, `Button`. Produces: a stub page whose page title is an `<h1>` (so `/games` and `/about` stubs have a top-level heading).

- [ ] **Step 1: Add an `<h1>` page title to `src/components/StubPage.tsx`**

Insert a visible page `<h1>` between the `Breadcrumb` and the `EmptyState`. Replace the JSX returned block with:

```tsx
  return (
    <section className="section pt-28">
      <Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: title }]} />
        <h1 className="text-section mt-6 text-ink">{title}</h1>
        <div className="mt-10">
          <EmptyState title={t(ui.home.comingSoon)}>
            <p className="text-sm text-ink-2">{t(ui.home.underConstruction)}</p>
            <Button href="/" variant="ghost" size="sm">← {locale === "vi" ? "Về trang chủ" : "Back home"}</Button>
          </EmptyState>
        </div>
      </Container>
    </section>
  );
```

(Keep the component's props, imports, and `const { t, locale } = useLocale(); const title = ...` logic unchanged.)

- [ ] **Step 2: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both pass. `/games` and `/about` (if present) now have a top-level `<h1>` (page title) with the "coming soon" `EmptyState` below it.

- [ ] **Step 3: Commit**

```bash
git add src/components/StubPage.tsx
git commit -m "a11y: give stub pages a top-level h1"
```

---

## Self-Review

**Spec coverage:** real `/products` grid (Task 2) + detail (Task 3) from a repository seam (Task 1); real `/team` (Task 4); orphan cleanup (Task 5); stub a11y (Task 6). Deferred (Stage 4): real `/games` catalog + `Game` type/repository (needs gamehub-depth decision + game data), `/about`+`/contact`, `three`/R3F dependency pruning, broader `aria-label` landmark sweep.

**Placeholder scan:** No TODO/TBD. No fabricated content (team roles rendered only `if (m.role)`; none in data, so none shown). Download button only renders when `downloadHref !== "#"`.

**Type consistency:** `getProducts(): EcosystemApp[]` / `getProduct(slug): EcosystemApp | undefined` (Task 1) consumed by Tasks 2–3. `EcosystemApp` fields used (`slug`, `name`, `image`, `categoryLabel`, `excerpt`, `description`, `features: Localized<string[]>`, `tags: Localized<string[]>`, `downloadHref`) all exist per `types.ts`. `t(p.features)`/`t(p.tags)` → `string[]`. `MediaFrame` `ratio` prop (Stage 2) used for portraits. Async `params` pattern (Next 16) in Task 3.

**Scope:** One coherent stage (products + team real, cleanup). `/products` and `/team` fully navigable real pages; `/games` and `/about` remain on-brand stubs. Independently shippable.

**Intermediate note:** `/games` still links to a stub and `/about` (if linked anywhere) too — intentional; those are the next stage. No dead links introduced (all nav routes still resolve).
