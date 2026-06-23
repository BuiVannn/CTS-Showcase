import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import GameCover from "@/components/games/GameCover";
import { getGames } from "@/content/games";

export const metadata: Metadata = { title: "Game Hub — CTS Lab" };

export default function GamesPage() {
  const games = getGames();
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <span className="eyebrow eyebrow-draw">Games</span>
          <h1 className="text-section mt-3 text-ink">Game Hub</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-2">
            Chơi các game do lab tạo ra — ngay trên trình duyệt.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.slug}`}
                className="group rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1 hover:border-blue"
              >
                <GameCover game={g} />
                <h2 className="text-display mt-3 text-lg text-ink">{g.title}</h2>
                <p className="mt-1 text-sm text-ink-2">by {g.author}</p>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
