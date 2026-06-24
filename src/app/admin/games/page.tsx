import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { getCatalog } from "@/lib/game-catalog";
import GameUploadManager from "@/components/admin/GameUploadManager";

export const metadata: Metadata = { title: "Quản lý Game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const session = await auth();
  if (!session?.user || !(session as { isAdmin?: boolean }).isAdmin) redirect("/");
  const games = getCatalog().filter((g) => g.source === "user");
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <h1 className="text-section text-ink">Quản lý Game</h1>
          <p className="mt-2 text-sm text-ink-2">Tải lên bản build WebGL (.zip có index.html). Game phục vụ từ origin tách biệt.</p>
          <GameUploadManager games={games.map((g) => ({ slug: g.slug, title: g.title, author: g.author }))} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
