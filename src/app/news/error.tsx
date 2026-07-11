"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";

// Bắt lỗi khi Dashboard sập/500/mạng hỏng lúc tải tin (xem src/content/news.ts:getNewsBySlug).
// Không cho outage trở thành 404 bị cache — trang này hiện thông báo có thể thử lại thay vì crash.
export default function NewsError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("[news] page error:", error);
  }, [error]);

  return (
    <>
      <Navbar />
      <main>
        <section className="section pt-28">
          <Container className="max-w-3xl text-center">
            <h1 className="text-section text-ink">{t(ui.news.errorTitle)}</h1>
            <p className="mt-3 text-base leading-relaxed text-ink-2">{t(ui.news.errorBody)}</p>
            <Button className="mt-6" onClick={() => unstable_retry()}>
              {t(ui.news.retry)}
            </Button>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
