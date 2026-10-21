import {
  addDays,
  noteInputSchema,
  noteUpdateSchema,
  reminderInputSchema,
  startOfDay,
  taskInputSchema,
  toDateKey,
  type Reminder,
  type ReminderRecurrence,
  type TodayAgenda,
} from '@polaris/shared';
import { notFound, parseInput, parsePatch } from '../lib/http';
import * as repo from '../repositories/productivityRepository';

// ===== Notas =====

export function listNotes(query?: string) {
  return query?.trim() ? repo.searchNotes(query.trim()) : repo.listNotes();
}

export function createNote(input: unknown) {
  const data = parseInput(noteInputSchema, input);
  return repo.createNote({ ...data, bookId: data.bookId ?? null, taskId: data.taskId ?? null });
}

export function updateNote(id: string, input: unknown) {
  const note = repo.updateNote(id, parsePatch(noteUpdateSchema, input));
  if (!note) throw notFound('Nota não encontrada.');
  return note;
}

export function deleteNote(id: string) {
  if (!repo.deleteNote(id)) throw notFound('Nota não encontrada.');
}

// ===== Tarefas =====

export const listTasks = () => repo.listTasks();

export function createTask(input: unknown) {
  return repo.createTask(parseInput(taskInputSchema, input));
}

export function updateTask(id: string, input: unknown, now: Date = new Date()) {
  const patch: Record<string, unknown> = { ...parsePatch(taskInputSchema.partial(), input) };
  if (patch.status === 'concluida') patch.completedAt = now.toISOString();
  else if (patch.status) patch.completedAt = null;
  const task = repo.updateTask(id, patch);
  if (!task) throw notFound('Tarefa não encontrada.');
  return task;
}

export function deleteTask(id: string) {
  if (!repo.deleteTask(id)) throw notFound('Tarefa não encontrada.');
}

// ===== Lembretes =====

export const listReminders = () => repo.listReminders();

export function createReminder(input: unknown) {
  const data = parseInput(reminderInputSchema, input);
  return repo.createReminder({
    title: data.title,
    notes: data.notes ?? null,
    remindAt: new Date(data.remindAt).toISOString(),
    recurrence: data.recurrence,
    taskId: data.taskId ?? null,
  });
}

export function updateReminder(id: string, input: unknown) {
  const patch: Record<string, unknown> = { ...parsePatch(reminderInputSchema.partial(), input) };
  if (typeof patch.remindAt === 'string') {
    patch.remindAt = new Date(patch.remindAt).toISOString();
    patch.done = false;
  }
  if (typeof (input as { done?: unknown })?.done === 'boolean')
    patch.done = (input as { done: boolean }).done;
  const reminder = repo.updateReminder(id, patch);
  if (!reminder) throw notFound('Lembrete não encontrado.');
  return reminder;
}

export function deleteReminder(id: string) {
  if (!repo.deleteReminder(id)) throw notFound('Lembrete não encontrado.');
}

/** Próxima ocorrência de um lembrete que se repete (sempre no futuro). */
export function nextOccurrence(remindAt: Date, recurrence: ReminderRecurrence, now: Date): Date {
  const step = recurrence === 'semanal' ? 7 : 1;
  let next = new Date(remindAt);
  do next = addDays(next, step);
  while (next <= now);
  return next;
}

/** Lembretes cujo horário chegou (a interface mostra o aviso e depois confirma). */
export const listDueReminders = (now: Date = new Date()) => repo.listDueReminders(now.toISOString());

/** Confirma que o lembrete foi avisado: conclui ou agenda a próxima vez. */
export function acknowledgeReminder(id: string, now: Date = new Date()): Reminder {
  const reminder = repo.getReminder(id);
  if (!reminder) throw notFound('Lembrete não encontrado.');
  const patch =
    reminder.recurrence === 'nenhuma'
      ? { done: true, lastFiredAt: now.toISOString() }
      : {
          remindAt: nextOccurrence(new Date(reminder.remindAt), reminder.recurrence, now).toISOString(),
          lastFiredAt: now.toISOString(),
        };
  return repo.updateReminder(id, patch)!;
}

// ===== Hoje (card do Painel) =====

export function getTodayAgenda(now: Date = new Date()): TodayAgenda {
  const today = toDateKey(now);
  const tasks = repo.listOpenTasksDueBy(today);
  const start = startOfDay(now);
  return {
    tasks,
    overdue: tasks.filter((t) => t.dueDate && t.dueDate < today).length,
    reminders: repo.listRemindersBetween(start.toISOString(), addDays(start, 1).toISOString()),
  };
}
