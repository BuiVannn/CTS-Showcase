# KidMentor Device-Order Deep-link Implementation Plan

> Small 2-repo change — executed inline (no subagents).

**Goal:** The KidMentor app's "ĐẶT MUA THIẾT BỊ" button opens `https://ctslab.net/products/kidmentor#order-device` and lands on the device-order block.

## Task 1: Web anchor (repo: ctslab-redesign)
- [ ] `src/components/products/DeviceOrderBlock.tsx`: add `id="order-device"` + `scroll-mt-24` to the root `<div>`.
- [ ] `npx tsc --noEmit && npm run build && npx vitest run` (device-mailto tests still pass).
- [ ] Deploy: `pm2 restart cts-redesign`; verify `curl -s http://localhost:3001/products/kidmentor | grep -c 'id="order-device"'` → ≥1.
- [ ] Commit (web).

## Task 2: Flutter button (repo: /home/namnx/Ptalk_project/App_Flutter)
- [ ] `KidMentor/lib/account/account_screen.dart`: add `const _orderDeviceUrl = 'https://ctslab.net/products/kidmentor#order-device';`; repoint the "ĐẶT MUA THIẾT BỊ" handler (`_openStore`) from `${ApiConfig.dashboardBaseUrl}/store` → `_orderDeviceUrl` (keep the `url_launcher` externalApplication pattern).
- [ ] Verify the file compiles conceptually (grep the new URL present, old store URL gone from that handler). Commit in the App_Flutter repo.
- [ ] USER rebuilds/reinstalls the KidMentor app + taps the button to confirm.
