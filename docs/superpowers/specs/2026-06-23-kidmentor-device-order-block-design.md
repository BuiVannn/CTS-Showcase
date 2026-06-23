# Product detail — "Đặt thiết bị vật lý" block (Quick win 3.5)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Add a data-driven "Đặt thiết bị vật lý / Order the physical device" block to the product detail page, enabled for **KidMentor** now. The block shows a short blurb, a **"Liên hệ đặt thiết bị" CTA that opens a pre-filled email**, and the lab's **phone number**. No backend changes (reuses the existing `site.contact`).

---

## 1. Goal

For apps that ship a physical device (starting with KidMentor), let interested visitors **request/order the device or contact the lab** straight from the product page. This is also the landing target for the future cross-app "buy device" deep-links (plan item 3.9).

## 2. Decisions (settled with the user)

- **Data-driven:** add a `device?` flag to the app data; only **KidMentor** has it set now. Enabling it for P-Connect / PTalk Signature later is a one-field change, no code.
- **CTA = pre-filled email + phone shown:** a button opens `mailto:` to the lab email with a pre-filled subject (e.g. "Đặt thiết bị KidMentor"); the lab phone number is shown beside it (as a `tel:` link). No order form, no payment in this quick win.
- **Reuse `site.contact`** (`email`, `phone`) — single source; the email-standardisation (item 3.8) is separate and will flow through automatically.

## 3. Architecture & components

### 3.1 Data (`src/content/types.ts`, `src/content/ecosystem.ts`)
- Add `device?: boolean` to `EcosystemApp` (optional; absent = no block).
- Set `device: true` on the **KidMentor** entry.

### 3.2 Strings (`src/content/ui.ts`)
- Add a `device` block of bilingual `Localized` strings: `title` ("Đặt thiết bị vật lý" / "Order the physical device"), `blurb` (one or two sentences inviting contact to order/try the device), `cta` ("Liên hệ đặt thiết bị" / "Contact to order"), `subjectPrefix` (used in the mailto subject, e.g. "Đặt thiết bị" / "Device order"), `callLabel` ("Gọi" / "Call") or similar.

### 3.3 Component (`src/components/products/DeviceOrderBlock.tsx`, new)
- Props: `appName: string` (and reads `site.contact` + `ui.device` itself).
- Renders a distinct card (border + tinted surface, brand accent) with: the title, the blurb, a primary `Button` whose `href` is `mailto:${site.contact.email}?subject=<encoded "<subjectPrefix> <appName>">` (and optionally a short pre-filled `body`), and the phone as a `tel:` link with a phone icon.
- Bilingual via `useLocale`; existing tokens/components (`Button`, lucide icons) only.
- The `mailto` subject is built from the active locale's `subjectPrefix` + the app name, URL-encoded.

### 3.4 Integration (`src/components/products/ProductDetail.tsx`)
- Render `{p.device && <DeviceOrderBlock appName={p.name} />}` in the content column — placed after the features/tags, near the action buttons (a clear, self-contained section). Wrap in the existing `Reveal` for consistent motion.

## 4. Behaviour & quality
- **Conditional:** the block renders only when `app.device` is truthy (KidMentor today). Other product pages are unchanged.
- **Accessibility:** the CTA is a real link (`mailto:`) with an accessible label; the phone is a `tel:` link; icons are decorative (`aria-hidden`).
- **Bilingual:** all visible text + the mailto subject via `t(...)`.
- **No backend:** uses `mailto:`/`tel:` — works without the contact API.
- **Responsive:** the block reflows on mobile (button + phone stack).
- Existing tokens only; no new dependencies; no `eslint-disable`; no React state.

## 5. Out of scope
- A dedicated device-order form / quantity / shipping (later; this quick win is contact-to-order).
- Online payment for devices (plan item 3.10).
- The cross-app deep-links FROM the apps to this block (plan item 3.9) — this block is the destination; the links are a separate task.
- Enabling the block for P-Connect / PTalk Signature (one-field change when desired).
- Email standardisation (item 3.8) — this block reads whatever `site.contact.email` is.

## 6. Testing
- **Unit (Vitest):** if a small `deviceMailto(email, subjectPrefix, appName)` helper is extracted, unit-test the encoded subject (pure). Otherwise the data shape is covered by the existing content tests; optionally assert KidMentor has `device === true`.
- **Manual/live:** KidMentor detail page shows the block; the CTA opens an email with the pre-filled subject; the phone is a working `tel:` link; other product pages (e.g. PTalk) do NOT show the block; VI/EN correct; mobile reflow OK. Verified via `npm run build` + `pm2 restart cts-redesign` + click-through.
