# Handoff: Cấu hình Nginx phục vụ file APK cho ctslab.net

**Người thực hiện:** bạn phụ trách hạ tầng/nginx.
**Người viết:** team frontend (phần giao diện tải app đã build xong và **đang chờ** file).
**Ngày:** 2026-07-07.

> **TL;DR** — Frontend đã sẵn sàng. Nó chuyển hướng người dùng tới URL cố định
> `https://ctslab.net/downloads/<slug>.apk`. Việc của bạn: làm cho URL đó trả về
> đúng file APK từ đĩa, có hỗ trợ **resume (range request)** và đúng **content-type**.
> Không cần đụng gì tới code frontend. Toàn bộ ở tầng nginx + Cloudflare Tunnel.

---

## 0. Hợp đồng frontend ↔ nginx (ĐỌC KỸ PHẦN NÀY TRƯỚC)

Đây là phần quan trọng nhất — làm sai chỗ này thì nút tải sẽ hỏng.

### Luồng tải hoàn chỉnh

```
[User bấm nút "Tải APK" trên web]
        │
        ▼
GET https://ctslab.net/api/download/kidmentor?platform=android
        │   (route Next.js — ĐÃ CÓ, do frontend lo: kiểm tra app, đếm lượt tải)
        │   → HTTP 302 Redirect
        ▼
GET https://ctslab.net/downloads/kidmentor.apk   ◄── NGINX PHẢI PHỤC VỤ URL NÀY
        │
        ▼
[Trình duyệt tải file .apk về máy]
```

Frontend **không** đưa file trực tiếp. Nó chỉ 302 sang `/downloads/<slug>.apk`.
Trình duyệt sau đó tự gọi một request **GET tĩnh, không header đặc biệt, không auth**
tới `/downloads/<slug>.apk`. Nhiệm vụ của nginx chỉ là trả file tĩnh cho request đó.

### Những gì nginx PHẢI đáp ứng cho `GET /downloads/<slug>.apk`

| Yêu cầu | Giá trị bắt buộc | Vì sao |
|---|---|---|
| HTTP status | `200` (và `206` cho range) | Tải được / tải tiếp được |
| `Content-Type` | `application/vnd.android.package-archive` | Trình duyệt/Android nhận đúng là file cài đặt |
| `Accept-Ranges` | `bytes` | **Cho phép resume khi mạng di động rớt** — cực kỳ quan trọng với APK |
| `Content-Disposition` | `attachment` (khuyến nghị) | Ép tải về thay vì mở trong tab |
| Hỗ trợ header `Range` | Trả `206 Partial Content` | Tải tiếp / tải nhiều luồng (IDM, trình tải Android) |

### Tên file — QUY TẮC BẤT BIẾN

Tên file trên đĩa **phải trùng khít** phần cuối của `target` mà frontend khai báo.
Quy tắc: **`<slug>.apk`**. Hiện tại frontend đang chờ đúng 2 file:

| App | slug | File nginx phải phục vụ tại `/downloads/` |
|---|---|---|
| KidMentor | `kidmentor` | **`kidmentor.apk`** |
| PTalk Signature | `ptalk-signature` | **`ptalk-signature.apk`** |

> Khi có app mới, frontend sẽ báo cho bạn tên file chính xác (luôn theo mẫu `<slug>.apk`).
> Sai tên → `404` → nút tải hỏng. Không tự đổi tên file.

### Ranh giới trách nhiệm

- **Frontend (đã xong, không cần bạn làm):** nút tải, route `/api/download/...`, redirect 302,
  đếm lượt tải (lưu SQLite ở tầng route — **không liên quan tới nginx**, bạn không phải làm gì cho việc đếm).
- **Bạn (nginx + tunnel):** làm `https://ctslab.net/downloads/*.apk` trả đúng file như bảng trên.
- **Upload file APK:** file bản dựng do team app cung cấp; bạn đặt vào đúng thư mục, đúng tên.

---

## 1. Bối cảnh hạ tầng hiện tại của máy chủ

Đọc để hiểu môi trường trước khi cấu hình:

- **ctslab.net** KHÔNG đi qua nginx hiện tại. Nó đi:
  `Cloudflare (CDN + TLS) → Cloudflare Tunnel (cloudflared) → http://localhost:3001` (app Next.js, pm2 `cts-redesign`).
