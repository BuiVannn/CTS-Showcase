import AdmZip from "adm-zip";
import { resolve, sep, dirname } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

/** ASCII slug from a (possibly Vietnamese) title. */
export function slugify(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "game";
}

/** Resolve `name` under `destDir`; return null if it escapes (path traversal / absolute). */
export function resolveInside(destDir: string, name: string): string | null {
  const root = resolve(destDir);
  const target = resolve(root, name);
  if (target === root || target.startsWith(root + sep)) return target;
  return null;
}

/**
 * Extract a WebGL build ZIP into destDir. Locates the directory containing
 * index.html (flattening a single wrapper folder) and writes its contents,
 * rejecting any entry that escapes destDir.
 */
export function safeExtractZip(buffer: Buffer, destDir: string): { ok: boolean; error?: string } {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return { ok: false, error: "invalid-zip" };
  }
  const entries = zip.getEntries();
  const indexes = entries.filter(
    (e) => !e.isDirectory && e.entryName.split("/").pop()?.toLowerCase() === "index.html",
  );
  if (indexes.length === 0) return { ok: false, error: "no-index" };
  indexes.sort((a, b) => a.entryName.split("/").length - b.entryName.split("/").length);
  const prefix = indexes[0].entryName.replace(/index\.html$/i, ""); // "MyGame/" or ""

  for (const e of entries) {
    if (e.isDirectory) continue;
    let name = e.entryName;
    if (prefix) {
      if (!name.startsWith(prefix)) continue; // outside the build root
      name = name.slice(prefix.length);
    }
    if (!name) continue;
    const target = resolveInside(destDir, name);
    if (!target) return { ok: false, error: "unsafe-path" };
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, e.getData());
  }
  return { ok: true };
}
