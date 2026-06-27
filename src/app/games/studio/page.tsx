import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import { signIn } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import StudioDashboard from "@/components/games/studio/StudioDashboard";

export const metadata: Metadata = { title: "Studio — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  if (!ownerId) {
    return (
      <>
        <Navbar />
        <main className="section pt-28"><Container>
          <h1 className="text-section text-ink">Game Studio</h1>
          <form action={async () => { "use server"; await signIn("authentik"); }} className="mt-6">
            <button type="submit" className="rounded-[var(--radius-pill)] bg-blue px-5 py-2.5 text-sm font-semibold text-white">Đăng nhập</button>
          </form>
        </Container></main>
        <Footer />
      </>
    );
  }
  const games = getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }));
  return (
    <>
      <Navbar />
      <main className="section pt-28"><Container>
        <h1 className="text-section text-ink">Game Studio</h1>
        <StudioDashboard games={games} />
      </Container></main>
      <Footer />
    </>
  );
}
