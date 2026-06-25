# Game Hub CSP Setup — Cloudflare Response Header Transform Rule

## Purpose

User-submitted games are served from a **separate origin** (`games.ctslab.net`) and embedded in `ctslab.net` via a sandboxed `<iframe>`. Adding the `Content-Security-Policy: frame-ancestors https://ctslab.net` header to every response from `games.ctslab.net` ensures that **only** `ctslab.net` can embed those game files. Any other site attempting to hotlink or frame a user game (e.g., to phish or re-brand it) is blocked by the browser.

The `X-Content-Type-Options: nosniff` header prevents browsers from MIME-sniffing responses, stopping a maliciously-named game asset from being interpreted as an executable script on an attacker's page.

> **Note:** `python -m http.server` (the `games-sandbox` pm2 process) cannot set custom headers — this must be handled at the Cloudflare edge. If you later replace the static server with Caddy or nginx, you can add these headers there instead.

---

## Step-by-Step: Cloudflare Response Header Transform Rule

### 1. Open the Cloudflare Dashboard

Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) and select the zone **`ctslab.net`**.

### 2. Navigate to Transform Rules

In the left sidebar:
**Rules → Transform Rules → Modify Response Headers**

Click **Create rule**.

### 3. Configure the Rule

**Rule name:** `games-origin-csp`

**When incoming requests match…**

| Field    | Operator | Value              |
| -------- | -------- | ------------------ |
| Hostname | equals   | `games.ctslab.net` |

(Use the *Expression Builder* or switch to *Edit expression* and enter:)

```
(http.host eq "games.ctslab.net")
```

**Then — Set static header:**

| Action       | Header name                | Value                                |
| ------------ | -------------------------- | ------------------------------------ |
| Set static   | `Content-Security-Policy`  | `frame-ancestors https://ctslab.net` |
| Set static   | `X-Content-Type-Options`   | `nosniff`                            |

Click **Save** and then **Deploy**.

---

## Verification

After the rule is live (usually takes < 30 seconds), verify with:

```bash
curl -I https://games.ctslab.net/<slug>/index.html
```

You should see both headers in the response:

```
Content-Security-Policy: frame-ancestors https://ctslab.net
X-Content-Type-Options: nosniff
```

Replace `<slug>` with any valid game slug (e.g., `_test`).

---

## Why This Matters

| Threat                      | Mitigated by                              |
| --------------------------- | ----------------------------------------- |
| Other sites iframing games  | `frame-ancestors https://ctslab.net`      |
| MIME-sniffing attacks        | `X-Content-Type-Options: nosniff`         |
| Cross-origin JS access      | Separate origin + `sandbox` attribute     |
| Cookie/auth leakage         | Separate origin (no shared cookies)       |

This rule complements the existing security stack: the `<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-fullscreen">` attribute in the Next.js embed component already prevents the game from accessing the parent frame's DOM and cookies. The CSP `frame-ancestors` directive adds the complementary control from the *game's* side — it explicitly declares who is allowed to embed it.

---

## Architecture Note

If you later migrate `games-sandbox` from `python -m http.server` to **Caddy** or **nginx**, you can remove this Cloudflare rule and add the headers directly in the server config:

**Caddy example:**
```
games.ctslab.net {
    root * /home/namnx/ctslab-games
    file_server
    header Content-Security-Policy "frame-ancestors https://ctslab.net"
    header X-Content-Type-Options "nosniff"
}
```

**nginx example:**
```nginx
server {
    server_name games.ctslab.net;
    root /home/namnx/ctslab-games;
    add_header Content-Security-Policy "frame-ancestors https://ctslab.net" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

---

## USER Manual Test Checklist (slice 2b end-to-end)

1. **Submit as non-admin:** Sign in as a regular user → `/games/submit` → fill in Title + Author + upload a WebGL `.zip` → Submit. Confirm the response shows `status: pending`. The game should **not** appear in `/games` (hub only shows published).
2. **Admin moderation:** Sign in as admin → `/admin/games` → see the pending submission → click **Preview** (opens in iframe) → click **Approve**. Confirm the game now appears in `/games` and plays correctly.
3. **Reject:** Submit another game → admin **Reject** → confirm it disappears from pending queue and the files are deleted.
4. **Quota enforcement:** Submit 3 more games as the same non-admin user (hitting the `GAMES_MAX_PENDING_PER_USER=3` limit) → the 4th submission should return HTTP 429.
5. **Cloudflare CSP rule:** After adding the rule above, run `curl -I https://games.ctslab.net/<slug>/index.html` and confirm both CSP headers appear.
