# Nút tải app (Android / iOS) cho hệ sinh thái CTS Lab — Design Spec

**Ngày:** 2026-07-06
**Nhánh:** home-redesign
**Trạng thái:** Đã brainstorm & thống nhất, chờ triển khai

## 1. Mục tiêu

Cho phép người dùng tải các app của CTS Lab (Android + iOS) ngay trên web ctslab.net.
Hiện `EcosystemApp` chỉ có 1 field `downloadHref: string` (tất cả `"#"` → nút ẩn) và
một nút "Download" đơn trên trang chi tiết. Cần:

- Tách download theo **từng nền tảng** (Android / iOS) với **trạng thái** và **kind** riêng.
- Hỗ trợ ngay: **APK tải trực tiếp** cho Android (KidMentor, PTalk Signature).
- iOS ở trạng thái **mock "Sắp có"** (chưa chốt App Store hay TestFlight).
- Xuất hiện ở **4 vị trí**: trang chi tiết app, thẻ grid `/products`, trang `/download` mới, section trên home.

## 2. Nguyên tắc chốt (kết quả brainstorm)

1. **Official badge ⇔ `available` + kind là store (`play`/`appstore`).** Mọi thứ khác — APK
   trực tiếp và **mọi** trạng thái `soon` — dùng **treatment tự thiết kế** bám design token.
   Lý do: Google/Apple cấm hiển thị badge của họ cho app chưa có trên store; badge chính thức
   giữ độ tin cậy (phụ huynh/giáo viên nhận diện ngay), tự vẽ lại vi phạm brand guideline.
2. **iOS đối xứng Android:** cả hai đều có `kind` đổi được theo thời gian
   (Android: `apk` → `play`; iOS: `testflight` → `appstore`). App Store là đích cuối của iOS,
   TestFlight chỉ là trạng thái tạm (giới hạn 10k tester, build hết hạn 90 ngày, cần cài app
   TestFlight trước — ma sát cao với người dùng phổ thông) → chỉ dùng khi app *thực sự* đang beta.
3. **Route trung gian:** link tải luôn trỏ vào `/api/download/[slug]?platform=...` rồi 302 ra
   đích thật. Đổi hạ tầng/kind chỉ sửa data, không đổi URL public; đồng thời đếm được lượt tải.
4. **Trust-signal cho APK:** hiển thị `version` + `updatedAt` cạnh nút APK (Play Store tự có
   thông tin này, APK trực tiếp không → phải tự bù) để giảm e ngại khi Android cảnh báo
   "nguồn không xác định".

## 3. Data model (`src/content/types.ts` + `ecosystem.ts`)

Bỏ `downloadHref: string` khỏi `EcosystemApp`. Thêm:

```ts
export type Platform       = "android" | "ios";
export type DownloadKind   = "apk" | "play" | "appstore" | "testflight";
export type DownloadStatus = "available" | "soon";

export interface PlatformDownload {
  status: DownloadStatus;
  kind?: DownloadKind;   // bắt buộc khi status="available" — quyết định badge/label
  target?: string;       // đích thật (file URL hoặc store URL); CHỈ API route đọc, client không dùng làm href
  version?: string;      // apk: vd "1.2.0"
  updatedAt?: string;    // apk: ISO date "2026-06-10"
  size?: string;         // apk (tùy chọn): vd "48 MB"
}

export interface AppDownloads {
  android?: PlatformDownload;
  ios?: PlatformDownload;
}

// EcosystemApp:  downloads?: AppDownloads
// - Thiếu 1 platform  → ẩn nền tảng đó.
// - Không có downloads → coi cả hai như "soon".
```

**Dữ liệu khởi tạo** (`ecosystem.ts`):
- **KidMentor**, **PTalk Signature**:
  `android: { status:"available", kind:"apk", target:<TBD>, version, updatedAt }`,
  `ios: { status:"soon" }`.
- **PTalk, VietCreative, Vision Tale, Unilearn, P-Connect**: `android` & `ios` đều `{ status:"soon" }`.
- `target` cho APK: host để user quyết sau (games origin :8090 / public/ / thư mục ngoài repo).
  Data chỉ cần URL cuối; API route đọc nó.

## 4. Component `<AppDownload>` + mapping variant ↔ vị trí

Một component duy nhất: `src/components/products/AppDownload.tsx`
Props: `{ app: EcosystemApp; variant: "full" | "row" | "compact" }`.

| variant | Vị trí | Hình dạng |
|---|---|---|
| **full** | Trang chi tiết `/products/[slug]` | 2 badge lớn xếp cạnh nhau. `available`+store → official badge (theo locale + theme). `available`+`apk` → nút APK custom kèm dòng phụ `version · updatedAt`. `soon` → chip mờ "Sắp có". |
| **row** | Trang `/download` (danh sách 7+ app) | Icon+tên app bên trái, 2 control gọn bên phải. Tránh lặp `full` 7 lần chiếm quá nhiều chiều dọc. |
| **compact** | Thẻ grid `/products` + section home | 2 chip nền tảng nhỏ (Android/iOS). `available` → tải thẳng; `soon` → chip mờ "Sắp có". |

