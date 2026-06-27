import { NextResponse } from "next/server";
import { rmSync } from "node:fs";
import { auth } from "@/auth";
import { getGamesStore, type DbGame } from "@/lib/games-db";
import { safeExtractZip, resolveInside } from "@/lib/game-upload";
import { nextStatusOnEdit, type EditIntent } from "@/lib/game-status";

export const runtime = "nodejs";

const STORAGE = process.env.GAMES_STORAGE_DIR || "/home/namnx/ctslab-games";
const MAX_MB = parseInt(process.env.GAMES_MAX_UPLOAD_MB || "100", 10) || 100;
const LIMITS = {
  maxTotalBytes: (parseInt(process.env.GAMES_MAX_UNCOMPRESSED_MB || "300", 10) || 300) * 1024 * 1024,
  maxFiles: parseInt(process.env.GAMES_MAX_FILES || "2000", 10) || 2000,
  maxFileBytes: (parseInt(process.env.GAMES_MAX_FILE_MB || "100", 10) || 100) * 1024 * 1024,
};

async function ownerOrAdmin(slug: string) {
  const session = await auth();
  const u = session?.user as { id?: string; email?: string | null } | undefined;
  const uid = u?.id || u?.email || null;
  if (!uid) return { error: "auth" as const };
  const game = getGamesStore().get(slug);
  if (!game) return { error: "notfound" as const };
  const isAdmin = (session as { isAdmin?: boolean }).isAdmin === true;
  if (game.owner_id !== uid && !isAdmin) return { error: "forbidden" as const };
  return { game };
}

function str(form: FormData, k: string): string {
  return String(form.get(k) || "").trim();
}

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gate = await ownerOrAdmin(slug);
  if ("error" in gate) {
    const code = gate.error === "auth" ? 401 : gate.error === "notfound" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status: code });
  }
  const game = gate.game;

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "bad" }, { status: 400 }); }

  const file = form.get("file");
  const hasNewBuild = file instanceof File && file.size > 0;
  if (hasNewBuild && (file as File).size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }
  if (hasNewBuild) {
    const dest = resolveInside(STORAGE, slug);
    if (!dest || dest === resolveInside(STORAGE, "")) return NextResponse.json({ error: "bad" }, { status: 400 });
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
    const res = safeExtractZip(Buffer.from(await (file as File).arrayBuffer()), dest, LIMITS);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 400 });
  }

  const submitted = (["draft", "pending", "keep"].includes(str(form, "status")) ? str(form, "status") : "keep") as EditIntent;
  const status = nextStatusOnEdit(game.status, submitted, hasNewBuild);
  const title = str(form, "title") || game.title;

  const patch: Partial<DbGame> = {
    title, author: str(form, "author") || game.author,
    cover: str(form, "cover") || null,
    tagline: str(form, "tagline") || null,
    description: str(form, "description") || null,
    classification: str(form, "classification") || null,
    project_type: str(form, "projectType") || null,
    release_status: str(form, "releaseStatus") || null,
    genre: str(form, "genre") || null,
    tags: str(form, "tags") || null,
    external_url: str(form, "externalUrl") || null,
    video_url: str(form, "videoUrl") || null,
    status,
    updated_at: new Date().toISOString(),
  };
  getGamesStore().update(slug, patch);
  return NextResponse.json({ slug, status });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gate = await ownerOrAdmin(slug);
  if ("error" in gate) {
    const code = gate.error === "auth" ? 401 : gate.error === "notfound" ? 404 : 403;
    return NextResponse.json({ error: gate.error }, { status: code });
  }
  const dest = resolveInside(STORAGE, slug);
  if (dest && dest !== resolveInside(STORAGE, "")) {
    try { rmSync(dest, { recursive: true, force: true }); } catch {}
  }
  getGamesStore().remove(slug);
  return NextResponse.json({ ok: true });
}
