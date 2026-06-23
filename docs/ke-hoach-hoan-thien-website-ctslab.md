# Kế hoạch hoàn thiện website CTS Lab

**Ngày:** 23/06/2026
**Trạng thái:** Bản tổng hợp trình duyệt — *cập nhật tiến độ 23/06/2026*
**Phạm vi:** Website ctslab.net và liên kết với hệ sinh thái CTS (PTalk, VietCreative, Vision Tale, Unilearn, KidMentor, P‑Connect, Dashboard).

---

## 1. Mục tiêu

Hoàn thiện website ctslab.net thành cổng trung tâm của hệ sinh thái CTS Lab: nhận diện thống nhất, trải nghiệm hiện đại, có tài khoản dùng chung, demo sản phẩm sống động, và là nơi quy về cho việc đặt thiết bị, mua gói và khu game của sinh viên.

Tài liệu này tổng hợp **những phần đã hoàn thành** và **các hạng mục đề xuất tiếp theo** kèm hướng triển khai khuyến nghị cho từng mục. Chi tiết kỹ thuật ở **Phụ lục** cuối tài liệu.

---

## 2. Những phần đã hoàn thành

Các hạng mục sau đã được phát triển và đưa lên website hiện tại:

- **Đăng ký / đăng nhập (SSO):** dùng chung tài khoản hệ sinh thái qua Authentik (một tài khoản cho mọi ứng dụng). Đã có trang hồ sơ cá nhân, khu thành viên, phân biệt vai trò quản trị viên.
- **Giao diện & hiệu ứng hiện đại:** con trỏ tùy biến, nền hạt tương tác (particle network), linh vật robot ở khu Games, hiệu ứng chuyển động chữ khi cuộn, ánh sáng nền và lớp film‑grain.
- **Tiện ích điều hướng:** bấm logo để cuộn lên đầu trang, nút "lên đầu trang" ở góc dưới.
- **Cấu trúc & nội dung:** tiêu đề rõ ràng hơn, các khối mới ("Chúng tôi làm gì", dải số liệu, teaser khu Games), trang chi tiết sản phẩm/showcase, logo thương hiệu mới, đưa VR Tour vào menu chính.
- **Khác:** thống nhất font hiển thị mới; liên kết Chính sách bảo mật / Điều khoản ở chân trang; tinh chỉnh phần giới thiệu PTalk (bỏ hiệu ứng "ghim", hiển thị đủ 3 tính năng).

> Các hạng mục đề xuất bên dưới được xây tiếp trên nền tảng này.

---

## 3. Các hạng mục đề xuất

> **Tiến độ nhanh:** ✅ Đã xong: Đăng nhập/đăng ký (SSO), 3.1, 3.2, 3.5, 3.6, 3.8 · 🟡 Phần lớn: 3.3, 3.7 (Game Hub đã có lát cắt 1: host + chơi game của lab) · ▶ Đang làm: 3.4 · ❌ Chưa làm: 3.9, 3.10, 3.11, 3.12.

### 3.1 Khu "Một tài khoản" → lưới logo ứng dụng — ✅ ĐÃ XONG
**Hiện trạng:** đã thay đoạn văn bằng lưới 7 ô app (3 logo thật + bổ sung 3 app KidMentor / PTalk Signature / P‑Connect), bấm ra trang chi tiết; có câu kết "…và hơn thế nữa."
**Đề xuất:** thay bằng **lưới logo các ứng dụng** (PTalk, VietCreative, Vision Tale, Unilearn… và các app khác); bấm vào mỗi logo mở **trang chi tiết sản phẩm** tương ứng. Bổ sung câu kết "…và hơn thế nữa." để gợi mở hệ sinh thái đang mở rộng.

### 3.2 Thống nhất một font chữ với các ứng dụng — ✅ ĐÃ XONG (phía web)
**Đã làm:** toàn website dùng **một font Plus Jakarta Sans** cho cả tiêu đề + body (bỏ Be Vietnam Pro), giữ mono cho số/code.
**Còn lại (note, chưa làm):** các **app** đổi font sang Plus Jakarta Sans để đồng bộ — việc phía project app, **tạm hoãn theo yêu cầu** (chưa sửa app lúc này).

