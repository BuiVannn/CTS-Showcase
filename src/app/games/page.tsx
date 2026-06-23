import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GameHubView from "@/components/games/GameHubView";

export const metadata: Metadata = { title: "Game Hub — CTS Lab" };

export default function GamesPage() {
  return (
    <>
      <Navbar />
      <main><GameHubView /></main>
      <Footer />
    </>
  );
}
