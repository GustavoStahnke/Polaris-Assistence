import { runMigrations } from './db/migrate';
import { runSeed } from './db/seed';
import { createBackup, ensureDailyBackup } from './services/backupService';

/** Prepara o banco: migrações (com backup antes), dados iniciais e backup diário. */
export async function prepareDatabase() {
  const migration = await runMigrations(async () => (await createBackup('pre-migracao')).fileName);
  if (migration.applied > 0) {
    console.log(`🗄️  ${migration.applied} migração(ões) aplicada(s).`);
    if (migration.backupFile) console.log(`💾 Backup antes da migração: ${migration.backupFile}`);
  }

  const seeded = runSeed();
  if (seeded.length) console.log(`🌱 Dados iniciais: ${seeded.join(', ')}.`);

  const daily = await ensureDailyBackup();
  if (daily) console.log(`💾 Backup diário criado: ${daily.fileName}`);
}
