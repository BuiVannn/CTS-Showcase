import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import { slugify, safeExtractZip } from "@/lib/game-upload";

export const runtime = "nodejs";

const STORAGE = process.env.GAMES_STORAGE_DIR || "/home/namnx/ctslab-games";
const MAX_MB = parseInt(process.env.GAMES_MAX_UPLOAD_MB || "100", 10) || 100;

async function requireAdmin() {
  const session = await auth();
  return session?.user && (session as { isAdmin?: boolean }).isAdmin ? session : null;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  const file = form.get("file");
  const rawSlug = String(form.get("slug") || "").trim();
  if (!title || !author || !(file instanceof File)) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const store = getGamesStore();
  const base = slugify(rawSlug || title);
  let slug = base;
  for (let i = 2; store.exists(slug); i++) slug = `${base}-${i}`;

  const dest = resolve(STORAGE, slug);
  if (!dest.startsWith(resolve(STORAGE))) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = safeExtractZip(buffer, dest);
  if (!res.ok) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  store.insert({
    id: randomUUID(), slug, title, author, cover: null,
    status: "published", created_at: new Date().toISOString(),
  });
  return NextResponse.json({ slug }, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "bad" }, { status: 400 });
  const dest = resolve(STORAGE, slug);
  if (dest.startsWith(resolve(STORAGE)) && dest !== resolve(STORAGE)) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
  }
  getGamesStore().remove(slug);
  return NextResponse.json({ ok: true });
}
