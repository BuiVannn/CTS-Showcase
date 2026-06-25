# PTalk Signature "order device" deep-link → ctslab.net product page (3.9 cont.)

**Date:** 2026-06-24
**Status:** Draft for review
**Scope:** Mirror the KidMentor device-order deep-link for the **PTalk Signature** app: its "ĐẶT MUA THIẾT BỊ" button (in Account, currently → `dashboard.ctslab.net/store`) should open the **PTalk Signature** product page's device-order block on ctslab.net. This requires enabling the device-order block on the PTalk Signature product (it's not enabled yet). **Touches two repos.**

---

## 1. Goal

A PTalk Signature user taps "ĐẶT MUA THIẾT BỊ" → the browser opens `https://ctslab.net/products/ptalk-signature#order-device` and lands on the "Đặt thiết bị vật lý" block — with the order email pre-filled for **PTalk Signature** (not KidMentor). Each app links to its own product's device-order page.

## 2. Decisions (settled with user)

- **Own product page:** enable the device-order block on the PTalk Signature product (so the prefilled email names the right app), and deep-link there.
- **Target:** `https://ctslab.net/products/ptalk-signature#order-device`.
- Fix the **existing** "ĐẶT MUA THIẾT BỊ" button in the PTalk Signature **Account** screen (same pattern as the KidMentor fix).

## 3. Changes

### 3.1 Web — enable the device block on PTalk Signature (repo: `ctslab-redesign`)
- `src/content/ecosystem.ts`: add `device: true` to the `ptalk-signature` entry (slug `ptalk-signature`). `ProductDetail` already renders `<DeviceOrderBlock appName={p.name} />` for any `device: true` product, and `DeviceOrderBlock` already carries the `id="order-device"` + `scroll-mt-24` anchor (added in the KidMentor work). So this single data flag makes `/products/ptalk-signature#order-device` render the block with the order email pre-filled as "PTalk Signature". No component change.

### 3.2 Flutter — repoint the button (repo: `/home/namnx/Ptalk_project/App_Flutter`, app `PTalk_Signature`)
- `PTalk_Signature/lib/account/account_screen.dart`: the "ĐẶT MUA THIẾT BỊ" button (≈line 130/132) calls `_openStore()` (≈lines 367–371), opening `'${ApiConfig.dashboardBaseUrl}/store'`. Change it like the KidMentor fix:
  - Add a top-of-file const `const _orderDeviceUrl = 'https://ctslab.net/products/ptalk-signature#order-device';`.
  - Point the handler at `_orderDeviceUrl` via the existing `url_launcher` pattern (`canLaunchUrl` + `launchUrl(uri, mode: LaunchMode.externalApplication)`).
  - If `ApiConfig` is no longer referenced in this file after the change, that's fine — it's a barrel import (`package:ptalk_core/ptalk_core.dart`) used for other symbols; confirm `dart analyze` reports no unused-import issue.
- No new packages (`url_launcher: ^6.3.0` already in `PTalk_Signature/pubspec.yaml`); no localization (label stays the hardcoded VI string).

## 4. Behaviour & quality
- Opens in the **external browser** (`LaunchMode.externalApplication`).
- The PTalk Signature product page now shows the device-order CTA with the email subject naming **PTalk Signature** (via `deviceMailto(email, subjectPrefix, "PTalk Signature")`) — the correctness point the user asked to verify.
- **Replaces** the button's old `dashboard.ctslab.net/store` target (mislabelled — store = subscriptions); the subscription flow stays at the subscription screen, out of scope.
- **Two deploys:** web (`npm run build` + `pm2 restart cts-redesign`) ships first; Flutter rebuilt/reinstalled by the user.

## 5. Out of scope
- P_Connect deep-link (same pattern, separate follow-up).
- A new Settings-list button; changing button visibility.
- The Dashboard `/store` subscription flow; payments (3.10).
- Any change to the shared `DeviceOrderBlock` / `ui.device.*` copy (already generic + parameterised by app name).

## 6. Testing
- **Web (ctslab-redesign):** `npx tsc --noEmit && npm run build && npx vitest run` (device-mailto tests pass). Live: `curl -s https://ctslab.net/products/ptalk-signature | grep -c 'id="order-device"'` → ≥1 (block now renders); the order email/CTA references "PTalk Signature". `/products/ptalk-signature` → 200.
- **Flutter (manual, user's build):** build/run PTalk Signature → Account → tap "ĐẶT MUA THIẾT BỊ" → the system browser opens `https://ctslab.net/products/ptalk-signature#order-device` and lands on the device-order block; `dart analyze` clean.
