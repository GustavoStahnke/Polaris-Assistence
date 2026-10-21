import { z } from 'zod';

export const backupKindSchema = z.enum(['manual', 'auto', 'pre-migracao', 'pre-importacao']);
export type BackupKind = z.infer<typeof backupKindSchema>;

export interface BackupInfo {
  fileName: string;
  kind: BackupKind | 'outro';
  sizeBytes: number;
  createdAt: string;
}

export interface SystemInfo {
  app: string;
  version: string;
  nodeVersion: string;
  dbPath: string;
  dbSizeBytes: number;
  sqliteVersion: string;
  tables: number;
  lastBackupAt: string | null;
  backupsCount: number;
}

/** Formato do arquivo de exportação completa em JSON. */
export const exportFileSchema = z.object({
  app: z.string(),
  formatVersion: z.literal(1),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});
export type ExportFile = z.infer<typeof exportFileSchema>;
