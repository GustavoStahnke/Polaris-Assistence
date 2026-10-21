import { EMAIL_CATEGORIES, type EmailCategory, type TriagedEmail } from '@polaris/shared';
import { saveTriage } from '../repositories/emailRepository';
import { extractJson } from './aiPrompts';
import { askAI, isAiAvailable } from './integrationService';

let running = false;

/**
 * Triagem de e-mail pela IA (em segundo plano). Só classifica os que ainda estão "por regra";
 * o resultado fica salvo, então cada e-mail é analisado uma vez. A correção do usuário sempre vence.
 */
export async function triageWithAI(emails: TriagedEmail[]): Promise<number> {
  const pending = emails.filter((e) => e.triageSource === 'regra').slice(0, 15);
  if (running || pending.length === 0 || !isAiAvailable()) return 0;
  running = true;
  try {
    const list = pending
      .map(
        (e) =>
          `{"id":"${e.id}","de":${JSON.stringify(`${e.fromName} <${e.fromEmail}>`)},"assunto":${JSON.stringify(e.subject)},"previa":${JSON.stringify(e.snippet.slice(0, 160))},"vip":${e.isVip}}`,
      )
      .join(',\n');
    const { content } = await askAI(
      [
        {
          role: 'system',
          content:
            'Você classifica e-mails de uma pessoa em português do Brasil. Categorias: "urgente" (precisa de ação hoje), "responder" (pede resposta, sem pressa), "pode_esperar" (informativo), "ignorar" (promoção, spam, notificação sem valor). Responda SOMENTE com JSON no formato {"items":[{"id":"...","category":"...","reason":"motivo em até 8 palavras"}]}.',
        },
        { role: 'user', content: `E-mails:\n[${list}]` },
      ],
      { json: true, temperature: 0.2 },
    );
    const parsed = extractJson<{ items?: Array<{ id?: string; category?: string; reason?: string }> }>(
      content,
    );
    let saved = 0;
    for (const item of parsed?.items ?? []) {
      if (!item.id || !pending.some((e) => e.id === item.id)) continue;
      if (!EMAIL_CATEGORIES.includes(item.category as EmailCategory)) continue;
      saveTriage(
        item.id,
        item.category as EmailCategory,
        'ia',
        item.reason?.slice(0, 120) ?? 'Classificado pela IA.',
      );
      saved += 1;
    }
    return saved;
  } catch {
    return 0;
  } finally {
    running = false;
  }
}
