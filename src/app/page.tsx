import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HomeHero from "@/components/home/HomeHero";
import WhatWeDo from "@/components/home/WhatWeDo";
import SpotlightSection from "@/components/home/SpotlightSection";
import HomeStats from "@/components/home/HomeStats";
import ShowcaseSection from "@/components/home/ShowcaseSection";
import HomeNews from "@/components/home/HomeNews";
import EcosystemBento from "@/components/home/EcosystemBento";
import DownloadBand from "@/components/home/DownloadBand";
import GamesTeaser from "@/components/home/GamesTeaser";
import Partners from "@/components/home/Partners";
import HomeCTA from "@/components/home/HomeCTA";
import { getNews, pickHomeNews, HOME_NEWS_WINDOW } from "@/content/news";

// Trang chủ trước đây tĩnh hoàn toàn. Khối Tin tức đọc từ Dashboard nên trang chuyển sang
// ISR: dựng sẵn, tự làm mới sau ~60s. Đăng tin ở Dashboard là trang chủ tự cập nhật.
export const revalidate = 60;

export default async function Home() {
  // Dashboard sập → getNews() nuốt lỗi, trả rỗng → HomeNews tự ẩn. Trang chủ KHÔNG được vỡ
  // vì một khối phụ. (Khác /news/[slug]: ở đó outage PHẢI ném lỗi, xem content/news.ts.)
  const { posts } = await getNews({ pageSize: HOME_NEWS_WINDOW });

  return (
    <>
      <Navbar />
      <main className="relative">
        <HomeHero />
        <WhatWeDo />
        <SpotlightSection />
        <HomeStats />
        <ShowcaseSection />
        <HomeNews posts={pickHomeNews(posts)} />
        <EcosystemBento />
        <DownloadBand />
        <GamesTeaser />
        <Partners />
        <HomeCTA />
      </main>
      <Footer />
    </>
  );
}
