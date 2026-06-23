# Impact stats band — expand to 6 metrics (Quick win 3.6)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Expand the homepage Impact band from 4 to **6 metrics** with bigger, more impressive numbers (users, downloads, schools), keeping the existing count-up animation. Enhance the count helper to support thousands separators so "10,000+" animates correctly. No backend.

---

## 1. Goal

Make the homepage feel larger and more credible by showing 6 headline numbers in the existing Impact band, with animated count-up. New "positioning" figures (users, downloads, schools) sit alongside the real ones (AI products, VR scenes, partner).

## 2. Decisions (settled with the user)

- **Approach:** expand the existing Impact band (no new section).
- **6 metrics (order):**
  1. **Người dùng / học sinh** — `10,000+`
  2. **Lượt tải ứng dụng** — `25,000+`
  3. **Trường / lớp học** — `30+`
  4. **Sản phẩm AI** — auto (count of ecosystem apps; currently 7, shown zero-padded "07")
  5. **Cảnh VR 360°** — `164`
  6. **Đối tác học thuật** — `PTIT`
- **Drop "Thành viên"** (team count).
- Figures 1–3 are positioning/illustrative (user-approved); kept round with a `+` for credibility.

## 3. Architecture & components

### 3.1 Count helper supports thousands separators (`src/lib/format.ts`)
- `parseCountValue` currently matches `^(\d+)(.*)$`, so a comma cuts the number short ("10,000+" → target 10). Enhance it to allow commas inside the number group and parse the comma-stripped digits, e.g. `^([\d,]+)(.*)$` → `target = parseInt(digits.replace(/,/g, ""), 10)`. Zero-pad detection stays (a value like "07" still yields pad=2).
- `formatCount` re-inserts thousands separators when not zero-padded: when `pad === 0`, format `Math.round(n)` with `toLocaleString("en-US")` (groups thousands); when `pad > 0`, keep the existing zero-pad path (small counts, no grouping). Then append the suffix.
- Result: "10,000+" parses to target 10000 (suffix "+") and animates 0 → "10,000+" with the comma; "164" and "07" and "PTIT" behave exactly as today.

### 3.2 Strings (`src/content/ui.ts`)
- Add bilingual `Localized` labels: `statUsers` ("Người dùng" / "Users"), `statDownloads` ("Lượt tải" / "Downloads"), `statSchools` ("Trường / lớp học" / "Schools & classes"). Keep `statApps`, `statScenes`, `statPartner`. `statTeam` may stay in data (unused) or be removed.

### 3.3 Impact band data (`src/components/home/HomeStats.tsx`)
- Replace the `stats` array with the 6 metrics above:
  - `{ value: "10,000+", label: t(ui.home.statUsers) }`
  - `{ value: "25,000+", label: t(ui.home.statDownloads) }`
  - `{ value: "30+", label: t(ui.home.statSchools) }`
  - `{ value: String(getProducts().length).padStart(2, "0"), label: t(ui.home.statApps) }`
  - `{ value: "164", label: t(ui.home.statScenes) }`
  - `{ value: "PTIT", label: t(ui.home.statPartner) }`
- Remove the now-unused `team` import (it backed the dropped "Thành viên" stat).

### 3.4 Band layout (`src/components/ui/StatBand.tsx`)
- The grid currently is `grid-cols-2 md:grid-cols-4` (tuned for 4). Re-tune for 6: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` so it reads as one impressive row on wide screens and reflows to 3×2 / 2×3 on smaller screens. (StatBand's only consumer is HomeStats, so this is safe.)

## 4. Behaviour & quality
- **Count-up** animates each numeric stat on enter (existing `CountUp`), now correctly for comma values; "PTIT" stays static (non-numeric); respects reduced motion (shows final value).
- **Responsive:** 6 tiles reflow cleanly (2/3/6 columns); the large value text (`text-3xl sm:text-4xl`) fits the short values.
- **Bilingual** labels via `t(...)`; existing tokens only; no new deps; no `eslint-disable`.
- **Credibility note:** figures 1–3 are illustrative/positioning, kept round with `+`. (Replace with measured numbers when available — single-source in `HomeStats`.)

## 5. Out of scope
- A separate dedicated "numbers" section (the user chose to expand the band).
- Real analytics-backed figures (positioning numbers now; swap later).
- Animating "PTIT" or other non-numeric values.

## 6. Testing
- **Unit (Vitest):** extend `src/lib/format.test.ts` — `parseCountValue("10,000+")` → `{ target: 10000, suffix: "+", … }`; `formatCount(10000, 0, "+")` → `"10,000+"`; `formatCount(3521, 0, "")` → `"3,521"`; existing cases ("164", "05"/pad, "PTIT") still pass unchanged.
- **Manual/live:** the band shows 6 tiles; numbers count up (10,000+ animates with the comma); reflows on mobile; VI/EN labels correct. Verified via `npm run build` + `pm2 restart cts-redesign`.
