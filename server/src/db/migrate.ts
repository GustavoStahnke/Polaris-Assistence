import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';
import { SERVER_DIR } from '../config/paths';
import { db, sqlite } from './client';

export const MIGRATIONS_DIR = path.join(SERVER_DIR, 'drizzle');

/** Quantas migrações ainda não foram aplicadas ao banco. */
export function countPendingMigrations(): number {
  const journal = JSON.parse(fs.readFileSync(path.join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8')) as {
    entries: unknown[];
  };
  const hasTable = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'")
    .get();
  const applied = hasTable
    ? (sqlite.prepare('SELECT COUNT(*) AS total FROM __drizzle_migrations').get() as { total: number }).total
    : 0;
  return Math.max(journal.entries.length - applied, 0);
}

/** true se o banco já tem tabelas (ou seja, não é um banco novo). */
function hasUserTables(): boolean {
  const row = sqlite
    .prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .get() as { total: number };
  return row.total > 0;
}

/**
 * Aplica as migrações pendentes. Se o banco já tinha dados, faz um backup ANTES
 * (regra: nunca arriscar os dados do usuário).
 */
export async function runMigrations(
  backup: () => Promise<string>,
): Promise<{ applied: number; backupFile: string | null }> {
  const pending = countPendingMigrations();
  if (pending === 0) return { applied: 0, backupFile: null };
  const backupFile = hasUserTables() ? await backup() : null;
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return { applied: pending, backupFile };
}
