"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import type { NewsPost } from "@/content/news";
import type { Localized } from "@/content/types";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function NewsGrid({ posts }: { posts: NewsPost[] }) {
  const { t, locale } = useLocale();
  // Dashboard đảm bảo title/body EN không rỗng cho bài đã publish, nhưng KHÔNG bắt buộc excerpt
  // — admin có thể đăng bài chỉ có excerpt tiếng Việt. Fallback để khách EN vẫn thấy tóm tắt.
  const pick = (l: Localized) => t(l) || l.vi || l.en;
  const fmtDate = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
          day: "2-digit", month: "2-digit", year: "numeric",
        })
      : "";

  return (
    <section className="section pt-28">
      <Container>
        <Reveal>
          <span className="eyebrow">{t(ui.news.eyebrow)}</span>
          <h1 className="text-section mt-2 text-ink">{t(ui.news.title)}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">{t(ui.news.intro)}</p>
        </Reveal>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-ink-2">{t(ui.news.empty)}</p>
        ) : (
          <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <StaggerItem key={p.slug}>
                <Link
                  href={`/news/${p.slug}`}
                  className="flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-card p-3 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue"
                >
                  {p.cover && (
                    // URL ảnh tuỳ ý (chưa cấu hình remotePatterns) → dùng <img>, không next/image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.cover}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full rounded-[var(--radius-lg)] object-cover"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-3">
                    <div className="flex items-center gap-2">
                      {p.featured && <Badge tone="red">{t(ui.news.featured)}</Badge>}
                      <span className="text-xs text-ink-2">{fmtDate(p.publishedAt)}</span>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-ink">{pick(p.title)}</h2>
                    <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-2">{pick(p.excerpt)}</p>
                    <span className="mt-3 text-sm font-semibold text-blue">{t(ui.news.readMore)} →</span>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Container>
    </section>
  );
}
