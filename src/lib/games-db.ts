import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface DbGame {
  id: string; slug: string; title: string; author: string;
  cover: string | null; status: string; created_at: string;
}

export interface GamesStore {
  listPublished(): DbGame[];
  get(slug: string): DbGame | undefined;
  exists(slug: string): boolean;
  insert(g: DbGame): void;
  remove(slug: string): void;
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
  return {
    listPublished: () =>
      db.prepare("SELECT * FROM games WHERE status = 'published' ORDER BY created_at DESC").all() as DbGame[],
    get: (slug) => db.prepare("SELECT * FROM games WHERE slug = ?").get(slug) as DbGame | undefined,
    exists: (slug) => !!db.prepare("SELECT 1 FROM games WHERE slug = ?").get(slug),
    insert: (g) =>
      void db
        .prepare(
          `INSERT INTO games (id, slug, title, author, cover, status, created_at)
           VALUES (@id, @slug, @title, @author, @cover, @status, @created_at)`,
        )
        .run(g),
    remove: (slug) => void db.prepare("DELETE FROM games WHERE slug = ?").run(slug),
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
