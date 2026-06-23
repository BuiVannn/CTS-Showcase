# Auth — Sign-in / Sign-up via Authentik SSO (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add sign-in / sign-up / sign-out to ctslab.net by reusing the ecosystem Authentik IdP over OIDC (Auth.js v5), with in-app auth state, a profile page, a protected member area, and an admin/user role split — no new database.

**Architecture:** Auth.js (NextAuth v5) configured with Authentik as an OIDC provider in `src/auth.ts`; login/registration use Authentik's hosted pages (redirect). Session is an encrypted JWT cookie carrying `{ user, isAdmin }`; `isAdmin` is computed from an `ADMIN_EMAILS` allowlist. Routes `/account`, `/members`, `/admin` are gated in `src/middleware.ts`.

**Tech Stack:** Next.js 16 (App Router), React 19, `next-auth@beta` (Auth.js v5) + `next-auth/providers/authentik`, TypeScript, Vitest (node) for pure-logic units, `lucide-react`, existing `useLocale` i18n.

## Global Constraints

- **Reuse Authentik over OIDC; no new user database.** Login/registration use Authentik's hosted pages; the site renders no password form.
- **No secrets in client code.** `AUTH_SECRET`, `AUTHENTIK_CLIENT_SECRET` are read only in `src/auth.ts` (server). Client never sees them.
- **`trustHost: true`** in the Auth.js config — the app runs behind a Cloudflare tunnel / reverse proxy, so Auth.js must trust the forwarded host.
- **Admin is an allowlist:** `isAdminEmail(email, process.env.ADMIN_EMAILS)` is the single rule; case-insensitive, trimmed, comma-separated. Consumers read a boolean `session.isAdmin`, never the allowlist.
- **Bilingual:** all user-facing strings are `Localized` (`{ en, vi }`) via `useLocale().t(...)`.
- **`@/*` maps to `src/*`** (tsconfig). Place `auth.ts` and `middleware.ts` under `src/`. Secrets go in `.env.local` (gitignored); document names in `.env.example`.
- **Bleeding-edge compatibility:** Next 16 + Auth.js v5 are new. Per `AGENTS.md`, read the relevant guide under `node_modules/next/dist/docs/` before wiring route handlers/middleware. The plan's code is the canonical Auth.js v5 pattern; if the installed version's API differs, adapt to it (and say so in the report). If Auth.js v5 cannot build on Next 16, STOP and report BLOCKED with the error — do not force it; the controller will pivot to an `openid-client` fallback behind the same interface.
- **External-IdP flows are verified manually/live**, not in CI. The end-to-end SSO round-trip requires real Authentik credentials + an Authentik OIDC app (a USER-performed prerequisite, see Task 2 / Task 7).
- **Verification per task:** `npx tsc --noEmit` + `npx eslint <files>` clean; `npm run build` succeeds; for tasks with tests `npx vitest run` green; live health `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/` → `200`. Deploy in the final task.
- **Commit after every task**; `git add` specific files only (never `git add -A` — `game/` and stray images must stay untracked). Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/auth-helpers.ts` — `isAdminEmail(...)`, `resolveEnrollUrl(...)` pure helpers (+ `src/lib/auth-helpers.test.ts`)
- `src/auth.ts` — Auth.js config (Authentik provider, callbacks attaching `isAdmin`, `trustHost`); exports `handlers`, `auth`, `signIn`, `signOut`
- `src/app/api/auth/[...nextauth]/route.ts` — re-export `handlers` as `GET`/`POST`
- `src/types/next-auth.d.ts` — module augmentation: `session.isAdmin`, JWT `isAdmin`
- `src/middleware.ts` — gate `/account`, `/members`, `/admin` (admin extra-gated)
- `src/components/auth/AuthMenu.tsx` — navbar auth state (client; `useSession`)
- `src/components/auth/SignOutButton.tsx` — small client sign-out button (reused by /account)
- `src/app/account/page.tsx` — profile
- `src/app/members/page.tsx` — protected member area
- `src/app/admin/page.tsx` — admin-only stub

**Modify:**
- `src/app/layout.tsx` — wrap children in `<SessionProvider>` (from `next-auth/react`)
- `src/components/Navbar.tsx` — render `<AuthMenu />` in the desktop right cluster + mobile menu
- `src/content/ui.ts` — add an `auth` block of bilingual strings
- `.env.example` — document the new env vars

**No database. No content/CMS changes.**

---

## Task 1: Auth helper logic (TDD)

**Files:**
- Create: `src/lib/auth-helpers.ts`, `src/lib/auth-helpers.test.ts`

**Interfaces:**
- Produces:
  - `isAdminEmail(email: string | null | undefined, allowlist: string | undefined): boolean`
  - `resolveEnrollUrl(envValue: string | undefined): string`

- [ ] **Step 1: Write the failing tests**

`src/lib/auth-helpers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isAdminEmail, resolveEnrollUrl } from "./auth-helpers";

