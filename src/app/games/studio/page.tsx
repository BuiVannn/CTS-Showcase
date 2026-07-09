import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import AmbientField from "@/components/fx/AmbientField";
import { auth } from "@/auth";
import { signIn } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import StudioDashboard from "@/components/games/studio/StudioDashboard";
import StudioHead from "@/components/games/studio/StudioHead";
import SignInButton from "@/components/games/studio/SignInButton";

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
        <main>
          <section className="section relative overflow-hidden pt-28">
            <AmbientField tone="warm" />
            <Container>
              <StudioHead page="dashboard" />
              <form action={async () => { "use server"; await signIn("authentik"); }} className="mt-8">
                <SignInButton />
              </form>
            </Container>
          </section>
        </main>
        <Footer />
      </>
    );
  }
  const games = getGamesStore().listByOwner(ownerId).map((g) => ({ slug: g.slug, title: g.title, status: g.status }));
  return (
    <>
      <Navbar />
      <main>
        <section className="section relative overflow-hidden pt-28">
          <AmbientField tone="warm" />
          <Container>
            <StudioHead page="dashboard" />
            <StudioDashboard games={games} />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
