# Spec: Website CTSLab × Dashboard — News, Games, Releases

**Trạng thái:** 🟢 Đủ chi tiết để code lát **W1–W2** · 🟡 W4 chờ chốt Q6 · **Ngày:** 2026-07-10 · **Repo:** `ctslab-redesign`
**Tài liệu anh em:** [Bàn giao cho đội Dashboard](../../handoff/2026-07-10-ctslab-modules-for-dashboard.md) — phía Dashboard.

> Spec này mô tả **phía website**. Nguyên tắc: mọi thứ có thể làm code lệch về sau đều phải được **chốt bằng chữ ở đây trước khi code**.

---

## §0. Nguyên tắc chống lệch (đọc trước khi code bất cứ dòng nào)

1. **Một cổng dữ liệu duy nhất.** UI **không bao giờ** gọi `fetch` tới Dashboard trực tiếp. Mọi dữ liệu đi qua **một lớp port** (`src/lib/dashboard/`). Đổi nguồn = đổi adapter, UI không đụng.
2. **Hợp đồng DTO là luật.** Kiểu dữ liệu trong `src/lib/dashboard/types.ts` là **bản sao đúng** của API Dashboard (§3). Sai lệch phải sửa spec trước, code sau.
3. **Validate ở biên.** Dữ liệu từ API là *không tin được* → parse/validate ngay tại adapter. Lỗi schema ⇒ log + fallback, **không** để lỗi rò vào UI.
4. **Website read-only.** Với news/game/download, website **chỉ đọc**. Ngoại lệ duy nhất: luồng Studio (tác giả tự nộp game) — ghi qua **proxy** tới API Dashboard, không ghi thẳng DB.
5. **Không bao giờ 500 vì Dashboard chết.** Mọi trang phải degrade an toàn (§8).

---

## §1. Phạm vi phía website

| Hạng mục | Thay đổi |
|---|---|
| **News** (mới) | Trang `/news` + `/news/[slug]`, thêm vào nav, (tùy chọn) block trên trang chủ. |
| **Games** | Bỏ đọc SQLite → đọc catalog từ API Dashboard. Studio (tác giả nộp game) **giữ trên web**, ghi qua proxy. |
| **Download / APK / store** | Bỏ dữ liệu tĩnh trong `ecosystem.ts` → đọc từ API Dashboard. Giữ route 302 + đếm. |
| **Admin trên web** | **Gỡ** `/admin`, `/admin/games`, `/api/admin/games` — chuyển hẳn về Dashboard. |
| **Account** | Ngoài phạm vi lần này (chưa thiết kế cho user thường). |

---

## §2. Kiến trúc dữ liệu — Port + Adapter (CỐT LÕI)

Đây là thứ giữ cho code không lệch và cho phép **làm web ngay bây giờ dù Dashboard chưa có API**.

```
   UI (server components, không đổi)
        │  gọi hàm domain, KHÔNG biết nguồn ở đâu
        ▼
   src/lib/dashboard/index.ts          ← PORT (API nội bộ, ổn định)
        getPublishedGames() · getGameBySlug()
        getNewsList()      · getNewsBySlug()
        getDownloadApps()
        submitGame() · updateGame() · deleteGame()   (proxy ghi, chỉ Studio)
        │
        ├─ adapter "local"      → nguồn hiện tại (SQLite + content tĩnh + seed news)
        └─ adapter "dashboard"  → REST API của Dashboard (§3)
                  ▲
        chọn bằng ENV: CTSLAB_DATA_SOURCE = local | dashboard
```

**Quy tắc:**
- **Cả hai adapter trả về đúng một kiểu DTO** (§3). Nếu chúng khác nhau dù chỉ một field → sai, phải sửa.
- Adapter `local` tồn tại để: (a) web dựng & style được **ngay hôm nay**; (b) làm fallback khi Dashboard chết; (c) là "lưới an toàn" lúc chuyển tiếp.
- Khi Dashboard sẵn sàng: đổi ENV, **không đổi một dòng UI nào**. Sau khi ổn định → xoá adapter `local` + `better-sqlite3` + `serverExternalPackages` trong `next.config.ts`.

**Vì sao không cho UI gọi thẳng API:** hôm nay `getCatalog()` (`src/lib/game-catalog.ts`) đã là seam đúng chuẩn, `products.ts` cũng ghi sẵn *"swap to an API/DB later without touching consumers"*. Ta chỉ mở rộng đúng khuôn đó.

