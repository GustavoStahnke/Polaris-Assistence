import type { AgendaItem } from '@polaris/shared';
import { formatTime } from '../../lib/format';

/** "em 25 min", "em 1h 10min", "agora" */
export function countdown(startIso: string, now: number = Date.now()): string {
  const minutes = Math.round((new Date(startIso).getTime() - now) / 60_000);
  if (minutes <= 0) return 'agora';
  if (minutes < 60) return `em ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `em ${h}h ${String(m).padStart(2, '0')}min` : `em ${h}h`;
}

/** "14:00 – 15:00" ou "Dia inteiro" */
export function timeRange(item: AgendaItem): string {
  if (item.allDay) return 'Dia inteiro';
  return item.end ? `${formatTime(item.start)} – ${formatTime(item.end)}` : formatTime(item.start);
}

/** Dia (YYYY-MM-DD local) de um item, inclusive os de dia inteiro. */
export const itemDay = (item: AgendaItem) => {
  if (item.allDay) return item.start.slice(0, 10);
  const d = new Date(item.start);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
