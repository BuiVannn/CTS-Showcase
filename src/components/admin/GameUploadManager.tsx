"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2 } from "lucide-react";

type Item = { slug: string; title: string; author: string };
type Pending = { slug: string; title: string; author: string; owner: string };

export default function GameUploadManager({ games, pending }: { games: Item[]; pending: Pending[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const GAMES_ORIGIN = "https://games.ctslab.net"; // preview origin (display only)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/games", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`✅ Đã đăng game: ${data.slug}`);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setMsg(`❌ Lỗi: ${data.error ?? res.status}`);
      }
    } catch {
      setMsg("❌ Lỗi mạng");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(slug: string) {
    if (!confirm(`Xoá game "${slug}"?`)) return;
    await fetch(`/api/admin/games?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    router.refresh();
  }

  async function moderate(slug: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm(`Từ chối & xoá "${slug}"?`)) return;
    await fetch("/api/admin/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, action }),
    });
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Pending queue */}
      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <h2 className="text-display text-lg text-ink">Chờ duyệt ({pending.length})</h2>
        <ul className="mt-4 space-y-2">
          {pending.length === 0 && <li className="text-sm text-dim">Không có game chờ duyệt.</li>}
          {pending.map((g) => (
            <li key={g.slug} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
              <span className="text-sm text-ink">{g.title} <span className="text-dim">· {g.author} · {g.owner}</span></span>
              <span className="ml-auto flex items-center gap-2">
                <a href={`${GAMES_ORIGIN}/${g.slug}/index.html`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue underline">Xem thử</a>
                <button type="button" onClick={() => moderate(g.slug, "approve")} className="rounded-[var(--radius-pill)] bg-blue px-3 py-1 text-xs font-semibold text-white">Duyệt</button>
                <button type="button" onClick={() => moderate(g.slug, "reject")} className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-xs text-red">Từ chối</button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* existing upload form + published list */}
      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
          <h2 className="text-display text-lg text-ink">Tải game lên</h2>
          <div className="mt-4 space-y-3">
            <input name="title" required placeholder="Tên game" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
            <input name="author" required placeholder="Tác giả" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
            <input name="slug" placeholder="Slug (tùy chọn)" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
            <input name="file" type="file" accept=".zip" required className="w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-blue file:px-4 file:py-2 file:text-white" />
          </div>
          <button type="submit" disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Upload size={16} /> {busy ? "Đang tải…" : "Đăng game"}
          </button>
          {msg && <p className="mt-3 text-sm text-ink-2">{msg}</p>}
        </form>

        <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
          <h2 className="text-display text-lg text-ink">Game đã đăng ({games.length})</h2>
          <ul className="mt-4 space-y-2">
            {games.length === 0 && <li className="text-sm text-dim">Chưa có game nào.</li>}
            {games.map((g) => (
              <li key={g.slug} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
                <span className="text-sm text-ink">{g.title} <span className="text-dim">· {g.author}</span></span>
                <button type="button" onClick={() => onDelete(g.slug)} aria-label={`Xoá ${g.title}`} className="text-dim transition-colors hover:text-red">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
