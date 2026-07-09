import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import AmbientField from "@/components/fx/AmbientField";
import { auth } from "@/auth";
import GameForm from "@/components/games/studio/GameForm";
import StudioHead from "@/components/games/studio/StudioHead";

export const metadata: Metadata = { title: "Tạo game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!(session?.user)) redirect("/games/studio");
  return (
    <>
      <Navbar />
      <main>
        <section className="section relative overflow-hidden pt-28">
          <AmbientField tone="warm" />
          <Container>
            <StudioHead page="new" />
            <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-7">
              <GameForm mode="create" />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
