"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Send, Lock, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import MessageContent from "./MessageContent";

type Msg = { role: "user" | "assistant"; content: string };

export default function PTalkChat() {
  const { t } = useLocale();
  const { status } = useSession();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limited, setLimited] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch the remaining quota once authenticated (side effect — async, not render-derivable).
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    fetch("/api/ptalk-chat")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (typeof d.remaining === "number") {
          setRemaining(d.remaining);
          setLimited(d.remaining <= 0);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const msg = input.trim();
    if (!msg || busy || limited) return;
    setInput("");
    setError(false);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ptalk-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (res.status === 429) {
        setLimited(true);
        setRemaining(0);
        return;
      }
      if (!res.ok) {
        setError(true);
        return;
      }
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
        setLimited(data.remaining <= 0);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const shell =
    "flex h-[420px] flex-col rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-lg)]";

  if (status !== "authenticated") {
    return (
      <div className={`${shell} items-center justify-center gap-4 p-8 text-center`}>
        <Lock size={28} className="text-blue" aria-hidden />
        <p className="max-w-xs text-base text-ink-2">{t(ui.ptalkChat.signInPrompt)}</p>
        <button
          type="button"
          onClick={() => signIn("authentik")}
          className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          disabled={status === "loading"}
        >
          {t(ui.ptalkChat.signInCta)}
        </button>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles size={16} className="text-red" aria-hidden />
        <span className="text-display text-sm text-ink">{t(ui.ptalkChat.intro)}</span>
        {remaining !== null && (
          <span className="ml-auto font-mono text-[0.7rem] text-dim">
            {t(ui.ptalkChat.quota).replace("{n}", String(remaining))}
          </span>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-sm text-dim">{t(ui.ptalkChat.emptyHint)}</p>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="text-right">
              <span className="inline-block max-w-[85%] rounded-[var(--radius-md)] bg-blue px-3 py-2 text-sm text-white">
                {m.content}
              </span>
            </div>
          ) : (
            <div key={i} className="text-left">
              <div className="inline-block max-w-[85%] rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-ink">
                <MessageContent content={m.content} />
              </div>
            </div>
          ),
        )}
        {busy && <p className="text-sm text-dim">{t(ui.ptalkChat.thinking)}</p>}
        {limited && <p className="text-sm text-red">{t(ui.ptalkChat.limitReached)}</p>}
        {error && <p className="text-sm text-red">{t(ui.ptalkChat.error)}</p>}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder={t(ui.ptalkChat.placeholder)}
            disabled={busy || limited}
            aria-label={t(ui.ptalkChat.placeholder)}
            className="flex-1 rounded-[var(--radius-pill)] border border-border bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-blue disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || limited || !input.trim()}
            aria-label={t(ui.ptalkChat.send)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] bg-red text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-[0.7rem] text-dim">{t(ui.ptalkChat.privacyNote)}</p>
      </div>
    </div>
  );
}