---

## §3. Hợp đồng DTO (bản sao của API Dashboard)

> ⚠️ **Bẫy số 1 — song ngữ.** Locale của web là **client-side** (`src/lib/locale.tsx`: `localStorage`, SSR mặc định `en`, đổi ngôn ngữ **không reload**). ⇒ API **không được** trả theo 1 locale. Payload phải mang **cả `en` + `vi`** để client tự chọn. Bất kỳ endpoint `?locale=` nào cũng là **sai kiến trúc** cho web này.

### 3.1 News (mới)
```ts
type Localized<T = string> = { en: T; vi: T };

interface NewsItem {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;          // cho card ở list
  body: Localized;             // Markdown
  cover?: string;              // URL ảnh bìa
  tags: string[];
  featured: boolean;
  publishedAt: string;         // ISO
  author?: string;
}
interface NewsList { items: NewsItem[]; total: number; page: number; pageSize: number; }
```
**Fallback ngôn ngữ:** nếu một ngôn ngữ trống → hiển thị ngôn ngữ còn lại (không để trống trắng). Quy tắc này thực thi **ở adapter**, không ở UI.

### 3.2 Game (catalog công khai)
Giữ đúng kiểu `CatalogGame` đang có (`src/lib/game-catalog-map.ts`) để **không phải sửa UI Game Hub**:
```ts
interface CatalogGame {
  id; slug; title; author; year?; cover?; tags?: string[];
  blurb?: Localized;
  source: "lab" | "user";
  embedUrl: string;      // lab → path nội bộ; user → https://games.ctslab.net/<slug>/index.html
  sandboxed: boolean;    // user = true
  tagline?; description?; classification?; projectType?; releaseStatus?; genre?; externalUrl?; videoUrl?;  // string đơn ngữ
}
```
> ⚠️ **Bẫy số 2 — game text đơn ngữ.** Hiện `tagline/description` của game là **string đơn** (game của lab bị ép lấy `.vi`, game user vốn 1 ngôn ngữ). **Giữ nguyên đơn ngữ** cho game ở lần này để tránh churn; nếu sau muốn song ngữ phải sửa spec + UI cùng lúc.

> ⚠️ **Bẫy số 3 — embedUrl.** Game của user chạy trên **origin khác** (`games.ctslab.net`) và **bắt buộc `sandboxed: true`**. Adapter `dashboard` phải tự dựng `embedUrl` theo `GAMES_ORIGIN`, **không** tin URL do API trả về (chống XSS/origin injection).

### 3.3 Download apps
```ts
type Platform = "android" | "ios" | "vr";
type DownloadKind = "apk" | "play" | "appstore" | "testflight";
type DownloadStatus = "available" | "soon";

interface PlatformDownload {
  status: DownloadStatus;
  kind?: DownloadKind;     // bắt buộc khi status="available"
  target?: string;         // URL store HOẶC path APK ("/downloads/x.apk") — CHỈ server đọc
  version?: string; updatedAt?: string; size?: string;
}
interface DownloadApp { slug: string; downloads: Partial<Record<Platform, PlatformDownload>>; order: number; }
```
> ⚠️ **Bẫy số 4 — `target` không được lộ ra client.** Hôm nay `target` chỉ được đọc trong route `/api/download/[slug]`. Giữ nguyên: **không** serialize `target` xuống client component; client chỉ nhận `describeDownload()` (kind/version/size).

---

## §4. Module News (mới)

### 4.1 Routes
- `/news` — danh sách, mới nhất trước, có phân trang; tin `featured` ghim đầu.
- `/news/[slug]` — chi tiết, render Markdown (đã có sẵn hạ tầng markdown cho game description + ptalk-chat).
- Nav: thêm `{ id: "/news", label: { en: "News", vi: "Tin tức" } }` vào `src/content/site.ts` — **chèn giữa `/products` và `/download`** (thứ tự: Home · Products · News · Download · Games · VR Tour). *(cần xác nhận vị trí)*

### 4.2 Render & cache
- Server component, **ISR**: `export const revalidate = 300` (5 phút). Không dùng `force-dynamic` — news không cần realtime.
- `/news/[slug]`: `generateStaticParams` từ danh sách slug + `dynamicParams = true`.
- SEO: `generateMetadata` (title/description/og:image từ `cover`). **Ngược lại với `/admin`, news phải được index.**

