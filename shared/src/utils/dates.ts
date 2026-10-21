// Funções de data usadas pelos dois lados. "Dia" = data local no formato YYYY-MM-DD.

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local no formato YYYY-MM-DD (ex.: 2026-10-21). */
export function toDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Converte "YYYY-MM-DD" em Date (meia-noite local). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Soma (ou subtrai) dias de uma data. */
export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Início do dia local. */
export function startOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Quantos dias seguidos (terminando hoje ou ontem) existem no conjunto de dias. */
export function computeStreak(dayKeys: Iterable<string>, today: Date = new Date()): number {
  const days = new Set(dayKeys);
  let cursor = startOfDay(today);
  // Se hoje ainda não foi marcado, a sequência pode continuar valendo a partir de ontem.
  if (!days.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Carimbo para nomes de arquivo: 2026-10-21_14-05-09 (hora local). */
export function fileStamp(date: Date = new Date()): string {
  return `${toDateKey(date)}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}
