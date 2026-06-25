import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface DbGame {
  id: string; slug: string; title: string; author: string;
  cover: string | null; status: string; created_at: string;
  owner_id: string | null; owner_email: string | null;
}

export interface GamesStore {
  listPublished(): DbGame[];
  get(slug: string): DbGame | undefined;
  exists(slug: string): boolean;
  insert(g: DbGame): void;
  remove(slug: string): void;
  listByStatus(status: string): DbGame[];
  listByOwner(ownerId: string): DbGame[];
  countByOwner(ownerId: string, status?: string): number;
  setStatus(slug: string, status: string): void;
}

export function createGamesStore(dbPath: string): GamesStore {
  const db = new Database(dbPath);
  if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");
  db.exec(
    `CREATE TABLE IF NOT EXISTS games (
       id TEXT PRIMARY KEY, slug TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
       author TEXT NOT NULL, cover TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL
     )`,
  );

  // Idempotent migration for columns added after slice 2a.
  const cols = new Set((db.prepare("PRAGMA table_info(games)").all() as { name: string }[]).map((c) => c.name));
  if (!cols.has("owner_id")) db.exec("ALTER TABLE games ADD COLUMN owner_id TEXT");
  if (!cols.has("owner_email")) db.exec("ALTER TABLE games ADD COLUMN owner_email TEXT");

  return {
    listPublished: () =>
      db.prepare("SELECT * FROM games WHERE status = 'published' ORDER BY created_at DESC").all() as DbGame[],
    get: (slug) => db.prepare("SELECT * FROM games WHERE slug = ?").get(slug) as DbGame | undefined,
    exists: (slug) => !!db.prepare("SELECT 1 FROM games WHERE slug = ?").get(slug),
    insert: (g) =>
      void db
        .prepare(
          `INSERT INTO games (id, slug, title, author, cover, status, created_at, owner_id, owner_email)
           VALUES (@id, @slug, @title, @author, @cover, @status, @created_at, @owner_id, @owner_email)`,
        )
        .run(g),
    remove: (slug) => void db.prepare("DELETE FROM games WHERE slug = ?").run(slug),
    listByStatus: (status: string) =>
      db.prepare("SELECT * FROM games WHERE status = ? ORDER BY created_at DESC").all(status) as DbGame[],
    listByOwner: (ownerId: string) =>
      db.prepare("SELECT * FROM games WHERE owner_id = ? ORDER BY created_at DESC").all(ownerId) as DbGame[],
    countByOwner: (ownerId: string, status?: string) =>
      (status
        ? (db.prepare("SELECT COUNT(*) n FROM games WHERE owner_id = ? AND status = ?").get(ownerId, status) as { n: number })
        : (db.prepare("SELECT COUNT(*) n FROM games WHERE owner_id = ?").get(ownerId) as { n: number })).n,
    setStatus: (slug: string, status: string) =>
      void db.prepare("UPDATE games SET status = ? WHERE slug = ?").run(status, slug),
  };
}

let _store: GamesStore | null = null;
export function getGamesStore(): GamesStore {
  if (!_store) {
    const path = process.env.GAMES_DB || "./data/games.db";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    _store = createGamesStore(path);
  }
  return _store;
}
