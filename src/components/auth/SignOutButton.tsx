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
