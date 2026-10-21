import { addDays, startOfDay, type AgendaItem, type AgendaResponse } from '@polaris/shared';
import { listRemindersBetween } from '../repositories/productivityRepository';
import { getCalendarEvents } from './integrationService';

/** Agenda de hoje ou da semana: eventos do Google + lembretes locais do Polaris. */
export async function getAgenda(
  range: 'hoje' | 'semana',
  now: Date = new Date(),
  options?: { force?: boolean },
): Promise<AgendaResponse> {
  const from = startOfDay(now);
  const to = addDays(from, range === 'hoje' ? 1 : 7);
  const hub = await getCalendarEvents({ from: from.toISOString(), to: to.toISOString() }, options);

  const events: AgendaItem[] = (hub.data ?? []).map((e) => ({
    id: e.id,
    source: 'google',
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    location: e.location,
    color: e.color,
    link: e.link,
    calendarName: e.calendarName,
  }));
  const reminders: AgendaItem[] = listRemindersBetween(from.toISOString(), to.toISOString()).map((r) => ({
    id: `lembrete:${r.id}`,
    source: 'lembrete',
    title: r.title,
    start: r.remindAt,
    end: null,
    allDay: false,
    location: null,
    color: null,
    link: null,
    calendarName: 'Lembrete do Polaris',
  }));

  // Eventos de dia inteiro vêm como "YYYY-MM-DD"; para ordenar, contam como início do dia.
  const sortKey = (item: AgendaItem) =>
    item.allDay ? `${item.start}T00:00:00` : new Date(item.start).toISOString();
  const items = [...events, ...reminders].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const next = items.find((i) => !i.allDay && new Date(i.start).getTime() >= now.getTime()) ?? null;

  return {
    state: hub.state,
    error: hub.error,
    fetchedAt: hub.fetchedAt,
    from: from.toISOString(),
    to: to.toISOString(),
    items,
    next,
  };
}
