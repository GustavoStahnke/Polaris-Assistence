import type { EmailMessage } from '@polaris/shared';
import { gmail } from 'googleapis/build/src/apis/gmail';
import { z } from 'zod';
import { listVipEmails } from '../../repositories/emailRepository';
import { defineIntegration, type DataSource, type IntegrationContext } from '../types';
import { authorizedClient, withGoogle, type GoogleAccountConfig } from './auth';

export const gmailConfigSchema = z.object({
  filter: z
    .enum(['importantes_ou_principal', 'importantes', 'principal', 'todos_nao_lidos'])
    .default('importantes_ou_principal')
    .meta({
      title: 'Filtro de importância',
      enumLabels: {
        importantes_ou_principal: 'Importantes ou caixa principal (recomendado)',
        importantes: 'Só os marcados como importantes',
        principal: 'Só a caixa principal',
        todos_nao_lidos: 'Todos os não lidos',
      },
    }),
  days: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(3)
    .meta({ title: 'Quantos dias olhar', description: 'De 1 a 30 dias.' }),
  maxMessages: z.number().int().min(5).max(50).default(25).meta({ title: 'Máximo de e-mails' }),
});
export type GmailConfig = z.infer<typeof gmailConfigSchema>;

const FILTERS: Record<GmailConfig['filter'], string> = {
  importantes_ou_principal: '(is:important OR category:primary)',
  importantes: 'is:important',
  principal: 'category:primary',
  todos_nao_lidos: '',
};

/** Monta a busca do Gmail: não lidos do filtro escolhido + remetentes VIP (que sempre aparecem). */
export function buildGmailQuery(config: GmailConfig, vips: string[]): string {
  const base = `is:unread ${FILTERS[config.filter]}`.trim();
  const vipPart = vips.length ? ` OR from:(${vips.join(' OR ')})` : '';
  return `newer_than:${config.days}d (${base}${vipPart})`;
}

/** "Maria Silva <maria@x.com>" → { name, email } */
export function parseFrom(header: string): { name: string; email: string } {
  const match = /^\s*"?([^"<]*)"?\s*<([^>]+)>/.exec(header);
  if (match) return { name: match[1]!.trim() || match[2]!, email: match[2]!.toLowerCase() };
  return { name: header.trim(), email: header.trim().toLowerCase() };
}

async function fetchImportantEmails(ctx: IntegrationContext<GmailConfig>): Promise<EmailMessage[]> {
  const account = ctx.dependency<GoogleAccountConfig>('google-account');
  const api = gmail({ version: 'v1', auth: authorizedClient(account) });
  const vips = listVipEmails();
  const list = await withGoogle(() =>
    api.users.messages.list({
      userId: 'me',
      q: buildGmailQuery(ctx.config, vips),
      maxResults: ctx.config.maxMessages,
    }),
  );
  const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);
  const messages = await Promise.all(
    ids.map((id) =>
      withGoogle(() =>
        api.users.messages.get({
          userId: 'me',
          id,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date', 'List-Unsubscribe'],
        }),
      ),
    ),
  );
  const vipSet = new Set(vips);
  return messages.map(({ data }): EmailMessage => {
    const header = (name: string) =>
      data.payload?.headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
    const from = parseFrom(header('From'));
    const labels = data.labelIds ?? [];
    return {
      id: data.id!,
      threadId: data.threadId ?? data.id!,
      fromName: from.name,
      fromEmail: from.email,
      subject: header('Subject') || '(sem assunto)',
      snippet: (data.snippet ?? '')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&'),
      date: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : new Date().toISOString(),
      unread: labels.includes('UNREAD'),
      important: labels.includes('IMPORTANT'),
      isVip: vipSet.has(from.email),
      hasUnsubscribe: Boolean(header('List-Unsubscribe')),
      labels,
      link: `https://mail.google.com/mail/u/0/#all/${data.threadId ?? data.id}`,
    };
  });
}

/** E-mails importantes (cache de 5 minutos). */
export const emailsSource: DataSource<GmailConfig, EmailMessage[]> = {
  key: (config) => `gmail:${config.filter}:${config.days}:${config.maxMessages}:${listVipEmails().join(',')}`,
  ttlMinutes: 5,
  fetch: (ctx) => fetchImportantEmails(ctx),
};

export const gmailIntegration = defineIntegration<GmailConfig>({
  id: 'gmail',
  name: 'Gmail',
  category: 'google',
  description: 'Só os e-mails que importam, com triagem: urgente, responder, pode esperar ou ignorar.',
  icon: 'Mail',
  authType: 'oauth2',
  availability: 'available',
  free: true,
  dependsOn: ['google-account'],
  defaultEnabled: true,
  syncIntervalMinutes: 5,
  configSchema: gmailConfigSchema,
  panels: ['vip-list'],
  async test(ctx) {
    const emails = await fetchImportantEmails(ctx);
    return {
      ok: true,
      message: `Conectado: ${emails.length} e-mail(s) importante(s) nos últimos ${ctx.config.days} dias.`,
    };
  },
  async sync(ctx) {
    const emails = await ctx.refresh(emailsSource, undefined);
    return { message: `${emails.length} e-mail(s) importante(s).`, items: emails.length };
  },
});
