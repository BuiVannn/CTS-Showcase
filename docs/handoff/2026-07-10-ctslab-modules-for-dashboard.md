# Bàn giao: Đưa CTSLab thành một "Sản phẩm" trong Dashboard Hệ sinh thái

**Ngày:** 2026-07-10 · **Người soạn:** CTS Lab (phía web `ctslab.net`) · **Người nhận:** Đội làm Dashboard (`Ptalk_project/Dashboard`)

> **TL;DR** — Chuyển toàn bộ **logic quản lý & duyệt game, tin tức (news), phát hành app (APK + link store)** từ website CTSLab về Dashboard tập trung. Dashboard là **nguồn sự thật (Postgres)** và mở **REST API public-read**; website CTSLab **bỏ SQLite, chỉ đọc qua API**. Quyền quản lý dùng **Authentik groups** (nhiều admin), không dùng allowlist email nữa. Website hiện tại **giữ nguyên làm tham khảo** trong lúc chuyển tiếp.

---

## 1. Mục đích & phạm vi

### 1.1 Mục tiêu
- **Quản lý tập trung** ở Dashboard cho các nội dung của CTSLab, thay vì rải rác trong trang `/admin` của website.
- **Nhiều tài khoản admin** (hiện website chỉ có allowlist email thô).
- **Dễ mở rộng**: website CTSLab cải tiến liên tục; cần khung để thêm module quản lý mới mà không đập đi làm lại.

### 1.2 Trong phạm vi lần này (4 module)
1. **Quản lý & duyệt Game** (chuyển logic thật về Dashboard).
2. **News / Tin tức** — CRUD ở Dashboard + hiển thị công khai trên website (mới hoàn toàn).
3. **Phát hành app**: cập nhật **APK** + **link store** (mới).
4. **Xem phiên đăng nhập / thiết bị của một user** (một account đang đăng nhập ở đâu, thiết bị nào).

### 1.3 Ngoài phạm vi (chưa làm)
- Giao diện cho **tài khoản user thường** trên website (chỉ làm phía admin + phần "user tự theo dõi phiên của mình" nếu tiện, xem §6.4).
- Không đụng các sản phẩm PTalk Assistant / Kid Mentor / Elder Kare đã có trong Dashboard.

### 1.4 Ánh xạ vào tài liệu nghiệp vụ Dashboard v2 hiện có
CTSLab được thêm vào như **một sản phẩm mới trong §3.5 "Quản lý theo Sản phẩm"**. Tài liệu v2 hiện chỉ bao PTalk Assistant / Kid Mentor / Elder Kare — CTSLab là khoảng trống cần bổ sung. Phần phiên đăng nhập ánh xạ vào **USR-02 (hồ sơ user 360°)** + **AUTH-05 (quản lý phiên)**. Phần nhiều admin dùng lại **RBAC §2.3** có sẵn.

---

## 2. Quyết định kiến trúc đã chốt

| # | Quyết định | Ghi chú |
|---|---|---|
| **1** | **Dashboard = nguồn sự thật.** Dữ liệu game/news/download nằm ở **Postgres của Dashboard**. | Website CTSLab **bỏ** `games.db` + `downloads.db` + content tĩnh, chỉ **đọc qua REST API**. |
| **2** | **Ghi chỉ ở Dashboard.** Mọi thao tác tạo/sửa/xoá/duyệt diễn ra trên Dashboard. | Website read-only với dữ liệu này. |
| **3** | **Nhiều admin qua Authentik groups.** Bỏ `ADMIN_EMAILS`. | Dùng `SuperAdmin` + `ProductAdmin` (scope = CTSLab). Xem §5. |
| **4** | **Website giữ nguyên làm tham khảo** trong giai đoạn chuyển tiếp. | Cắt sang API theo từng module (feature flag), không big-bang. Xem §7. |

**Còn mở (cần chốt với đội hạ tầng — xem §8):** nơi lưu file build game WebGL, cơ chế đồng bộ giai đoạn chuyển tiếp, chi tiết chống lạm dụng download counter.

---

## 3. Mô hình tích hợp & luồng dữ liệu

