import cron from 'node-cron';
import { ensureDailyBackup } from '../services/backupService';

/** Liga as tarefas agendadas do servidor. */
export function startJobs() {
  // De hora em hora: garante o backup diário (cobre o caso de o PC ficar ligado de um dia para o outro).
  cron.schedule('0 * * * *', async () => {
    try {
      const backup = await ensureDailyBackup();
      if (backup) console.log(`💾 Backup diário criado: ${backup.fileName}`);
    } catch (error) {
      console.error('❌ Falha no backup diário:', error);
    }
  });
}
