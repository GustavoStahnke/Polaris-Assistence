import type { CalendarEvent, CalendarInfo } from '@polaris/shared';
import { calendar } from 'googleapis/build/src/apis/calendar';
import { z } from 'zod';
import { defineIntegration, type DataSource, type IntegrationContext } from '../types';
import { authorizedClient, withGoogle, type GoogleAccountConfig } from './auth';

export const googleCalendarConfigSchema = z.object({
  calendarIds: z.array(z.string()).default([]).meta({
    title: 'Calendários que aparecem no Polaris',
    description: 'Se nenhum for marcado, usa o calendário principal.',
    widget: 'calendar-select',
  }),
});
export type GoogleCalendarConfig = z.infer<typeof googleCalendarConfigSchema>;

const accountOf = (ctx: IntegrationContext<unknown>) => ctx.dependency<GoogleAccountConfig>('google-account');

/** Lista os calendários da conta (para o usuário escolher). */
export async function listCalendars(ctx: IntegrationContext<unknown>): Promise<CalendarInfo[]> {
  const api = calendar({ version: 'v3', auth: authorizedClient(accountOf(ctx)) });
  const result = await withGoogle(() => api.calendarList.list({ maxResults: 100 }));
  return (result.data.items ?? []).map((c) => ({
    id: c.id ?? '',
    name: c.summaryOverride ?? c.summary ?? 'Calendário',
    color: c.backgroundColor ?? null,
    primary: Boolean(c.primary),
  }));
}

/** Eventos de todos os calendários escolhidos num intervalo. */
async function fetchEvents(
  ctx: IntegrationContext<GoogleCalendarConfig>,
  range: { from: string; to: string },
): Promise<CalendarEvent[]> {
  const api = calendar({ version: 'v3', auth: authorizedClient(accountOf(ctx)) });
  const ids = ctx.config.calendarIds.length ? ctx.config.calendarIds : ['primary'];
  const calendars = await listCalendars(ctx).catch(() => [] as CalendarInfo[]);
  const lists = await Promise.all(
    ids.map(async (calendarId) => {
      const info = calendars.find((c) => c.id === calendarId || (calendarId === 'primary' && c.primary));
      const result = await withGoogle(() =>
        api.events.list({
          calendarId,
          timeMin: range.from,
          timeMax: range.to,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 250,
        }),
      );
      return (result.data.items ?? [])
        .filter((e) => e.status !== 'cancelled')
        .map((e): CalendarEvent => ({
          id: `${calendarId}:${e.id}`,
          calendarId,
          calendarName: info?.name ?? null,
          color: info?.color ?? null,
          title: e.summary ?? '(sem título)',
          start: e.start?.dateTime ?? e.start?.date ?? range.from,
          end: e.end?.dateTime ?? e.end?.date ?? range.to,
          allDay: !e.start?.dateTime,
          location: e.location ?? null,
          description: e.description ?? null,
          link: e.htmlLink ?? null,
        }));
    }),
  );
  return lists.flat().sort((a, b) => a.start.localeCompare(b.start));
}

/** Eventos de um intervalo (cache de 10 minutos). */
export const eventsSource: DataSource<GoogleCalendarConfig, CalendarEvent[], { from: string; to: string }> = {
  key: (config, range) => `calendar:${range.from}:${range.to}:${config.calendarIds.join(',')}`,
  ttlMinutes: 10,
  fetch: (ctx, range) => fetchEvents(ctx, range),
};

/** Hoje e os próximos 7 dias (usado na sincronização). */
export function weekRange(now: Date = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(from.getTime() + 8 * 86400_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export const googleCalendar = defineIntegration<GoogleCalendarConfig>({
  id: 'google-calendar',
  name: 'Google Agenda',
  category: 'google',
  description: 'Seus compromissos de hoje e da semana, com contagem regressiva.',
  icon: 'CalendarDays',
  authType: 'oauth2',
  availability: 'available',
  free: true,
  dependsOn: ['google-account'],
  defaultEnabled: true,
  syncIntervalMinutes: 10,
  configSchema: googleCalendarConfigSchema,
  async test(ctx) {
    const events = await fetchEvents(ctx, weekRange());
    return { ok: true, message: `Conectado: ${events.length} evento(s) nos próximos 7 dias.` };
  },
  async sync(ctx) {
    const events = await ctx.refresh(eventsSource, weekRange());
    return { message: `${events.length} evento(s) sincronizado(s).`, items: events.length };
  },
});
