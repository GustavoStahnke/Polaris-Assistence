import { googleAccount } from './google/account';
import { googleCalendar } from './google/calendar';
import { gmailIntegration } from './google/gmail';
import { ollama } from './ollama';
import { openLibrary } from './open-library';
import { openMeteo } from './open-meteo';
import { rss } from './rss';
import { soonIntegrations } from './soon';
import type { IntegrationDefinition } from './types';

/**
 * Registro de todas as integrações.
 * Para adicionar um programa novo: crie uma pasta em integrations/ e coloque a definição aqui.
 */
export const INTEGRATIONS: IntegrationDefinition<unknown>[] = [
  openMeteo,
  rss,
  openLibrary,
  googleAccount,
  googleCalendar,
  gmailIntegration,
  ollama,
  ...soonIntegrations,
] as IntegrationDefinition<unknown>[];

export function findIntegration(id: string): IntegrationDefinition<unknown> | undefined {
  return INTEGRATIONS.find((integration) => integration.id === id);
}
