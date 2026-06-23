import Image from "next/image";
import { Gamepad2 } from "lucide-react";
import type { Game } from "@/content/types";

/** A game's cover: the cover image when set, else a branded placeholder tile. */
export default function GameCover({ game, className = "" }: { game: Game; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[var(--radius-md)] border border-border ${className}`}
      style={{ aspectRatio: "16 / 9" }}
    >
      {game.cover ? (
        <Image src={game.cover} alt={game.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-white"
          style={{ background: "linear-gradient(135deg, var(--blue), var(--red))" }}
        >
          <Gamepad2 size={28} aria-hidden />
          <span className="px-3 text-center text-sm font-semibold">{game.title}</span>
        </div>
      )}
    </div>
  );
}