describe("isAdminEmail", () => {
  const list = "admin@ctslab.net, owner@ctslab.net";
  it("matches an allowlisted email", () => expect(isAdminEmail("admin@ctslab.net", list)).toBe(true));
  it("is case-insensitive and trims", () => expect(isAdminEmail("  Admin@CTSLab.net ", list)).toBe(true));
  it("rejects a non-allowlisted email", () => expect(isAdminEmail("user@ctslab.net", list)).toBe(false));
  it("rejects null/undefined email", () => {
    expect(isAdminEmail(null, list)).toBe(false);
    expect(isAdminEmail(undefined, list)).toBe(false);
  });
  it("rejects everyone when allowlist is empty/undefined", () => {
    expect(isAdminEmail("admin@ctslab.net", "")).toBe(false);
    expect(isAdminEmail("admin@ctslab.net", undefined)).toBe(false);
  });
});

describe("resolveEnrollUrl", () => {
  it("returns the env value when set", () =>
    expect(resolveEnrollUrl("https://auth.ctslab.net/if/flow/x/")).toBe("https://auth.ctslab.net/if/flow/x/"));
  it("falls back to the default enrollment flow", () =>
    expect(resolveEnrollUrl(undefined)).toBe("https://auth.ctslab.net/if/flow/default-enrollment-flow/"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/auth-helpers.test.ts`
Expected: FAIL — cannot find module `./auth-helpers`.

- [ ] **Step 3: Implement**

`src/lib/auth-helpers.ts`:

```ts
/** True iff `email` is in the comma-separated `allowlist` (case-insensitive, trimmed). */
export function isAdminEmail(
  email: string | null | undefined,
  allowlist: string | undefined
): boolean {
  if (!email || !allowlist) return false;
  const set = allowlist
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return set.includes(email.trim().toLowerCase());
}

/** The Authentik self-registration (enrollment) URL, with a sensible default. */
export function resolveEnrollUrl(envValue: string | undefined): string {
  return envValue && envValue.length > 0
    ? envValue
    : "https://auth.ctslab.net/if/flow/default-enrollment-flow/";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/auth-helpers.test.ts` → PASS (7 tests). Then `npx vitest run` → full suite green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-helpers.ts src/lib/auth-helpers.test.ts
git commit -m "feat(auth): admin-email + enroll-url helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Install Auth.js + core config + route + env (compatibility spike)

**Files:**
- Create: `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`
- Modify: `.env.example`, `package.json` (via install)

**Interfaces:**
- Consumes: `isAdminEmail` (Task 1).
- Produces: `handlers`, `auth`, `signIn`, `signOut` exported from `@/auth`; `session.isAdmin: boolean`.

- [ ] **Step 1: Read the Next 16 docs for route handlers + middleware**

Per `AGENTS.md`, skim `node_modules/next/dist/docs/` for App Router route handlers and middleware before wiring. Note any deviation from prior Next versions.

- [ ] **Step 2: Install Auth.js v5**

Run: `npm install next-auth@beta`
Expected: installs (v5 / 5.x beta). If it refuses on peer deps for Next 16 / React 19, retry with `npm install next-auth@beta --legacy-peer-deps` and note it in the report. If it still cannot install/build, STOP and report BLOCKED with the exact error.

- [ ] **Step 3: Type augmentation**

`src/types/next-auth.d.ts`:

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    isAdmin: boolean;
    user: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
  }
}
```

- [ ] **Step 4: Auth config**

`src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Authentik from "next-auth/providers/authentik";
import { isAdminEmail } from "@/lib/auth-helpers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // behind the Cloudflare tunnel / reverse proxy
  providers: [
    Authentik({
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      issuer: process.env.AUTHENTIK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      token.isAdmin = isAdminEmail(token.email, process.env.ADMIN_EMAILS);
      return token;
    },
    async session({ session, token }) {
      session.isAdmin = token.isAdmin ?? false;
      return session;
    },
  },
});
```

Note: Auth.js v5 reads `AUTH_SECRET` and `AUTH_URL` from env automatically. If the installed version requires a different provider import path or option name, adapt and record it.

- [ ] **Step 5: Route handler**

`src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 6: Document env vars**

Append to `.env.example`:

```
# --- Auth (Authentik SSO via OIDC) — real values go in .env.local (gitignored) ---
AUTH_SECRET=                 # `openssl rand -base64 32`
AUTH_URL=https://ctslab.net
AUTHENTIK_ISSUER=https://auth.ctslab.net/application/o/ctslab/
AUTHENTIK_CLIENT_ID=
AUTHENTIK_CLIENT_SECRET=
AUTHENTIK_ENROLL_URL=https://auth.ctslab.net/if/flow/default-enrollment-flow/
ADMIN_EMAILS=admin@ctslab.net
```

- [ ] **Step 7: Verify build + typecheck**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed. (The app builds with Auth.js wired even without real credentials; the `[...nextauth]` route is mounted.) If the build fails due to a Next16/Auth.js incompatibility, STOP and report BLOCKED with the error.

- [ ] **Step 8: Verify the auth route mounts**

Run: `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "providers: %{http_code}\n" http://localhost:3001/api/auth/providers`
Expected: `200` (Auth.js serves a providers JSON even before credentials are set). Also `curl -s -o /dev/null -w "home: %{http_code}\n" http://localhost:3001/` → `200`.

> **USER prerequisite (not a code step):** for the real SSO round-trip, the user must create the Authentik OIDC application `ctslab` (redirect URI `https://ctslab.net/api/auth/callback/authentik`), then put `AUTH_SECRET`, `AUTHENTIK_CLIENT_ID/SECRET`, `AUTHENTIK_ISSUER`, `ADMIN_EMAILS` into `.env.local` and restart pm2. The end-to-end login test happens in Task 7.

- [ ] **Step 9: Commit**

```bash
git add src/auth.ts "src/app/api/auth/[...nextauth]/route.ts" src/types/next-auth.d.ts .env.example package.json package-lock.json
git commit -m "feat(auth): wire Auth.js v5 with Authentik OIDC provider

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Navbar auth state + bilingual strings

**Files:**
- Create: `src/components/auth/AuthMenu.tsx`, `src/components/auth/SignOutButton.tsx`
- Modify: `src/app/layout.tsx`, `src/components/Navbar.tsx`, `src/content/ui.ts`

**Interfaces:**
- Consumes: `signIn`/`signOut`/`useSession` from `next-auth/react`; `resolveEnrollUrl`; `ui.auth.*`.
- Produces: `<AuthMenu />`, `<SignOutButton />`.

- [ ] **Step 1: Bilingual strings**

In `src/content/ui.ts`, add an `auth` block inside the exported `ui` object (after `nav`):

```ts
  auth: {
    signIn: { en: "Sign in", vi: "Đăng nhập" } as Localized,
    signUp: { en: "Sign up", vi: "Đăng ký" } as Localized,
    signOut: { en: "Sign out", vi: "Đăng xuất" } as Localized,
    account: { en: "Account", vi: "Tài khoản" } as Localized,
    members: { en: "Members", vi: "Thành viên" } as Localized,
    admin: { en: "Admin", vi: "Quản trị" } as Localized,
    profile: { en: "Profile", vi: "Hồ sơ" } as Localized,
    memberLead: {
      en: "Your gateway to the CTS ecosystem — one account across every app.",
      vi: "Cổng vào hệ sinh thái CTS — một tài khoản cho mọi ứng dụng.",
    } as Localized,
    adminStub: {
      en: "Management tools are coming — game review and user management land here.",
      vi: "Công cụ quản trị sắp có — duyệt game và quản lý người dùng sẽ ở đây.",
    } as Localized,
  },
```

- [ ] **Step 2: Wrap the app in SessionProvider**

In `src/app/layout.tsx`, import `SessionProvider` and wrap the existing provider tree (it is a client component from `next-auth/react`, valid inside the server layout):

```tsx
import { SessionProvider } from "next-auth/react";
```

Wrap the body's provider subtree:

```tsx
<SessionProvider>
  <ThemeProvider>
    <LocaleProvider>
      <ScrollProgress />
      <SmoothScroll />
      <PageTransition>{children}</PageTransition>
    </LocaleProvider>
  </ThemeProvider>
</SessionProvider>
```

(Leave `<CustomCursor />`, `<GrainOverlay />`, `<ScrollToTop />` where they are.)

- [ ] **Step 3: SignOutButton**

`src/components/auth/SignOutButton.tsx`:

```tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

export default function SignOutButton({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className ?? "inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-blue"}
    >
      <LogOut size={15} /> {t(ui.auth.signOut)}
    </button>
  );
}
```

- [ ] **Step 4: AuthMenu**

`src/components/auth/AuthMenu.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { User, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { resolveEnrollUrl } from "@/lib/auth-helpers";
import SignOutButton from "./SignOutButton";

export default function AuthMenu() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  if (status !== "authenticated") {
    return (
      <div className="flex items-center gap-2">
        <a
          href={resolveEnrollUrl(process.env.NEXT_PUBLIC_AUTHENTIK_ENROLL_URL)}
          className="hidden text-[0.82rem] font-medium text-ink-2 hover:text-ink sm:inline"
        >
          {t(ui.auth.signUp)}
        </a>
        <button
          type="button"
          onClick={() => signIn("authentik")}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-3.5 py-1.5 text-[0.82rem] font-medium text-ink hover:border-blue hover:text-blue"
        >
          <User size={15} /> {t(ui.auth.signIn)}
        </button>
      </div>
    );
  }

  const name = session.user?.name ?? session.user?.email ?? "";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-border px-3 py-1.5 text-[0.82rem] font-medium text-ink"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue/15 text-[0.65rem] text-blue">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[8rem] truncate">{name}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-[var(--radius-md)] border border-border bg-card p-2 shadow-[var(--shadow-md)]">
          <Link href="/account" onClick={() => setOpen(false)} className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink-2 hover:bg-surface hover:text-ink">{t(ui.auth.account)}</Link>
          <Link href="/members" onClick={() => setOpen(false)} className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink-2 hover:bg-surface hover:text-ink">{t(ui.auth.members)}</Link>
          {session.isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)} className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink-2 hover:bg-surface hover:text-ink">{t(ui.auth.admin)}</Link>
          )}
          <div className="my-1 h-px bg-border" />
          <div className="px-3 py-1.5"><SignOutButton /></div>
        </div>
      )}
    </div>
  );
}
```

Note: `NEXT_PUBLIC_AUTHENTIK_ENROLL_URL` is the client-exposed enroll URL; if you prefer not to expose it, hardcode the default via `resolveEnrollUrl(undefined)` (it already defaults to the Authentik enrollment flow). Add `NEXT_PUBLIC_AUTHENTIK_ENROLL_URL` to `.env.example` if you keep the env read.

- [ ] **Step 5: Mount AuthMenu in the navbar**

In `src/components/Navbar.tsx`, import `AuthMenu` and render it in the desktop right cluster (after `<ThemeToggle />`) and inside the mobile menu (after the nav links). Add:

```tsx
import AuthMenu from "@/components/auth/AuthMenu";
```

Desktop right cluster:

```tsx
<div className="hidden items-center gap-2 lg:flex">
  <LanguageToggle />
  <ThemeToggle />
  <AuthMenu />
