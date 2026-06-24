import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GamePlayView from "@/components/games/GamePlayView";
import { getGames } from "@/content/games";
import { getCatalogGame } from "@/lib/game-catalog";

export const dynamicParams = true;
export function generateStaticParams() {
  return getGames().map((g) => ({ slug: g.slug })); // pre-render lab games; user games render on demand
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getCatalogGame(slug);
  return { title: g ? g.title : "Không tìm thấy" };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getCatalogGame(slug);
  if (!g) notFound();
  return (
    <>
      <Navbar />
      <main><GamePlayView game={g} /></main>
      <Footer />
    </>
  );
}
