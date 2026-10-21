import {
  APP_NAME,
  exportFileSchema,
  fileStamp,
  toDateKey,
  type BackupInfo,
  type BackupKind,
  type ExportFile,
} from '@polaris/shared';
import fs from 'node:fs';
import path from 'node:path';
import { BACKUPS_DIR } from '../config/paths';
import { badRequest, notFound } from '../lib/http';
import { backupDatabaseTo, readAllTables, replaceAllTables } from '../repositories/databaseRepository';

/** Quantos backups automáticos diários manter. */
export const KEEP_AUTO_BACKUPS = 14;

const FILE_PATTERN = /^(manual|auto|pre-migracao|pre-importacao)-(\d{4}-\d{2}-\d{2})_\d{2}-\d{2}-\d{2}\.db$/;

/** Cria uma cópia do banco em backups/ (ex.: manual-2026-10-21_14-05-09.db). */
export async function createBackup(kind: BackupKind, now: Date = new Date()): Promise<BackupInfo> {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const fileName = `${kind}-${fileStamp(now)}.db`;
  const filePath = path.join(BACKUPS_DIR, fileName);
  await backupDatabaseTo(filePath);
  return { fileName, kind, sizeBytes: fs.statSync(filePath).size, createdAt: now.toISOString() };
}

/** Lista os backups, do mais novo para o mais antigo. */
export function listBackups(): BackupInfo[] {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  return fs
    .readdirSync(BACKUPS_DIR)
    .filter((name) => name.endsWith('.db'))
    .map((fileName): BackupInfo => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, fileName));
      const kind = (FILE_PATTERN.exec(fileName)?.[1] as BackupKind | undefined) ?? 'outro';
      return { fileName, kind, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Apaga os backups automáticos mais antigos, mantendo os últimos `keep`. */
export function pruneAutoBackups(keep = KEEP_AUTO_BACKUPS): number {
  const autos = listBackups().filter((b) => b.kind === 'auto');
  const toDelete = autos.slice(keep);
  for (const backup of toDelete) fs.rmSync(path.join(BACKUPS_DIR, backup.fileName));
  return toDelete.length;
}

/** Backup automático diário: cria um se ainda não existe o de hoje. */
export async function ensureDailyBackup(now: Date = new Date()): Promise<BackupInfo | null> {
  const today = toDateKey(now);
  const hasToday = listBackups().some((b) => b.kind === 'auto' && b.fileName.startsWith(`auto-${today}`));
  if (hasToday) return null;
  const backup = await createBackup('auto', now);
  pruneAutoBackups();
  return backup;
}

/** Caminho seguro de um arquivo de backup (impede nomes como "../../.env"). */
export function getBackupPath(fileName: string): string {
  if (!/^[\w.-]+\.db$/.test(fileName)) throw badRequest('Nome de arquivo inválido.');
  const filePath = path.join(BACKUPS_DIR, fileName);
  if (!fs.existsSync(filePath)) throw notFound('Backup não encontrado.');
  return filePath;
}

/** Exporta todos os dados em um único JSON. */
export function exportData(now: Date = new Date()): ExportFile {
  return { app: APP_NAME, formatVersion: 1, exportedAt: now.toISOString(), tables: readAllTables() };
}

/** Importa um JSON exportado. Faz um backup antes, por segurança. */
export async function importData(input: unknown): Promise<{ inserted: number; backupFile: string }> {
  const parsed = exportFileSchema.safeParse(input);
  if (!parsed.success) throw badRequest('Arquivo inválido: não parece uma exportação do Polaris.');
  const backup = await createBackup('pre-importacao');
  try {
    const inserted = replaceAllTables(parsed.data.tables);
    return { inserted, backupFile: backup.fileName };
  } catch (error) {
    console.error('❌ Falha ao importar:', error);
    throw badRequest(
      `Não foi possível importar (nada foi alterado). Um backup foi salvo em ${backup.fileName}.`,
    );
  }
}