```
                    Authentik (OIDC + Core API)  ── định danh chung, roles, sessions
                        ▲                    ▲
                        │ login              │ đọc phiên/thiết bị
                        │                    │
   ┌────────────────────┴───────┐    ┌───────┴─────────────────────────┐
   │  Website CTSLab (Next.js)  │    │  Dashboard (Next.js 16 + PG)    │
   │  ctslab.net → :3001        │    │  NGUỒN SỰ THẬT                  │
   │  READ-ONLY với dữ liệu     │    │  - Game moderation + CRUD       │
   │  game/news/download        │◀───│  - News CRUD                    │
   │                            │ REST│  - Releases (APK + store)       │
   │  giữ: /api/download 302 +  │ public│ - Sessions viewer (Authentik)│
   │  đếm click, viewer game    │ read │  - RBAC (nhiều admin)          │
   └────────────┬───────────────┘    └───────┬─────────────────────────┘
                │ phục vụ build tĩnh          │ ghi file build (§4.1.4)
                ▼                             ▼
        games.ctslab.net :8090  ◀── /home/namnx/ctslab-games (thư mục build WebGL)
```

**Nguyên tắc:** website **không** truy cập Postgres trực tiếp; chỉ gọi **REST API public-read** của Dashboard (§9). Điều này giữ 2 app tách biệt, schema đổi độc lập, và đúng tinh thần "quản lý tập trung".

**Thuận lợi có sẵn:** website đã có "repository seam" — `src/content/products.ts` ghi rõ *"swap to an API/DB later without touching consumers"*, và `games.ts`/`products.ts` là các hàm `getX()` tập trung. Cắt sang API = đổi ruột các hàm này, không đụng UI.

---

## 4. Các module cần xây trong Dashboard

### 4.1 Module Game (duyệt + CRUD) — QUAN TRỌNG NHẤT

> Đây là logic nghiệp vụ **thật** đang chạy. Tái hiện **chính xác** các luật dưới đây, nếu không sẽ sai hành vi kiểm duyệt.

> **Phạm vi (đã chốt):** Dashboard quản lý **game do người dùng nộp** (user-submitted). Vài **game của lab** (hiện 1 game, chạy từ file tĩnh cùng origin với web, không sandbox) **giữ tĩnh trong repo web** — website tự merge 2 nguồn khi hiển thị. Dashboard **không** cần quản lý game của lab.

#### 4.1.1 Vòng đời trạng thái
`draft → pending → published | rejected`

| Trạng thái | Ý nghĩa |
|---|---|
| `draft` | Tác giả lưu nháp, chưa gửi duyệt. |
| `pending` | Đã gửi, chờ admin duyệt. |
| `published` | Đã duyệt, hiển thị công khai. |
| `rejected` | Bị từ chối. |

#### 4.1.2 Luật kiểm duyệt (admin)
- **Approve** → set `published`.
- **Reject** → set `rejected` **và xoá thư mục build** khỏi storage.

#### 4.1.3 Luật khi tác giả sửa game (`nextStatusOnEdit`)
- Đang `published` + **upload build mới** → **tụt về `pending`** (kiểm duyệt lại).
- Đang `published` + **chỉ sửa metadata** → **giữ `published`**.
- Đang `draft/pending/rejected` → theo intent gửi lên: `submit → pending`, `save-draft → draft`, `keep → giữ nguyên`.

#### 4.1.4 Upload & lưu trữ build WebGL
- Nhận **file ZIP** build WebGL (Unity...). Giải nén an toàn:
  - Tìm thư mục chứa `index.html`, **làm phẳng** 1 lớp wrapper.
  - **Chống path-traversal** (từ chối entry thoát khỏi thư mục đích, đường dẫn tuyệt đối).
  - Bỏ rác `__MACOSX/`, `.DS_Store`, `Thumbs.db`.
  - **Chèn CSS** (`id="cts-viewer-fit"`) vào `index.html` để canvas fill iframe (idempotent).
- **Giới hạn:** ZIP ≤ **100MB**; sau giải nén ≤ **300MB** / ≤ **2000 file** / mỗi file ≤ **100MB**. (Đều cấu hình qua ENV.)
- **Đích lưu:** thư mục `/home/namnx/ctslab-games/<slug>/` — được **server tĩnh riêng** phục vụ tại `games.ctslab.net` (port 8090, pm2 `games-sandbox`, tunnel `CTS_Showcase`). ⚠️ Dashboard chạy Docker → **cần chốt cách ghi vào thư mục này** (§8).
- Tham chiếu code hiện tại: `src/lib/game-upload.ts` (`slugify`, `safeExtractZip`, `injectViewerCss`, `resolveInside`).

#### 4.1.5 Quota chống lạm dụng (mỗi owner)
- Tối đa **3 game `pending`** đồng thời.
- Tối đa **10 game** tổng.

