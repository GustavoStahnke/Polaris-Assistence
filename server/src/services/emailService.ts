import {
  EMAIL_CATEGORIES,
  triageUpdateSchema,
  vipSenderInputSchema,
  type EmailCategory,
  type EmailResponse,
  type TriagedEmail,
} from '@polaris/shared';
import { notFound, parseInput } from '../lib/http';
import * as repo from '../repositories/emailRepository';
import { clearCachePrefix } from '../repositories/cacheRepository';
import { classifyEmail } from './emailTriageService';
import { getImportantEmails } from './integrationService';

const ORDER: Record<EmailCategory, number> = { urgente: 0, responder: 1, pode_esperar: 2, ignorar: 3 };

/** E-mails importantes já com a triagem (a correção do usuário sempre vence a regra). */
export async function getEmails(options?: { force?: boolean }): Promise<EmailResponse> {
  const hub = await getImportantEmails(options);
  const messages = hub.data ?? [];
  const saved = repo.getTriages(messages.map((m) => m.id));
  const emails: TriagedEmail[] = messages.map((m) => {
    const stored = saved.get(m.id);
    if (stored)
      return { ...m, category: stored.category, triageSource: stored.source, reason: stored.reason };
    const rule = classifyEmail(m);
    return { ...m, category: rule.category, triageSource: 'regra', reason: rule.reason };
  });
  emails.sort((a, b) => ORDER[a.category] - ORDER[b.category] || b.date.localeCompare(a.date));
  const counts = Object.fromEntries(
    EMAIL_CATEGORIES.map((c) => [c, emails.filter((e) => e.category === c).length]),
  ) as Record<EmailCategory, number>;
  return { state: hub.state, error: hub.error, fetchedAt: hub.fetchedAt, emails, counts };
}

/** O usuário corrige a classificação. */
export function setTriage(messageId: string, input: unknown): void {
  const { category } = parseInput(triageUpdateSchema, input);
  repo.saveTriage(messageId, category, 'usuario', 'Corrigido por você.');
}

export const listVips = () => repo.listVipSenders();

export function addVip(input: unknown) {
  const data = parseInput(vipSenderInputSchema, input);
  clearCachePrefix('gmail:');
  return repo.addVipSender(data.email, data.name ?? null);
}

export function removeVip(id: string) {
  if (!repo.deleteVipSender(id)) throw notFound('Remetente não encontrado.');
  clearCachePrefix('gmail:');
}
