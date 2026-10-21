import type {
  Book,
  BookIdeaSummary,
  BookInput,
  BookNote,
  BookNoteInput,
  BookRecommendation,
  BookStatus,
  ReadingSession,
} from '@polaris/shared';
import { and, asc, count, desc, eq, gte, inArray, isNotNull, like, lte, or } from 'drizzle-orm';
import { db } from '../db/client';
import {
  bookIdeaSummaries,
  bookNotes,
  bookRecommendations,
  books,
  readingGoals,
  readingSessions,
} from '../db/schema';

type BookRow = typeof books.$inferSelect;

/** Converte a linha do banco em Book (com progresso e URL da capa). */
function toBook(row: BookRow, notesCount = 0): Book {
  const progress = row.pageCount ? Math.min(100, Math.round((row.currentPage / row.pageCount) * 100)) : 0;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    authors: row.authors,
    isbn: row.isbn,
    openLibraryKey: row.openLibraryKey,
    coverUrl: row.coverFile
      ? `/api/library/books/${row.id}/cover?v=${encodeURIComponent(row.coverFile)}`
      : row.coverUrl,
    pageCount: row.pageCount,
    subjects: row.subjects,
    publishYear: row.publishYear,
    description: row.description,
    status: row.status,
    currentPage: row.currentPage,
    progress: row.status === 'lido' ? 100 : progress,
    rating: row.rating,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    notesCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function notesCountByBook(ids: string[]): Map<string, number> {
  if (ids.length === 0) return new Map();
  const rows = db
    .select({ bookId: bookNotes.bookId, total: count() })
    .from(bookNotes)
    .where(inArray(bookNotes.bookId, ids))
    .groupBy(bookNotes.bookId)
    .all();
  return new Map(rows.map((r) => [r.bookId, r.total]));
}

// ===== Livros =====

export function listBooks(filter: { status?: BookStatus; query?: string } = {}): Book[] {
  const conditions = [];
  if (filter.status) conditions.push(eq(books.status, filter.status));
  if (filter.query) {
    const q = `%${filter.query}%`;
    conditions.push(or(like(books.title, q), like(books.authors, q)));
  }
  const rows = db
    .select()
    .from(books)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(books.updatedAt))
    .all();
  const counts = notesCountByBook(rows.map((r) => r.id));
  return rows.map((row) => toBook(row, counts.get(row.id) ?? 0));
}

export function getBookRow(id: string): BookRow | undefined {
  return db.select().from(books).where(eq(books.id, id)).get();
}

export function getBook(id: string): Book | undefined {
  const row = getBookRow(id);
  return row ? toBook(row, notesCountByBook([id]).get(id) ?? 0) : undefined;
}

export function findBookByKeyOrTitle(
  openLibraryKey: string | null | undefined,
  title: string,
): BookRow | undefined {
  if (openLibraryKey) {
    const byKey = db.select().from(books).where(eq(books.openLibraryKey, openLibraryKey)).get();
    if (byKey) return byKey;
  }
  return db.select().from(books).where(eq(books.title, title)).get();
}

export function createBook(
  input: BookInput & { description?: string | null; coverFile?: string | null },
): BookRow {
  return db
    .insert(books)
    .values({
      title: input.title,
      subtitle: input.subtitle ?? null,
      authors: input.authors,
      isbn: input.isbn ?? null,
      openLibraryKey: input.openLibraryKey ?? null,
      coverUrl: input.coverUrl ?? null,
      coverFile: input.coverFile ?? null,
      pageCount: input.pageCount ?? null,
      subjects: input.subjects,
      publishYear: input.publishYear ?? null,
      description: input.description ?? null,
      status: input.status,
    })
    .returning()
    .get();
}

export function updateBook(id: string, patch: Partial<typeof books.$inferInsert>): BookRow | undefined {
  return db.update(books).set(patch).where(eq(books.id, id)).returning().get();
}

export function deleteBook(id: string): boolean {
  return db.delete(books).where(eq(books.id, id)).run().changes > 0;
}

/** Livros com status e campos usados nas estatísticas e recomendações. */
export function listAllBookRows(): BookRow[] {
  return db.select().from(books).all();
}

// ===== Sessões de leitura =====

const toSession = (row: typeof readingSessions.$inferSelect): ReadingSession => ({
  id: row.id,
  bookId: row.bookId,
  date: row.date,
  pagesRead: row.pagesRead,
  fromPage: row.fromPage,
  toPage: row.toPage,
  minutes: row.minutes,
});

