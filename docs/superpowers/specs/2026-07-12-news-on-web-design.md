# Spec: Trang Tin tức trên ctslab.net (tiêu thụ News API của Dashboard)

**Trạng thái:** 🟡 Chờ bạn duyệt · **Ngày:** 2026-07-12 · **Repo:** `ctslab-redesign`
**Đầu vào:** [Bàn giao của đội Dashboard](/home/namnx/Ptalk_project/docs/handoff/2026-07-11-news-api-for-web.md)
**Spec mẹ:** `2026-07-10-web-dashboard-integration-design.md` (spec này **sửa** §3.1 + §4 của nó — xem §2)

---

## §0. Những gì tôi đã KIỂM CHỨNG (không tin suông tài liệu)

| Việc kiểm | Kết quả |
|---|---|
| Hợp đồng API khớp code thật? | ✅ Đối chiếu `Dashboard-v2/dashboard/src/lib/public-news.ts` + 2 route — **khớp 100%** |
| **API đã sống chưa?** | ✅ **ĐÃ SỐNG** — `curl localhost:4321` và `:4322` đều **HTTP 200**, đúng shape.<br>⚠️ Nhưng **`total: 0` — chưa có bài nào.** (Tài liệu ghi "chưa deploy" là đã lỗi thời.) |
| `unstable_retry` có thật trong Next 16.2.4? | ✅ Có (`node_modules/next/dist/docs/.../error.md`, thêm ở v16.2.0). Docs xác nhận **`reset()` KHÔNG re-fetch** |
| Patch tham chiếu áp được lên HEAD? | ✅ `git apply --check` → **sạch** |
| Primitive patch dùng có thật? | ✅ `Badge tone="red"`, `Button onClick`, `Container`, `Reveal`, `Stagger` — đúng API |
| Biến CSS patch dùng có tồn tại? | ✅ `--surface --blue --ink-2 --card --border --radius-lg --font-mono` đủ cả |
| **CSP có chặn ảnh bìa domain ngoài?** | ✅ **Không.** CSP duy nhất là `frame-ancestors` trên `games.ctslab.net`; `ctslab.net` **không có `img-src`** |
| Cảnh báo hạ tầng có thật? | 🚨 **THẬT.** pm2 `cts-redesign` = `npm run start` với `cwd=/home/namnx/ctslab-redesign` → **build/dev tại chỗ ĐÈ `.next` production đang phục vụ** |

---

## §1. Mục tiêu & phạm vi

Thêm **`/news`** (danh sách) và **`/news/[slug]`** (bài viết) vào website, đọc từ **API công khai của Dashboard**. Web **chỉ đọc**, không chạm DB. Admin soạn tin ở Dashboard `/v2/news`.

**Ngoài phạm vi:** mọi thứ khác trong spec mẹ (Games W1, Studio proxy, Downloads).

---

## §2. ⚠️ Spec mẹ đã SAI ở 4 điểm — sửa lại

Tôi viết spec mẹ **trước khi** có hợp đồng thật. Đối chiếu code Dashboard thì 4 điểm sau **sai**, phải sửa để code không đi theo bản cũ:

| # | Spec mẹ (SAI) | Thực tế (ĐÚNG) |
|---|---|---|
| 1 | `body` là **Markdown**, render bằng `MessageContent` | ❌ **`body` là HTML** (từ trình soạn rich-text), đã sanitize ở Dashboard → render bằng `dangerouslySetInnerHTML` + CSS `.news-body`. **Không dùng `MessageContent`.** |
| 2 | Có `tags: string[]` | ❌ Không có `tags`. Có **`category`**: `san-pham \| su-kien \| thong-bao \| nghien-cuu` |
| 3 | Có `author` | ❌ **Không có `author`** trong API |
| 4 | `NewsList = { items, total, page, pageSize }` | ❌ Thật là `{ news: [...], pagination: { page, pageSize, total, totalPages } }`, và **thẻ tin KHÔNG có `body`** (cố ý — tiết kiệm băng thông + chi phí sanitize) |

✅ **Điểm spec mẹ nói ĐÚNG và cực kỳ quan trọng:** API **trả cả `vi` + `en` trong một payload**, không có `?locale=`. Đội Dashboard làm đúng vậy — vì locale của web là client-side.

---

