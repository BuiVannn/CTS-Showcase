import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GamePlayView from "@/components/games/GamePlayView";
import { getGames, getGame } from "@/content/games";

export function generateStaticParams() {
  return getGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGame(slug);
  return { title: g ? `${g.title} — CTS Lab` : "Không tìm thấy — CTS Lab" };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGame(slug);
  if (!g) notFound();
  return (
    <>
      <Navbar />
      <main><GamePlayView game={g} /></main>
      <Footer />
    </>
  );
}
