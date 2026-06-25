# KidMentor "order device" deep-link → ctslab.net product page (3.9)

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** Make the existing **"ĐẶT MUA THIẾT BỊ"** button in the KidMentor Flutter app open the **device-order section of the KidMentor product page on ctslab.net** (currently it opens `dashboard.ctslab.net/store`, the wrong target). Add the matching anchor on the web so the link scrolls straight to the order block. This is the first concrete piece of roadmap **3.9** (cross-app deep links to the website's device-order page). **Touches two repos.**

---

## 1. Goal

A KidMentor parent taps "ĐẶT MUA THIẾT BỊ" → the device system browser opens `https://ctslab.net/products/kidmentor#order-device` and lands on the "Đặt thiết bị vật lý" block (pre-filled email + phone CTA from 3.5). One funnel for hardware orders, on the website.

## 2. Decisions (settled with user)

- **Fix the existing button** in the KidMentor **Account** screen (it's already labelled "ĐẶT MUA THIẾT BỊ"; reached from Settings → "Quản lý tài khoản"). No new Settings row.
- **Deep-link target:** `https://ctslab.net/products/kidmentor#order-device` — the web adds the `#order-device` anchor so the page scrolls to the order block.

## 3. Changes

### 3.1 Web — anchor on the device-order block (repo: `ctslab-redesign`)
- `src/components/products/DeviceOrderBlock.tsx`: add `id="order-device"` and a scroll offset (`scroll-mt-24`) to the block's root `<div>` so `…/products/kidmentor#order-device` scrolls to it (clearing the sticky navbar). No other change; the block already renders on every `device: true` product (KidMentor has `device: true`).

### 3.2 Flutter app — repoint the button (repo: `/home/namnx/Ptalk_project/App_Flutter`, app `KidMentor`)
- `KidMentor/lib/account/account_screen.dart`: the "ĐẶT MUA THIẾT BỊ" `FilledButton.icon` (≈line 121) calls `_openStore()` (≈lines 325–330), which opens `'${ApiConfig.dashboardBaseUrl}/store'`. Change the destination to the website product page:
  - Add a top-of-file const `const _orderDeviceUrl = 'https://ctslab.net/products/kidmentor#order-device';` (mirrors the inlined-URL pattern used for privacy/terms in `settings_screen.dart`).
  - Point the button's handler at `_orderDeviceUrl` via the existing `url_launcher` pattern (`canLaunchUrl` + `launchUrl(uri, mode: LaunchMode.externalApplication)` — same as `settings_screen.dart`'s `_openUrl`). Optionally rename `_openStore` → `_openDeviceOrder` for clarity; keep behaviour identical otherwise.
- No new packages (`url_launcher: ^6.3.0` already in `KidMentor/pubspec.yaml`); no localization framework (label stays the hardcoded VI string, unchanged).

## 4. Behaviour & quality
- Opens in the **external browser** (existing `LaunchMode.externalApplication` pattern), not in-app.
- The button's **label already matches** the new destination ("ĐẶT MUA THIẾT BỊ" → the device-order block). This change **replaces** its old `dashboard.ctslab.net/store` target; the Dashboard subscription/store flow (if still wanted) is reachable elsewhere (subscription screen) and is out of scope.
- Web anchor is additive — no visual/behavioural change to the product page except that `#order-device` now scrolls to the block.
- **Two separate deploys:** web = `npm run build` + `pm2 restart cts-redesign`; Flutter = rebuild + reinstall the KidMentor app (the user's build pipeline). The web anchor should ship first (so the link works when the app update lands).

## 5. Out of scope
- A new button in the Settings list; changing button visibility (it stays in the logged-in Account flow).
- Deep links from the OTHER apps (P_Connect, PTalk Signature) — same pattern, separate follow-ups (3.9 continued).
- The Dashboard `/store` subscription/purchase flow; payments (3.10).
- Any backend; the device-order block itself (already shipped in 3.5 — email + phone CTA).

## 6. Testing
- **Web (ctslab-redesign):** `npx tsc --noEmit && npm run build`; the existing `device-mailto` tests still pass; live: `curl -s https://ctslab.net/products/kidmentor | grep -c 'id="order-device"'` → ≥1; open `…/products/kidmentor#order-device` in a browser → scrolls to the order block.
- **Flutter (manual, user's build):** build/run KidMentor → Settings → Quản lý tài khoản → tap "ĐẶT MUA THIẾT BỊ" → the system browser opens `https://ctslab.net/products/kidmentor#order-device` and lands on the device-order block. (No unit test — it's a one-line URL + `url_launcher`, verified by tapping.)
