import type { Note, Reminder, Task, TaskInput } from '@polaris/shared';
import { and, asc, desc, eq, gte, inArray, isNotNull, like, lte, ne, or } from 'drizzle-orm';
import { db, sqlite } from '../db/client';
import { books, exercises, habitLogs, habits, notes, reminders, tasks } from '../db/schema';

// ===== Notas =====

type NoteRow = typeof notes.$inferSelect;

function withLinks(rows: NoteRow[]): Note[] {
  const bookIds = [...new Set(rows.map((r) => r.bookId).filter((id): id is string => Boolean(id)))];
  const taskIds = [...new Set(rows.map((r) => r.taskId).filter((id): id is string => Boolean(id)))];
  const bookTitles = new Map(
    bookIds.length
      ? db
          .select({ id: books.id, title: books.title })
          .from(books)
          .where(inArray(books.id, bookIds))
          .all()
          .map((b) => [b.id, b.title])
      : [],
  );
  const taskTitles = new Map(
    taskIds.length
      ? db
          .select({ id: tasks.id, title: tasks.title })
          .from(tasks)
          .where(inArray(tasks.id, taskIds))
          .all()
          .map((t) => [t.id, t.title])
      : [],
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags,
    pinned: row.pinned,
    bookId: row.bookId,
    bookTitle: row.bookId ? (bookTitles.get(row.bookId) ?? null) : null,
    taskId: row.taskId,
    taskTitle: row.taskId ? (taskTitles.get(row.taskId) ?? null) : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function listNotes(): Note[] {
  return withLinks(db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.updatedAt)).all());
}

export function getNote(id: string): Note | undefined {
  const row = db.select().from(notes).where(eq(notes.id, id)).get();
  return row ? withLinks([row])[0] : undefined;
}

export function createNote(data: typeof notes.$inferInsert): Note {
  return withLinks([db.insert(notes).values(data).returning().get()])[0]!;
}

export function updateNote(id: string, patch: Partial<typeof notes.$inferInsert>): Note | undefined {
  const row = db.update(notes).set(patch).where(eq(notes.id, id)).returning().get();
  return row ? withLinks([row])[0] : undefined;
}

export function deleteNote(id: string): boolean {
  return db.delete(notes).where(eq(notes.id, id)).run().changes > 0;
}

/**
 * Busca de texto completo nas notas (SQLite FTS5).
 * É a única parte específica do SQLite fora do Drizzle, e fica isolada aqui.
 * Cada palavra vira um prefixo ("hab" encontra "hábito"), e todas precisam aparecer.
 */
export function searchNotes(query: string, limit = 50): Note[] {
  const terms = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (terms.length === 0) return [];
  const match = terms.map((t) => `"${t}"*`).join(' ');
  const rows = sqlite
    .prepare(
      `SELECT note_id AS id, snippet(notes_fts, 2, '«', '»', '…', 12) AS snippet
       FROM notes_fts WHERE notes_fts MATCH ? ORDER BY rank LIMIT ?`,
    )
    .all(match, limit) as Array<{ id: string; snippet: string }>;
  if (rows.length === 0) return [];
  const byId = new Map(
    withLinks(
      db
        .select()
        .from(notes)
        .where(
          inArray(
            notes.id,
            rows.map((r) => r.id),
          ),
        )
        .all(),
    ).map((n) => [n.id, n]),
  );
  return rows.flatMap((r) => {
    const note = byId.get(r.id);
    return note ? [{ ...note, snippet: r.snippet }] : [];
  });
}

// ===== Tarefas =====

const toTask = (row: typeof tasks.$inferSelect): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  status: row.status,
  dueDate: row.dueDate,
  completedAt: row.completedAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export function listTasks(): Task[] {
  return db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.status), asc(tasks.dueDate), desc(tasks.createdAt))
    .all()
    .map(toTask);
}

export function getTask(id: string): Task | undefined {
  const row = db.select().from(tasks).where(eq(tasks.id, id)).get();
  return row ? toTask(row) : undefined;
}

export function createTask(input: TaskInput): Task {
  return toTask(
    db
      .insert(tasks)
      .values({ ...input, description: input.description ?? null, dueDate: input.dueDate ?? null })
      .returning()
      .get(),
  );
}

export function updateTask(id: string, patch: Partial<typeof tasks.$inferInsert>): Task | undefined {
  const row = db.update(tasks).set(patch).where(eq(tasks.id, id)).returning().get();
  return row ? toTask(row) : undefined;
}

export function deleteTask(id: string): boolean {
  return db.delete(tasks).where(eq(tasks.id, id)).run().changes > 0;
}

/** Tarefas abertas com prazo até a data (inclui atrasadas). */
export function listOpenTasksDueBy(dateKey: string): Task[] {
  return db
    .select()
    .from(tasks)
    .where(and(ne(tasks.status, 'concluida'), isNotNull(tasks.dueDate), lte(tasks.dueDate, dateKey)))
    .orderBy(asc(tasks.dueDate))
    .all()
    .map(toTask);
}

