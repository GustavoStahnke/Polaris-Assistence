import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'node:fs';
import { DATA_DIR, DB_PATH } from '../config/paths';
import * as schema from './schema';

// Conexão única com o SQLite (data/polaris.db). Só db/ e repositories/ usam isto.
fs.mkdirSync(DATA_DIR, { recursive: true });

export const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });
export type Db = typeof db;
