import { APP_NAME, APP_VERSION, type SystemInfo } from '@polaris/shared';
import { DB_PATH } from '../config/paths';
import { getDatabaseStats } from '../repositories/databaseRepository';
import { listBackups } from './backupService';

export function getSystemInfo(): SystemInfo {
  const stats = getDatabaseStats();
  const backups = listBackups();
  return {
    app: APP_NAME,
    version: APP_VERSION,
    nodeVersion: process.version,
    dbPath: DB_PATH,
    dbSizeBytes: stats.sizeBytes,
    sqliteVersion: stats.sqliteVersion,
    tables: stats.tables,
    lastBackupAt: backups[0]?.createdAt ?? null,
    backupsCount: backups.length,
  };
}
