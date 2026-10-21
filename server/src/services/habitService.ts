import { toDateKey, type HabitAutoKey } from '@polaris/shared';
import { findHabitByAutoKey, markHabitDay } from '../repositories/habitsRepository';

/**
 * Marcação automática de hábitos:
 * registrar um treino marca "Treino"; registrar leitura marca "Leitura".
 */
export function autoMarkHabit(autoKey: HabitAutoKey, date: Date = new Date()): void {
  const habit = findHabitByAutoKey(autoKey);
  if (habit) markHabitDay(habit.id, toDateKey(date), true);
}