export function addReadingSession(data: typeof readingSessions.$inferInsert): ReadingSession {
  return toSession(db.insert(readingSessions).values(data).returning().get());
}

export function listReadingSessions(bookId: string): ReadingSession[] {
  return db
    .select()
    .from(readingSessions)
    .where(eq(readingSessions.bookId, bookId))
    .orderBy(desc(readingSessions.date), desc(readingSessions.createdAt))
    .all()
    .map(toSession);
}

export function deleteReadingSession(id: string) {
  return db.delete(readingSessions).where(eq(readingSessions.id, id)).returning().get();
}

/** Páginas lidas por dia (YYYY-MM-DD) num intervalo. */
export function pagesByDay(from: string, to: string): Array<{ date: string; pages: number }> {
  const rows = db
    .select({ date: readingSessions.date, pages: readingSessions.pagesRead })
    .from(readingSessions)
    .where(and(gte(readingSessions.date, from), lte(readingSessions.date, to)))
    .all();
  const totals = new Map<string, number>();
  for (const r of rows) totals.set(r.date, (totals.get(r.date) ?? 0) + r.pages);
  return [...totals.entries()].map(([date, pages]) => ({ date, pages }));
}

export function allReadingDays(): string[] {
  return db
    .selectDistinct({ date: readingSessions.date })
    .from(readingSessions)
    .all()
    .map((r) => r.date);
}

// ===== Anotações =====

const toNote = (row: typeof bookNotes.$inferSelect): BookNote => ({
  id: row.id,
  bookId: row.bookId,
  type: row.type,
  content: row.content,
  chapter: row.chapter,
  page: row.page,
  tags: row.tags,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export function listNotes(bookId: string): BookNote[] {
  return db
    .select()
    .from(bookNotes)
    .where(eq(bookNotes.bookId, bookId))
    .orderBy(asc(bookNotes.page), desc(bookNotes.createdAt))
    .all()
    .map(toNote);
}

export function getNote(id: string): BookNote | undefined {
  const row = db.select().from(bookNotes).where(eq(bookNotes.id, id)).get();
  return row ? toNote(row) : undefined;
}

export function createNote(bookId: string, input: BookNoteInput): BookNote {
  return toNote(
    db
      .insert(bookNotes)
      .values({
        bookId,
        type: input.type,
        content: input.content,
        chapter: input.chapter ?? null,
        page: input.page ?? null,
        tags: input.tags,
      })
      .returning()
      .get(),
  );
}

export function updateNote(id: string, patch: Partial<BookNoteInput>): BookNote | undefined {
  const row = db.update(bookNotes).set(patch).where(eq(bookNotes.id, id)).returning().get();
  return row ? toNote(row) : undefined;
}

export function deleteNote(id: string): boolean {
  return db.delete(bookNotes).where(eq(bookNotes.id, id)).run().changes > 0;
}

/** Anotações para o "Relembrar", das mostradas há mais tempo para as mais recentes. */
export function listNotesForReview(limit: number) {
  return db
    .select({ note: bookNotes, title: books.title, coverFile: books.coverFile, coverUrl: books.coverUrl })
    .from(bookNotes)
    .innerJoin(books, eq(books.id, bookNotes.bookId))
    .orderBy(asc(bookNotes.lastShownAt), asc(bookNotes.createdAt))
    .limit(limit)
    .all()
    .map(({ note, title, coverFile, coverUrl }) => ({
      note: toNote(note),
      bookTitle: title,
      coverUrl: coverFile
        ? `/api/library/books/${note.bookId}/cover?v=${encodeURIComponent(coverFile)}`
        : coverUrl,
    }));
}

export function getNotesWithBook(ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ note: bookNotes, title: books.title, coverFile: books.coverFile, coverUrl: books.coverUrl })
    .from(bookNotes)
    .innerJoin(books, eq(books.id, bookNotes.bookId))
    .where(inArray(bookNotes.id, ids))
    .all()
    .map(({ note, title, coverFile, coverUrl }) => ({
      note: toNote(note),
      bookTitle: title,
      coverUrl: coverFile
        ? `/api/library/books/${note.bookId}/cover?v=${encodeURIComponent(coverFile)}`
        : coverUrl,
    }));
}

export function markNotesShown(ids: string[], at: string): void {
  if (ids.length) db.update(bookNotes).set({ lastShownAt: at }).where(inArray(bookNotes.id, ids)).run();
}

