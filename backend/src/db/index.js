import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "./migrate.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('better-sqlite3').Database | null} */
let db = null;

/**
 * @param {string} databasePath
 * @returns {import('better-sqlite3').Database}
 */
export function initDb(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });
  db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);

  migrate(db);

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error("Database not initialized — call initDb() before handling requests");
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