## §3. Hợp đồng dữ liệu (bản chép từ code thật của Dashboard)

```ts
// Nguồn sự thật: Dashboard-v2/dashboard/src/lib/public-news.ts
interface NewsPost {
  slug: string;
  category: string;          // san-pham | su-kien | thong-bao | nghien-cuu
  cover: string | null;      // Dashboard đã lọc scheme (safeCoverUrl)
  featured: boolean;
  publishedAt: string;       // ISO — ⚠️ CÓ THỂ LÀ "" (chuỗi rỗng)
  title:   { vi: string; en: string };
  excerpt: { vi: string; en: string };
  body:    { vi: string; en: string };  // HTML đã sanitize — thẻ tin KHÔNG có field này
}
```

**Endpoint** (base = `DASHBOARD_API_URL`, **server-side only**, prod `:4321`, staging `:4322`):
- `GET {BASE}/api/public/news?page=1&pageSize=12&featured=true` → `{ news: NewsCard[], pagination: { page, pageSize, total, totalPages } }`
  - `pageSize` tối đa **50**. Sắp xếp `published_at DESC NULLS LAST, slug ASC`.
- `GET {BASE}/api/public/news/{slug}` → `NewsPost` · **404** `{error}` nếu không có/chưa đăng · **500** `{error}`.

**"Bài đang sống"** = `published` **hoặc** (`scheduled` và `published_at <= now()`). Web **không phải làm gì** — nháp và bài hẹn-giờ-chưa-tới sẽ không bao giờ xuất hiện.

---

## §4. Kiến trúc: đặt seam ở đâu?

Spec mẹ §0 nói *"mọi dữ liệu đi qua port `src/lib/dashboard/`"*. Nhưng port hai-adapter đó được thiết kế cho dữ liệu **đang di cư** (games/downloads hôm nay có nguồn local, mai chuyển sang API) — cần 2 adapter để cắt dần.

**News không như vậy: nó sinh ra đã thuộc Dashboard, chỉ có duy nhất một nguồn, mãi mãi.** Dựng port 2-adapter cho nó là nghi lễ thừa (adapter thứ hai sẽ vĩnh viễn trống).

👉 **Quyết định: News dùng `src/content/news.ts`** — đúng khuôn **"Repository seam"** repo đã có sẵn (`content/games.ts`, `content/products.ts` đều ghi rõ comment đó). UI vẫn **không bao giờ fetch trực tiếp**, vẫn đúng tinh thần "một cổng dữ liệu" của spec mẹ §0.

Ranh giới rõ ràng, ghi lại để sau không cãi nhau:
- `src/content/*.ts` = **seam nội dung** — thứ các trang đọc. Cổng duy nhất của UI.
- `src/lib/dashboard/*` = **adapter cho dữ liệu ĐANG DI CƯ** (games, downloads — có nguồn local cần cắt dần).
- Sau này nếu cần chế độ offline/fixture cho News → thêm **bên trong** `content/news.ts` sau một biến ENV. Không đổi kiến trúc.

---

## §5. Bốn cái bẫy (bắt buộc tuân thủ)

### 5.1 🚨 Dashboard sập KHÔNG được biến thành 404 — xử lý BẤT ĐỐI XỨNG

Đây là lỗi nặng nhất. Nếu `getNewsBySlug` gộp *"API trả 404"* và *"API sập/mạng hỏng"* thành cùng `null` rồi trang gọi `notFound()`, thì **mỗi lần deploy Dashboard, mọi URL bài thật trả 404 — và Next CACHE cái 404 đó** → crawler de-index bài thật.

```ts
if (res.status === 404) return null;                    // bài THẬT SỰ không có → notFound()
if (!res.ok) throw new Error(`news API ${res.status}`); // API sập → NÉM, để error boundary lo
// fetch reject (mạng hỏng) cũng phải ném — đừng nuốt
```

| Trang | API lỗi thì làm gì | Vì sao |
|---|---|---|
| **`/news`** (danh sách) | **Suy giảm êm** → `{posts: [], totalPages: 1}` → empty-state. **KHÔNG BAO GIỜ ném.** | Danh sách không khẳng định điều gì về một bài cụ thể |
| **`/news/[slug]`** (chi tiết) | **Ném** → `error.tsx` | Chi tiết có khẳng định: "bài này tồn tại". Nói 404 khi thực ra ta *không biết* là nói dối |

