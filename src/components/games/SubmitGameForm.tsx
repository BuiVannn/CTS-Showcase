"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Upload, Lock } from "lucide-react";

type Mine = { slug: string; title: string; status: string };
const STATUS_VI: Record<string, string> = { pending: "Chờ duyệt", published: "Đã đăng", rejected: "Bị từ chối" };

export default function SubmitGameForm({ signedIn, mine }: { signedIn: boolean; mine: Mine[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <div className="mt-8 flex flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-card p-6">
        <Lock size={24} className="text-blue" aria-hidden />
        <p className="text-sm text-ink-2">Đăng nhập để đăng game.</p>
        <button type="button" onClick={() => signIn("authentik")} className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white">Đăng nhập</button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/games/submit", { method: "POST", body: new FormData(e.currentTarget) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg("✅ Đã gửi! Game đang chờ duyệt.");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        const m: Record<string, string> = { quota: "Bạn đã đạt giới hạn số game.", "too-large": "File quá lớn.", "too-big-uncompressed": "Game giải nén quá lớn.", "no-index": "Zip thiếu index.html.", "invalid-zip": "File zip không hợp lệ.", "unsafe-path": "Zip chứa đường dẫn không an toàn." };
        setMsg(`❌ ${m[data.error] ?? "Lỗi: " + (data.error ?? res.status)}`);
      }
    } catch {
      setMsg("❌ Lỗi mạng");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <div className="space-y-3">
          <input name="title" required placeholder="Tên game" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="author" required placeholder="Tác giả" className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue" />
          <input name="file" type="file" accept=".zip" required className="w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-blue file:px-4 file:py-2 file:text-white" />
        </div>
        <button type="submit" disabled={busy} className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          <Upload size={16} /> {busy ? "Đang gửi…" : "Gửi duyệt"}
        </button>
        {msg && <p className="mt-3 text-sm text-ink-2">{msg}</p>}
      </form>

      <div className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
        <h2 className="text-display text-lg text-ink">Game của bạn ({mine.length})</h2>
        <ul className="mt-4 space-y-2">
          {mine.length === 0 && <li className="text-sm text-dim">Bạn chưa đăng game nào.</li>}
          {mine.map((g) => (
            <li key={g.slug} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm">
              <span className="text-ink">{g.title}</span>
              <span className="text-dim">{STATUS_VI[g.status] ?? g.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
