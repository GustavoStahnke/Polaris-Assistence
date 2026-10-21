import type { BookNoteType, BookStatus } from '@polaris/shared';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { idColumn, timestamps } from './common';

export const books = sqliteTable(
  'books',
  {
    id: idColumn(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    authors: text('authors', { mode: 'json' }).$type<string[]>().notNull().default([]),
    isbn: text('isbn'),
    openLibraryKey: text('open_library_key'),
    coverUrl: text('cover_url'),
    /** Nome do arquivo da capa salva em data/covers (funciona offline). */
    coverFile: text('cover_file'),
    pageCount: integer('page_count'),
    subjects: text('subjects', { mode: 'json' }).$type<string[]>().notNull().default([]),
    publishYear: integer('publish_year'),
    description: text('description'),
    status: text('status').$type<BookStatus>().notNull().default('quero_ler'),
    currentPage: integer('current_page').notNull().default(0),
    rating: integer('rating'),
    startedAt: text('started_at'),
    finishedAt: text('finished_at'),
    ...timestamps(),
  },
  (t) => [index('books_status_idx').on(t.status)],
);

/** Sessões de leitura: dia (YYYY-MM-DD) e páginas lidas. */
export const readingSessions = sqliteTable(
  'reading_sessions',
  {
    id: idColumn(),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    pagesRead: integer('pages_read').notNull(),
    fromPage: integer('from_page'),
    toPage: integer('to_page'),
    minutes: integer('minutes'),
    ...timestamps(),
  },
  (t) => [index('reading_sessions_date_idx').on(t.date), index('reading_sessions_book_idx').on(t.bookId)],
);

export const bookNotes = sqliteTable(
  'book_notes',
  {
    id: idColumn(),
    bookId: text('book_id')
      .notNull()
      .references(() => books.id, { onDelete: 'cascade' }),
    type: text('type').$type<BookNoteType>().notNull().default('ideia'),
    content: text('content').notNull(),
    chapter: text('chapter'),
    page: integer('page'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    /** Última vez que apareceu no card "Relembrar" (revisão espaçada simples). */
    lastShownAt: text('last_shown_at'),
    ...timestamps(),
  },
  (t) => [index('book_notes_book_idx').on(t.bookId)],
);

/** "Minhas ideias sobre o livro": resumo gerado pela IA a partir das anotações (editável). */
export const bookIdeaSummaries = sqliteTable('book_idea_summaries', {
  id: idColumn(),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  model: text('model'),
  edited: integer('edited', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
});

export const readingGoals = sqliteTable('reading_goals', {
  id: idColumn(),
  year: integer('year').notNull().unique(),
  targetBooks: integer('target_books').notNull(),
  ...timestamps(),
});

export const bookRecommendations = sqliteTable('book_recommendations', {
  id: idColumn(),
  title: text('title').notNull(),
  authors: text('authors', { mode: 'json' }).$type<string[]>().notNull().default([]),
  openLibraryKey: text('open_library_key'),
  coverUrl: text('cover_url'),
  publishYear: integer('publish_year'),
  pageCount: integer('page_count'),
  subjects: text('subjects', { mode: 'json' }).$type<string[]>().notNull().default([]),
  reason: text('reason'),
  source: text('source').$type<'openlibrary' | 'ia'>().notNull().default('openlibrary'),
  score: real('score').notNull().default(0),
  dismissed: integer('dismissed', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
});