Bất đối xứng này là **cố ý**, không phải thiếu nhất quán.

### 5.2 Nút "Thử lại" phải gọi `unstable_retry()`, KHÔNG phải `reset()`
Đã kiểm chứng trong docs Next 16.2.4: `reset()` **chỉ xoá state, không re-fetch** → bấm vào hiện lại y lỗi cũ. Props của `error.tsx`: `{ error, unstable_retry }`.

### 5.3 `publishedAt` có thể là chuỗi rỗng `""`
Code Dashboard: `publishedAt: r.published_at ? new Date(...).toISOString() : ""`. `new Date("")` → **Invalid Date** → hiện "Invalid Date" trên UI. **Luôn guard trước khi format.**

### 5.4 `cover` là URL người dùng nhập
Dashboard đã chặn ở đầu ra (`safeCoverUrl`: chỉ `http/https` hoặc path gốc). **Nếu web tự xử lý URL ảnh ở đâu đó**, nhớ: theo WHATWG, trình duyệt coi `\` **tương đương** `/` trong phần authority → `/\evil.com/a.png` resolve sang **origin khác**. Kiểm `startsWith("//")` là **không đủ**.
→ Web **không** tự xử lý URL ảnh; render thẳng giá trị Dashboard trả. Không có CSP `img-src` nên ảnh ngoài hiển thị được.

---

## §6. 🔒 Ranh giới tin cậy: `dangerouslySetInnerHTML`

Web render HTML thân bài **không sanitize lại**. Chấp nhận được **với đúng 2 điều kiện**, ghi lại để sau này ai đọc cũng hiểu vì sao:

1. Dashboard sanitize **2 lớp**, lớp chịu lực là **lúc trả API** (phủ cả hàng bị sửa thẳng trong DB). Allowlist: `p br strong em u s h2 h3 ul ol li blockquote a img code pre`; thuộc tính chỉ `a[href]`, `img[src,alt]`; scheme chỉ `http/https/mailto`.
2. **`DASHBOARD_API_URL` là biến server-side, do ta cấu hình** — không phải đầu vào người dùng. Nếu nó trỏ sang host lạ thì mọi bảo đảm sụp đổ.

⚠️ **Hệ quả vận hành:** `DASHBOARD_API_URL` phải được coi như **secret cấu hình**. Không bao giờ đặt thành `NEXT_PUBLIC_*`, không để người dùng ảnh hưởng.

*(Không thêm sanitize phía web: cần dependency mới, và lớp chịu lực đã ở đúng chỗ — nơi dữ liệu rời khỏi nguồn sự thật.)*

---

## §7. Cách làm: dùng lại patch tham chiếu + vá 3 lỗ hổng

Patch của đội Dashboard (`ctslab-news-reference.patch`, 6 commit, ~450 dòng, **thuần thêm — 0 dòng xoá**) **áp sạch lên HEAD**, bám đúng convention repo, có test, đã xử lý đúng cả 4 bẫy ở §5.

👉 **Dùng nó làm nền.** Viết lại từ đầu chỉ để "tự làm" là lãng phí và rủi ro hơn.

Nhưng tôi rà kỹ và thấy **3 lỗ hổng** patch chưa xử lý:

| # | Lỗ hổng | Hệ quả | Đề xuất |
|---|---|---|---|
| **G1** | **Không có phân trang.** `/news` fetch `pageSize: 24` rồi bỏ qua `totalPages` | Khi lab có **>24 tin**, các tin cũ **không còn URL nào tới được** — mất nội dung âm thầm | **Thêm phân trang** (`/news?page=2`). API đã trả sẵn `totalPages`, chi phí ~20 dòng |
| **G2** | **Tin `featured` không được ghim lên đầu** — chỉ có badge, thứ tự vẫn thuần thời gian | Tin quan trọng bị tin mới đẩy chìm | Sắp `featured` lên đầu (giữ nguyên thứ tự thời gian trong mỗi nhóm) |
| **G3** | **Không có OG image** — chia sẻ Facebook/Zalo ra thẻ trống | Tin của lab share lên MXH trông nghèo nàn | Thêm `openGraph.images` từ `cover` trong `generateMetadata` |

Ngoài ra giữ nguyên toàn bộ phần tốt của patch: seam có **fetch tiêm vào** (test được), map khoan dung (record hỏng → loại, không vỡ trang), `pick()` fallback ngôn ngữ, cảnh báo khi thiếu `DASHBOARD_API_URL` ở production, ISR 60s.

---

## §8. Các file sẽ đụng

| File | Việc |
|---|---|
| `src/content/news.ts` + `news.test.ts` | **Mới** — seam đọc API, ISR 60s, xử lý lỗi bất đối xứng (§5.1) |
| `src/content/types.ts` | `+` type `NewsPost` |
| `src/content/ui.ts` | `+` chuỗi song ngữ (eyebrow/title/intro/empty/featured/back/readMore/error/retry) |
| `src/content/site.ts` | `+` mục nav `/news` (giữa **Products** và **Download**) |
| `src/app/news/page.tsx` | **Mới** — danh sách, ISR, **+ phân trang (G1)** |
| `src/app/news/[slug]/page.tsx` | **Mới** — bài viết, `notFound()` khi 404, **+ OG image (G3)** |
| `src/app/news/error.tsx` | **Mới** — error boundary, `unstable_retry()` (§5.2) |
| `src/components/news/NewsGrid.tsx` | **Mới** — lưới thẻ tin, empty-state, **+ ghim featured (G2)** |
| `src/components/news/NewsArticle.tsx` | **Mới** — bài viết + `.news-body` |
| `src/app/globals.css` | `+` style `.news-body` (nối cuối, dùng biến CSS sẵn có) |
| `.env.example` | `+` `DASHBOARD_API_URL` |

**Không đụng** bất cứ thứ gì khác. Thuần thêm mới.

---

## §9. 🚨 Ràng buộc vận hành (KHÔNG được vi phạm)

**pm2 `cts-redesign` chạy `npm run start` với `cwd = /home/namnx/ctslab-redesign` → nó phục vụ production từ thư mục `.next` NGAY TRONG repo này.**

⇒ Chạy `npm run build` **hoặc** `next dev` tại chỗ sẽ **ghi đè `.next` mà production đang dùng** → website thật hỏng/chập chờn.

**Bắt buộc:**
- Mọi `build` / `dev` **phải làm trong `git worktree` riêng.**
- Trong repo chính chỉ được chạy: `npm test`, `npx tsc --noEmit`, `npm run lint` (không đụng `.next`).
- Deploy = build ở worktree → chỉ khi xanh mới build/restart ở repo chính (hoặc theo quy trình deploy sẵn có của bạn).

---

## §10. Kế hoạch kiểm chứng

⚠️ **API đang trả `total: 0` — chưa có bài nào.** Không có nội dung thì không kiểm được UI thật.

1. **Test đơn vị** (fetch tiêm vào, không cần API sống): map khoan dung; danh sách suy giảm êm khi 500/mạng hỏng; chi tiết **404 → null** nhưng **500/throw → ném**; `publishedAt: ""` không ra "Invalid Date".
2. **Chạy thật trong worktree** với `DASHBOARD_API_URL=http://localhost:4322` (staging):
   - **Cần ít nhất 1 bài tin** — bạn tạo ở Dashboard `/v2/news`, hoặc tôi chèn 1 bài mẫu vào DB staging (nếu bạn cho phép).
   - Kiểm: `/news` hiện thẻ tin; đổi ngôn ngữ VI↔EN **không reload** vẫn đổi được nội dung; `/news/<slug>` render HTML đúng; bài không tồn tại → 404 thật.
   - **Kiểm bẫy §5.1:** tắt Dashboard staging → `/news` phải hiện empty-state (không vỡ), `/news/<slug>` phải hiện **error boundary** (KHÔNG phải 404).
