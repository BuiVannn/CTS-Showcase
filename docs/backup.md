# Sao lưu dữ liệu ctslab.net

Git chỉ giữ **code**. Những thứ dưới đây sống trên server, không có trong git, nên được
sao lưu bằng `scripts/backup-data.sh` lên **Google Drive của xuannamservice@gmail.com**
(remote rclone `gdrive-cts`; remote `gdrive` cũ là Drive của tài khoản khác — không dùng cho sao lưu).

| Dữ liệu | Nguồn trên server | Trong bản sao lưu |
|---------|-------------------|-------------------|
| Lượt tải app, game, lượt dùng PTalk (SQLite) | `data/*.db` | `db/*.db` |
| Khoá bí mật (SSO, LLM…) | `.env.local` | `env.local.gpg` (mã hoá AES256) |
| Game người dùng upload | `/home/namnx/ctslab-games-root/` | `ctslab-games-root.tar.gz` |
| File APK trang tải | `/var/www/ctslab-downloads/*.apk` | đồng bộ riêng (xem dưới) |

## Lịch & nơi lưu

- **Cron** user `namnx`: `0 20 * * *` (20:00 UTC = **03:00 giờ VN**), log ở
  `/home/namnx/backups/ctslab-web/backup.log`.
- **Trên máy:** `/home/namnx/backups/ctslab-web/ctslab-web_<ngày_giờ>.tar.gz`, giữ 7 bản mới nhất.
- **Google Drive** (xuannamservice@gmail.com): `Backups/ctslab-web/` —
  https://drive.google.com/drive/folders/16UJD8nRlAFK7bZNM2tGJBrniAtgIpaRY
  - `daily/ctslab-web_<ngày_giờ>.tar.gz` — giữ 30 ngày.
  - `apk/` — bản sao hiện tại của thư mục APK (chỉ tải lại file thay đổi).
  - `apk-old/<ngày_giờ>/` — APK cũ bị thay/xoá hôm đó (không tự xoá).
- **Passphrase** giải mã `.env.local`: `/home/namnx/.config/ctslab-backup/passphrase`
  (chmod 600). ⚠️ Phải có **một bản chép ở chỗ khác** (trình quản lý mật khẩu) — mất
  server là mất luôn file này.

Chạy tay: `scripts/backup-data.sh` (có khoá `flock`, chạy trùng sẽ tự bỏ qua).

## Khôi phục

```bash
# 1. Lấy bản sao lưu (từ máy hoặc từ Drive)
rclone ls gdrive-cts:Backups/ctslab-web/daily/            # xem các bản
rclone copy gdrive-cts:Backups/ctslab-web/daily/ctslab-web_<ngày_giờ>.tar.gz /tmp/restore/
cd /tmp/restore && tar -xzf ctslab-web_<ngày_giờ>.tar.gz && cd ctslab-web_<ngày_giờ>
sha256sum -c SHA256SUMS                                # kiểm toàn vẹn

# 2. Dừng web rồi chép database về
pm2 stop cts-redesign
cp db/*.db /home/namnx/ctslab-redesign/data/
rm -f /home/namnx/ctslab-redesign/data/*.db-wal /home/namnx/ctslab-redesign/data/*.db-shm

# 3. .env.local (cần passphrase)
gpg --batch --pinentry-mode loopback --passphrase-file <file-passphrase> \
    -d env.local.gpg > /home/namnx/ctslab-redesign/.env.local

# 4. Game người dùng
tar -C /home/namnx -xzf ctslab-games-root.tar.gz

# 5. APK
rclone copy gdrive-cts:Backups/ctslab-web/apk/ /var/www/ctslab-downloads/

pm2 start cts-redesign
```

## Cấp lại quyền Drive (khi token hết hạn / bị thu hồi)

Log báo lỗi `invalid_grant` hoặc `token expired` → đăng nhập lại (server không có trình duyệt):

```bash
rclone config reconnect gdrive-cts:     # in ra link http://127.0.0.1:53682/auth?state=…
```

Mở link đó qua VS Code Remote (tự chuyển tiếp cổng 53682) hoặc `ssh -L 53682:127.0.0.1:53682 <server>`,
đăng nhập **xuannamservice@gmail.com**, bấm Allow.
