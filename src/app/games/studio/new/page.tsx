import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import { auth } from "@/auth";
import GameForm from "@/components/games/studio/GameForm";
import Breadcrumb from "@/components/ui/Breadcrumb";

export const metadata: Metadata = { title: "Tạo game — CTS Lab" };
export const dynamic = "force-dynamic";

export default async function NewGamePage() {
  const session = await auth();
  if (!(session?.user)) redirect("/games/studio");
  return (
    <>
      <Navbar />
      <main className="section pt-28"><Container>
        <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: "Games", href: "/games" }, { label: "Studio", href: "/games/studio" }, { label: "Tạo mới" }]} />
        <h1 className="text-section text-ink">Tạo game mới</h1>
        <GameForm mode="create" />
      </Container></main>
      <Footer />
    </>
  );
}
