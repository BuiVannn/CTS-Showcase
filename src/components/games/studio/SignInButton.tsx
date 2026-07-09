"use client";

import { LogIn } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

export default function SignInButton() {
  const { t } = useLocale();
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
    >
      <LogIn size={16} aria-hidden /> {t(ui.studio.signIn)}
    </button>
  );
}
