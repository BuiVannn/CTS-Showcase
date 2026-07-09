"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, Gamepad2 } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

type Item = { slug: string; title: string; status: string };
const STATUS_TONE: Record<string, "red" | "blue" | "neutral"> = { draft: "neutral", pending: "neutral", published: "blue", rejected: "red" };

export default function StudioDashboard({ games }: { games: Item[] }) {
  const { t } = useLocale();
  const statusLabel = (s: string) => {
    const map: Record<string, typeof ui.studio.statusDraft> = {
      draft: ui.studio.statusDraft,
      pending: ui.studio.statusPending,
      published: ui.studio.statusPublished,
      rejected: ui.studio.statusRejected,
    };
    return map[s] ? t(map[s]) : s;
  };
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  async function onDelete(slug: string) {
    if (!confirm(t(ui.studio.confirmDelete))) return;
    setErr(null);
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else setErr(`❌ ${t(ui.studio.deleteFailed)}`);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-lg text-ink">{t(ui.studio.myGames)} ({games.length})</h2>
        <Link href="/games/studio/new" className="rounded-[var(--radius-pill)] bg-red px-4 py-2 text-sm font-semibold text-white">{t(ui.studio.newGame)}</Link>
      </div>
      {err && <p className="mt-3 text-sm text-red">{err}</p>}
      {games.length === 0 ? (
        <div className="mt-8"><EmptyState title={t(ui.studio.empty)} icon={<Gamepad2 size={28} aria-hidden />}>
          <Link href="/games/studio/new" className="text-sm text-blue hover:underline">{t(ui.studio.newGame)}</Link>
        </EmptyState></div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {games.map((g) => (
            <li key={g.slug} className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-display text-base text-ink">{g.title}</h3>
                <Badge tone={STATUS_TONE[g.status] ?? "neutral"}>{statusLabel(g.status)}</Badge>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <Link href={`/games/${g.slug}`} className="inline-flex items-center gap-1 text-ink-2 hover:text-blue"><Eye size={14} /> {t(ui.studio.preview)}</Link>
                <Link href={`/games/studio/${g.slug}/edit`} className="inline-flex items-center gap-1 text-ink-2 hover:text-blue"><Pencil size={14} /> {t(ui.studio.edit)}</Link>
                <button type="button" onClick={() => onDelete(g.slug)} className="ml-auto inline-flex items-center gap-1 text-dim hover:text-red"><Trash2 size={14} /> {t(ui.studio.del)}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