- **nginx đang chạy production** trên `:80/:443`, phục vụ các domain khác (`*.dtqt.edu.vn`, aivideo, gemma4-api…).
  → **Tuyệt đối không sửa các server block đang có.** Ta thêm một vhost MỚI, độc lập, trên một cổng riêng.
- nginx chạy dưới user **`www-data`** (đã xác nhận).
- **Cloudflare Tunnel do dashboard quản lý** (không có file `config.yml` local) → thêm route = thao tác trên Cloudflare Zero Trust dashboard.
- **Ổ đĩa đang 94% đầy** (còn ~59G). Xem [§7 Vận hành](#7-bảo-mật--vận-hành).
- Redis trên máy đang được app khác (PTalk) dùng — **không dùng Redis cho việc host file này**, không liên quan.

### Chọn cách định tuyến

Frontend đang chờ **same-origin**: `ctslab.net/downloads/...`. Có 2 cách cho nginx nhận request đó.
**Tài liệu này dùng Phương án A** (không phải đổi gì bên frontend). Phương án B (subdomain riêng) ở [Phụ lục](#phụ-lục-phương-án-b--subdomain-dlctslabnet).

| | **A. Same-origin path (khuyến nghị)** | B. Subdomain `dl.ctslab.net` |
|---|---|---|
| URL file | `ctslab.net/downloads/x.apk` | `dl.ctslab.net/x.apk` |
| Đổi frontend | **Không** | Có (frontend đổi 1 dòng `target`) |
| Cấu hình tunnel | Thêm route theo **path** `/downloads/*`, phải **xếp trên** route catch-all | Thêm 1 public hostname mới (đơn giản hơn) |
| Độ khó | Trung bình (chú ý thứ tự route) | Dễ |

---

## 2. Tạo thư mục chứa file + phân quyền

> **CẢNH BÁO:** KHÔNG đặt file dưới `/home/namnx/...`. Thư mục `/home/namnx` có quyền `750`
> (`drwxr-x---`), user `www-data` **không có quyền đi vào** → nginx sẽ trả `403`. Dùng `/var/www`
> (đang là `root:root 755`, www-data đọc được).

```bash
# Tạo thư mục chứa APK, tách hoàn toàn khỏi mã nguồn website
sudo mkdir -p /var/www/ctslab-downloads

# Upload 2 file APK vào đây (dùng scp/rsync từ máy build, hoặc đặt tay).
# Tên file PHẢI đúng: kidmentor.apk, ptalk-signature.apk
#   ví dụ: sudo cp /đường/dẫn/build/kidmentor.apk /var/www/ctslab-downloads/kidmentor.apk

# Phân quyền: web server đọc được, KHÔNG cấp execute
sudo chown -R www-data:www-data /var/www/ctslab-downloads
sudo chmod 755 /var/www/ctslab-downloads
sudo chmod 644 /var/www/ctslab-downloads/*.apk

# Kiểm tra
ls -l /var/www/ctslab-downloads
```

---

## 3. Chọn cổng nội bộ cho vhost tải

Vhost này lắng nghe một cổng **chỉ trên localhost**, để Cloudflare Tunnel trỏ vào.
Kiểm tra cổng còn trống (ví dụ dùng `8085`):

```bash
# Cổng đang bận: 80, 443 (nginx), 3001 (next), 8090 (games), 8080 (khác), 6379 (redis)
sudo ss -ltnp | grep -E ':8085\b' || echo "8085 trống, dùng được"
```

Nếu `8085` bận, chọn cổng trống khác và thay trong config bên dưới.

---

## 4. File cấu hình nginx (vhost độc lập)

Tạo file mới — **không sửa file có sẵn**:

```bash
sudo nano /etc/nginx/sites-available/ctslab-downloads.conf
```

Nội dung:

```nginx
# Vhost phục vụ file tải APK cho ctslab.net.
# Chỉ nhận traffic /downloads/* do Cloudflare Tunnel chuyển tới cổng nội bộ 8085.
server {
    listen 127.0.0.1:8085;
    server_name ctslab.net;

    # Log riêng để dễ theo dõi lượt tải / lỗi
    access_log /var/log/nginx/ctslab-downloads.access.log;
    error_log  /var/log/nginx/ctslab-downloads.error.log;

    # Chặn mọi đường dẫn không phải /downloads/ (vhost này chỉ để tải file)
    location / { return 404; }

    location /downloads/ {
        alias /var/www/ctslab-downloads/;

        # Map đuôi .apk sang đúng content-type (thứ khác -> octet-stream, vẫn tải về)
        types { application/vnd.android.package-archive apk; }
        default_type application/octet-stream;

        # Ép tải về + cho phép resume (range) — bắt buộc cho mạng di động chập chờn
        add_header Content-Disposition "attachment" always;
        add_header Accept-Ranges bytes always;

        # Cho phép Cloudflare + trình duyệt cache (giảm tải origin — xem §6)
        add_header Cache-Control "public, max-age=86400" always;

        # Truyền file tốc độ cao ở kernel-space, tiết kiệm RAM/CPU
        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;

        # Không liệt kê thư mục, chặn file ẩn
        autoindex off;
        location ~ /\. { deny all; }
    }
}
```

> **Ghi chú kỹ thuật:** dùng `alias` (không phải `root`) nên request `/downloads/kidmentor.apk`
> ánh xạ tới `/var/www/ctslab-downloads/kidmentor.apk` (không lồng `downloads/downloads`).
> Không đặt `location ~ \.apk$` lồng bên trong `location /downloads/` khi đã dùng `alias`
> (nginx có lỗi cấn `alias` + nested regex). Cấu hình trên đã tránh điều đó.

Kích hoạt vhost:

```bash
sudo ln -s /etc/nginx/sites-available/ctslab-downloads.conf /etc/nginx/sites-enabled/

# BẮT BUỘC kiểm tra cú pháp trước khi reload — để KHÔNG làm sập các domain khác
sudo nginx -t

# Nếu "syntax is ok" và "test is successful" thì mới reload (reload không ngắt kết nối)
sudo systemctl reload nginx
```

Kiểm tra nhanh ngay trên máy (chưa qua Cloudflare):

```bash
curl -sI -H "Host: ctslab.net" http://127.0.0.1:8085/downloads/kidmentor.apk \
  | grep -iE "HTTP|content-type|accept-ranges|content-disposition"
# Kỳ vọng: 200 ; application/vnd.android.package-archive ; accept-ranges: bytes ; attachment
```

Nếu bước này chưa `200` thì lỗi nằm ở nginx/quyền file — sửa xong mới sang §5.

---

## 5. Định tuyến Cloudflare Tunnel (dashboard)

Cho `ctslab.net/downloads/*` đi vào nginx (`localhost:8085`), phần còn lại vẫn về Next (`localhost:3001`).

1. Vào **Cloudflare Zero Trust → Networks → Tunnels** → chọn tunnel đang phục vụ `ctslab.net`.
2. Tab **Public Hostname → Add a public hostname**:
   - **Subdomain:** (để trống)
   - **Domain:** `ctslab.net`
   - **Path:** `downloads/.*`  *(ô Path dùng regex; nếu UI của bạn nhận glob thì dùng `/downloads/*`)*
   - **Service:** Type `HTTP`, URL `localhost:8085`
3. **QUAN TRỌNG — thứ tự:** kéo route mới này **LÊN TRÊN** route catch-all
   `ctslab.net → localhost:3001`. Cloudflare match theo thứ tự từ trên xuống; route cụ thể (`/downloads`)
   phải đứng trước route tổng. Nếu đặt sai thứ tự, `/downloads/*` vẫn bị nuốt về Next → `404`.

Không cần cấu hình TLS ở nginx: Cloudflare xử lý HTTPS ở edge, tunnel nói chuyện với nginx qua HTTP nội bộ.

---

## 6. (Nên làm) Cache Rule cho .apk trên Cloudflare — giảm tải & bandwidth

Mặc định Cloudflare **không** cache đuôi `.apk`. Không cache = mỗi lượt tải đều dội về VPS.
Bật cache để Cloudflare gánh phần lớn bandwidth (đây mới là thứ giúp "nhiều người tải cùng lúc không sập"):

1. **Cloudflare Dashboard → (domain ctslab.net) → Caching → Cache Rules → Create rule.**
2. Điều kiện: `URI Path` `starts with` `/downloads/`  *(hoặc `URI Full` chứa `.apk`)*.
3. Hành động:
   - **Cache eligibility:** Eligible for cache (Cache Everything)
   - **Edge TTL:** ví dụ 1 ngày (hoặc theo tần suất cập nhật bản build)
   - **Browser TTL:** theo `Cache-Control` từ origin (đã set 86400s ở nginx)
4. Save. Cloudflare vẫn tôn trọng `Accept-Ranges` → resume vẫn hoạt động qua cache.

> Khi **cập nhật bản APK mới** (ghi đè cùng tên file): nhớ **Purge Cache** cho URL đó trên Cloudflare,
> nếu không edge vẫn trả bản cũ tới hết Edge TTL.

---

## 7. Bảo mật & vận hành

- **Không cấp execute** cho file (`chmod 644`) — đã làm ở §2. Thư mục tách khỏi mã nguồn web.
- **Đĩa đang 94% đầy (còn ~59G, chỉ 1 ổ `/dev/sda2`).** APK vài chục MB/file thì thoải mái,
  **nhưng** nếu ổ đầy 100% thì mọi service ghi đĩa (Next build, SQLite, log, cả nginx) sẽ lỗi.
  → Theo dõi `df -h` định kỳ; đặt trần dung lượng thư mục tải; xoá bản APK version cũ không dùng.
- **Bandwidth:** với Cache Rule ở §6, Cloudflare gánh phần lớn; VPS chỉ đẩy origin khi cache miss.
  Vẫn nên nắm hạn mức băng thông/tháng của gói VPS.
- **Hotlink protection (TÙY CHỌN — cân nhắc kỹ):** guide phổ biến hay thêm chặn referer để chống
  site khác câu link. **Với app tải công khai thường KHÔNG nên bật**, vì nó làm hỏng các tình huống
  hợp lệ: mở link trực tiếp, quét QR, mở từ app khác (referer rỗng/khác domain → bị chặn nhầm).
  Nếu vẫn muốn bật, dùng `valid_referers none blocked ctslab.net *.ctslab.net;` và test kỹ trên mobile.
  Lưu ý: sau Cloudflare, nginx thấy referer do Cloudflare chuyển tiếp — hành vi có thể khác kỳ vọng.
- **Log:** lượt tải thật xem ở `/var/log/nginx/ctslab-downloads.access.log`. (Con số "lượt tải" hiển thị
  trên web do frontend đếm ở tầng route, độc lập với log này.)

---

## 8. Nghiệm thu (chạy các lệnh này để xác nhận HOÀN TẤT)

Chạy từ máy bất kỳ, qua domain thật (đã qua Cloudflare + tunnel):

```bash
# 1) File tĩnh: phải 200, đúng content-type, có accept-ranges
curl -sI https://ctslab.net/downloads/kidmentor.apk \
  | grep -iE "HTTP|content-type|accept-ranges|content-disposition"
#   Kỳ vọng: 200 ; application/vnd.android.package-archive ; accept-ranges: bytes ; attachment

# 2) Resume/range: phải 206 Partial Content + Content-Range
curl -s -o /dev/null -D - -H "Range: bytes=0-1023" https://ctslab.net/downloads/kidmentor.apk \
  | grep -iE "HTTP|content-range"
#   Kỳ vọng: 206 ; content-range: bytes 0-1023/<tổng_size>

# 3) End-to-end qua route frontend: 302 rồi tới file 200
curl -sIL "https://ctslab.net/api/download/kidmentor?platform=android" \
  | grep -iE "HTTP|location"
#   Kỳ vọng: 302 (location: .../downloads/kidmentor.apk) → 200

# 4) Tải thật + kiểm toàn vẹn (so md5 với bản build gốc do team app cung cấp)
curl -s https://ctslab.net/downloads/kidmentor.apk -o /tmp/k.apk && md5sum /tmp/k.apk && ls -l /tmp/k.apk

# 5) Lặp lại (1)-(4) cho ptalk-signature.apk
```

Cả 5 bước xanh = xong. Cuối cùng: **bấm thử nút tải trên chính web ctslab.net bằng điện thoại Android thật.**

---

## 9. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách sửa |
|---|---|---|
| `403 Forbidden` | www-data không đọc được file/thư mục | Kiểm `chmod 644` file + `755` thư mục; **file không được nằm dưới `/home/namnx`** (quyền 750). Xem `error_log`. |
| `404 Not Found` | Sai tên file, hoặc tunnel chưa route `/downloads`, hoặc route đặt **dưới** catch-all | Kiểm tên đúng `<slug>.apk`; kiểm thứ tự route ở §5; test bước curl nội bộ §4. |
| File **mở trong tab** thay vì tải | Thiếu content-type / Content-Disposition | Kiểm block `types {}` + `add_header Content-Disposition` trong config. |
| Tải **không resume được**, rớt mạng phải tải lại từ đầu | Thiếu `Accept-Ranges: bytes` | Kiểm `add_header Accept-Ranges bytes always;` |
| `502 Bad Gateway` | Tunnel trỏ sai cổng / nginx chưa listen cổng đó | Kiểm cổng `8085` khớp giữa config nginx và service trong tunnel; `ss -ltnp | grep 8085`. |
| Qua Cloudflare vẫn chậm / mỗi lượt về origin | Chưa bật Cache Rule cho `.apk` | Làm §6. |
| Cập nhật APK mới nhưng user vẫn tải bản cũ | Cloudflare còn cache bản cũ | **Purge Cache** URL đó trên Cloudflare. |
| `sudo nginx -t` báo lỗi | Sai cú pháp config | Đọc dòng lỗi; **không reload** khi test fail (giữ nguyên các domain khác đang chạy). |

---

## Phụ lục: Phương án B — subdomain `dl.ctslab.net`

Nếu bạn thấy định tuyến theo path (§5) phiền, có thể dùng subdomain riêng (giống `games.ctslab.net` đã có).
**Đổi lại:** team frontend phải sửa 1 dòng (họ đồng ý). Các bước khác gần như y hệt, chỉ khác:

1. **nginx** — vhost đổi thành phục vụ ở gốc:
   ```nginx
   server {
       listen 127.0.0.1:8085;
       server_name dl.ctslab.net;
       root /var/www/ctslab-downloads;      # file tại /var/www/ctslab-downloads/kidmentor.apk
       location / {
           types { application/vnd.android.package-archive apk; }
           default_type application/octet-stream;
           add_header Content-Disposition "attachment" always;
           add_header Accept-Ranges bytes always;
           add_header Cache-Control "public, max-age=86400" always;
           sendfile on; tcp_nopush on; tcp_nodelay on;
           autoindex off;
       }
       location ~ /\. { deny all; }
   }
   ```
2. **Cloudflare Tunnel** — thêm Public Hostname **mới**: Subdomain `dl`, Domain `ctslab.net`,
   Service `HTTP` `localhost:8085`. (Không cần path, không cần lo thứ tự — đơn giản hơn §5.)
3. **Frontend (team frontend làm, không phải bạn):** đổi `target` trong `src/content/ecosystem.ts`
   từ `"/downloads/kidmentor.apk"` thành `"https://dl.ctslab.net/kidmentor.apk"` (route đã hỗ trợ URL tuyệt đối sẵn),
   rồi `npm run build && pm2 restart cts-redesign`.
4. Nghiệm thu: thay `https://ctslab.net/downloads/` bằng `https://dl.ctslab.net/` trong các lệnh §8.

---

## Checklist bàn giao

- [ ] Tạo `/var/www/ctslab-downloads`, chown `www-data`, chmod thư mục 755 / file 644
- [ ] Đặt `kidmentor.apk` và `ptalk-signature.apk` đúng tên vào thư mục
- [ ] Chọn cổng nội bộ trống (mặc định 8085)
- [ ] Tạo vhost `/etc/nginx/sites-available/ctslab-downloads.conf` + symlink sang `sites-enabled`
- [ ] `sudo nginx -t` PASS → `sudo systemctl reload nginx`
- [ ] Curl nội bộ `127.0.0.1:8085` trả 200 + đúng header (§4)
- [ ] Thêm route tunnel `/downloads/*` → localhost:8085, **xếp trên** route catch-all (§5)
- [ ] Bật Cloudflare Cache Rule cho `/downloads/` (§6)
- [ ] Nghiệm thu §8: cả 5 bước PASS (200/206/302 + md5 khớp)
- [ ] Test tải thật trên điện thoại Android
- [ ] Bàn giao: báo team frontend "đã live" để họ bỏ trạng thái chờ nếu cần
