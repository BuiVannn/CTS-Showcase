"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import Badge from "@/components/ui/Badge";

type Item = { slug: string; title: string; status: string };
const STATUS_VI: Record<string, string> = { draft: "Nháp", pending: "Chờ duyệt", published: "Đã đăng", rejected: "Bị từ chối" };

export default function StudioDashboard({ games }: { games: Item[] }) {
  const { t } = useLocale();
  const router = useRouter();

  async function onDelete(slug: string) {
    if (!confirm(t(ui.studio.confirmDelete))) return;
    await fetch(`/api/games/${encodeURIComponent(slug)}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-display text-lg text-ink">{t(ui.studio.myGames)} ({games.length})</h2>
        <Link href="/games/studio/new" className="rounded-[var(--radius-pill)] bg-red px-4 py-2 text-sm font-semibold text-white">{t(ui.studio.newGame)}</Link>
      </div>
      {games.length === 0 ? (
        <p className="mt-6 text-sm text-dim">{t(ui.studio.empty)}</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {games.map((g) => (
            <li key={g.slug} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3">
              <span className="text-sm font-medium text-ink">{g.title}</span>
              <Badge tone="neutral">{STATUS_VI[g.status] ?? g.status}</Badge>
              <span className="ml-auto flex items-center gap-3">
                <Link href={`/games/${g.slug}`} className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-blue"><Eye size={14} /> {t(ui.studio.preview)}</Link>
                <Link href={`/games/studio/${g.slug}/edit`} className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-blue"><Pencil size={14} /> {t(ui.studio.edit)}</Link>
                <button type="button" onClick={() => onDelete(g.slug)} className="inline-flex items-center gap-1 text-xs text-dim hover:text-red"><Trash2 size={14} /> {t(ui.studio.del)}</button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
