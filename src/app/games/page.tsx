import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GameHubView from "@/components/games/GameHubView";
import { getCatalog } from "@/lib/game-catalog";

export const metadata: Metadata = { title: "Game Hub" };
export const dynamic = "force-dynamic"; // catalog includes DB rows

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main><GameHubView games={getCatalog()} /></main>
      <Footer />
    </>
  );
}
