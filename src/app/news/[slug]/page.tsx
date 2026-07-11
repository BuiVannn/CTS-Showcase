import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsArticle from "@/components/news/NewsArticle";
import { getNewsBySlug } from "@/content/news";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) return { title: "Không tìm thấy" };
  return {
    title: post.title.vi || post.title.en || "Tin tức",
    description: post.excerpt.vi || post.excerpt.en || undefined,
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  if (!post) notFound();
  return (
    <>
      <Navbar />
      <main>
        <NewsArticle post={post} />
      </main>
      <Footer />
    </>
  );
}