#### 4.1.6 Slug
- Sinh từ title: tiếng Việt → ASCII (bỏ dấu, `đ→d`), lowercase, `[^a-z0-9]→-`, cắt 60 ký tự.
- Trùng slug → tự thêm hậu tố `-2`, `-3`, …

#### 4.1.7 Quyền sở hữu
- Mỗi game có `owner_id` + `owner_email`.
- Sửa/xoá: cho phép **owner HOẶC admin** (`ownerOrAdmin`).
- Admin thấy & thao tác tất cả; owner chỉ thấy game của mình.

#### 4.1.8 Schema `games` (hiện tại — SQLite, cần chuyển sang Postgres)
```
id            TEXT PK (uuid)
slug          TEXT UNIQUE NOT NULL
title         TEXT NOT NULL
author        TEXT NOT NULL
cover         TEXT NULL
status        TEXT NOT NULL           -- draft|pending|published|rejected
created_at    TEXT NOT NULL (ISO)
owner_id      TEXT NULL
owner_email   TEXT NULL
tagline       TEXT NULL
description   TEXT NULL               -- Markdown
classification TEXT NULL
project_type  TEXT NULL
release_status TEXT NULL
genre         TEXT NULL
tags          TEXT NULL               -- chuỗi phân tách; cân nhắc TEXT[] trong PG
video_url     TEXT NULL
external_url  TEXT NULL
updated_at    TEXT NULL (ISO)
```
Tham chiếu: `src/lib/games-db.ts`, API `src/app/api/admin/games/route.ts` (admin: POST upload / DELETE / PATCH approve-reject), `src/app/api/games/studio/route.ts` (owner submit), `src/app/api/games/[slug]/route.ts` (owner/admin PUT/DELETE), `src/lib/game-status.ts` (luật re-moderation).

### 4.2 Module News / Tin tức — MỚI HOÀN TOÀN

Website chưa có news. Mục tiêu: admin đăng tin/thành tựu của lab, website hiển thị ở trang `/news` (list) + `/news/[slug]` (detail).

**Schema đề xuất `news`:**
```
id            uuid PK
slug          text unique not null
title_vi      text not null            -- site song ngữ vi/en
title_en      text not null
excerpt_vi    text
excerpt_en    text
body_vi       text                     -- Markdown
body_en       text
cover         text                     -- URL ảnh bìa
status        text not null            -- draft|published
featured      boolean default false    -- ghim/nổi bật trên trang chủ
published_at  timestamptz
author        text
tags          text[]
created_at    timestamptz default now()
updated_at    timestamptz
```
**CRUD ở Dashboard:** tạo/sửa/xoá, đổi trạng thái draft↔published, preview song ngữ, ghim featured.
**Lưu ý song ngữ:** website là vi/en (kiểu `Localized = {en, vi}`). Cần chốt: bắt buộc cả 2 ngôn ngữ hay cho phép chỉ 1 (fallback). Đề xuất: bắt buộc `title`, cho phép `body` một ngôn ngữ + fallback.

### 4.3 Module Phát hành app: APK + link store — MỚI

Hiện dữ liệu tải nằm **tĩnh trong code** (`src/content/ecosystem.ts`, mỗi app có field `downloads`). Cần đưa thành **dữ liệu quản lý được**.

> **Phạm vi (đã chốt):** Dashboard **chỉ** quản lý **khối `downloads`** (trạng thái, kind, link store, file APK, version, size, updatedAt) + **thứ tự app tải**. **KHÔNG** quản lý nội dung marketing của sản phẩm (tên, mô tả song ngữ dài, ảnh, features) — phần đó **ở lại repo web** (`ecosystem.ts`) vì đổi rất hiếm. Tránh phình phạm vi thành một CMS đầy đủ.

**Mô hình dữ liệu hiện tại (mỗi app, mỗi platform):**
```
Platform      = android | ios | vr
DownloadKind  = apk | play | appstore | testflight
DownloadStatus= available | soon
PlatformDownload = { status, kind?, target?, version?, updatedAt?, size? }
  target   = URL thật: file APK ("/downloads/<slug>.apk") HOẶC URL store ("https://…")
  version  = "1.2.0" (cho apk)
  updatedAt= ISO date
  size     = "48 MB"
```
Các app có nút tải: `unilearn, viet-creative, kidmentor, ptalk-signature, p-connect` (danh sách này cũng cần quản lý được).

