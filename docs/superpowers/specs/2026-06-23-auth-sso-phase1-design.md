# Auth — Sign-in / Sign-up via Authentik SSO (Phase 1)

**Date:** 2026-06-23
**Status:** Draft for review
**Scope:** Add authentication to the `ctslab-redesign` marketing site (Next.js 16 App Router, pm2 `cts-redesign`, served at ctslab.net) by reusing the ecosystem's existing **Authentik** identity provider over OIDC. Phase 1 only: working sign-in / sign-up / sign-out, in-app auth state, a profile page, a protected member area, and an admin/user role distinction. User-uploaded games are a **separate, later project** (see Out of Scope).

---

## 1. Goal

Let people sign in (and self-register) on ctslab.net using **one ecosystem account** — the same Authentik identity used by the Dashboard / PTalk apps — so that later phases (user management, user game uploads) have an identity foundation. The site already advertises "Single Sign-On / Đăng nhập một lần," so this makes that real.

## 2. Decisions (settled with the user)

- **Identity provider:** reuse the existing **Authentik** at `https://auth.ctslab.net` over **OIDC** (the user is the Authentik admin/owner — can create the OIDC application). No new user database.
- **Library:** **Auth.js (NextAuth v5)** with Authentik configured as an OIDC provider. Login/registration use Authentik's hosted pages (redirect flow); the site renders no password form of its own.
- **Phase-1 capabilities:** (a) auth state in the navbar + a basic `/account` profile page; (b) a protected `/members` area; (c) an admin vs. user role distinction with a stub `/admin` page (groundwork for future moderation).
- **Admin source (phase 1):** an `ADMIN_EMAILS` env allowlist, checked after login. Avoids Authentik group/claim configuration now; can migrate to an Authentik group claim later without changing consumers (the `isAdmin()` boundary stays the same).

## 3. Architecture

**OIDC redirect flow (Authorization Code):**
1. User clicks **Đăng nhập** → `signIn("authentik")` → browser redirects to Authentik.
2. User authenticates on Authentik's hosted login page.
3. Authentik redirects back to `https://ctslab.net/api/auth/callback/authentik`.
4. Auth.js exchanges the code, builds a session, sets an encrypted **JWT session cookie** (no DB).
5. Server components / middleware read the session; the navbar shows the user; protected routes allow/deny.

**Sign-up:** a **Đăng ký** link points to Authentik's enrollment flow URL (self-service registration in Authentik). After enrolling, the user signs in normally. (Requires Authentik's enrollment flow to be enabled — see §9.)

**Session shape:** `{ user: { name, email, image }, isAdmin: boolean }`. `isAdmin` is computed in the Auth.js `jwt`/`session` callback from `ADMIN_EMAILS`.

## 4. Components & files

**Create:**
- `auth.ts` — Auth.js config: the Authentik OIDC provider (`issuer`, `clientId`, `clientSecret`), `AUTH_SECRET`, and `jwt`/`session` callbacks that attach `isAdmin`. Exports `handlers`, `auth`, `signIn`, `signOut`.
- `src/app/api/auth/[...nextauth]/route.ts` — re-exports `handlers` (`GET`, `POST`).
- `middleware.ts` — protects `/account`, `/members`, `/admin`; redirects unauthenticated users to sign-in; `/admin` additionally requires `isAdmin`.
- `src/lib/auth-helpers.ts` — `isAdmin(session)` (single source of truth for the admin rule) + the Authentik enrollment URL helper.
- `src/components/auth/AuthMenu.tsx` — client component for the navbar: shows **Đăng nhập** when signed out; avatar/name + **Đăng xuất** menu when signed in.
- `src/app/account/page.tsx` — profile (name, email, avatar from the session); sign-out button.
- `src/app/members/page.tsx` — protected member area; phase-1 content = links/cards to ecosystem apps (Dashboard, PTalk) + a placeholder for the future games area.
- `src/app/admin/page.tsx` — admin-only stub page ("Quản trị — sắp có"), confirming the admin gate works.

**Modify:**
- `src/components/Navbar.tsx` — render `<AuthMenu />` in the right cluster (desktop) and in the mobile menu.
- `src/content/ui.ts` — bilingual auth strings (`signIn`, `signUp`, `signOut`, `account`, `members`, `admin`, `memberAreaLead`, etc.).
- `src/app/layout.tsx` — wrap the app in the Auth.js `SessionProvider` (client) if `AuthMenu` uses `useSession`; OR keep `AuthMenu` server-driven (preferred — pass session from a server boundary) to avoid a client provider. Decide during implementation per Auth.js v5 App Router guidance.
- `.env.example` — document the new env vars.

**No database. No new heavy dependencies beyond Auth.js.**

## 5. Roles / admin

- `isAdmin(session)` returns true iff `session.user.email` is in `ADMIN_EMAILS` (comma-separated env, e.g. `admin@ctslab.net,xuannamservice@gmail.com`).
- Computed once in the Auth.js callback and stored on the session as `isAdmin` so the UI/middleware read a boolean, not the allowlist.
- `/admin` is gated in `middleware.ts` (and re-checked in the page) on `isAdmin`.

## 6. Routes & protection

