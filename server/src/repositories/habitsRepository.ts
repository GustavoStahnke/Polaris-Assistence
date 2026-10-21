import type { HabitAutoKey } from '@polaris/shared';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { habitLogs, habits } from '../db/schema';

export function findHabitByAutoKey(autoKey: HabitAutoKey) {
  return db
    .select()
    .from(habits)
    .where(and(eq(habits.autoKey, autoKey), eq(habits.archived, false)))
    .get();
}

/** Marca o hábito no dia (se já estiver marcado, não faz nada). */
export function markHabitDay(habitId: string, date: string, auto: boolean): void {
  db.insert(habitLogs).values({ habitId, date, auto }).onConflictDoNothing().run();
}
