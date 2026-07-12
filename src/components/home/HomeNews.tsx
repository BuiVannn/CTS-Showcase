"use client";

import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import type { NewsPost } from "@/content/news";
import type { Localized } from "@/content/types";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import AmbientField from "@/components/fx/AmbientField";

export default function HomeNews({ posts }: { posts: NewsPost[] }) {
  const { t, locale } = useLocale();

  // Trang chủ là mặt tiền: không có tin (hoặc Dashboard đang sập → getNews trả rỗng)
  // thì ẨN HẲN cả khối. Thà không có mục còn hơn có mục trống.
  if (posts.length === 0) return null;

  // Dashboard chỉ bắt buộc song ngữ cho `title`, không bắt buộc `excerpt` — nên khách EN
  // có thể gặp excerpt rỗng. Rơi về ngôn ngữ còn lại thay vì để trống.
  const pick = (l: Localized) => t(l) || l.vi || l.en;
  const fmtDate = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

  const [lead, ...rest] = posts;

  return (
    <section className="section">
      <Container>
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-xl">
              <span className="eyebrow eyebrow-draw">{t(ui.homeNews.eyebrow)}</span>
              <h2 className="text-section mt-3 text-ink">{t(ui.homeNews.title)}</h2>
              <p className="mt-3 text-base leading-relaxed text-ink-2">{t(ui.homeNews.lead)}</p>
            </div>
            <Magnetic>
              <Button href="/news" variant="ghost">
                <Newspaper size={16} /> {t(ui.homeNews.cta)} <ArrowRight size={16} />
              </Button>
            </Magnetic>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Thẻ lớn. Chỉ có 1 tin → chiếm trọn chiều ngang, trông có chủ đích chứ không như thiếu. */}
            <Link
              href={`/news/${lead.slug}`}
              className={`group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue ${
                rest.length > 0 ? "lg:col-span-2" : "lg:col-span-3"
              }`}
            >
              {lead.cover ? (
                // Ảnh bìa là URL tuỳ ý (chưa cấu hình remotePatterns) → dùng <img>, không next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lead.cover}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/7] w-full object-cover"
                />
              ) : (
                // Không có ảnh bìa: dùng nền gradient sẵn có thay vì để một ô xám trống.
                <div className="relative aspect-[16/7] w-full overflow-hidden bg-surface">
                  <AmbientField tone="cool" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  {lead.featured && <Badge tone="red">{t(ui.news.featured)}</Badge>}
                  <span className="text-xs text-ink-2">{fmtDate(lead.publishedAt)}</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-ink">{pick(lead.title)}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-2">
                  {pick(lead.excerpt)}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue">
                  {t(ui.news.readMore)} <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className="flex flex-col gap-4">
                {rest.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/news/${p.slug}`}
                    className="group flex flex-1 flex-col rounded-[var(--radius-lg)] border border-border bg-card p-5 shadow-[var(--shadow-sm)] transition duration-300 hover:-translate-y-1 hover:border-blue"
                  >
                    <div className="flex items-center gap-2">
                      {p.featured && <Badge tone="red">{t(ui.news.featured)}</Badge>}
                      <span className="text-xs text-ink-2">{fmtDate(p.publishedAt)}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-ink">{pick(p.title)}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-2">
                      {pick(p.excerpt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
