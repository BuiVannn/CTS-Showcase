"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import MessageContent from "@/components/home/MessageContent";

export type GameFormData = {
  title: string; author: string; tagline: string; cover: string;
  classification: string; projectType: string; releaseStatus: string; genre: string; tags: string;
  description: string; externalUrl: string; videoUrl: string;
};

export const EMPTY_FORM: GameFormData = {
  title: "", author: "", tagline: "", cover: "",
  classification: "game", projectType: "web", releaseStatus: "in_dev", genre: "", tags: "",
  description: "", externalUrl: "", videoUrl: "",
};

const inputCls = "w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-blue";

function errorMsg(code: string | undefined): string {
  const m: Record<string, string> = {
    quota: "Bạn đã đạt giới hạn số game.", "too-large": "File quá lớn.",
    "too-big-uncompressed": "Game giải nén quá lớn.", "no-index": "Zip thiếu index.html.",
    "invalid-zip": "File zip không hợp lệ.", "unsafe-path": "Zip chứa đường dẫn không an toàn.",
    bad: "Thiếu thông tin bắt buộc.", forbidden: "Bạn không có quyền.",
  };
  return `❌ ${m[code ?? ""] ?? "Lỗi: " + (code ?? "")}`;
}

export default function GameForm({
  mode, initial, slug, status,
}: { mode: "create" | "edit"; initial?: GameFormData; slug?: string; status?: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [data, setData] = useState<GameFormData>(initial ?? EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const set = (k: keyof GameFormData, v: string) => setData((d) => ({ ...d, [k]: v }));

  const tabs = [t(ui.studio.tabBasic), t(ui.studio.tabClassify), t(ui.studio.tabUpload), t(ui.studio.tabDetails), t(ui.studio.tabVisibility)];
  const showDraftSubmit = mode === "create" || status === "draft" || status === "rejected";

  async function save(intent: "draft" | "pending" | "keep") {
    if (!data.title.trim() || !data.author.trim()) { setTab(0); setMsg(errorMsg("bad")); return; }
    if (mode === "create" && !file) { setTab(2); setMsg("❌ Cần tải lên bản build (.zip)."); return; }
    setBusy(true); setMsg(null);
    const form = new FormData();
    (Object.keys(data) as (keyof GameFormData)[]).forEach((k) => form.append(k, data[k]));
    form.append("status", intent);
    if (file) form.append("file", file);
    const url = mode === "create" ? "/api/games/studio" : `/api/games/${slug}`;
    try {
      const res = await fetch(url, { method: mode === "create" ? "POST" : "PUT", body: form });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/games/studio"); router.refresh(); }
      else setMsg(errorMsg(d.error));
    } catch { setMsg(`❌ ${t(ui.studio.errNetwork)}`); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-8 max-w-3xl">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((label, i) => (
          <button key={label} type="button" onClick={() => setTab(i)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${tab === i ? "border-blue text-blue" : "border-transparent text-ink-2 hover:text-ink"}`}>
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tab === 0 && (
          <>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fTitle)} *</span>
              <input className={`mt-1 ${inputCls}`} value={data.title} onChange={(e) => set("title", e.target.value)} /></label>
            {mode === "edit" && <p className="text-xs text-dim">URL: /games/{slug}</p>}
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fAuthor)} *</span>
              <input className={`mt-1 ${inputCls}`} value={data.author} onChange={(e) => set("author", e.target.value)} /></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fTagline)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.tagline} onChange={(e) => set("tagline", e.target.value)} /></label>
          </>
        )}

        {tab === 1 && (
          <>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.tabClassify)}</span>
              <select className={`mt-1 ${inputCls}`} value={data.classification} onChange={(e) => set("classification", e.target.value)}>
                <option value="game">{t(ui.studio.classGame)}</option><option value="app">{t(ui.studio.classApp)}</option>
                <option value="tool">{t(ui.studio.classTool)}</option><option value="demo">{t(ui.studio.classDemo)}</option>
                <option value="educational">{t(ui.studio.classEdu)}</option>
              </select></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.tabUpload)}</span>
              <select className={`mt-1 ${inputCls}`} value={data.projectType} onChange={(e) => set("projectType", e.target.value)}>
                <option value="web">{t(ui.studio.typeWeb)}</option><option value="external">{t(ui.studio.typeExternal)}</option>
                <option value="video">{t(ui.studio.typeVideo)}</option>
              </select></label>
            <label className="block text-sm"><span className="text-ink-2">Status</span>
              <select className={`mt-1 ${inputCls}`} value={data.releaseStatus} onChange={(e) => set("releaseStatus", e.target.value)}>
                <option value="in_dev">{t(ui.studio.relInDev)}</option><option value="released">{t(ui.studio.relReleased)}</option>
                <option value="prototype">{t(ui.studio.relPrototype)}</option>
              </select></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fGenre)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.genre} onChange={(e) => set("genre", e.target.value)} /></label>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fTags)}</span>
              <input className={`mt-1 ${inputCls}`} value={data.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Unity, WebGL" /></label>
          </>
        )}

        {tab === 2 && (
          <>
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fBuild)}</span>
              <input type="file" accept=".zip" className="mt-1 w-full text-sm text-ink-2 file:mr-3 file:rounded-[var(--radius-pill)] file:border-0 file:bg-blue file:px-4 file:py-2 file:text-white"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            {mode === "edit" && <p className="text-xs text-dim">{t(ui.studio.fBuildKeep)} — {t(ui.studio.rebuildNote)}</p>}
            <label className="block text-sm"><span className="text-ink-2">External URL</span>
              <input className={`mt-1 ${inputCls}`} value={data.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://…" /></label>
            <label className="block text-sm"><span className="text-ink-2">Video URL</span>
              <input className={`mt-1 ${inputCls}`} value={data.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://…" /></label>
          </>
        )}

        {tab === 3 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block text-sm"><span className="text-ink-2">{t(ui.studio.fDescription)}</span>
              <textarea className={`mt-1 h-72 ${inputCls}`} value={data.description} onChange={(e) => set("description", e.target.value)} /></label>
            <div><p className="text-sm text-ink-2">{t(ui.studio.preview2)}</p>
              <div className="mt-1 h-72 overflow-auto rounded-[var(--radius-md)] border border-border bg-surface p-3">
                {data.description ? <MessageContent content={data.description} /> : <p className="text-sm text-dim">—</p>}
              </div></div>
          </div>
        )}

        {tab === 4 && (
          <p className="text-sm text-ink-2">
            {showDraftSubmit
              ? "“Lưu nháp” lưu lại nhưng chưa gửi duyệt. “Gửi duyệt” gửi cho quản trị viên xem xét."
              : "“Lưu thay đổi” cập nhật ngay. Tải build mới sẽ đưa game đã đăng về chờ duyệt lại."}
          </p>
        )}
      </div>

      {/* Persistent action bar — visible on every tab */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {showDraftSubmit ? (
          <>
            <button type="button" disabled={busy} onClick={() => save("draft")} className="rounded-[var(--radius-pill)] border border-border px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">{t(ui.studio.saveDraft)}</button>
            <button type="button" disabled={busy} onClick={() => save("pending")} className="rounded-[var(--radius-pill)] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t(ui.studio.submitReview)}</button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => save("keep")} className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{t(ui.studio.saveChanges)}</button>
        )}
        {msg && <p className="text-sm text-ink-2">{msg}</p>}
      </div>
    </div>
  );
}