| Route | Access | Phase-1 content |
|---|---|---|
| `/account` | signed-in | profile + sign-out |
| `/members` | signed-in | ecosystem app links + games placeholder |
| `/admin` | admin only | stub ("management coming") |

Protection is centralized in `middleware.ts` with a `matcher` for those paths. Unauthenticated → redirect to `signIn`. Authenticated-but-not-admin hitting `/admin` → redirect to `/account` (or a 403 page).

## 7. Configuration (env)

```
AUTH_SECRET=                # generated; Auth.js session encryption
AUTH_URL=https://ctslab.net # canonical site URL for callbacks
AUTHENTIK_ISSUER=https://auth.ctslab.net/application/o/ctslab/
AUTHENTIK_CLIENT_ID=
AUTHENTIK_CLIENT_SECRET=
AUTHENTIK_ENROLL_URL=https://auth.ctslab.net/if/flow/default-enrollment-flow/
ADMIN_EMAILS=admin@ctslab.net
```

The pm2 process loads these (the site is `next start`; env via the pm2/ecosystem env or a `.env` file, consistent with how `RESEND_API_KEY` is handled today).

## 8. Error handling & security

- HTTPS only (already via the Cloudflare tunnel). Session cookie is `httpOnly`, `secure`, `sameSite=lax`.
- Failed/cancelled login → return to the site with a friendly bilingual error (Auth.js `error` page or a query param the UI reads).
- `AUTH_SECRET` and client secret never shipped to the client; only `auth.ts` (server) reads them.
- Middleware fails closed: if the session can't be read, treat as unauthenticated.
- Do not log tokens. Email allowlist comparison is case-insensitive and trimmed.

## 9. Authentik setup (operational prerequisite — done in Authentik, not in this codebase)

The user (Authentik admin) configures, ideally **as a blueprint** so it survives redeploys (the ecosystem already uses `Dashboard/authentik/blueprints/`):
1. **Create an OIDC Provider + Application** named `ctslab`:
   - Redirect URI: `https://ctslab.net/api/auth/callback/authentik`
   - Note the resulting `client_id` / `client_secret` and issuer `https://auth.ctslab.net/application/o/ctslab/`.
2. **Enable the enrollment (self-registration) flow** if public sign-up is wanted; note its URL for `AUTHENTIK_ENROLL_URL`.
3. (Optional, cosmetic) **Branding "Pthentik" + login background** — via System → Brands (branding title, custom CSS to hide the footer band) and the flow `Background`, or as a blueprint `authentik_brands.brand` entry with media under the mounted `media/` dir. This is independent of the ctslab.net code and can be done anytime.

These steps are captured here as prerequisites; the implementation plan will assume the `client_id`/`client_secret`/issuer/enroll URL are available as env values.

## 10. Compatibility risk & fallback

- **Next.js 16 + Auth.js v5 are both new.** Per the repo's `AGENTS.md`, the implementer must read the relevant guide in `node_modules/next/dist/docs/` before wiring route handlers/middleware, and verify Auth.js v5 works on Next 16 (route handler signatures, `middleware` API, edge vs node runtime).
- **Fallback if Auth.js v5 is incompatible:** implement the OIDC Authorization-Code flow directly with a minimal, well-maintained OIDC client (e.g. `openid-client`) behind the same `auth.ts` interface (`auth()`, `signIn`, `signOut`, session cookie). Consumers (navbar, middleware, pages) are written against that interface so the underlying library can change without touching them.

## 11. Testing

- **Unit (Vitest, node):** `isAdmin()` — email in/out of allowlist, case-insensitivity, trimming, empty/undefined session; enrollment-URL helper. These are pure and follow the repo's existing `src/lib/*.test.ts` pattern.
- **Manual / live:** sign-in redirect round-trip to Authentik and back; navbar reflects state; `/account` shows profile; `/members` blocks signed-out users; `/admin` blocks non-admins; sign-out clears the session. Verified in the live app (`pm2 restart cts-redesign`).
- Auth flows that depend on the external IdP are validated manually, not in CI.

## 12. Out of scope (explicitly)

- **User game uploads / hosting** — a separate, larger project (needs a database, large-file storage, a sandboxed serving origin for untrusted WebGL/JS, moderation). Phase-1 only leaves a placeholder in `/members` and an admin stub.
- **User management UI** — the ecosystem Dashboard already covers this; not rebuilt here.
- **Authentik branding** ("Pthentik", background) — operational config in Authentik (§9), not ctslab.net code.
- Migrating admin from email allowlist to Authentik group claims — possible later behind the same `isAdmin()` boundary.

## 13. Phasing (within Phase 1)

1. **Auth plumbing:** `auth.ts`, the `[...nextauth]` route, env, `isAdmin()` (+ tests), sign-in/out working from a temporary button. Verify the Authentik round-trip end-to-end.
2. **Navbar state + `/account`:** `AuthMenu` in desktop + mobile nav; profile page; bilingual strings.
3. **Protected areas + roles:** `middleware.ts` protecting `/members` and `/admin`; member-area content; admin stub gated on `isAdmin`.
4. **Polish & verify:** error states, reduced-motion/responsive parity with the rest of the site, live verification, deploy.

Each phase is independently shippable and verifiable.