**Chức năng CRUD ở Dashboard:**
- Với mỗi app × platform: đặt `status`, `kind`, `target` (link store hoặc upload APK), `version`, `size`, `updatedAt`.
- **Upload APK**: nhận file → lưu vào nơi hosting APK (hiện có `docs/ops/nginx-apk-hosting.md`), tự set `target` + `version` + `size` + `updatedAt`.
- **Link store**: chỉ cần dán URL Play/App Store/TestFlight.

**Đếm lượt tải:** bảng `downloads(slug, platform, count)` (hiện ở website). Đưa về Dashboard (thuộc về analytics). Website vẫn giữ route trung gian `/api/download/<slug>?platform=` (302 → target) và **gọi Dashboard để +1 count** (hoặc Dashboard tự đếm — xem §9.4).

### 4.4 Xem phiên đăng nhập / thiết bị của user — dùng Authentik

Yêu cầu: xem **một account đang đăng nhập ở đâu, trên thiết bị nào**. Đây **không** phải thiết bị robot (khác với DEV-* trong tài liệu v2) — đây là **phiên đăng nhập (login sessions)**.

- **Nguồn đúng: Authentik Core API** (Dashboard đã có sẵn `AUTHENTIK_API_TOKEN`, `AUTHENTIK_URL`).
- Liệt kê session của 1 user: **IP, user-agent/loại thiết bị, last seen, thời điểm tạo**.
- Cho phép **thu hồi (revoke) phiên** từ Dashboard.
- Đặt trong **Hồ sơ user 360° (USR-02)** như một tab "Phiên & Thiết bị đăng nhập".

---

## 5. Quyền & nhiều admin (RBAC)

- **Bỏ** cơ chế hiện tại của website: allowlist `ADMIN_EMAILS` (chuỗi email phân tách bằng dấu phẩy trong ENV — xem `src/lib/auth-helpers.ts`). Thô, không mở rộng được.
- **Dùng Authentik groups** đã định nghĩa trong tài liệu v2 §2.3:
  - `SuperAdmin` — toàn quyền.
  - `ProductAdmin` — **scope = CTSLab**: duyệt/CRUD game, news, releases.
  - `Support` — xem + sửa nhẹ (vd: ẩn tin), không xoá/không duyệt.
  - `Viewer` — chỉ xem.
- Website đọc `isAdmin` từ JWT (`session.isAdmin`); sau khi cắt, quyền quản lý nằm ở Dashboard nên website **không cần** biết admin nữa (trừ khi vẫn giữ trang studio cho tác giả tự upload — xem §7).

---

## 6. Yêu cầu trải nghiệm (UX) cho Dashboard

Lý do làm lại: *"dashboard hiện tại trải nghiệm rất tệ"*. Định hướng:
1. **Nhất quán khung sản phẩm**: CTSLab là 1 mục trong sidebar; bên trong có tab con Game / News / Releases — theo đúng pattern §3.5.
2. **Bảng dữ liệu chuẩn**: tìm kiếm, lọc theo trạng thái, phân trang, sắp xếp; hành động hàng loạt (duyệt nhiều game).
3. **Luồng duyệt mượt**: xem preview game/tin ngay trong duyệt, approve/reject 1 chạm, có lý do từ chối.
4. **Dễ mở rộng**: khung module hoá để thêm loại nội dung mới (vd sự kiện, tuyển dụng) chỉ bằng cách thêm module, không sửa core (khớp yêu cầu phi chức năng §4 "Khả năng mở rộng").
5. **Song ngữ** vi/en (mặc định vi) — khớp yêu cầu i18n của cả 2 hệ.
6. **Audit log (SYS-03)**: ghi ai duyệt/sửa/xoá cái gì, lúc nào.

> Phần thiết kế UI/UX chi tiết (layout, design system) sẽ làm bằng skill `design` + `ui-ux-pro-max` ở bước sau, sau khi chốt tài liệu này.

---

## 7. Chiến lược chuyển tiếp (website giữ nguyên làm tham khảo)

Cắt **theo từng module, có feature flag**, không big-bang:

1. **Giai đoạn 0** — Dashboard dựng schema + API + CRUD, **migrate dữ liệu** từ SQLite/content tĩnh sang Postgres (game hiện có 1 record; download data từ `ecosystem.ts`).
2. **Giai đoạn 1** — Website đổi `getPublishedGames()` / `getProducts()` / (mới) `getNews()` đọc từ API Dashboard **sau một flag**; SQLite/content tĩnh làm **fallback** nếu API lỗi.
3. **Giai đoạn 2** — Tắt ghi ở website (`/admin/games`, `/api/admin/games`, studio) → chuyển hẳn về Dashboard. Trang `/admin` cũ để **read-only tham khảo** rồi gỡ sau.
4. **Nguồn sự thật**: trong lúc chuyển tiếp, **chỉ một nơi được ghi** cho mỗi module (tránh 2 nơi lệch). Khuyến nghị: khi bật module nào ở Dashboard thì **khoá ghi** module đó ở website ngay.

