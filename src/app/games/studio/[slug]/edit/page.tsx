import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import GameForm, { type GameFormData } from "@/components/games/studio/GameForm";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const metadata: Metadata = { title: "Sửa game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function EditGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  if (!uid) redirect("/games/studio");
  const g = getGamesStore().get(slug);
  if (!g) notFound();
  const isAdmin = (session as { isAdmin?: boolean }).isAdmin === true;
  if (g.owner_id !== uid && !isAdmin) notFound();

  const initial: GameFormData = {
    title: g.title, author: g.author, tagline: g.tagline ?? "", cover: g.cover ?? "",
    classification: g.classification ?? "game", projectType: g.project_type ?? "web",
    releaseStatus: g.release_status ?? "in_dev", genre: g.genre ?? "", tags: g.tags ?? "",
    description: g.description ?? "", externalUrl: g.external_url ?? "", videoUrl: g.video_url ?? "",
  };
  return (
    <>
      <Navbar />
      <main className="section pt-28"><Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: "Games", href: "/games" }, { label: "Studio", href: "/games/studio" }, { label: "Sửa" }]} />
        <h1 className="text-section text-ink">Sửa: {g.title}</h1>
        <GameForm mode="edit" slug={slug} status={g.status} initial={initial} />
      </Container></main>
      <Footer />
    </>
  );
}
