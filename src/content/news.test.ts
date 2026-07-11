import { describe, it, expect, vi } from "vitest";
import { mapNewsPost, getNews, getNewsBySlug } from "./news";

const raw = {
  slug: "robot-clover", category: "san-pham", cover: "https://ctslab.net/a.png",
  featured: true, publishedAt: "2026-07-01T03:00:00.000Z",
  title: { vi: "Robot", en: "Robot EN" },
  excerpt: { vi: "Tóm tắt", en: "Summary" },
  body: { vi: "<p>Nội dung</p>", en: "<p>Body</p>" },
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data }) as unknown as Response;

describe("mapNewsPost", () => {
  it("map đủ field", () => {
    const p = mapNewsPost(raw)!;
    expect(p.slug).toBe("robot-clover");
    expect(p.title).toEqual({ vi: "Robot", en: "Robot EN" });
    expect(p.featured).toBe(true);
  });

  it("thiếu slug → null", () => {
    expect(mapNewsPost({ ...raw, slug: "" })).toBeNull();
    expect(mapNewsPost(null)).toBeNull();
  });

  it("thiếu bản dịch → chuỗi rỗng, không vỡ", () => {
    const p = mapNewsPost({ ...raw, excerpt: undefined })!;
    expect(p.excerpt).toEqual({ vi: "", en: "" });
  });
});

describe("getNews", () => {
  it("trả danh sách khi API OK", async () => {
    const f = vi.fn().mockResolvedValue(ok({ news: [raw], pagination: { totalPages: 3 } }));
    const r = await getNews({ page: 2 }, f as unknown as typeof fetch);
    expect(r.posts).toHaveLength(1);
    expect(r.totalPages).toBe(3);
    expect(String(f.mock.calls[0][0])).toContain("/api/public/news?page=2");
  });

  it("API trả lỗi → rỗng (trang hiện empty-state, KHÔNG vỡ)", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as unknown as Response);
    expect(await getNews({}, f as unknown as typeof fetch)).toEqual({ posts: [], totalPages: 1 });
  });

  it("API CHẾT (fetch throw) → rỗng, không ném lỗi", async () => {
    const f = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    expect(await getNews({}, f as unknown as typeof fetch)).toEqual({ posts: [], totalPages: 1 });
  });
});

describe("getNewsBySlug", () => {
  it("OK → bài viết", async () => {
    const f = vi.fn().mockResolvedValue(ok(raw));
    expect((await getNewsBySlug("robot-clover", f as unknown as typeof fetch))?.slug).toBe("robot-clover");
  });

  it("404 → null", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as unknown as Response);
    expect(await getNewsBySlug("x", f as unknown as typeof fetch)).toBeNull();
  });

  it("fetch throw → null", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom"));
    expect(await getNewsBySlug("x", f as unknown as typeof fetch)).toBeNull();
  });
});