### 4.3 UI & render Markdown
- Tuân theo design system sẵn có: `section`, `Container`, `eyebrow`/`eyebrow-draw`, `text-section`, token `--ink / --ink-2 / --card / --border`.
- **Body Markdown: dùng lại `src/components/home/MessageContent.tsx`** — đã có `react-markdown` + `remark-gfm` + KaTeX, **raw HTML tắt sẵn (không XSS)**, và **đang được dùng cho mô tả game** (`GameDetailView.tsx:82`) lẫn preview trong Studio. **Không thêm thư viện markdown mới.**
  - *(Nợ kỹ thuật nhỏ: tên `MessageContent` mang tính chat. Đổi tên là refactor riêng, đừng gộp vào việc này.)*
- Chi tiết thị giác (layout card, typography, ảnh bìa) làm ở bước sau bằng `ui-ux-pro-max` + `frontend-design`.

---

## §5. Module Games (cắt sang API)

### 5.1 Đọc
- `src/lib/game-catalog.ts::getCatalog()` — **giữ nguyên chữ ký**, đổi ruột: gọi port `getPublishedGames()`.
- **Game của lab giữ tĩnh trong repo** (đã chốt): `src/content/games.ts` (hiện 1 game `tyrp`, chạy từ `/games/tyrp/index.html`, **cùng origin, không sandbox**). Dashboard chỉ quản lý **game do user nộp**. ⇒ `getCatalog()` = `[lab games tĩnh] + [user games từ API]`, đúng như hôm nay chỉ đổi nguồn vế sau.
- `/games` hiện `force-dynamic` → chuyển sang `revalidate = 60` khi đã qua API.

### 5.2 Ghi (Studio — tác giả tự nộp game)
Studio là tính năng **của người dùng**, không phải công cụ vận hành ⇒ **ở lại website**. Nhưng **không ghi DB nữa**:
- `/api/games/studio` (POST tạo) và `/api/games/[slug]` (PUT sửa / DELETE xoá) trở thành **proxy mỏng**: xác thực phiên → chuyển tiếp (kể cả file ZIP) tới API Dashboard → trả kết quả.
- **Toàn bộ luật nghiệp vụ** (quota 3/10, giới hạn ZIP, re-moderation khi có build mới, slug, quyền owner) **chuyển về Dashboard** — website **không** sao chép lại luật, chỉ hiển thị lỗi trả về.
- `/games/studio` (server) hiện đọc `getGamesStore().listByOwner()` → đổi thành port `getMyGames(ownerId)`.

### 5.3 Gỡ
- Xoá `/admin`, `/admin/games`, `src/components/admin/GameUploadManager.tsx`, `src/app/api/admin/games/route.ts`.
- Sau khi hết SQLite: xoá `games-db.ts`, `downloads-db.ts`, `better-sqlite3`, `serverExternalPackages`.

---

## §6. Module Download / APK / Store

- `src/content/products.ts::getProducts()/getProduct()/getDownloadApps()` — **giữ chữ ký**, đổi ruột sang port.
- **Đã chốt:** metadata sản phẩm (tên, mô tả song ngữ, ảnh, features…) **ở lại `ecosystem.ts`** — nội dung marketing, đổi hiếm, thuộc về web. **Chỉ khối `downloads` + thứ tự app tải** lấy từ Dashboard. Adapter merge: `ecosystem.ts` (tĩnh) ⊕ `downloads` (API).
- Route `/api/download/[slug]?platform=` **giữ nguyên trên web**:
  - Lấy `target` qua port (cache ngắn) → **302 với `Location` trả verbatim**.
  - ⚠️ **Bất biến sống còn:** không absolutize `Location` theo `req.url`. Sau Cloudflare tunnel host là `localhost:3001` ⇒ absolutize = redirect chết. (Comment cảnh báo đã có sẵn trong route.)
  - Đếm lượt tải: bắn `POST` sang Dashboard **fire-and-forget**; lỗi đếm **không** chặn tải (giữ đúng hành vi `try/catch` hiện tại).

---

## §7. Auth & quyền trên web

