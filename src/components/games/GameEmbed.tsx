"use client";

import { useRef } from "react";
import { Maximize } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

/**
 * Embeds a self-contained static game (its own index.html) in a sandboxed,
 * 16:9 responsive iframe with a fullscreen button. Same-origin is acceptable
 * for trusted lab games; user-uploaded games will use a separate origin later.
 */
export default function GameEmbed({ src, title }: { src: string; title: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLIFrameElement>(null);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-black shadow-[var(--shadow-lg)]"
      style={{ aspectRatio: "16 / 9" }}
    >
      <iframe
        ref={ref}
        src={src}
        title={title}
        className="absolute inset-0 h-full w-full"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups"
        allow="fullscreen; autoplay; gamepad"
        allowFullScreen
      />
      <button
        type="button"
        onClick={() => ref.current?.requestFullscreen?.()}
        aria-label={t(ui.games.fullscreen)}
        className="absolute bottom-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-pill)] border border-border bg-card/90 text-ink shadow-[var(--shadow-sm)] transition-colors hover:text-blue"
      >
        <Maximize size={16} />
      </button>
    </div>
  );
}
