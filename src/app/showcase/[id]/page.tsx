import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShowcaseDetail from "@/components/showcase/ShowcaseDetail";
import { showcase, getShowcaseItem } from "@/content/showcase";

export function generateStaticParams() {
  return showcase.map((s) => ({ id: s.id }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const s = getShowcaseItem(id);
  return { title: s ? `${s.title} — CTS Lab` : "Không tìm thấy — CTS Lab" };
}

export default async function ShowcaseDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!getShowcaseItem(id)) notFound();
  return (
    <>
      <Navbar />
      <main><ShowcaseDetail id={id} /></main>
      <Footer />
    </>
  );
}