**Logic render 1 platform:**
- `status="available"`, `kind∈{play,appstore}` → `<a>` bọc official badge SVG.
- `status="available"`, `kind∈{apk,testflight}` → nút custom (token xanh-trắng) + (apk) dòng `version · updatedAt`.
- `status="soon"` → chip tĩnh, mờ (opacity ~0.5), nhãn "`<Platform>` · Sắp có", không phải link.

## 5. Chi tiết 4 vị trí

### 5.1 Trang chi tiết `/products/[slug]` (`ProductDetail.tsx`)
Thay khối nút Download đơn (dòng ~97–108) bằng `<AppDownload app={p} variant="full" />`.
Nút "Quay lại /products" giữ nguyên. Với 2 app `device:true` (KidMentor, PTalk Signature),
khối này nằm cạnh `DeviceOrderBlock` sẵn có (đặt thiết bị + tải app — ăn khớp ngữ cảnh).

### 5.2 Trang `/download` (route mới)
- `src/app/download/page.tsx` + component `DownloadCenter`.
- Header dùng lại nhãn `ui.products.downloadHeading` ("Tải ứng dụng của chúng tôi").
- Danh sách toàn bộ app dạng `<AppDownload variant="row" />`.
- Thêm link "Tải app" vào `site.nav` và/hoặc footer (1 link chia sẻ duy nhất).

### 5.3 Grid `/products` (`ProductsGrid.tsx`)
- **Refactor tránh nested-link:** thẻ hiện bọc toàn bộ trong 1 `<Link>` → không được nhét
  `<a>` tải vào trong (a-lồng-a không hợp lệ). Đổi: media + tiêu đề là link vào chi tiết,
  còn `<AppDownload variant="compact" />` là hàng **anh em** ở đáy thẻ (link riêng, không lồng).

### 5.4 Home
- Band mới "Tải ứng dụng": component `src/components/home/DownloadBand.tsx`, đặt trong
  `src/app/page.tsx` **sau** `EcosystemBento`, **trước** `GamesTeaser`.
- Nêu bật các app `available` (hiện KidMentor, PTalk Signature) + nút "Xem tất cả →" `/download`.
- Dùng lại nhãn `ui.products.downloadHeading`. Không trùng `OneAccountApps` (đó là launcher SSO,
  không phải download) — nhưng có thể tái dùng pattern tile.

## 6. Route trung gian + analytics

`src/app/api/download/[slug]/route.ts` — `GET`, query `?platform=android|ios`:
1. Tra app theo `slug` từ content ecosystem (server-side).
2. Lấy `downloads[platform]`; nếu không `available` hoặc thiếu → 404 hoặc 302 về `/products/[slug]`.
3. **Tăng bộ đếm** (better-sqlite3) — bảng `downloads(slug TEXT, platform TEXT, count INTEGER)`,
   PRIMARY KEY `(slug, platform)`, upsert `count = count + 1`. Đặt DB tại `data/downloads.db`
   (theo mẫu `games.db`, `ptalk-usage.db`); helper `src/lib/downloads-db.ts`.
4. **302 redirect** ra `target`.

**Số "X+ Downloads" trên `HomeStats`:** phase sau (tùy chọn) — đọc tổng `count`.

### Ràng buộc client
- Link tải **dùng `<a>` thường, KHÔNG `next/link`** — vì `next/link` prefetch route nội bộ
  khi hover, sẽ tự kích redirect + thổi phồng số đếm. Thêm `rel="nofollow"` để chặn crawler.
- APK: host gửi `Content-Disposition: attachment` (hoặc route xử lý) để trình duyệt tải file.

## 7. Asset badge

- **User tự cấp** SVG official, drop vào `public/img/badges/` theo tên quy ước:
  - `google-play-{black,white}-{en,vi}.svg`
  - `app-store-{black,white}-{en,vi}.svg`
- Chọn bản theo **locale** (en/vi) + **theme** (sáng→black, dark→white; site có `theme-context`).
- APK & "sắp có" = tự thiết kế (token xanh-trắng, icon lucide như `Smartphone`/`Download`).
  **Tránh** dùng robot Android (trademark) — chỉ dùng chữ + icon trung tính.

## 8. Nhãn i18n (`ui.ts`)

Tái dùng: `ui.products.downloadHeading`, `ui.products.download`.
Thêm mới (bilingual): `downloadAndroid`, `downloadIos`, `getOnPlay`, `getOnAppStore`,
`downloadApk`, `comingSoonShort` ("Sắp có"), `updatedOn`, `downloadCenterIntro`.

## 9. Build / deploy

- Route `/api/download` là **động** → phải `npm run build && pm2 restart cts-redesign`
  (theo memory deployment: `next start` không tự nhận source edit).
- Badge SVG (`public/`) & file APK (host ngoài) là **tĩnh** → không cần rebuild.

## 10. Ngoài phạm vi (YAGNI)

- Không làm "notify me" cho app sắp có (chỉ chip tĩnh).
- Không làm trang thống kê download admin ở slice này.
- Số "X+ Downloads" trên HomeStats để phase sau.
- Không tự host/deploy file APK trong slice này (user quyết `target` sau).