</div>
```

Mobile menu (after the `site.nav.map(...)` links block, before the closing `</div>`):

```tsx
<div className="px-1 pt-2"><AuthMenu /></div>
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/components/auth/AuthMenu.tsx src/components/auth/SignOutButton.tsx src/components/Navbar.tsx src/app/layout.tsx src/content/ui.ts`
Expected: clean. Then `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/` → `200`. Signed-out state shows **Đăng nhập** / **Đăng ký** in the navbar.

- [ ] **Step 7: Commit**

```bash
git add src/components/auth/AuthMenu.tsx src/components/auth/SignOutButton.tsx src/components/Navbar.tsx src/app/layout.tsx src/content/ui.ts .env.example
git commit -m "feat(auth): navbar auth menu + session provider + strings

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Route protection middleware

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `auth` from `@/auth`; `session.isAdmin`.

- [ ] **Step 1: Implement middleware**

`src/middleware.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  if (!session) {
    const signInUrl = new URL("/api/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  if (nextUrl.pathname.startsWith("/admin") && !session.isAdmin) {
    return NextResponse.redirect(new URL("/account", nextUrl.origin));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/members/:path*", "/admin/:path*"],
};
```

Note: Auth.js v5 middleware runs on the edge runtime by default. If the build/runtime errors about the provider in edge (a known Auth.js v5 nuance), apply the documented split-config: move the providers-free options into `src/auth.config.ts`, build the edge `auth` from it for middleware, and keep the full provider config in `src/auth.ts`. Read the Auth.js v5 + Next 16 docs and adapt; report what you did.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/middleware.ts`
Expected: clean. Then `pm2 restart cts-redesign && sleep 3`:
- `curl -s -o /dev/null -w "members(out): %{http_code} %{redirect_url}\n" http://localhost:3001/members` → a redirect (`307`/`302`) toward `/api/auth/signin` (signed-out has no session cookie).
- `curl -s -o /dev/null -w "home: %{http_code}\n" http://localhost:3001/` → `200` (unprotected).

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(auth): protect /account /members /admin via middleware

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Account (profile) page

