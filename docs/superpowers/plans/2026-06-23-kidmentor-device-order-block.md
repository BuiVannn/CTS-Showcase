# KidMentor Device-Order Block — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a data-driven "Đặt thiết bị vật lý / Order the physical device" block to the product detail page (enabled for KidMentor) with a pre-filled email CTA + the lab phone, reusing `site.contact`.

**Architecture:** A `device?: boolean` flag on the app data gates a new `DeviceOrderBlock` rendered inside `ProductDetail`. The CTA is a plain `mailto:` anchor (subject built by a small tested helper); the phone is a `tel:` link. Bilingual via existing `useLocale`. No backend.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4, TypeScript, Vitest (node), lucide-react, existing `useLocale` i18n.

## Global Constraints

- **Bilingual:** every visible string + the mailto subject via `t(...)` / `Localized`.
- **Data-driven:** the block renders only when `app.device` is truthy; only KidMentor sets it now. Other product pages unchanged.
- **CTA is a plain `<a href="mailto:…">`** styled like a button — NOT the `Button` component (which wraps `next/link`, unreliable for `mailto:`). Phone is a plain `<a href="tel:…">`.
- **Reuse `site.contact`** (`email`, `phone`); no new contact data.
- **Existing tokens only** (`--radius-*`, `bg-surface`, `bg-blue`, `text-ink`, etc.); no new dependencies; `next/image` only if images (none here).
- **No `react-hooks/set-state-in-effect`; no `eslint-disable`.** The block is a pure render component (no state).
- **`@/*` maps to `src/*`.**
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; tasks with tests `npx vitest run` green; live `curl` checks. Deploy in the final task.
- **Commit after every task**; `git add` specific files only (NEVER `git add -A` — `game/` + stray images stay untracked). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/device-mailto.ts` — `deviceMailto(...)` (+ `src/lib/device-mailto.test.ts`)
- `src/components/products/DeviceOrderBlock.tsx` — the block

**Modify:**
- `src/content/types.ts` — add `device?: boolean` to `EcosystemApp`
- `src/content/ecosystem.ts` — set `device: true` on KidMentor
- `src/content/ui.ts` — add a `device` bilingual string block
- `src/content/products.test.ts` — assert KidMentor `device === true`
- `src/components/products/ProductDetail.tsx` — render the block when `p.device`

---

## Task 1: Data flag + strings + test

**Files:**
- Modify: `src/content/types.ts`, `src/content/ecosystem.ts`, `src/content/ui.ts`, `src/content/products.test.ts`

**Interfaces:**
- Produces: `EcosystemApp.device?: boolean`; KidMentor has `device: true`; `ui.device` block.

- [ ] **Step 1: Write the failing test**

In `src/content/products.test.ts`, add inside the `describe("getProduct", ...)` block:

```ts
  it("marks KidMentor as having a physical device", () => {
    expect(getProduct("kidmentor")?.device).toBe(true);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/products.test.ts`
Expected: FAIL — `device` is `undefined`.

- [ ] **Step 3: Add the type field**

In `src/content/types.ts`, add to the `EcosystemApp` interface (near `logo`):

```ts
  device?: boolean; // true → show the "order physical device" block on the detail page
```

- [ ] **Step 4: Set the flag on KidMentor**

In `src/content/ecosystem.ts`, in the `kidmentor` entry, add `device: true` (e.g. right after its `logo` line):

```ts
    logo: "/img/logos/logo_kidmentor.png",
    device: true,
```

- [ ] **Step 5: Add the bilingual strings**

In `src/content/ui.ts`, add a `device` block inside the exported `ui` object (e.g. after `products`):

```ts
  device: {
    title: { en: "Order the physical device", vi: "Đặt thiết bị vật lý" } as Localized,
    blurb: {
      en: "Want the hardware for your school or home? Contact the lab to order a device or arrange a trial.",
      vi: "Muốn có thiết bị cho trường hoặc gia đình? Liên hệ lab để đặt thiết bị hoặc sắp xếp dùng thử.",
    } as Localized,
    cta: { en: "Contact to order", vi: "Liên hệ đặt thiết bị" } as Localized,
    subjectPrefix: { en: "Device order:", vi: "Đặt thiết bị:" } as Localized,
  },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/content/products.test.ts` → PASS. Then `npx vitest run` → full suite green.

- [ ] **Step 7: Verify build**

Run: `npx tsc --noEmit && npm run build && npx eslint src/content/types.ts src/content/ecosystem.ts src/content/ui.ts src/content/products.test.ts`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/content/types.ts src/content/ecosystem.ts src/content/ui.ts src/content/products.test.ts
git commit -m "feat(content): device flag on KidMentor + device-order strings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `deviceMailto` helper (TDD)

**Files:**
- Create: `src/lib/device-mailto.ts`, `src/lib/device-mailto.test.ts`

**Interfaces:**
- Produces: `deviceMailto(email: string, subjectPrefix: string, appName: string): string`

- [ ] **Step 1: Write the failing test**

`src/lib/device-mailto.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deviceMailto } from "./device-mailto";

describe("deviceMailto", () => {
  it("builds a mailto with the encoded subject", () => {
    const href = deviceMailto("contact@cts.ptit.edu.vn", "Đặt thiết bị:", "KidMentor");
    expect(href).toBe(
      "mailto:contact@cts.ptit.edu.vn?subject=" + encodeURIComponent("Đặt thiết bị: KidMentor")
    );
  });
  it("encodes spaces in the subject", () => {
    expect(deviceMailto("a@b.com", "Device order:", "KidMentor")).toContain("subject=Device%20order%3A%20KidMentor");
  });
  it("trims a missing prefix cleanly", () => {
    expect(deviceMailto("a@b.com", "", "KidMentor")).toBe("mailto:a@b.com?subject=KidMentor");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/device-mailto.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/lib/device-mailto.ts`:

```ts
/** Build a `mailto:` href whose subject is "<prefix> <appName>" (URL-encoded). */
export function deviceMailto(email: string, subjectPrefix: string, appName: string): string {
  const subject = `${subjectPrefix} ${appName}`.trim();
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/device-mailto.test.ts` → PASS (3). Then `npx vitest run` → full suite green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/device-mailto.ts src/lib/device-mailto.test.ts
git commit -m "feat(lib): deviceMailto helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: DeviceOrderBlock component + integration

**Files:**
- Create: `src/components/products/DeviceOrderBlock.tsx`
- Modify: `src/components/products/ProductDetail.tsx`

**Interfaces:**
- Consumes: `deviceMailto` (Task 2), `site.contact`, `ui.device`.
- Produces: `<DeviceOrderBlock appName={string} />`.

- [ ] **Step 1: Implement the block**

`src/components/products/DeviceOrderBlock.tsx`:

```tsx
"use client";

import { Mail, Phone } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/content/site";
import { ui } from "@/content/ui";
import { deviceMailto } from "@/lib/device-mailto";

/**
 * "Order the physical device" CTA block shown on detail pages for apps with a
 * device (app.device). Pre-filled email + tel link; no backend.
 */
export default function DeviceOrderBlock({ appName }: { appName: string }) {
  const { t } = useLocale();
  const href = deviceMailto(site.contact.email, t(ui.device.subjectPrefix), appName);
  const tel = `tel:${site.contact.phone.replace(/\s+/g, "")}`;

  return (
    <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h2 className="text-display text-lg text-ink">{t(ui.device.title)}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">{t(ui.device.blurb)}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <a
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-[0.9rem] font-semibold text-white transition duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          <Mail size={16} aria-hidden /> {t(ui.device.cta)}
        </a>
        <a href={tel} className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-blue">
          <Phone size={14} aria-hidden /> {site.contact.phone}
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render it in ProductDetail**

In `src/components/products/ProductDetail.tsx`, add the import:

```tsx
import DeviceOrderBlock from "@/components/products/DeviceOrderBlock";
```

In the content column, after the tags `Reveal` block and before the action-buttons `Reveal` (the one with Download/back), add:

```tsx
{p.device && (
  <Reveal delay={0.12}>
    <DeviceOrderBlock appName={p.name} />
  </Reveal>
)}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/products/DeviceOrderBlock.tsx src/components/products/ProductDetail.tsx`
Expected: clean. `npx vitest run` → green.

- [ ] **Step 4: Verify live**

Run: `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "kidmentor: %{http_code}\n" http://localhost:3001/products/kidmentor` → `200`
- `curl -s -o /dev/null -w "ptalk: %{http_code}\n" http://localhost:3001/products/ptalk` → `200`
- `curl -s http://localhost:3001/products/kidmentor | grep -c "mailto:"` → ≥ 1 (the block is present on KidMentor).
- `curl -s http://localhost:3001/products/ptalk | grep -c "mailto:"` → `0` (no block on a non-device app).

- [ ] **Step 5: Commit**

```bash
git add src/components/products/DeviceOrderBlock.tsx src/components/products/ProductDetail.tsx
git commit -m "feat(products): device-order block on device apps (KidMentor)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Audit + deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (incl. `deviceMailto` + KidMentor `device` assertions). No stray `eslint-disable`.

- [ ] **Step 2: Behaviour audit (code level)**

Confirm: the block renders only on KidMentor (other product pages have no `mailto:` from it); the CTA href is `mailto:` with the encoded subject; the phone is a `tel:` link with whitespace stripped; bilingual; mobile reflow (the button + phone wrap via `flex-wrap`). Fix any gap minimally.

- [ ] **Step 3: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3`; health-check `/`, `/products`, `/products/kidmentor` → `200`.

- [ ] **Step 4: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(products): device-order block audit fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

If no fixes were needed, do not create an empty commit — report the audit results.

---

## Self-Review (completed during planning)

**Spec coverage:**
- §3.1 data flag → Task 1 (type + KidMentor `device: true`). §3.2 strings → Task 1 (`ui.device`). §3.3 component (mailto + tel) → Task 3 + the `deviceMailto` helper (Task 2). §3.4 integration (conditional render) → Task 3.
- §4 behaviour (conditional, a11y links, bilingual, no backend, responsive) → Tasks 3/4.
- §6 testing (helper unit + KidMentor flag assertion + manual) → Tasks 1/2 tests + Task 4.

**Placeholder scan:** No TBD/TODO; complete code in every step. The CTA deliberately uses a plain `<a>` (not `Button`) to avoid `next/link`+`mailto` issues — stated in Global Constraints and Task 3.

**Type consistency:** `deviceMailto(email, subjectPrefix, appName)` identical in Task 2/3. `EcosystemApp.device?: boolean` defined Task 1, read in Task 3 (`p.device`). `ui.device.{title,blurb,cta,subjectPrefix}` defined Task 1, read Task 3.

**Note:** placement in ProductDetail (Task 3 Step 2) is described against the current structure (after tags, before the action buttons); the implementer should read the file and place the conditional block there.
```
