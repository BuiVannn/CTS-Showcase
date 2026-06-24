import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import { slugify, resolveInside, safeExtractZip } from "./game-upload";

describe("slugify", () => {
  it("strips Vietnamese diacritics to ascii dashes", () => {
    expect(slugify("Trò Chơi Đố Vui!")).toBe("tro-choi-do-vui");
  });
  it("falls back to 'game' for empty", () => {
    expect(slugify("  ***  ")).toBe("game");
  });
});

describe("resolveInside (path-traversal guard)", () => {
  it("allows paths inside destDir", () => {
    expect(resolveInside("/games/x", "Build/a.data")).toBe("/games/x/Build/a.data");
  });
  it("rejects traversal and absolute paths", () => {
    expect(resolveInside("/games/x", "../evil.txt")).toBeNull();
    expect(resolveInside("/games/x", "/etc/passwd")).toBeNull();
  });
});

/**
 * Build a minimal but valid ZIP buffer with arbitrary entry names (including
 * path-traversal names like "../evil.txt" that adm-zip silently normalises
 * when _writing_ via addFile, but preserves when _reading_ a raw buffer).
 */
function buildRawZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  // Minimal CRC-32 implementation (no dependencies).
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    table[i] = c;
  }
  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }

  const localParts: Buffer[] = [];
  const offsets: number[] = [];
  let localOffset = 0;

  for (const { name, data } of files) {
    const fn = Buffer.from(name);
    const lh = Buffer.alloc(30 + fn.length);
    lh.writeUInt32LE(0x04034b50, 0); // local file header sig
    lh.writeUInt16LE(20, 4);         // version needed
    lh.writeUInt16LE(0, 6);          // flags
    lh.writeUInt16LE(0, 8);          // compression: STORED
    lh.writeUInt16LE(0, 10);         // mod time
    lh.writeUInt16LE(0, 12);         // mod date
    lh.writeUInt32LE(crc32(data), 14);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(fn.length, 26);
    lh.writeUInt16LE(0, 28);         // extra length
    fn.copy(lh, 30);
    offsets.push(localOffset);
    localParts.push(lh, data);
    localOffset += lh.length + data.length;
  }

  const cdParts: Buffer[] = [];
  for (let i = 0; i < files.length; i++) {
    const { name, data } = files[i];
    const fn = Buffer.from(name);
    const cd = Buffer.alloc(46 + fn.length);
    cd.writeUInt32LE(0x02014b50, 0); // central dir sig
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(crc32(data), 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(fn.length, 28);
    cd.writeUInt16LE(0, 30); // extra
    cd.writeUInt16LE(0, 32); // comment
    cd.writeUInt16LE(0, 34); // disk num
    cd.writeUInt16LE(0, 36); // int attr
    cd.writeUInt32LE(0, 38); // ext attr
    cd.writeUInt32LE(offsets[i], 42);
    fn.copy(cd, 46);
    cdParts.push(cd);
  }

  const cdBuf = Buffer.concat(cdParts);
  const eoc = Buffer.alloc(22);
  eoc.writeUInt32LE(0x06054b50, 0); // end of central dir sig
  eoc.writeUInt16LE(0, 4);
  eoc.writeUInt16LE(0, 6);
  eoc.writeUInt16LE(files.length, 8);
  eoc.writeUInt16LE(files.length, 10);
  eoc.writeUInt32LE(cdBuf.length, 12);
  eoc.writeUInt32LE(localOffset, 16);
  eoc.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, cdBuf, eoc]);
}

describe("safeExtractZip (end-to-end extraction)", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs) {
      try { rmSync(d, { recursive: true, force: true }); } catch {}
    }
    dirs.length = 0;
  });

  function makeTmpDir(): string {
    const d = mkdtempSync(join(tmpdir(), `game-upload-test-${randomUUID()}-`));
    dirs.push(d);
    return d;
  }

  it("extracts a clean zip (index.html only) and returns {ok:true}", () => {
    const zip = new AdmZip();
    zip.addFile("index.html", Buffer.from("<html><body>game</body></html>"));
    const dest = makeTmpDir();
    const result = safeExtractZip(zip.toBuffer(), dest);
    expect(result).toEqual({ ok: true });
    expect(existsSync(join(dest, "index.html"))).toBe(true);
  });

  it("rejects a zip with a path-traversal entry (../evil.txt) — no file written outside dest", () => {
    // adm-zip normalises "../evil.txt" to "evil.txt" when writing via addFile(),
    // so we craft a raw ZIP buffer that preserves the traversal path verbatim.
    // safeExtractZip must call resolveInside() on each entry name; when that
    // returns null (traversal detected) it must abort with {ok:false, error:"unsafe-path"}.
    const dest = makeTmpDir();
    const rawZip = buildRawZip([
      { name: "index.html", data: Buffer.from("<html></html>") },
      { name: "../evil.txt", data: Buffer.from("pwned") },
    ]);
    const result = safeExtractZip(rawZip, dest);
    expect(result).toEqual({ ok: false, error: "unsafe-path" });
    // The evil file must not have been written outside the destination dir.
    expect(existsSync(join(dest, "..", "evil.txt"))).toBe(false);
  });
});