**Files:**
- Create: `src/app/account/page.tsx`

**Interfaces:**
- Consumes: `auth` from `@/auth`; `SignOutButton`.

- [ ] **Step 1: Implement**

`src/app/account/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import SignOutButton from "@/components/auth/SignOutButton";

export const metadata: Metadata = { title: "Tài khoản — CTS Lab", robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/account");

  const { name, email, image } = session.user ?? {};
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container className="max-w-2xl">
          <h1 className="text-section text-ink">Tài khoản</h1>
          <div className="mt-8 flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue/15 text-xl text-blue">
                {(name ?? email ?? "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-lg font-semibold text-ink">{name ?? "—"}</p>
              <p className="text-sm text-ink-2">{email ?? "—"}</p>
              {session.isAdmin && <span className="mt-1 inline-block rounded-[var(--radius-pill)] bg-red-soft px-2 py-0.5 text-xs font-semibold text-red">Admin</span>}
            </div>
          </div>
          <div className="mt-6"><SignOutButton /></div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

Note: if `bg-red-soft` is not a Tailwind utility in this project, use `style={{ background: "var(--red-soft)" }}` instead (the project exposes `--red-soft` as a CSS var, and `--color-red` as a Tailwind color but not necessarily `red-soft`). Verify against `globals.css` and adjust.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/app/account/page.tsx`
Expected: clean. `pm2 restart cts-redesign && sleep 3 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/account` → a redirect toward sign-in (signed-out).

