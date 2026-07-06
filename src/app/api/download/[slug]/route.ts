import { NextResponse } from "next/server";
import { getProduct } from "@/content/products";
import { resolveDownload } from "@/lib/app-download";
import { getDownloadsStore } from "@/lib/downloads-db";
import type { Platform } from "@/content/types";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = new URL(req.url).searchParams.get("platform");
  const back = () => NextResponse.redirect(new URL(`/products/${slug}`, req.url), 302);

  if (platform !== "android" && platform !== "ios") return back();
  const res = resolveDownload(getProduct(slug), platform as Platform);
  if (!res.ok) return back();

  try { getDownloadsStore().increment(slug, platform); } catch { /* đếm lỗi không chặn tải */ }

  const dest = res.target.startsWith("http") ? res.target : new URL(res.target, req.url).toString();
  return NextResponse.redirect(dest, 302);
}
