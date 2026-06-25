import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import SubmitGameForm from "@/components/games/SubmitGameForm";

export const metadata: Metadata = { title: "Đăng game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function SubmitGamePage() {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  const mine = ownerId
    ? getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }))
    : [];
  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <h1 className="text-section text-ink">Đăng game của bạn</h1>
          <p className="mt-2 max-w-xl text-sm text-ink-2">Tải lên bản build WebGL (.zip có index.html). Game sẽ chờ duyệt trước khi công khai.</p>
          <SubmitGameForm signedIn={!!ownerId} mine={mine} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