- [ ] **Step 3: Commit**

```bash
git add src/app/account/page.tsx
git commit -m "feat(auth): account profile page

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Members area + admin stub

**Files:**
- Create: `src/app/members/page.tsx`, `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `auth` from `@/auth`; `ui.auth.memberLead` / `ui.auth.adminStub`.

- [ ] **Step 1: Members page**

`src/app/members/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";

export const metadata: Metadata = { title: "Thành viên — CTS Lab", robots: { index: false } };

const APPS = [
  { name: "Dashboard", href: "https://dashboard.ctslab.net", desc: "Quản lý hệ sinh thái" },
  { name: "PTalk", href: "/products/ptalk", desc: "Trợ lý giọng nói AI" },
  { name: "VR Tour", href: "/vr-tour", desc: "Tham quan campus PTIT" },
];

export default async function MembersPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/members");

  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <span className="eyebrow eyebrow-draw">Thành viên</span>
          <h1 className="text-section mt-3 text-ink">Khu thành viên</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">
            Cổng vào hệ sinh thái CTS — một tài khoản cho mọi ứng dụng.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {APPS.map((a) => (
              <a key={a.name} href={a.href} className="group rounded-[var(--radius-lg)] border border-border bg-card p-6 transition-transform hover:-translate-y-1">
                <h2 className="text-display text-lg text-ink">{a.name}</h2>
                <p className="mt-1.5 text-sm text-ink-2">{a.desc}</p>
              </a>
            ))}
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-6 text-sm text-dim">
              Khu game của bạn — sắp có.
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Admin stub**

`src/app/admin/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";

export const metadata: Metadata = { title: "Quản trị — CTS Lab", robots: { index: false } };

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin?callbackUrl=/admin");
  if (!session.isAdmin) redirect("/account");

  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container className="max-w-2xl">
          <span className="eyebrow eyebrow-draw">Quản trị</span>
          <h1 className="text-section mt-3 text-ink">Bảng quản trị</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-2">
            Công cụ quản trị sắp có — duyệt game và quản lý người dùng sẽ ở đây.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run build && npx eslint src/app/members/page.tsx src/app/admin/page.tsx`
Expected: clean. `pm2 restart cts-redesign && sleep 3`: `curl` `/members` and `/admin` (signed-out) → redirect toward sign-in.

- [ ] **Step 4: Commit**

```bash
git add src/app/members/page.tsx src/app/admin/page.tsx
git commit -m "feat(auth): members area + admin stub (gated)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Polish, end-to-end SSO verification, deploy

