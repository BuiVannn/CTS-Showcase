import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface DownloadsStore {
  increment(slug: string, platform: string): void;
  getCount(slug: string, platform: string): number;
  total(): number;
}

export function createDownloadsStore(dbPath: string): DownloadsStore {
  const db = new Database(dbPath);
  if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");
  db.exec(
    `CREATE TABLE IF NOT EXISTS downloads (
       slug TEXT NOT NULL, platform TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0,
       PRIMARY KEY (slug, platform)
     )`,
  );
  return {
    increment: (slug, platform) =>
      void db.prepare(
        `INSERT INTO downloads (slug, platform, count) VALUES (?, ?, 1)
         ON CONFLICT(slug, platform) DO UPDATE SET count = count + 1`,
      ).run(slug, platform),
    getCount: (slug, platform) =>
      (db.prepare("SELECT count FROM downloads WHERE slug = ? AND platform = ?").get(slug, platform) as { count: number } | undefined)?.count ?? 0,
    total: () =>
      (db.prepare("SELECT COALESCE(SUM(count), 0) AS n FROM downloads").get() as { n: number }).n,
  };
}

let _store: DownloadsStore | null = null;
export function getDownloadsStore(): DownloadsStore {
  if (!_store) {
    const path = process.env.DOWNLOADS_DB || "./data/downloads.db";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    _store = createDownloadsStore(path);
  }
  return _store;
}
