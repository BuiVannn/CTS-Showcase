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

const VIEWER_STYLE = `<style id="cts-viewer-fit">
html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#231F20;}
#unity-container.unity-desktop{left:0;top:0;transform:none;width:100%;height:100%;}
#unity-canvas{width:100%!important;height:100%!important;display:block;}
#unity-footer{display:none!important;}
canvas{max-width:100%;}
</style>`;

/**
 * Inject a stylesheet so the game canvas fills the embedding iframe instead of
 * the build's fixed desktop size (which overflows the frame → scrollbars).
 * Idempotent (keyed on the style id). Unity-targeted selectors are inert for
 * other engines; the html/body + canvas rules are a safe generic baseline.
 */
export function injectViewerCss(html: string): string {
  if (html.includes('id="cts-viewer-fit"')) return html;
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${VIEWER_STYLE}</head>`);
  if (/<body[^>]*>/i.test(html)) return html.replace(/(<body[^>]*>)/i, `$1${VIEWER_STYLE}`);
  return VIEWER_STYLE + html;
}

/** OS/archive junk that should never be served. */
function isJunkEntry(entryName: string): boolean {
  if (entryName.startsWith("__MACOSX/")) return true;
  const base = entryName.split("/").pop() || "";
  return base === ".DS_Store" || base === "Thumbs.db";
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
export function safeExtractZip(
  buffer: Buffer,
  destDir: string,
  limits?: { maxTotalBytes: number; maxFiles: number; maxFileBytes: number },
): { ok: boolean; error?: string } {
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return { ok: false, error: "invalid-zip" };
  }
  const entries = zip.getEntries();
  const indexes = entries.filter(
    (e) =>
      !e.isDirectory &&
      !isJunkEntry(e.entryName) &&
      e.entryName.split("/").pop()?.toLowerCase() === "index.html",
  );
  if (indexes.length === 0) return { ok: false, error: "no-index" };
  indexes.sort((a, b) => a.entryName.split("/").length - b.entryName.split("/").length);
  const prefix = indexes[0].entryName.replace(/index\.html$/i, ""); // "MyGame/" or ""

  if (limits) {
    const files = entries.filter((e) => !e.isDirectory && !isJunkEntry(e.entryName));
    if (files.length > limits.maxFiles) return { ok: false, error: "too-big-uncompressed" };
    let total = 0;
    for (const e of files) {
      const size = e.header.size; // uncompressed size
      if (size > limits.maxFileBytes) return { ok: false, error: "too-big-uncompressed" };
      total += size;
      if (total > limits.maxTotalBytes) return { ok: false, error: "too-big-uncompressed" };
    }
  }

  for (const e of entries) {
    if (e.isDirectory || isJunkEntry(e.entryName)) continue;
    let name = e.entryName;
    if (prefix) {
      if (!name.startsWith(prefix)) continue; // outside the build root
      name = name.slice(prefix.length);
    }
    if (!name) continue;
    const target = resolveInside(destDir, name);
    if (!target) return { ok: false, error: "unsafe-path" };
    mkdirSync(dirname(target), { recursive: true });
    if (name.toLowerCase() === "index.html") {
      writeFileSync(target, injectViewerCss(e.getData().toString("utf8")), "utf8");
    } else {
      writeFileSync(target, e.getData());
    }
  }
  return { ok: true };
}
