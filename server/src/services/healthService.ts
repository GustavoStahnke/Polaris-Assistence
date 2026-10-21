import { APP_NAME, APP_VERSION, type HealthResponse } from '@polaris/shared';

/** Monta a resposta de saúde do sistema. Função pura: recebe o horário de fora. */
export function getHealth(now: Date = new Date()): HealthResponse {
  return {
    status: 'ok',
    app: APP_NAME,
    version: APP_VERSION,
    time: now.toISOString(),
  };
}