// ===== Lembretes =====

const toReminder = (row: typeof reminders.$inferSelect): Reminder => ({
  id: row.id,
  title: row.title,
  notes: row.notes,
  remindAt: row.remindAt,
  recurrence: row.recurrence,
  done: row.done,
  lastFiredAt: row.lastFiredAt,
  taskId: row.taskId,
});

export function listReminders(): Reminder[] {
  return db
    .select()
    .from(reminders)
    .orderBy(asc(reminders.done), asc(reminders.remindAt))
    .all()
    .map(toReminder);
}

export function getReminder(id: string): Reminder | undefined {
  const row = db.select().from(reminders).where(eq(reminders.id, id)).get();
  return row ? toReminder(row) : undefined;
}

export function createReminder(data: typeof reminders.$inferInsert): Reminder {
  return toReminder(db.insert(reminders).values(data).returning().get());
}

export function updateReminder(
  id: string,
  patch: Partial<typeof reminders.$inferInsert>,
): Reminder | undefined {
  const row = db.update(reminders).set(patch).where(eq(reminders.id, id)).returning().get();
  return row ? toReminder(row) : undefined;
}

export function deleteReminder(id: string): boolean {
  return db.delete(reminders).where(eq(reminders.id, id)).run().changes > 0;
}

/** Lembretes pendentes cujo horário já chegou. */
export function listDueReminders(nowIso: string): Reminder[] {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.done, false), lte(reminders.remindAt, nowIso)))
    .all()
    .map(toReminder);
}

/** Lembretes pendentes num intervalo (ex.: hoje). */
export function listRemindersBetween(fromIso: string, toIso: string): Reminder[] {
  return db
    .select()
    .from(reminders)
    .where(and(eq(reminders.done, false), gte(reminders.remindAt, fromIso), lte(reminders.remindAt, toIso)))
    .orderBy(asc(reminders.remindAt))
    .all()
    .map(toReminder);
}

// ===== Hábitos =====

export type HabitRow = typeof habits.$inferSelect;

export function listHabitRows(includeArchived = false): HabitRow[] {
  return db
    .select()
    .from(habits)
    .where(includeArchived ? undefined : eq(habits.archived, false))
    .orderBy(asc(habits.sortOrder), asc(habits.createdAt))
    .all();
}

export function getHabitRow(id: string): HabitRow | undefined {
  return db.select().from(habits).where(eq(habits.id, id)).get();
}

export function createHabit(data: typeof habits.$inferInsert): HabitRow {
  return db.insert(habits).values(data).returning().get();
}

export function updateHabit(id: string, patch: Partial<typeof habits.$inferInsert>): HabitRow | undefined {
  return db.update(habits).set(patch).where(eq(habits.id, id)).returning().get();
}

export function deleteHabit(id: string): boolean {
  return db.delete(habits).where(eq(habits.id, id)).run().changes > 0;
}

/** Dias marcados de cada hábito (a partir de uma data). */
export function listHabitLogs(fromDate: string): Array<{ habitId: string; date: string }> {
  return db
    .select({ habitId: habitLogs.habitId, date: habitLogs.date })
    .from(habitLogs)
    .where(gte(habitLogs.date, fromDate))
    .all();
}

export function isHabitDone(habitId: string, date: string): boolean {
  return Boolean(
    db
      .select({ id: habitLogs.id })
      .from(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
      .get(),
  );
}

export function setHabitDone(habitId: string, date: string, done: boolean): void {
  if (done) db.insert(habitLogs).values({ habitId, date, auto: false }).onConflictDoNothing().run();
  else
    db.delete(habitLogs)
      .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)))
      .run();
}

// ===== Busca simples (LIKE) para a paleta Ctrl+K =====

export function searchBooksByText(query: string, limit = 5) {
  const q = `%${query}%`;
  return db
    .select({ id: books.id, title: books.title, authors: books.authors })
    .from(books)
    .where(or(like(books.title, q), like(books.authors, q)))
    .limit(limit)
    .all();
}

export function searchTasksByText(query: string, limit = 5) {
  const q = `%${query}%`;
  return db
    .select({ id: tasks.id, title: tasks.title, status: tasks.status, dueDate: tasks.dueDate })
    .from(tasks)
    .where(or(like(tasks.title, q), like(tasks.description, q)))
    .limit(limit)
    .all();
}

export function searchExercisesByText(query: string, limit = 5) {
  const q = `%${query}%`;
  return db
    .select({ id: exercises.id, name: exercises.name, muscleGroup: exercises.muscleGroup })
    .from(exercises)
    .where(like(exercises.name, q))
    .limit(limit)
    .all();
}

export function searchRemindersByText(query: string, limit = 5) {
  const q = `%${query}%`;
  return db
    .select({ id: reminders.id, title: reminders.title, remindAt: reminders.remindAt })
    .from(reminders)
    .where(and(eq(reminders.done, false), like(reminders.title, q)))
    .limit(limit)
    .all();
}
