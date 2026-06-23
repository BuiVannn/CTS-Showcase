import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const DAILY_LIMIT = Math.max(
  1,
  parseInt(process.env.PTALK_CHAT_DAILY_LIMIT || "8", 10) || 8,
);

/** YYYY-MM-DD for Asia/Ho_Chi_Minh (UTC+7, no DST). */
export function todayKey(date: Date): string {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return vn.toISOString().slice(0, 10);
}

export function remaining(count: number): number {
  return Math.max(0, DAILY_LIMIT - count);
}

export interface UsageStore {
  getUsage(userId: string, day: string): number;
  incrementUsage(userId: string, day: string): number;
}

export function createUsageStore(dbPath: string): UsageStore {
  const db = new Database(dbPath);
  if (dbPath !== ":memory:") db.pragma("journal_mode = WAL");
  db.exec(
    `CREATE TABLE IF NOT EXISTS usage (
       user_id TEXT NOT NULL,
       day     TEXT NOT NULL,
       count   INTEGER NOT NULL DEFAULT 0,
       PRIMARY KEY (user_id, day)
     )`,
  );
  const getStmt = db.prepare("SELECT count FROM usage WHERE user_id = ? AND day = ?");
  const incStmt = db.prepare(
    `INSERT INTO usage (user_id, day, count) VALUES (?, ?, 1)
     ON CONFLICT(user_id, day) DO UPDATE SET count = count + 1`,
  );
  return {
    getUsage(userId, day) {
      const row = getStmt.get(userId, day) as { count: number } | undefined;
      return row?.count ?? 0;
    },
    incrementUsage(userId, day) {
      incStmt.run(userId, day);
      const row = getStmt.get(userId, day) as { count: number } | undefined;
      return row?.count ?? 0;
    },
  };
}

let _store: UsageStore | null = null;
/** Lazily-opened singleton store from PTALK_USAGE_DB (creates the dir). */
export function getUsageStore(): UsageStore {
  if (!_store) {
    const path = process.env.PTALK_USAGE_DB || "./data/ptalk-usage.db";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    _store = createUsageStore(path);
  }
  return _store;
}
