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

  const title = post.title.vi || post.title.en || "Tin tức";
  const description = post.excerpt.vi || post.excerpt.en || undefined;
  // Dashboard đã lọc scheme của `cover` (safeCoverUrl) — dùng thẳng làm ảnh chia sẻ.
  const images = post.cover ? [post.cover] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      // `publishedAt` CÓ THỂ là chuỗi rỗng (xem content/news.ts) — đừng để lọt "" vào metadata.
      publishedTime: post.publishedAt || undefined,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
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
