import type { Localized, NewsPost } from "./types";

export type { NewsPost };

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
  try {
    const res = await f(`${BASE}/api/public/news/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE },
    });
    if (!res.ok) return null;
    return mapNewsPost(await res.json());
  } catch (e) {
    console.warn("[news] getNewsBySlug failed:", e);
    return null;
  }
}
