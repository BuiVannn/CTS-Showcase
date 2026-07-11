"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { ui } from "@/content/ui";
import type { NewsPost } from "@/content/news";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";

export default function NewsArticle({ post }: { post: NewsPost }) {
  const { t, locale } = useLocale();
  const date = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "";
  const body = t(post.body);
  const excerpt = t(post.excerpt);

  return (
    <article className="section pt-28">
      <Container className="max-w-3xl">
        <Link href="/news" className="text-sm font-semibold text-blue hover:underline">
          ← {t(ui.news.back)}
        </Link>

        <div className="mt-5 flex items-center gap-2">
          {post.featured && <Badge tone="red">{t(ui.news.featured)}</Badge>}
          <span className="text-xs text-ink-2">{date}</span>
        </div>

        <h1 className="text-section mt-3 text-ink">{t(post.title)}</h1>
        {excerpt && <p className="mt-3 text-base leading-relaxed text-ink-2">{excerpt}</p>}

        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover}
            alt=""
            className="mt-6 w-full rounded-[var(--radius-lg)] object-cover"
          />
        )}

        {/* HTML đã sanitize 2 lớp ở Dashboard (lúc lưu + lúc trả API). */}
        <div className="news-body mt-8" dangerouslySetInnerHTML={{ __html: body }} />
      </Container>
    </article>
  );
}
