import {
  addDays,
  computeStreak,
  habitInputSchema,
  toDateKey,
  type Habit,
  type HabitAutoKey,
  type HabitHeatmap,
} from '@polaris/shared';
import { badRequest, notFound, parseInput, parsePatch } from '../lib/http';
import { findHabitByAutoKey, markHabitDay } from '../repositories/habitsRepository';
import * as repo from '../repositories/productivityRepository';

/**
 * Marcação automática de hábitos:
 * registrar um treino marca "Treino"; registrar leitura marca "Leitura".
 */
export function autoMarkHabit(autoKey: HabitAutoKey, date: Date = new Date()): void {
  const habit = findHabitByAutoKey(autoKey);
  if (habit) markHabitDay(habit.id, toDateKey(date), true);
}

/** Hábitos com o estado de hoje, a sequência e os últimos 7 dias. */
export function listHabits(now: Date = new Date()): Habit[] {
  const rows = repo.listHabitRows();
  const logs = repo.listHabitLogs('2000-01-01');
  const today = toDateKey(now);
  const last7 = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(now, i - 6)));
  return rows.map((row) => {
    const days = new Set(logs.filter((l) => l.habitId === row.id).map((l) => l.date));
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      autoKey: row.autoKey,
      sortOrder: row.sortOrder,
      doneToday: days.has(today),
      streak: computeStreak(days, now),
      last7: last7.map((date) => ({ date, done: days.has(date) })),
      totalDays: days.size,
    };
  });
}

export function createHabit(input: unknown): Habit {
  const data = parseInput(habitInputSchema, input);
  repo.createHabit({ ...data, sortOrder: repo.listHabitRows(true).length });
  return listHabits().at(-1)!;
}

export function updateHabit(id: string, input: unknown) {
  const row = repo.updateHabit(id, parsePatch(habitInputSchema.partial(), input));
  if (!row) throw notFound('Hábito não encontrado.');
  return listHabits().find((h) => h.id === id)!;
}

export function archiveHabit(id: string) {
  if (!repo.updateHabit(id, { archived: true })) throw notFound('Hábito não encontrado.');
}

export function deleteHabit(id: string) {
  if (!repo.deleteHabit(id)) throw notFound('Hábito não encontrado.');
}

/** Marca ou desmarca um hábito num dia (padrão: hoje). */
export function toggleHabit(id: string, input: unknown, now: Date = new Date()): Habit {
  if (!repo.getHabitRow(id)) throw notFound('Hábito não encontrado.');
  const body = (input ?? {}) as { date?: unknown; done?: unknown };
  const date = typeof body.date === 'string' ? body.date : toDateKey(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw badRequest('Data inválida.');
  if (date > toDateKey(now)) throw badRequest('Não dá para marcar um dia que ainda não chegou.');
  const done = typeof body.done === 'boolean' ? body.done : !repo.isHabitDone(id, date);
  repo.setHabitDone(id, date, done);
  return listHabits(now).find((h) => h.id === id)!;
}

/** Mapa de calor do ano: quantos hábitos foram marcados em cada dia. */
export function getHeatmap(year: number, habitId?: string): HabitHeatmap {
  const logs = repo
    .listHabitLogs(`${year}-01-01`)
    .filter((l) => l.date <= `${year}-12-31` && (!habitId || l.habitId === habitId));
  const days: Record<string, number> = {};
  for (const log of logs) days[log.date] = (days[log.date] ?? 0) + 1;
  return { year, habits: habitId ? 1 : repo.listHabitRows().length, days };
}