### 3.3 Bổ sung thêm hiệu ứng động, hiện đại hơn — 🟡 PHẦN LỚN ĐÃ XONG (con trỏ tùy biến, particle network, mascot, chuyển động chữ; còn dư địa mở rộng)
**Đề xuất:** mở rộng có chọn lọc thêm hiệu ứng (chuyển cảnh, vi tương tác, nền động ở các mục còn tĩnh) trên nền các hiệu ứng đã có, ưu tiên giữ trải nghiệm mượt và đồng nhất phong cách.

### 3.4 Demo chat thử với PTalk (cạnh mô hình 3D) — ❌ CHƯA LÀM (mục lớn: cần API DeepSeek + RAG)
**Đề xuất:** thêm **khung chat thử** bên phải mô hình 3D PTalk để khách trải nghiệm trực tiếp. Giới hạn **5–10 câu/tài khoản/ngày** (gắn với tài khoản đăng nhập đã có). Kết nối **API DeepSeek** kèm **RAG nội bộ** của lab để trả lời sát ngữ cảnh sản phẩm.
**Hướng triển khai:** gọi mô hình qua máy chủ (ẩn khóa API), giới hạn lượt theo ngày để kiểm soát chi phí.

### 3.5 Trang chi tiết KidMentor: đặt thiết bị vật lý & liên hệ lab — ✅ ĐÃ XONG
**Đã làm:** khối "Đặt thiết bị vật lý" trên trang KidMentor: nút mở email soạn sẵn + hiển thị số điện thoại lab (data-driven, có thể bật cho app khác sau).
**Đề xuất ban đầu:** trong trang chi tiết KidMentor, thêm **mục "Đặt thiết bị vật lý"** và **nút liên hệ lab** để khách quan tâm phần cứng có thể đăng ký/đặt mua hoặc kết nối trực tiếp.

### 3.6 Bổ sung số liệu nổi bật, tăng tính chuyên nghiệp — ✅ ĐÃ XONG (dải Impact 6 số có đếm động: 10.000+ người dùng, 25.000+ lượt tải, 30+ trường, …)
**Đề xuất:** thêm **dải số liệu định vị** (người dùng, lượt tải, số trường/đối tác, số sản phẩm…) để tạo cảm giác quy mô và uy tín. Ưu tiên dùng **số liệu thật khi có**; với chỉ số chưa đo được thì dùng con số định hướng/khoảng hợp lý để giữ độ tin cậy.

### 3.7 Khu Game Hub (mô hình giống itch.io) — 🟡 LÁT CẮT 1 ĐÃ XONG (host + chơi game của lab trên web, hub + trang chơi đã polish & song ngữ). CÒN LẠI: sinh viên đăng ký + tự upload/deploy + duyệt + sandbox (mục lớn, làm sau).
**Đề xuất:** xây **khu Game Hub** nơi sinh viên ngành game **đăng ký tài khoản, tải lên và đăng (deploy) game** lên website và **chơi trực tiếp** trên trình duyệt.
**Hướng triển khai:** cho phép tải lên bản build game (WebGL); game của người dùng được **chạy ở miền tách biệt (sandbox)** để bảo đảm an toàn cho website; có **bước duyệt** trước khi công khai. Đây là hạng mục lớn, nên xem như một sản phẩm con và làm theo từng bước.

### 3.8 Chuẩn hóa email liên lạc — ✅ ĐÃ XONG
**Đã làm:** email liên hệ toàn site đổi sang `info@ctslab.net` (chân trang, biểu mẫu, khối đặt thiết bị); người gửi form → `noreply@ctslab.net`. *(Gửi email thật cần verify `ctslab.net` trong Resend khi bật key.)*
**Đề xuất ban đầu:** rà soát và **cập nhật email liên hệ chính xác** ở toàn bộ website (chân trang, biểu mẫu liên hệ, dữ liệu SEO).

