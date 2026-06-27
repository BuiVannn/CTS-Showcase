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

function str(form: FormData, k: string): string {
  return String(form.get(k) || "").trim();
}

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

  const title = str(form, "title");
  const author = str(form, "author");
  const file = form.get("file");
  const status = str(form, "status") === "draft" ? "draft" : "pending";
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

  const now = new Date().toISOString();
  store.insert({
    id: randomUUID(), slug, title, author,
    cover: str(form, "cover") || null,
    status, created_at: now, owner_id: ownerId, owner_email: u?.email ?? null,
  });
  store.update(slug, {
    tagline: str(form, "tagline") || null,
    description: str(form, "description") || null,
    classification: str(form, "classification") || null,
    project_type: str(form, "projectType") || null,
    release_status: str(form, "releaseStatus") || null,
    genre: str(form, "genre") || null,
    tags: str(form, "tags") || null,
    external_url: str(form, "externalUrl") || null,
    video_url: str(form, "videoUrl") || null,
    updated_at: now,
  });
  return NextResponse.json({ slug, status }, { status: 201 });
}