**Files:**
- Modify: any file needing a fix surfaced by verification

- [ ] **Step 1: Full automated suite**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: all clean; vitest green (includes `auth-helpers` tests). Confirm no stray `eslint-disable` beyond the single justified `@next/next/no-img-element` on the Authentik avatar (or replace it with `next/image` + a configured remote pattern for `auth.ctslab.net` if preferred — note the decision).

- [ ] **Step 2: Responsive / reduced-motion parity**

Confirm the navbar `AuthMenu` reflows in the mobile menu, the dropdown closes on navigation, and protected pages render with the standard Navbar/Footer. No new animation is introduced, so reduced-motion is unaffected.

- [ ] **Step 3: USER end-to-end SSO check (requires Authentik app + .env.local)**

This step needs the real Authentik OIDC app and credentials in `.env.local` (the user provides them; see Task 2's USER prerequisite). With them set and pm2 restarted, verify in a browser:
- Click **Đăng nhập** → redirects to `auth.ctslab.net` → after login, returns signed-in; navbar shows the avatar/name.
- `/account` shows profile; **Đăng xuất** clears the session.
- `/members` is reachable when signed in; signed-out it redirects to sign-in.
- `/admin` is reachable only when the signed-in email is in `ADMIN_EMAILS`; otherwise redirects to `/account`.
- **Đăng ký** opens the Authentik enrollment page.

If credentials are not yet available, record that this step is pending the user and proceed to deploy the code (signed-out behavior + build are already verified).

- [ ] **Step 4: Production build + deploy**

Run: `npm run build && pm2 restart cts-redesign && sleep 3` then health-check `http://localhost:3001/`, `/api/auth/providers` → `200`; protected routes redirect when signed-out.

- [ ] **Step 5: Final commit (only if fixes were made)**

```bash
git add <changed files>
git commit -m "polish(auth): phase-1 verification fixes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- §2 Authentik OIDC + Auth.js → Task 2. No DB → confirmed (JWT session).
- §4 components (auth.ts, route, middleware, AuthMenu, account/members/admin, navbar, strings) → Tasks 2–6.
- §5 admin allowlist (`isAdminEmail`, `session.isAdmin`) → Task 1 + Task 2 callbacks + gating in Task 4/6.
- §6 route protection table → Task 4 (middleware) + per-page redirects (Tasks 5/6).
- §7 env → Task 2 `.env.example`; secrets in `.env.local`.
- §8 security (httpOnly/secure cookie via Auth.js, trustHost, fail-closed middleware, no token logging) → Tasks 2/4.
- §9 Authentik setup → USER prerequisite noted in Task 2/Task 7 (operational, not code).
- §10 compatibility risk + fallback → Global Constraints + Task 2 BLOCK path.
- §11 testing (unit `isAdminEmail`/`resolveEnrollUrl`; manual SSO) → Task 1 + Task 7.
- §12 out of scope (game upload, Authentik branding) → not in any task (correct).

**Placeholder scan:** No TBD/TODO. Complete code in every code step. Three steps name a version-adaptation path (Task 2 provider API, Task 4 edge split-config, Task 5 `bg-red-soft`) — each gives the concrete canonical code plus the exact adjustment to verify, because the bleeding-edge library version and one Tailwind token cannot be assumed; these are explicit verify-and-adapt instructions, not vague placeholders.

**Type consistency:** `isAdminEmail(email, allowlist)` and `resolveEnrollUrl(envValue)` identical in Tasks 1/2/3. `session.isAdmin: boolean` declared (Task 2 augmentation), set (Task 2 callback), read (Tasks 3/4/5/6). `handlers/auth/signIn/signOut` from `@/auth` consistent across Tasks 2/4/5/6.

**Note for implementer:** This is a real external-IdP integration. Tasks 1–6 are fully verifiable offline (build/lint/typecheck/tests + signed-out redirects); the signed-IN round-trip (Task 7 Step 3) depends on the user's Authentik app + `.env.local` and may be completed after the code ships.
```
