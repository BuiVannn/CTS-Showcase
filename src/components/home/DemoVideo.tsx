"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/** Pull the YouTube id out of an embed (".../embed/<id>") or watch ("?v=<id>") URL. */
function youtubeId(url: string): string {
  const embed = url.match(/\/embed\/([^/?]+)/);
  if (embed) return embed[1];
  const watch = url.match(/[?&]v=([^&]+)/);
  return watch ? watch[1] : "";
}

/**
 * Click-to-play YouTube facade. Until the user clicks, this is a plain poster +
 * button — so wheel/touch events bubble to the page and scrolling past it stays
 * smooth (a live cross-origin iframe would otherwise swallow scroll events).
 * The real iframe is mounted only on click, with autoplay.
 */
export default function DemoVideo({
  videoUrl,
  label,
  title,
}: {
  videoUrl: string;
  label: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(videoUrl);
  const poster = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  const sep = videoUrl.includes("?") ? "&" : "?";
  const src = `${videoUrl}${sep}autoplay=1&rel=0`;

  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-md)] bg-ink/90">
      {playing ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={title}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          data-cursor="Play"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
            }}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/15" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-red shadow-[var(--shadow-lg)] transition-transform duration-300 group-hover:scale-110">
            <Play size={26} className="ml-1" />
          </span>
          <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-white/85 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-red backdrop-blur">
            <Play size={12} />
            {label}
          </span>
        </button>
      )}
    </div>
  );
}
