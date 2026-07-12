import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NewsGrid from "@/components/news/NewsGrid";
import { getNews, parsePage, pinFeatured } from "@/content/news";

export const revalidate = 60;

// API chặn trên ở 50; 12 vừa đủ 4 hàng lưới 3 cột.
const PAGE_SIZE = 12;

const DESCRIPTION = "Tin tức, sự kiện và cột mốc mới nhất của CTS Lab.";

export const metadata: Metadata = {
  title: "Tin tức",
  description: DESCRIPTION,
  openGraph: { title: "Tin tức — CTS Lab", description: DESCRIPTION, type: "website" },
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const page = parsePage((await searchParams).page);
  const { posts, totalPages } = await getNews({ page, pageSize: PAGE_SIZE });

  return (
    <>
      <Navbar />
      <main>
        <NewsGrid posts={pinFeatured(posts)} page={page} totalPages={totalPages} />
      </main>
      <Footer />
    </>
  );
}