> ✅ **Đã chốt — trang Studio tác giả giữ trên website.** Website vẫn có luồng để **tác giả (không phải admin) tự nộp game** (`/games/studio`), nhưng **không ghi DB nữa**: các route `/api/games/studio` + `/api/games/[slug]` trở thành **proxy mỏng** gọi API ghi của Dashboard (§9.5). Toàn bộ luật (quota, giới hạn, re-moderation) **chỉ tồn tại ở Dashboard**.

---

## 8. Quyết định còn mở (cần chốt với đội Dashboard/hạ tầng)

| # | Vấn đề | Lựa chọn |
|---|---|---|
| O1 | **Ghi file build game** — Dashboard (Docker) ghi vào `/home/namnx/ctslab-games` thế nào? | (a) mount volume host vào container; (b) API nhỏ trên máy games nhận ZIP; (c) Dashboard + games-server chung host + shared path. |
| O2 | **Hosting APK** — upload APK ở Dashboard lưu đâu? | Theo `docs/ops/nginx-apk-hosting.md` hiện có, hay chuyển sang storage của Dashboard. |
| O3 | **Đếm download** — website 302 rồi ai +1 count? | (a) website gọi API Dashboard +1; (b) Dashboard tự phục vụ redirect + đếm. |
| ~~O4~~ | ~~Luồng Studio tác giả — giữ trên web hay đưa vào Dashboard?~~ | ✅ **ĐÃ CHỐT: giữ trên web**, ghi qua proxy → Dashboard mở **API ghi** (§9.5). |
| O5 | **News song ngữ** — bắt buộc cả vi/en hay 1 + fallback? | Đề xuất: bắt buộc `title` cả 2; `body` cho phép 1 ngôn ngữ + fallback. **API luôn trả cả 2 khoá** (§9.2). |
| O6 | **User tự xem phiên của mình** trên website? | Ngoài phạm vi lần này, nhưng Authentik hỗ trợ sẵn nếu muốn thêm sau. |
| **O7** | **Truyền danh tính** từ web proxy → Dashboard API ghi (§9.5): làm sao Dashboard tin `owner_id`? | (a) token dịch vụ server↔server + user id đã xác thực; (b) forward access token Authentik của user. **Cần chốt sớm — chặn phần Studio.** |

---

## 9. Hợp đồng REST API public-read (Dashboard → Website)

Đề xuất tối thiểu để website đọc. (Đường dẫn/versioning do đội Dashboard chốt; gợi ý prefix `/api/public/ctslab/`.)

### 9.1 Games
- `GET /games` → danh sách `published`, sắp xếp `created_at DESC`.
- `GET /games/{slug}` → chi tiết 1 game (mọi field ở §4.1.8).
- (Auth) `GET /games?status=pending` → cho Dashboard duyệt (không public).

### 9.2 News
- `GET /news?page=1&pageSize=12` → tin `published`, mới nhất trước; hỗ trợ `featured=true`.
- `GET /news/{slug}` → chi tiết.
- ⚠️ **BẤT BIẾN: trả CẢ HAI ngôn ngữ trong một payload** — `title: {en, vi}`, `excerpt: {en, vi}`, `body: {en, vi}`.
  **KHÔNG** có tham số `?locale=`. Lý do: website đổi ngôn ngữ **client-side, không reload trang** (`localStorage`, xem `src/lib/locale.tsx`) ⇒ client phải có sẵn cả 2 bản trong payload. Endpoint trả 1 ngôn ngữ sẽ **không dùng được**.

### 9.3 Downloads / Products
- `GET /download-apps` → danh sách app tải được + `downloads` (status/kind/target/version/size/updatedAt) mỗi platform.
- Hoặc gộp vào endpoint products nếu Dashboard quản lý cả metadata sản phẩm.

### 9.4 Download resolve + count
- Giữ ở website: `GET /api/download/{slug}?platform=android|ios` → 302 tới `target`.
  - `target` lấy từ API §9.3 (cache ngắn) **hoặc** gọi `GET {dashboard}/download/{slug}/resolve?platform=` trả `target`.
  - Đếm: `POST {dashboard}/download/{slug}/hit?platform=` (fire-and-forget, lỗi không chặn tải).
