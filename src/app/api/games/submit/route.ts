import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { auth } from "@/auth";
import { getGamesStore } from "@/lib/games-db";
import { slugify, safeExtractZip, resolveInside } from "@/lib/game-upload";

export const runtime = "nodejs";

const STORAGE = process.env.GAMES_STORAGE_DIR || "/home/namnx/ctslab-games";
const MAX_MB = parseInt(process.env.GAMES_MAX_UPLOAD_MB || "100", 10) || 100;
const LIMITS = {
  maxTotalBytes: (parseInt(process.env.GAMES_MAX_UNCOMPRESSED_MB || "300", 10) || 300) * 1024 * 1024,
  maxFiles: parseInt(process.env.GAMES_MAX_FILES || "2000", 10) || 2000,
  maxFileBytes: (parseInt(process.env.GAMES_MAX_FILE_MB || "100", 10) || 100) * 1024 * 1024,
};
const MAX_PENDING = parseInt(process.env.GAMES_MAX_PENDING_PER_USER || "3", 10) || 3;
const MAX_TOTAL = parseInt(process.env.GAMES_MAX_TOTAL_PER_USER || "10", 10) || 10;

export async function POST(req: Request) {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const ownerId = u?.id || u?.email || null;
  if (!ownerId) return NextResponse.json({ error: "auth" }, { status: 401 });

  const store = getGamesStore();
  if (store.countByOwner(ownerId, "pending") >= MAX_PENDING || store.countByOwner(ownerId) >= MAX_TOTAL) {
    return NextResponse.json({ error: "quota" }, { status: 429 });
  }

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }
  const title = String(form.get("title") || "").trim();
  const author = String(form.get("author") || "").trim();
  const file = form.get("file");
  if (!title || !author || !(file instanceof File)) return NextResponse.json({ error: "bad" }, { status: 400 });
  if (file.size > MAX_MB * 1024 * 1024) return NextResponse.json({ error: "too-large" }, { status: 413 });

  const base = slugify(title);
  let slug = base;
  for (let i = 2; store.exists(slug); i++) slug = `${base}-${i}`;

  const dest = resolveInside(STORAGE, slug);
  if (!dest || dest === resolveInside(STORAGE, "")) return NextResponse.json({ error: "bad" }, { status: 400 });

  const res = safeExtractZip(Buffer.from(await file.arrayBuffer()), dest, LIMITS);
  if (!res.ok) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
    return NextResponse.json({ error: res.error }, { status: 400 });
  }

  store.insert({
    id: randomUUID(), slug, title, author, cover: null,
    status: "pending", created_at: new Date().toISOString(),
    owner_id: ownerId, owner_email: u?.email ?? null,
  });
  return NextResponse.json({ slug, status: "pending" }, { status: 202 });
}
