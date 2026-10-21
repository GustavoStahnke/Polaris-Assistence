import { runMigrations } from '../db/migrate';
import { runSeed } from '../db/seed';
import { createBackup } from '../services/backupService';

// npm run db:migrate — aplica migrações pendentes (com backup antes) e os dados iniciais.
const result = await runMigrations(async () => (await createBackup('pre-migracao')).fileName);
if (result.applied === 0) console.log('✅ O banco já está atualizado.');
else console.log(`✅ ${result.applied} migração(ões) aplicada(s).`);
if (result.backupFile) console.log(`💾 Backup feito antes: ${result.backupFile}`);
const seeded = runSeed();
if (seeded.length) console.log(`🌱 Dados iniciais: ${seeded.join(', ')}.`);
