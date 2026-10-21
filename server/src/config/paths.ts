import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Caminhos do projeto calculados a partir deste arquivo (server/src/config),
// assim funcionam não importa de qual pasta o comando foi executado.
const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(currentDir, '../../..');
export const SERVER_DIR = path.join(ROOT_DIR, 'server');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const BACKUPS_DIR = path.join(ROOT_DIR, 'backups');
export const CLIENT_DIST_DIR = path.join(ROOT_DIR, 'client', 'dist');
export const ENV_PATH = path.join(ROOT_DIR, '.env');
export const ENV_EXAMPLE_PATH = path.join(ROOT_DIR, '.env.example');
export const DB_PATH = path.join(DATA_DIR, 'polaris.db');
