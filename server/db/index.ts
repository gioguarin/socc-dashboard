/**
 * SQLite database connection and initialization.
 * Uses better-sqlite3 for synchronous, fast access.
 * Data is stored alongside JSON files for backward compatibility.
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { runMigrations } from './migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, '..', 'data', 'socc.db');

let db: Database.Database | null = null;

/** Get or create the database connection */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent read performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
    console.log('📦 SQLite database initialized at', DB_PATH);
  }
  return db;
}

/** Close the database connection gracefully */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
