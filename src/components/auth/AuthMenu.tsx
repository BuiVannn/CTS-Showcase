"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { User, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import { resolveEnrollUrl } from "@/lib/auth-helpers";
import SignOutButton from "./SignOutButton";

export default function AuthMenu({ variant = "menu" }: { variant?: "menu" | "inline" }) {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

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

  if (variant === "inline") {
    return (
      <div className="flex flex-col gap-1">
        <Link href="/account" className="rounded-[var(--radius-md)] px-4 py-3 text-sm text-ink-2 hover:bg-surface hover:text-ink">{t(ui.auth.account)}</Link>
        <Link href="/members" className="rounded-[var(--radius-md)] px-4 py-3 text-sm text-ink-2 hover:bg-surface hover:text-ink">{t(ui.auth.members)}</Link>
        {session.isAdmin && (
          <Link href="/admin" className="rounded-[var(--radius-md)] px-4 py-3 text-sm text-ink-2 hover:bg-surface hover:text-ink">{t(ui.auth.admin)}</Link>
        )}
        <div className="px-4 py-2"><SignOutButton /></div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
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
