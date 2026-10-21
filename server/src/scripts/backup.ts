import fs from 'node:fs';
import path from 'node:path';
import { BACKUPS_DIR, DB_PATH } from '../config/paths';

// Copia o banco para a pasta backups/ com data e hora no nome.
if (!fs.existsSync(DB_PATH)) {
  console.log('ℹ️  Ainda não existe banco para copiar (ele é criado na Etapa 2).');
} else {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(BACKUPS_DIR, `manual-${stamp}.db`);
  fs.copyFileSync(DB_PATH, target);
  console.log(`✅ Backup criado em ${target}`);
}
