# Báo cáo: Web đã tiêu thụ xong News API — đã live

**Ngày:** 2026-07-12 · **Từ:** đội Web (`ctslab-redesign`) · **Gửi:** đội Dashboard
**Trả lời:** [2026-07-11-news-api-for-web.md](../../../Ptalk_project/docs/handoff/2026-07-11-news-api-for-web.md)

## 1. Trạng thái: XONG, đã chạy trên production

Tin tức đã live trên **ctslab.net** từ 2026-07-12:

| Nơi | Nội dung |
|---|---|
| `/news` | Danh sách, **có phân trang**, tin nổi bật ghim đầu |
| `/news/[slug]` | Bài viết, render HTML thân bài, OG image cho chia sẻ MXH |
| **Trang chủ** | Khối "Lab có gì mới" — 1 tin lớn + 2 tin nhỏ, đặt giữa Showcase và Ecosystem |
| Nav | Thêm mục **News / Tin tức** |

Env production: `DASHBOARD_API_URL=http://localhost:4321`. ISR 60s — các bạn đăng tin là web tự cập nhật trong vòng 1 phút, web không cần deploy lại.

**Cảm ơn bản patch tham chiếu** — áp sạch lên HEAD, dùng làm nền luôn. Tiết kiệm cho chúng tôi khá nhiều thời gian.

---

## 2. Ba việc chúng tôi bổ sung thêm vào patch

| | Vấn đề | Đã xử lý |
|---|---|---|
| **1** | Patch fetch 24 tin rồi bỏ qua `totalPages` → khi lab có **>24 tin, các tin cũ không còn URL nào tới được** (mất nội dung âm thầm) | Thêm phân trang `?page=`, dùng `pagination.totalPages` các bạn trả về |
| **2** | Tin `featured` chỉ có badge, không được ghim lên đầu | Ghim featured lên đầu (xem mục 3 — có việc cần các bạn) |
| **3** | Thiếu OG image → share Facebook/Zalo ra thẻ trống | Thêm `og:image` + `twitter:card` từ `cover` |

---

## 3. ⚠️ MỘT ĐỀ NGHỊ VỚI API — phần này cần các bạn

**Vấn đề:** endpoint danh sách sắp xếp **thuần theo `published_at DESC`**, và `featured` chỉ là **bộ lọc** (`?featured=true`) chứ **không phải tiêu chí sắp xếp**.

Hệ quả: trang chủ chúng tôi chỉ hiện 3 tin. Nếu xin đúng 3 tin, thì một bài admin đã **ghim "nổi bật"** nhưng không nằm trong 3 bài mới nhất sẽ **không bao giờ lên được trang chủ** — ghim mà như không ghim.

**Cách chúng tôi lách tạm:** fetch **cửa sổ 12 tin** rồi tự ghim + cắt 3 ở phía web. Chạy đúng, nhưng chỉ đúng trong phạm vi 12 tin gần nhất — một bài featured cũ hơn thế vẫn sẽ rơi mất.

**Đề nghị:** thêm `featured` vào `ORDER BY` của endpoint danh sách:
```sql
ORDER BY featured DESC, published_at DESC NULLS LAST, slug ASC
```
Hoặc thêm tham số `?sort=featured`. Làm vậy thì phía web bỏ được đoạn lách, và ý nghĩa của nút "ghim nổi bật" trong Dashboard mới đúng như admin kỳ vọng.

*(Không gấp — hiện lab mới có 1 tin. Nhưng nên xử lý trước khi số tin vượt 12.)*

---

## 4. Vài điểm nhỏ để các bạn biết

- **Tài liệu bàn giao ghi "⚠️ Chưa deploy" nhưng API đã sống rồi.** Chúng tôi `curl` cả `:4321` và `:4322` đều HTTP 200 đúng shape. Có lẽ đã rebuild sau khi viết tài liệu — nên cập nhật lại dòng đó.
- **`excerpt.en` thường rỗng.** Dashboard bắt buộc song ngữ cho `title` nhưng không bắt buộc `excerpt` — bài "Chúc mừng sinh nhật a Nam" có `excerpt.vi = "hello"`, `excerpt.en = ""`. Web đã tự fallback sang bản VI để khách xem tiếng Anh không thấy ô trống. **Không cần các bạn sửa gì**, chỉ để biết.
- **`publishedAt` có thể là chuỗi rỗng** — web đã guard trước khi `new Date()`. Đúng như các bạn cảnh báo.

---

## 5. Chúng tôi đã kiểm chứng giúp các bạn

Chạy production build thật trong worktree riêng, test bằng Chromium headless (không chỉ `curl`):

- ✅ **Cái bẫy quan trọng nhất các bạn cảnh báo — HOẠT ĐỘNG ĐÚNG.** Tắt Dashboard rồi thử: `/news` suy giảm êm (200 + empty-state), `/news/<slug>` trả **500 + error boundary có nút Thử lại** — **không phải 404 bị cache**. Bất đối xứng đó đúng và cần thiết.
- ✅ `unstable_retry()` đúng như các bạn nói — docs Next 16.2.4 xác nhận `reset()` không re-fetch.
- ✅ **HTML sanitize của các bạn render đủ allowlist**: `h2 strong ul li blockquote pre code a[href]`. Web không sanitize lại, tin vào lớp đầu ra của các bạn.
- ✅ **`next build` của web KHÔNG fail khi Dashboard sập** → hai bên deploy lệch nhau vẫn an toàn.

**Một điều chúng tôi nghi sai, đã tự bác bỏ:** ban đầu tưởng `generateMetadata` (cũng gọi `getNewsBySlug` và cũng ném khi API sập) sẽ chặn error boundary render. Kiểm bằng trình duyệt thật thì **không** — patch của các bạn đúng, chúng tôi đã gỡ bỏ thay đổi thừa của mình. **Đừng ai thêm `try/catch` vào đó.**

---

## 6. Hợp đồng — xin giữ giúp

Nguồn sự thật của shape là `Dashboard-v2/dashboard/src/lib/public-news.ts`. Web chép tay lại shape đó, **không có tooling nào ràng buộc hai bên**. Nếu đổi tên field hoặc đổi cấu trúc response, **báo web trước** — không thì web sẽ âm thầm hiện tin rỗng mà test hai bên vẫn xanh.

Đặc biệt xin giữ nguyên hai điều:
1. **Mỗi bài trả CẢ `vi` lẫn `en`** trong một payload, **không** thêm `?locale=`. Web đổi ngôn ngữ **client-side, không reload** — endpoint trả một ngôn ngữ sẽ làm vỡ tính năng này.
2. **API trả 404 chỉ khi bài thật sự không tồn tại/chưa đăng.** Đừng bao giờ trả 404 cho lỗi hệ thống.

---

## 7. Còn nợ (từ bản bàn giao web → Dashboard, 2026-07-10)

Ba module còn lại vẫn chờ phía Dashboard, chưa động tới:
- **Quản lý + duyệt Game** (kèm API ghi cho luồng Studio của tác giả — web giữ trang Studio, ghi qua proxy)
- **Cập nhật APK + link store**
- **Xem phiên đăng nhập / thiết bị của user** (qua Authentik API)

Câu hỏi **O7 vẫn đang chặn phần Game**: web proxy truyền **danh tính user** sang Dashboard bằng cách nào — token dịch vụ server↔server, hay forward access token Authentik của user? Cần chốt sớm.
