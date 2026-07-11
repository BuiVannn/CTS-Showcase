import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsGrid from "@/components/news/NewsGrid";
import { getNews } from "@/content/news";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Tin tức",
  description: "Tin tức, sự kiện và cột mốc mới nhất của CTS Lab.",
};

export default async function NewsPage() {
  const { posts } = await getNews({ pageSize: 24 });
  return (
    <>
      <Navbar />
      <main>
        <NewsGrid posts={posts} />
      </main>
      <Footer />
    </>
  );
}