3. `npm test`, `npx tsc --noEmit`, `npm run lint` — xanh.

---

## §11. Thứ tự triển khai

1. Code + test (repo chính, không build).
2. Verify trong **worktree** với staging `:4322`.
3. Thêm `DASHBOARD_API_URL=http://localhost:4321` vào env production của web.
4. Deploy web.
5. Admin viết tin ở Dashboard → tin lên sóng sau ≤60s (ISR).

---

## §12. Quyết định đã chốt (2026-07-12)

| # | Quyết định |
|---|---|
| ✅ **D1** | **Dùng patch tham chiếu làm nền** — áp sạch lên HEAD, đúng convention, đã xử lý đủ 4 bẫy ở §5. Giữ nguyên 6 commit gốc để bảo toàn ghi công của đội Dashboard. |
| ✅ **D2** | **Vá cả 3 lỗ hổng: G1 (phân trang) + G2 (ghim featured) + G3 (OG image)** — thành các commit riêng, có test. |
| ✅ **D3** | **Dữ liệu kiểm thử: người dùng tự tạo 1–2 tin ở Dashboard `/v2/news`** (đi qua luồng admin thật, sanitize thật). Verify sau khi có tin. |
| ✅ **D4** | **Nav:** `Home · Products · **News** · Download · Games · VR Tour` — đúng như patch. |
| ✅ **D5** | **News dùng `src/content/news.ts`** (seam), KHÔNG dựng port 2-adapter — xem lý do ở §4. |

