import type { Localized, NewsPost } from "./types";

export type { NewsPost };

if (!process.env.DASHBOARD_API_URL && process.env.NODE_ENV === "production") {
  // Thiếu biến này ở production → /news im lặng trả "Chưa có tin nào" MÃI MÃI
  // (trông như nội dung rỗng hợp lệ, thực ra là lỗi cấu hình). Cảnh báo một lần lúc load module.
  console.warn(
    "[news] DASHBOARD_API_URL is not set in production — falling back to http://localhost:4321, which will not work.",
  );
}
const BASE = process.env.DASHBOARD_API_URL || "http://localhost:4321";
const REVALIDATE = 60; // giây — ISR: sửa tin ở dashboard, web tự làm mới sau ~1 phút

type Fetch = typeof fetch;

function loc(v: unknown): Localized {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    en: typeof o.en === "string" ? o.en : "",
    vi: typeof o.vi === "string" ? o.vi : "",
  };
}

/** Map JSON của Dashboard → NewsPost. Field lạ/thiếu không được làm vỡ trang. */
export function mapNewsPost(raw: unknown): NewsPost | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.slug !== "string" || !r.slug) return null;
  return {
    slug: r.slug,
    category: typeof r.category === "string" ? r.category : "",
    cover: typeof r.cover === "string" && r.cover ? r.cover : null,
    featured: Boolean(r.featured),
    publishedAt: typeof r.publishedAt === "string" ? r.publishedAt : "",
    title: loc(r.title),
    excerpt: loc(r.excerpt),
    body: loc(r.body),
  };
}

export interface NewsList {
  posts: NewsPost[];
  totalPages: number;
}

/**
 * Repository seam (đúng tinh thần `getGames()`): web KHÔNG chạm DB, chỉ đọc API công khai
 * của Dashboard. Dashboard chết → trả rỗng để trang hiện empty-state thay vì 500.
 */
export async function getNews(
  opts: { page?: number; pageSize?: number; featured?: boolean } = {},
  f: Fetch = fetch,
): Promise<NewsList> {
  const q = new URLSearchParams();
  if (opts.page) q.set("page", String(opts.page));
  if (opts.pageSize) q.set("pageSize", String(opts.pageSize));
  if (opts.featured) q.set("featured", "true");
  const qs = q.toString();
  try {
    const res = await f(`${BASE}/api/public/news${qs ? `?${qs}` : ""}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return { posts: [], totalPages: 1 };
    const d = (await res.json()) as { news?: unknown[]; pagination?: { totalPages?: number } };
    const posts = Array.isArray(d?.news)
      ? (d.news.map(mapNewsPost).filter(Boolean) as NewsPost[])
      : [];
    return { posts, totalPages: Number(d?.pagination?.totalPages) || 1 };
  } catch (e) {
    console.warn("[news] getNews failed:", e);
    return { posts: [], totalPages: 1 };
  }
}

export async function getNewsBySlug(slug: string, f: Fetch = fetch): Promise<NewsPost | null> {
  const res = await f(`${BASE}/api/public/news/${encodeURIComponent(slug)}`, {
    next: { revalidate: REVALIDATE },
  });
  // 404 = bài thật sự không tồn tại → trang gọi notFound().
  if (res.status === 404) return null;
  // Bất kỳ lỗi nào khác (API sập, 500, mạng hỏng) KHÔNG được biến thành 404:
  // 404 sẽ bị cache và làm crawler de-index bài viết THẬT. Ném ra để error boundary xử lý.
  if (!res.ok) throw new Error(`news API ${res.status}`);
  return mapNewsPost(await res.json());
}