- ⚠️ **Bất biến quan trọng**: `Location` trả **verbatim** (đường dẫn tương đối giữ nguyên). Sau Cloudflare tunnel host là `localhost:3001`; **không** absolutize theo `req.url` kẻo redirect chết. (Xem comment trong `src/app/api/download/[slug]/route.ts`.)

### 9.5 API GHI cho Studio (bắt buộc — website vẫn giữ trang Studio cho tác giả)

**Đã chốt:** luồng tác giả tự nộp game **ở lại website** (là tính năng của người dùng, không phải công cụ vận hành). Nhưng **website không ghi DB nữa** — các route của web trở thành **proxy mỏng** chuyển tiếp lên Dashboard. ⇒ Dashboard **phải mở API ghi**:

- `POST /studio/games` — tạo game (multipart: metadata + file ZIP). **Dashboard thực thi toàn bộ luật**: quota 3 pending / 10 tổng (§4.1.5), giới hạn ZIP (§4.1.4), sinh slug (§4.1.6), giải nén an toàn, set `status = draft|pending`.
- `PUT /studio/games/{slug}` — sửa (multipart, ZIP tùy chọn). Áp **luật re-moderation** (§4.1.3).
- `DELETE /studio/games/{slug}` — xoá (kiểm tra owner).
- `GET /studio/games?ownerId=…` — danh sách game của chính tác giả (mọi trạng thái) để render Studio.

**Mã lỗi cần chuẩn hoá** (web chỉ hiển thị lại, không tự suy luận): `quota`, `too-large`, `too-big-uncompressed`, `invalid-zip`, `no-index`, `unsafe-path`, `forbidden`, `notfound`.

> ⚠️ **Nguyên tắc:** website **không sao chép luật nghiệp vụ**. Mọi quota/giới hạn/kiểm duyệt chỉ tồn tại ở Dashboard — nếu web cũng kiểm tra, hai bên sẽ lệch nhau theo thời gian.

**Truyền danh tính:** cần chốt cơ chế để Dashboard tin `owner_id` do web gửi lên (token dịch vụ giữa 2 server + user id đã xác thực, hoặc forward access token Authentik của user). Xem O7 (§8).

### 9.6 Xác thực API
- Public-read: có thể mở công khai (chỉ dữ liệu `published`) hoặc ký bằng token dịch vụ. Endpoint duyệt/CRUD/ghi: bắt buộc Authentik + role (§5), riêng API Studio xác thực theo cơ chế ở §9.5.

---

## 10. Phụ lục — file tham chiếu trong website (đọc để hiểu logic gốc)

| Chức năng | File |
|---|---|
| Store game (SQLite) | `src/lib/games-db.ts` |
| Upload/giải nén ZIP an toàn, slug, viewer CSS | `src/lib/game-upload.ts` |
| Luật re-moderation khi sửa | `src/lib/game-status.ts` |
| API admin: upload/xoá/duyệt | `src/app/api/admin/games/route.ts` |
| API owner: submit (quota) | `src/app/api/games/studio/route.ts` |
| API owner/admin: sửa/xoá | `src/app/api/games/[slug]/route.ts` |
| Resolve + đếm download | `src/lib/app-download.ts`, `src/lib/downloads-db.ts`, `src/app/api/download/[slug]/route.ts` |
| Dữ liệu app/store (tĩnh) | `src/content/ecosystem.ts`, `src/content/products.ts`, `src/content/types.ts` |
| Quyền admin (allowlist) | `src/lib/auth-helpers.ts`, `src/auth.ts` |
| Repository seam (đã sẵn để đổi nguồn) | `src/content/products.ts`, `src/content/games.ts` |

### ENV liên quan (website)
`GAMES_STORAGE_DIR` (mặc định `/home/namnx/ctslab-games`), `GAMES_MAX_UPLOAD_MB=100`, `GAMES_MAX_UNCOMPRESSED_MB=300`, `GAMES_MAX_FILES=2000`, `GAMES_MAX_FILE_MB=100`, `GAMES_MAX_PENDING_PER_USER=3`, `GAMES_MAX_TOTAL_PER_USER=10`, `GAMES_DB`, `DOWNLOADS_DB`, `ADMIN_EMAILS` (sẽ bỏ), `AUTHENTIK_*`.