/** Todas as anotações de um livro em texto (para a IA resumir as ideias do usuário). */
export function countNotes(bookId: string): number {
  return db.select({ total: count() }).from(bookNotes).where(eq(bookNotes.bookId, bookId)).get()?.total ?? 0;
}

// ===== Resumo de ideias (IA) =====

const toSummary = (row: typeof bookIdeaSummaries.$inferSelect): BookIdeaSummary => ({
  id: row.id,
  bookId: row.bookId,
  content: row.content,
  model: row.model,
  edited: row.edited,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export function getIdeaSummary(bookId: string): BookIdeaSummary | null {
  const row = db
    .select()
    .from(bookIdeaSummaries)
    .where(eq(bookIdeaSummaries.bookId, bookId))
    .orderBy(desc(bookIdeaSummaries.createdAt))
    .get();
  return row ? toSummary(row) : null;
}

export function saveIdeaSummary(
  bookId: string,
  content: string,
  model: string | null,
  edited: boolean,
): BookIdeaSummary {
  const existing = getIdeaSummary(bookId);
  if (existing) {
    return toSummary(
      db
        .update(bookIdeaSummaries)
        .set({ content, model: model ?? existing.model, edited })
        .where(eq(bookIdeaSummaries.id, existing.id))
        .returning()
        .get(),
    );
  }
  return toSummary(db.insert(bookIdeaSummaries).values({ bookId, content, model, edited }).returning().get());
}

// ===== Metas =====

export function getGoal(year: number): number | null {
  return db.select().from(readingGoals).where(eq(readingGoals.year, year)).get()?.targetBooks ?? null;
}

export function setGoal(year: number, targetBooks: number): void {
  db.insert(readingGoals)
    .values({ year, targetBooks })
    .onConflictDoUpdate({
      target: readingGoals.year,
      set: { targetBooks, updatedAt: new Date().toISOString() },
    })
    .run();
}

export function countFinishedInYear(year: number): number {
  return (
    db
      .select({ total: count() })
      .from(books)
      .where(
        and(
          eq(books.status, 'lido'),
          isNotNull(books.finishedAt),
          gte(books.finishedAt, `${year}-01-01`),
          lte(books.finishedAt, `${year}-12-31`),
        ),
      )
      .get()?.total ?? 0
  );
}

// ===== Recomendações =====

const toRecommendation = (row: typeof bookRecommendations.$inferSelect): BookRecommendation => ({
  id: row.id,
  title: row.title,
  authors: row.authors,
  openLibraryKey: row.openLibraryKey,
  coverUrl: row.coverUrl,
  publishYear: row.publishYear,
  pageCount: row.pageCount,
  subjects: row.subjects,
  reason: row.reason,
  source: row.source,
});

export function listRecommendations(): BookRecommendation[] {
  return db
    .select()
    .from(bookRecommendations)
    .where(eq(bookRecommendations.dismissed, false))
    .orderBy(desc(bookRecommendations.score))
    .all()
    .map(toRecommendation);
}

export function getRecommendation(id: string): BookRecommendation | undefined {
  const row = db.select().from(bookRecommendations).where(eq(bookRecommendations.id, id)).get();
  return row ? toRecommendation(row) : undefined;
}

/** Substitui as recomendações ativas (as dispensadas continuam guardadas para não voltarem). */
export function replaceRecommendations(items: Array<typeof bookRecommendations.$inferInsert>): void {
  db.transaction((tx) => {
    tx.delete(bookRecommendations).where(eq(bookRecommendations.dismissed, false)).run();
    if (items.length) tx.insert(bookRecommendations).values(items).run();
  });
}

export function dismissedRecommendationKeys(): Set<string> {
  return new Set(
    db
      .select({ key: bookRecommendations.openLibraryKey })
      .from(bookRecommendations)
      .where(eq(bookRecommendations.dismissed, true))
      .all()
      .map((r) => r.key)
      .filter((k): k is string => Boolean(k)),
  );
}

export function dismissRecommendation(id: string): boolean {
  return (
    db.update(bookRecommendations).set({ dismissed: true }).where(eq(bookRecommendations.id, id)).run()
      .changes > 0
  );
}

export function updateRecommendationReason(id: string, reason: string): void {
  db.update(bookRecommendations).set({ reason, source: 'ia' }).where(eq(bookRecommendations.id, id)).run();
}