- Website **không còn** khái niệm admin ⇒ bỏ `ADMIN_EMAILS`, bỏ `session.isAdmin` (và badge "Admin" ở `/account`), bỏ `src/lib/auth-helpers.ts::isAdminEmail`.
- Đăng nhập Authentik **giữ nguyên** (cần cho Studio: xác định `owner_id`).
- Proxy ghi (§5.2) phải **chuyển danh tính người dùng** sang Dashboard một cách tin cậy (token dịch vụ + user id đã xác thực, hoặc forward access token). *(Open Q — cần chốt với đội Dashboard)*

---

## §8. Chịu lỗi & cache (Dashboard chết thì sao?)

| Tình huống | Hành vi bắt buộc |
|---|---|
| API timeout / 5xx khi render `/news`, `/games`, `/download` | Dùng **bản cache gần nhất**; nếu không có → trang rỗng có thông báo nhã nhặn. **Không 500.** |
| API sai schema | Adapter loại bỏ record hỏng, log, render phần còn lại. |
| API chết khi user bấm tải | `/api/download` fallback: 302 về `/products/<slug>` (đúng như hành vi `back()` hiện tại). |
| API chết khi Studio nộp game | Hiện lỗi rõ ràng "hệ thống quản lý tạm gián đoạn", không mất dữ liệu form. |

Timeout gọi Dashboard: **3s**. Cache: `next: { revalidate }` + `tags` để revalidate theo module.

---

## §9. Kế hoạch cắt (từng lát, có cờ)

| Lát | Nội dung | Điều kiện |
|---|---|---|
| **W1** | Dựng port + DTO + adapter `local` (không đổi hành vi). Có test. | Không phụ thuộc Dashboard |
| **W2** | **News**: routes + UI, chạy trên adapter `local` (seed JSON trong repo). | Không phụ thuộc Dashboard |
| **W3** | Adapter `dashboard` cho News → bật ENV. | Cần API news |
| **W4** | Games: catalog qua port; Studio proxy; gỡ `/admin`. | Cần API games |
| **W5** | Downloads qua port; gỡ SQLite hoàn toàn. | Cần API downloads |

Mỗi lát: hành vi người dùng **không đổi** (trừ W2 thêm News). Có thể lùi bằng ENV.

---

## §10. Quyết định & câu hỏi còn mở

### 10.1 Đã chốt (2026-07-10)

| # | Quyết định | Ở mục |
|---|---|---|
| ✅ D1 | **Studio ở lại website**, ghi qua proxy tới API Dashboard. Web **không** sao chép luật nghiệp vụ. | §5.2 |
| ✅ D2 | **Làm News ngay** bằng adapter `local` + seed JSON, không chờ Dashboard. Cùng DTO ⇒ đổi ENV là chạy. | §9 W2 |
| ✅ D3 | **Game của lab giữ tĩnh trong repo**; Dashboard chỉ quản lý game do user nộp. | §5.1 |
| ✅ D4 | **Metadata sản phẩm ở lại repo**; chỉ khối `downloads` lấy từ Dashboard. | §6 |
| ✅ D5 | **Dashboard = nguồn sự thật**, web read-only, đọc qua REST. | §2 |

### 10.2 Còn mở

| # | Câu hỏi | Chặn gì | Ai chốt |
|---|---|---|---|
| **Q5** | Vị trí "News" trong nav — đề xuất: `Home · Products · News · Download · Games · VR Tour`. | Nhỏ, không chặn | Bạn |
| **Q6** | Proxy ghi truyền **danh tính user** sang Dashboard thế nào (token dịch vụ vs forward access token)? | **Chặn W4 (Studio)** | Bạn + đội Dashboard (= O7 bên bàn giao) |
| **Q7** | Seed JSON cho News: cần bao nhiêu tin mẫu + có tin thật nào để lên trước không? | Chặn W2 (nội dung, không chặn code) | Bạn |

> Q5/Q7 **không chặn** lát W1 (dựng port + DTO). Có thể bắt đầu W1 ngay.

---

## §11. Bố cục file & chữ ký hàm của port (code phải khớp đúng cái này)

```
src/lib/dashboard/
  types.ts        # DTO — bản sao hợp đồng API (§3). KHÔNG import từ đây vào adapter khác.
  port.ts         # chữ ký hàm (interface DataSource) — nơi duy nhất định nghĩa "web cần gì"
  index.ts        # chọn adapter theo ENV + export hàm domain cho UI
  parse.ts        # validate/parse dữ liệu API → DTO (biên tin cậy). Loại record hỏng, không throw lên UI.
  adapters/
    local.ts      # nguồn hiện tại: content tĩnh + SQLite + seed news JSON
    dashboard.ts  # REST API Dashboard
  __fixtures__/
    news.seed.json  # seed News cho adapter local (W2)
```

