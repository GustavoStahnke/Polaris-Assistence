// Formatadores em português do Brasil, usando só a API nativa Intl.

const LOCALE = 'pt-BR';

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
const hourMinuteFormatter = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dayMonthFormatter = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: 'short' });
const weekdayShortFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });
const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
const numberFormatter = new Intl.NumberFormat(LOCALE);

type DateInput = Date | string | number;
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

/** 14:05:09 */
export const formatClock = (value: DateInput) => timeFormatter.format(toDate(value));

/** 14:05 */
export const formatTime = (value: DateInput) => hourMinuteFormatter.format(toDate(value));

/** terça-feira, 21 de outubro de 2026 */
export const formatLongDate = (value: DateInput) => longDateFormatter.format(toDate(value));

/** 21/10/2026 */
export const formatShortDate = (value: DateInput) => shortDateFormatter.format(toDate(value));

/** 21 de out. */
export const formatDayMonth = (value: DateInput) => dayMonthFormatter.format(toDate(value));

/** ter. */
export const formatWeekdayShort = (value: DateInput) => weekdayShortFormatter.format(toDate(value));

/** 1.234 */
export const formatNumber = (value: number, maximumFractionDigits = 0) =>
  maximumFractionDigits === 0
    ? numberFormatter.format(value)
    : new Intl.NumberFormat(LOCALE, { maximumFractionDigits }).format(value);

/** "há 4 min", "em 2 horas", "ontem"... */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const diffSeconds = Math.round((toDate(value).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 45) return 'agora';
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), 'minute');
  if (abs < 86400) return relativeFormatter.format(Math.round(diffSeconds / 3600), 'hour');
  if (abs < 86400 * 30) return relativeFormatter.format(Math.round(diffSeconds / 86400), 'day');
  if (abs < 86400 * 365) return relativeFormatter.format(Math.round(diffSeconds / (86400 * 30)), 'month');
  return relativeFormatter.format(Math.round(diffSeconds / (86400 * 365)), 'year');
}

/** 3725 segundos → "1h 02min" */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

/** 95 segundos → "01:35" (cronômetro) */
export function formatTimer(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Saudação pelo horário. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return 'Boa noite';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Primeira letra maiúscula. */
export const capitalize = (text: string) => (text ? text[0]!.toUpperCase() + text.slice(1) : text);

/** "1 livro" / "3 livros" */
export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;

/** 1536 → "1,5 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${formatNumber(value, 1)} ${units[unit]}`;
}

/** 21/10/2026 14:05 */
export const formatDateTime = (value: Date | string | number) =>
  `${formatShortDate(value)} ${formatTime(value)}`;