### Thứ tự thực thi
1. `git am` patch (6 commit gốc) → `npm test` + `tsc` phải xanh.
2. Commit **G1 phân trang** (+ test).
3. Commit **G2 ghim featured** (+ test).
4. Commit **G3 OG image**.
5. Verify trong **git worktree** (§9!) với staging `:4322`, sau khi có tin thật.

---

## §13. Kết quả kiểm chứng (2026-07-12) — ĐÃ CHẠY THẬT

Build + chạy production trong **git worktree riêng** (repo chính không bị đụng: `.next` giữ nguyên mtime, pm2 `cts-redesign` không restart, `localhost:3001` vẫn 200). Kiểm bằng **Chromium headless thật** (không chỉ `curl`, vì error boundary render sau hydrate — `curl` chỉ thấy shell rỗng và sẽ cho kết luận SAI).

| Kịch bản | Kỳ vọng | Kết quả |
|---|---|---|
| API sống, 0 tin → `/news` | 200 + empty-state | ✅ 200, "No news yet" |
| API sống, slug lạ → `/news/xxx` | **404 thật** | ✅ 404 |
| 🚨 **API SẬP** → `/news` (danh sách) | suy giảm êm, 200 | ✅ 200 + empty-state, không vỡ |
| 🚨 **API SẬP** → `/news/<slug>` | **500, KHÔNG phải 404** | ✅ **500** + error boundary render (tiêu đề lỗi + nút "Thử lại" + navbar/footer) |
| **G1** phân trang | `Page 1/2`, link trang 2, trang 1 URL sạch | ✅ `Previous \| Page 1/2 \| Next → /news?page=2`; trang 2 đúng 3 tin cuối; Previous về `/news` |
| **G2** ghim featured | tin nổi bật lên đầu, còn lại giữ thứ tự thời gian | ✅ `tin-07 → tin-01 → tin-02 → …` (tin-07 featured, không phải mới nhất) |
| **G3** OG image | og:image + twitter card | ✅ `og:image`, `og:type=article`, `article:published_time`, `twitter:card=summary_large_image` |
| Thân bài HTML | render đủ allowlist | ✅ `h2 strong ul li blockquote pre code a[href]` trong `.news-body` |
| Song ngữ | payload có **cả** vi+en | ✅ cả hai bản có trong payload → đổi ngôn ngữ không cần reload |
| Test / typecheck / lint | xanh | ✅ **142 test**, tsc sạch, eslint sạch |

> Dữ liệu kiểm thử: API giả bám đúng hợp đồng (15 bài, 1 featured không phải bài mới nhất, `pageSize=12` → 2 trang). **Không đụng DB thật.** Vẫn cần bạn tạo tin thật ở Dashboard `/v2/news` để kiểm nội dung/sanitize thật.

### Một điều tôi đã NGHI SAI — ghi lại để đừng ai "sửa" lại
Tôi từng nghi `generateMetadata` (cũng gọi `getNewsBySlug` và cũng ném khi API sập) sẽ **chặn error boundary render**, vì docs Next ghi `error.js` chỉ bọc `layout/page/loading/not-found`. **Kiểm chứng bằng trình duyệt thật: SAI.** Error boundary vẫn render bình thường ở bản gốc. Đã **gỡ bỏ** thay đổi thừa đó.
⚠️ **Đừng thêm `try/catch` vào `generateMetadata`** — không cần, chỉ làm rối.
