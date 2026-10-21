import cron from 'node-cron';
import { ensureDailyBackup } from '../services/backupService';
import { runScheduledSyncs } from '../services/integrationService';

/** Liga as tarefas agendadas do servidor. */
export function startJobs() {
  // A cada minuto: sincroniza as integrações ativas cujo intervalo já passou.
  let running = false;
  cron.schedule('* * * * *', async () => {
    if (running) return;
    running = true;
    try {
      await runScheduledSyncs();
    } catch (error) {
      console.error('❌ Falha no agendador de integrações:', error);
    } finally {
      running = false;
    }
  });

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
