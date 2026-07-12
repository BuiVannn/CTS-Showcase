import { describe, it, expect, vi } from "vitest";
import { mapNewsPost, getNews, getNewsBySlug, parsePage, pinFeatured } from "./news";
import type { NewsPost } from "./types";

// Fixture này là bản chép tay của JSON mà Dashboard trả — nó PHẢI khớp `PublicNews` /
// `toPublicNewsCard` trong `src/lib/public-news.ts` của repo Dashboard. Không có tooling
// nào ràng buộc 2 bên; nếu Dashboard đổi tên field, chỉ sửa ở đây thì test vẫn xanh mà
// contract thật đã vỡ — người đổi tên PHẢI tự nhớ cập nhật cả 2 nơi.
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

  it("publishedAt thiếu → chuỗi rỗng (KHÔNG để lọt undefined ra `new Date()` → Invalid Date)", () => {
    expect(mapNewsPost({ ...raw, publishedAt: undefined })!.publishedAt).toBe("");
  });
});

describe("parsePage", () => {
  // `?page=` là dữ liệu người dùng: có thể thiếu, là rác, số âm, hoặc lặp lại thành mảng.
  it("thiếu / rác / <1 → về trang 1", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-3")).toBe(1);
  });

  it("số hợp lệ → dùng luôn", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage("17")).toBe(17);
  });

  it("?page=3&page=4 → Next đưa vào mảng, lấy phần tử đầu", () => {
    expect(parsePage(["3", "4"])).toBe(3);
  });
});

describe("pinFeatured", () => {
  const p = (slug: string, featured: boolean): NewsPost => ({
    slug, category: "", cover: null, featured, publishedAt: "",
    title: { vi: "", en: "" }, excerpt: { vi: "", en: "" }, body: { vi: "", en: "" },
  });

  it("ghim tin nổi bật lên đầu", () => {
    expect(pinFeatured([p("a", false), p("b", true), p("c", false)]).map((x) => x.slug))
      .toEqual(["b", "a", "c"]);
  });

  it("giữ nguyên thứ tự thời gian API đã sắp, trong TỪNG nhóm (sort ổn định)", () => {
    expect(pinFeatured([p("a", true), p("b", false), p("c", true), p("d", false)]).map((x) => x.slug))
      .toEqual(["a", "c", "b", "d"]);
  });

  it("không làm biến đổi mảng gốc", () => {
    const orig = [p("a", false), p("b", true)];
    pinFeatured(orig);
    expect(orig.map((x) => x.slug)).toEqual(["a", "b"]);
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

  it("404 → null (bài thật sự không tồn tại)", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as unknown as Response);
    expect(await getNewsBySlug("x", f as unknown as typeof fetch)).toBeNull();
  });

  it("500 → ném lỗi (KHÔNG được biến outage thành 404 bị cache)", async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as unknown as Response);
    await expect(getNewsBySlug("x", f as unknown as typeof fetch)).rejects.toThrow();
  });

  it("fetch throw (Dashboard sập/mạng hỏng) → ném lỗi, KHÔNG trả null", async () => {
    const f = vi.fn().mockRejectedValue(new Error("boom"));
    await expect(getNewsBySlug("x", f as unknown as typeof fetch)).rejects.toThrow("boom");
  });
});
