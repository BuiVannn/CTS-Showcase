import { NextResponse } from "next/server";
import { getProduct } from "@/content/products";
import { isPlatform, resolveDownload } from "@/lib/app-download";
import { getDownloadsStore } from "@/lib/downloads-db";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = new URL(req.url).searchParams.get("platform");
  const back = () => NextResponse.redirect(new URL(`/products/${slug}`, req.url), 302);

  if (!isPlatform(platform)) return back();
  const res = resolveDownload(getProduct(slug), platform);
  if (!res.ok) return back();

  try { getDownloadsStore().increment(slug, platform); } catch { /* đếm lỗi không chặn tải */ }

  // res.target is either an absolute store URL ("https://…") or a root-relative
  // path ("/downloads/<slug>.apk"). Emit it verbatim as the Location header — a
  // relative Location is resolved by the browser against the real request origin
  // (ctslab.net). Do NOT absolutize with req.url: behind the CF tunnel the host is
  // localhost:3001, which would send users to a dead URL.
  return new NextResponse(null, { status: 302, headers: { Location: res.target } });
}
