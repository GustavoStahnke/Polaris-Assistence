import type { EmailCategory, EmailMessage } from '@polaris/shared';

// Triagem por regras simples (sem IA). Funções puras: fáceis de entender e de testar.

const URGENT_WORDS = [
  'urgente',
  'urgência',
  'urgencia',
  'imediato',
  'imediatamente',
  'hoje',
  'prazo',
  'vence',
  'vencimento',
  'atrasad',
  'bloquead',
  'suspens',
  'alerta de segurança',
  'falha',
  'asap',
  'urgent',
];
const NEWSLETTER_SENDERS = [
  'noreply',
  'no-reply',
  'newsletter',
  'news@',
  'marketing',
  'promo',
  'naoresponda',
  'nao-responda',
];
const REPLY_HINTS = [
  '?',
  're:',
  'pergunta',
  'dúvida',
  'duvida',
  'pode me',
  'consegue',
  'confirma',
  'aguardo',
  'retorno',
  'convite',
  'reunião',
  'reuniao',
];

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function classifyEmail(email: EmailMessage): { category: EmailCategory; reason: string } {
  const subject = normalize(email.subject);
  const from = normalize(`${email.fromEmail} ${email.fromName}`);
  const urgent = URGENT_WORDS.find((w) => subject.includes(normalize(w)));

  if (urgent) return { category: 'urgente', reason: `Assunto com "${urgent}".` };
  if (email.isVip) return { category: 'responder', reason: 'Remetente VIP.' };
  const newsletter = email.hasUnsubscribe || NEWSLETTER_SENDERS.some((w) => from.includes(w));
  if (newsletter) {
    const promotional =
      email.labels.includes('CATEGORY_PROMOTIONS') || email.labels.includes('CATEGORY_SOCIAL');
    return {
      category: promotional ? 'ignorar' : 'pode_esperar',
      reason: promotional ? 'Promoção ou rede social.' : 'Parece newsletter ou mensagem automática.',
    };
  }
  const reply = REPLY_HINTS.find((w) => subject.includes(normalize(w)));
  if (reply) return { category: 'responder', reason: 'Parece pedir uma resposta.' };
  if (email.important) return { category: 'responder', reason: 'Marcado como importante pelo Gmail.' };
  return { category: 'pode_esperar', reason: 'Sem sinais de urgência.' };
}
