import { DEFAULT_SERVER_PORT } from '@polaris/shared';
import { ensurePolarisSecret } from '../security/secret';
import { ENV_EXAMPLE_PATH, ENV_PATH } from './paths';

export interface ServerEnv {
  port: number;
  host: string;
  isProduction: boolean;
}

/**
 * Prepara o ambiente: cria o .env (se preciso), gera o POLARIS_SECRET no primeiro start
 * e carrega as variáveis. Deve ser chamado antes de qualquer outra coisa.
 */
export function loadEnvironment(): ServerEnv {
  const createdSecret = ensurePolarisSecret(ENV_PATH, ENV_EXAMPLE_PATH);
  process.loadEnvFile(ENV_PATH);

  if (createdSecret) {
    console.log('🔑 Chave POLARIS_SECRET gerada e salva no .env (guarde este arquivo com cuidado).');
  }

  const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
  if (isProduction) process.env.NODE_ENV = 'production';

  return {
    port: Number(process.env.PORT) || DEFAULT_SERVER_PORT,
    host: process.env.HOST || '127.0.0.1',
    isProduction,
  };
}
