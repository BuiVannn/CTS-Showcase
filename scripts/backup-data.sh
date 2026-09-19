#!/usr/bin/env bash
# Sao lưu dữ liệu KHÔNG nằm trong git của ctslab.net → Google Drive (rclone remote `gdrive`).
# Hướng dẫn khôi phục: docs/backup.md. Cron: hằng ngày 20:00 UTC (= 03:00 giờ VN).
#
# Mỗi lần chạy:
#   1. data/*.db (SQLite: lượt tải, game, ptalk-usage) — chụp nhất quán bằng `.backup`
#      (an toàn khi app đang ghi, kể cả chế độ WAL) + kiểm integrity_check.
#   2. .env.local — mã hoá gpg AES256, passphrase ở $PASSFILE (chmod 600).
#   3. ctslab-games-root/ (game người dùng upload) — tar.gz.
#   → gói 1 file ctslab-web_<ngày>.tar.gz: giữ 7 bản trên máy, 30 ngày trên Drive.
#   4. /var/www/ctslab-downloads/*.apk — rclone sync (chỉ tải file đổi); file bị thay/xoá
#      được dời sang apk-old/<ngày>/ trên Drive chứ không mất.
set -euo pipefail
export PATH=/usr/local/bin:/usr/bin:/bin

APP_DIR=/home/namnx/ctslab-redesign
GAMES_ROOT=/home/namnx/ctslab-games-root
APK_DIR=/var/www/ctslab-downloads
LOCAL_DIR=/home/namnx/backups/ctslab-web
PASSFILE=/home/namnx/.config/ctslab-backup/passphrase
REMOTE=gdrive:Backups/ctslab-web
KEEP_LOCAL=7
KEEP_REMOTE_DAYS=30

STAMP=$(TZ=Asia/Ho_Chi_Minh date +%F_%H%M)
log() { echo "[$(TZ=Asia/Ho_Chi_Minh date '+%F %T')] $*"; }

mkdir -p "$LOCAL_DIR"
exec 9>"$LOCAL_DIR/.lock"
flock -n 9 || { log "đang có lần sao lưu khác chạy — bỏ qua"; exit 0; }

WORK=$(mktemp -d "$LOCAL_DIR/.work-XXXXXX")
trap 'rm -rf "$WORK"' EXIT
mkdir -p "$WORK/ctslab-web_$STAMP/db"
OUT="$WORK/ctslab-web_$STAMP"

log "bắt đầu $STAMP"

# 1. SQLite — dùng python3 hệ thống (CLI sqlite3 không có sẵn trong PATH của cron)
for db in "$APP_DIR"/data/*.db; do
  name=$(basename "$db")
  check=$(/usr/bin/python3 - "$db" "$OUT/db/$name" <<'PY'
import sqlite3, sys
src = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
dst = sqlite3.connect(sys.argv[2])
src.backup(dst)
src.close()
print(dst.execute("PRAGMA integrity_check").fetchone()[0])
dst.close()
PY
)
  [ "$check" = "ok" ] || { log "LỖI integrity_check $name: $check"; exit 1; }
done
log "db: $(ls "$OUT/db" | tr '\n' ' ')"

# 2. .env.local (mã hoá)
[ -s "$PASSFILE" ] || { log "LỖI thiếu passphrase $PASSFILE"; exit 1; }
gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-file "$PASSFILE" \
    --symmetric --cipher-algo AES256 -o "$OUT/env.local.gpg" "$APP_DIR/.env.local"

# 3. game người dùng
tar -C "$(dirname "$GAMES_ROOT")" -czf "$OUT/ctslab-games-root.tar.gz" "$(basename "$GAMES_ROOT")"

(cd "$OUT" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
ARCHIVE="$LOCAL_DIR/ctslab-web_$STAMP.tar.gz"
tar -C "$WORK" -czf "$ARCHIVE" "ctslab-web_$STAMP"
log "gói $(du -h "$ARCHIVE" | cut -f1) → $ARCHIVE"

# Giữ KEEP_LOCAL bản mới nhất trên máy
ls -1t "$LOCAL_DIR"/ctslab-web_*.tar.gz | tail -n +$((KEEP_LOCAL + 1)) | xargs -r rm -f

# Lên Drive
rclone copy "$ARCHIVE" "$REMOTE/daily/" --retries 5
rclone delete "$REMOTE/daily/" --min-age "${KEEP_REMOTE_DAYS}d" --include 'ctslab-web_*.tar.gz'
log "đã lên $REMOTE/daily/"

# 4. APK: chỉ tải file đổi; bản bị thay giữ ở apk-old/<ngày>/
rclone sync "$APK_DIR" "$REMOTE/apk/" --include '*.apk' \
    --backup-dir "$REMOTE/apk-old/$STAMP" --retries 5
log "apk đồng bộ xong"

log "XONG"
