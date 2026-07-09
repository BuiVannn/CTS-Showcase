import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GameDetailView from "@/components/games/GameDetailView";
import { getCatalogGame } from "@/lib/game-catalog";
import { getGamesStore } from "@/lib/games-db";
import { mapUserGame } from "@/lib/game-catalog-map";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

async function resolve(slug: string): Promise<{ game: import("@/lib/game-catalog-map").CatalogGame; notPublic: boolean } | null> {
  const pub = getCatalogGame(slug);
  if (pub) return { game: pub, notPublic: false };
  const db = getGamesStore().get(slug);
  if (!db) return null;
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  const isAdmin = (session as { isAdmin?: boolean } | null)?.isAdmin === true;
  if (uid && (db.owner_id === uid || isAdmin)) return { game: mapUserGame(db), notPublic: true };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolve(slug);
  const title = r ? (r.game.title?.trim() || "Game") : "Không tìm thấy";
  return { title };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  return (
    <>
      <Navbar />
      <main><GameDetailView game={r.game} notPublic={r.notPublic} /></main>
      <Footer />
    </>
  );
}
