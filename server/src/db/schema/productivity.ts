import type { HabitAutoKey, ReminderRecurrence, TaskPriority, TaskStatus } from '@polaris/shared';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { idColumn, timestamps } from './common';
import { books } from './library';

export const tasks = sqliteTable(
  'tasks',
  {
    id: idColumn(),
    title: text('title').notNull(),
    description: text('description'),
    priority: text('priority').$type<TaskPriority>().notNull().default('media'),
    status: text('status').$type<TaskStatus>().notNull().default('pendente'),
    /** Prazo: data (YYYY-MM-DD). */
    dueDate: text('due_date'),
    completedAt: text('completed_at'),
    ...timestamps(),
  },
  (t) => [index('tasks_status_idx').on(t.status, t.dueDate)],
);

/** Notas do "segundo cérebro". A busca de texto completo usa a tabela virtual notes_fts. */
export const notes = sqliteTable('notes', {
  id: idColumn(),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  pinned: integer('pinned', { mode: 'boolean' }).notNull().default(false),
  bookId: text('book_id').references(() => books.id, { onDelete: 'set null' }),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  ...timestamps(),
});

export const reminders = sqliteTable(
  'reminders',
  {
    id: idColumn(),
    title: text('title').notNull(),
    notes: text('notes'),
    /** Próxima data e hora do lembrete (ISO UTC). */
    remindAt: text('remind_at').notNull(),
    recurrence: text('recurrence').$type<ReminderRecurrence>().notNull().default('nenhuma'),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    lastFiredAt: text('last_fired_at'),
    taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [index('reminders_remind_at_idx').on(t.done, t.remindAt)],
);

export const habits = sqliteTable('habits', {
  id: idColumn(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('Target'),
  /** Marcação automática: 'treino' (ao registrar treino) ou 'leitura' (ao registrar leitura). */
  autoKey: text('auto_key').$type<HabitAutoKey>(),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
});

export const habitLogs = sqliteTable(
  'habit_logs',
  {
    id: idColumn(),
    habitId: text('habit_id')
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    /** Dia (YYYY-MM-DD) */
    date: text('date').notNull(),
    auto: integer('auto', { mode: 'boolean' }).notNull().default(false),
    ...timestamps(),
  },
  (t) => [uniqueIndex('habit_logs_habit_date_unique').on(t.habitId, t.date)],
);
