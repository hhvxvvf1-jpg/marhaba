import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { SCHEMA_SQL } from "./schema";

let _db: Database.Database | null = null;
let _dbPath: string | null = null;

export function getDbPath(): string {
  if (process.env.MARHABA_DB_PATH) return process.env.MARHABA_DB_PATH;
  return path.join(process.cwd(), "data", "marhaba.db");
}

export function getDb(): Database.Database {
  const targetPath = getDbPath();
  if (_db && _dbPath === targetPath) {
    return _db;
  }
  if (_db) {
    try {
      _db.close();
    } catch {
      // ignore
    }
  }
  if (targetPath !== ":memory:") {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }
  const db = new Database(targetPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(SCHEMA_SQL);
  _db = db;
  _dbPath = targetPath;
  return db;
}

export function resetDbConnectionForTests() {
  if (_db) {
    try {
      _db.close();
    } catch {
      // ignore
    }
  }
  _db = null;
  _dbPath = null;
}

export function runInTransaction<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  const tx = db.transaction(() => fn(db));
  return tx.immediate();
}
