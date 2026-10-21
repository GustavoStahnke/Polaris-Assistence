import { createBackup } from '../services/backupService';

// npm run backup — cópia segura do banco para backups/
const backup = await createBackup('manual');
console.log(`✅ Backup criado: backups/${backup.fileName}`);
