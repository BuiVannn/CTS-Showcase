import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Breadcrumb from "@/components/ui/Breadcrumb";
import GameEmbed from "@/components/games/GameEmbed";
import { getGames, getGame } from "@/content/games";

export function generateStaticParams() {
  return getGames().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGame(slug);
  return { title: g ? `${g.title} — CTS Lab` : "Không tìm thấy — CTS Lab" };
}

export default async function GamePlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGame(slug);
  if (!g) notFound();

  return (
    <>
      <Navbar />
      <main className="section pt-28">
        <Container>
          <Breadcrumb items={[{ label: "CTS Lab", href: "/" }, { label: "Games", href: "/games" }, { label: g.title }]} />
          <h1 className="text-section mt-6 text-ink">{g.title}</h1>
          <p className="mt-1 text-sm text-dim">by {g.author} · {g.year}</p>
          <div className="mt-6 max-w-4xl">
            <GameEmbed src={g.embedPath} title={g.title} />
            <p className="mt-3 text-xs text-dim">
              Game khá nặng — nên chơi trên máy tính; lần tải đầu có thể hơi lâu.
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