### 3.9 Liên kết "đặt thiết bị" từ các app về website — ❌ CHƯA LÀM (khối đích trên web đã có ở 3.5; phần còn lại nằm ở các project app)
**Đề xuất:** trong các ứng dụng **KidMentor, PTalk Signature, P‑Connect**, nút **"Đặt thiết bị vật lý"** sẽ **liên kết về trang đặt thiết bị trên ctslab.net**, đưa nhu cầu mua phần cứng quy về một đầu mối. (Cần phối hợp với nhóm phát triển các app để gắn liên kết.)

### 3.10 Mua gói ứng dụng & thanh toán trực tuyến — ❌ CHƯA LÀM (mục lớn: cần cổng thanh toán cấp phép)
**Đề xuất:** cho phép **mua gói dịch vụ của app ngay trên website** với **thanh toán trực tuyến**.
**Hướng triển khai:** tích hợp qua **cổng thanh toán được cấp phép** (ví dụ VNPay/MoMo/Stripe), không tự lưu trữ thông tin thẻ, để bảo đảm an toàn và tuân thủ.

### 3.11 Tùy biến trang xác thực "Pthentik" + nền PTIT — ❌ CHƯA LÀM (cấu hình phía Authentik)
**Đề xuất:** đổi nhận diện trang đăng nhập/đăng ký từ "authentik" thành **"Pthentik"** và **đổi hình nền sau thành hình PTIT**, để trang xác thực mang nhận diện riêng của hệ sinh thái.
**Hướng triển khai:** chỉnh ở phần Branding của Authentik (tiêu đề, ẩn dòng mặc định, ảnh nền), lưu dưới dạng cấu hình để giữ qua các lần triển khai.

### 3.12 Rà soát & nâng cấp Dashboard — ❌ CHƯA LÀM (nằm ở project Dashboard)
**Đề xuất:** Dashboard hiện còn ít công dụng và có mục thừa. **Tinh gọn lại**, đồng thời **bổ sung nâng gói dịch vụ ngay trên web** và **nút đặt mua thiết bị liên kết sang ctslab.net**, để Dashboard thực sự hữu ích cho người dùng.

---

## 4. Phụ lục kỹ thuật

Phần này dành cho người duyệt muốn xem chi tiết cách triển khai; không bắt buộc với người duyệt ở góc quản lý.

- **Nền tảng web:** Next.js (App Router) chạy trên máy chủ, đưa ra Internet qua Cloudflare tunnel, quản lý tiến trình bằng pm2. Nội dung dạng song ngữ (Việt/Anh).
- **3.1 Lưới logo app:** mỗi logo là liên kết tới trang chi tiết sản phẩm đã có sẵn trên web; chỉ thay phần hiển thị, không đổi dữ liệu.
- **3.2 Font chung:** cần xác định font các app đang dùng; nếu là font miễn phí/thương mại thì cấu hình lại font hiển thị của web cho khớp.
- **3.4 Demo chat PTalk:** xử lý ở phía máy chủ (route API) để giấu khóa DeepSeek; RAG truy xuất kho tài liệu nội bộ của lab; giới hạn lượt theo tài khoản/ngày để kiểm soát chi phí gọi mô hình. Tận dụng hệ đăng nhập SSO đã có để đếm lượt theo người dùng.
- **3.7 Game Hub:** cần kho lưu trữ file (bản build WebGL có thể nặng hàng chục MB), cơ sở dữ liệu lưu thông tin game/chủ sở hữu/trạng thái duyệt, và **phục vụ game người dùng từ một miền riêng (sandbox)** để cách ly mã lạ khỏi website chính. Dựa trên hệ tài khoản đã có.
- **3.9 / 3.12 Liên kết chéo app:** dùng liên kết sâu (deep link) từ các app/Dashboard về các trang tương ứng trên ctslab.net; cần phối hợp với nhóm phát triển từng app.
- **3.10 Thanh toán:** tích hợp cổng thanh toán cấp phép; website chỉ khởi tạo giao dịch và nhận kết quả, không trực tiếp xử lý/lưu dữ liệu thẻ.
- **3.11 Pthentik:** chỉnh trong Authentik (Brand: tiêu đề, CSS, ảnh nền; hoặc qua blueprint để lưu cấu hình lâu dài). Đây là cấu hình phía Authentik, tách khỏi mã nguồn website.
