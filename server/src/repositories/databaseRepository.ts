import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { getTableName } from 'drizzle-orm';
import fs from 'node:fs';
import { DB_PATH } from '../config/paths';
import { db, sqlite } from '../db/client';
import * as schema from '../db/schema';

/**
 * Tabelas que entram na exportação, na ordem certa para importar
 * (as "pais" antes das "filhas", por causa das chaves estrangeiras).
 * O cache fica de fora: é temporário e se refaz sozinho.
 */
const EXPORT_TABLES: SQLiteTable[] = [
  schema.settings,
  schema.integrations,
  schema.integrationLogs,
  schema.books,
  schema.readingSessions,
  schema.bookNotes,
  schema.bookIdeaSummaries,
  schema.readingGoals,
  schema.bookRecommendations,
  schema.exercises,
  schema.workoutRoutines,
  schema.routineExercises,
  schema.workoutSessions,
  schema.workoutSets,
  schema.personalRecords,
  schema.bodyMeasurements,
  schema.tasks,
  schema.notes,
  schema.reminders,
  schema.habits,
  schema.habitLogs,
  schema.newsFeeds,
  schema.savedArticles,
  schema.readArticles,
  schema.emailTriage,
  schema.vipSenders,
  schema.aiConversations,
  schema.aiMessages,
];

/** Cópia segura do banco aberto (API de backup do SQLite). */
export async function backupDatabaseTo(filePath: string): Promise<void> {
  await sqlite.backup(filePath);
}

/** Lê todas as tabelas para exportar em JSON. */
export function readAllTables(): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const table of EXPORT_TABLES) {
    result[getTableName(table)] = db.select().from(table).all() as Record<string, unknown>[];
  }
  return result;
}

/** Substitui todos os dados pelas tabelas recebidas, tudo numa transação (ou tudo ou nada). */
export function replaceAllTables(tables: Record<string, Record<string, unknown>[]>): number {
  let inserted = 0;
  db.transaction((tx) => {
    for (const table of [...EXPORT_TABLES].reverse()) tx.delete(table).run();
    for (const table of EXPORT_TABLES) {
      const rows = tables[getTableName(table)] ?? [];
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        if (chunk.length)
          tx.insert(table)
            .values(chunk as never)
            .run();
      }
      inserted += rows.length;
    }
  });
  return inserted;
}

export function getDatabaseStats(): { sizeBytes: number; sqliteVersion: string; tables: number } {
  const version = sqlite.prepare('SELECT sqlite_version() AS v').get() as { v: string };
  const tables = sqlite
    .prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .get() as { total: number };
  // Soma o arquivo principal e o WAL (registro de alterações ainda não consolidadas).
  const sizeOf = (file: string) => (fs.existsSync(file) ? fs.statSync(file).size : 0);
  const sizeBytes = sizeOf(DB_PATH) + sizeOf(`${DB_PATH}-wal`);
  return { sizeBytes, sqliteVersion: version.v, tables: tables.total };
}