**Interface (`port.ts`) — chốt cứng, đổi phải sửa spec trước:**
```ts
export interface DataSource {
  // đọc — công khai
  getPublishedGames(): Promise<CatalogGame[]>;
  getGameBySlug(slug: string): Promise<CatalogGame | undefined>;
  getNewsList(opts?: { page?: number; pageSize?: number }): Promise<NewsList>;
  getNewsBySlug(slug: string): Promise<NewsItem | undefined>;
  getDownloadApps(): Promise<DownloadApp[]>;
  resolveDownloadTarget(slug: string, platform: Platform): Promise<string | undefined>; // server-only
  recordDownloadHit(slug: string, platform: Platform): Promise<void>;                   // fire-and-forget

  // Studio (ghi) — chỉ proxy, KHÔNG chứa luật nghiệp vụ
  getMyGames(ownerId: string): Promise<StudioGame[]>;
  submitGame(ownerId: string, form: FormData): Promise<StudioResult>;
  updateGame(ownerId: string, slug: string, form: FormData): Promise<StudioResult>;
  deleteGame(ownerId: string, slug: string): Promise<StudioResult>;
}

type StudioResult =
  | { ok: true; slug: string; status: string }
  | { ok: false; error: StudioError };   // mã lỗi do Dashboard trả, web chỉ hiển thị lại

type StudioError =
  | "quota" | "too-large" | "too-big-uncompressed" | "invalid-zip"
  | "no-index" | "unsafe-path" | "forbidden" | "notfound" | "unavailable";
```

**Ràng buộc:**
- Hàm đọc **async** hết (kể cả adapter `local` đọc đồng bộ) — để đổi adapter không phải sửa call-site.
- `resolveDownloadTarget` **chỉ được gọi từ server** (route `/api/download`). Có `import "server-only"` chặn lọt xuống client.
- `getCatalog()` / `getProducts()` / `getProduct()` hiện tại **giữ nguyên tên & chữ ký** (trừ việc thành `async`) — mọi UI đang gọi chúng không phải sửa logic.

**ENV mới:**
```
CTSLAB_DATA_SOURCE = local | dashboard     # mặc định: local
DASHBOARD_API_URL  = https://…             # bắt buộc khi = dashboard
DASHBOARD_API_TOKEN= …                     # token dịch vụ server↔server (Q6)
DASHBOARD_TIMEOUT_MS = 3000
```

---

## §12. Kế hoạch test (repo này test rất kỹ — giữ đúng chuẩn đó)

Repo dùng **vitest** (`npm test` → `vitest run`) và **gần như mọi file `src/lib/*.ts` đều có `.test.ts` đi kèm**. Giữ nguyên văn hoá đó:

| File | Test bắt buộc |
|---|---|
| `parse.ts` | Payload hợp lệ → DTO đúng. Payload **thiếu field / sai kiểu / thừa field** → loại record hỏng, giữ record tốt, **không throw**. |
| `adapters/local.ts` | Trả đúng DTO; merge lab games + user games; merge `ecosystem.ts` ⊕ `downloads`. |
| `adapters/dashboard.ts` | Mock `fetch`: 200 OK; **5xx → fallback**; **timeout → fallback**; JSON rác → fallback. |
| **Tương đương 2 adapter** | ⭐ Test then chốt: cùng một dữ liệu nguồn ⇒ **hai adapter trả DTO giống hệt nhau**. Đây là lưới chống lệch quan trọng nhất. |
| Fallback ngôn ngữ | `vi` trống → hiển thị `en`, và ngược lại. Không ra chuỗi rỗng. |
| `embedUrl` | Game `user` **luôn** `sandboxed: true` + URL dựng từ `GAMES_ORIGIN`, **không** lấy từ payload API. |
| `/api/download` | `Location` trả **verbatim** (không absolutize). Lỗi đếm không chặn 302. API chết → 302 về `/products/<slug>`. |

**Không test lại luật nghiệp vụ của Dashboard** (quota, giới hạn ZIP, re-moderation) — chúng không còn sống ở web nữa. Web chỉ test **hiển thị đúng mã lỗi** nhận được.
