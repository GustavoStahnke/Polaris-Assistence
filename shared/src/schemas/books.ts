import { z } from 'zod';
import { BOOK_NOTE_TYPES, BOOK_STATUSES, type BookNoteType, type BookStatus } from '../enums';

/** Livro encontrado na busca da Open Library. */
export interface BookSearchResult {
  /** Chave da obra na Open Library (ex.: /works/OL45804W). */
  key: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  publishYear: number | null;
  pageCount: number | null;
  coverUrl: string | null;
  isbn: string | null;
  subjects: string[];
}

export interface Book {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  isbn: string | null;
  openLibraryKey: string | null;
  /** URL para exibir a capa (local quando baixada, senão a original). */
  coverUrl: string | null;
  pageCount: number | null;
  subjects: string[];
  publishYear: number | null;
  description: string | null;
  status: BookStatus;
  currentPage: number;
  /** 0 a 100 */
  progress: number;
  rating: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  notesCount: number;
  createdAt: string;
  updatedAt: string;
}

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');

export const bookInputSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.').max(300),
  subtitle: z.string().trim().max(300).nullish(),
  authors: z.array(z.string().trim().min(1)).max(10).default([]),
  isbn: z.string().trim().max(20).nullish(),
  openLibraryKey: z.string().trim().max(60).nullish(),
  coverUrl: z.url().nullish(),
  pageCount: z.number().int().min(1).max(20000).nullish(),
  subjects: z.array(z.string().trim()).max(30).default([]),
  publishYear: z.number().int().min(0).max(3000).nullish(),
  description: z.string().trim().max(5000).nullish(),
  status: z.enum(BOOK_STATUSES).default('quero_ler'),
});
export type BookInput = z.infer<typeof bookInputSchema>;

export const bookUpdateSchema = bookInputSchema.partial().extend({
  currentPage: z.number().int().min(0).max(20000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  startedAt: dateKey.nullable().optional(),
  finishedAt: dateKey.nullable().optional(),
});
export type BookUpdate = z.infer<typeof bookUpdateSchema>;

/** Registro de leitura: "+ páginas" (pagesRead) ou "parei na página X" (toPage). */
export const readingLogSchema = z
  .object({
    pagesRead: z.number().int().min(1).max(5000).optional(),
    toPage: z.number().int().min(0).max(20000).optional(),
    date: dateKey.optional(),
    minutes: z.number().int().min(1).max(1440).optional(),
  })
  .refine((v) => v.pagesRead !== undefined || v.toPage !== undefined, 'Informe as páginas lidas.');
export type ReadingLog = z.infer<typeof readingLogSchema>;

export interface ReadingSession {
  id: string;
  bookId: string;
  date: string;
  pagesRead: number;
  fromPage: number | null;
  toPage: number | null;
  minutes: number | null;
}

export interface BookNote {
  id: string;
  bookId: string;
  type: BookNoteType;
  content: string;
  chapter: string | null;
  page: number | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const bookNoteInputSchema = z.object({
  type: z.enum(BOOK_NOTE_TYPES).default('ideia'),
  content: z.string().trim().min(1, 'Escreva a anotação.').max(10000),
  chapter: z.string().trim().max(120).nullish(),
  page: z.number().int().min(0).max(20000).nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});
export type BookNoteInput = z.infer<typeof bookNoteInputSchema>;

export interface BookIdeaSummary {
  id: string;
  bookId: string;
  content: string;
  model: string | null;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookDetail {
  book: Book;
  notes: BookNote[];
  sessions: ReadingSession[];
  summary: BookIdeaSummary | null;
}

export interface ReadingGoal {
  year: number;
  targetBooks: number | null;
  finishedBooks: number;
}

export const readingGoalSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  targetBooks: z.number().int().min(1, 'Pelo menos 1 livro.').max(1000),
});

export interface ReadingStats {
  year: number;
  booksFinished: number;
  pagesRead: number;
  /** Média de páginas por dia nos últimos 30 dias. */
  pagesPerDay: number;
  streak: number;
  readingToday: boolean;
  booksByYear: Array<{ year: number; count: number }>;
  pagesByMonth: Array<{ month: string; pages: number }>;
  topSubjects: Array<{ name: string; count: number }>;
  topAuthors: Array<{ name: string; count: number }>;
}

export interface BookRecommendation {
  id: string;
  title: string;
  authors: string[];
  openLibraryKey: string | null;
  coverUrl: string | null;
  publishYear: number | null;
  pageCount: number | null;
  subjects: string[];
  reason: string | null;
  source: 'openlibrary' | 'ia';
}

export interface RememberItem {
  note: BookNote;
  bookId: string;
  bookTitle: string;
  coverUrl: string | null;
}

export const isBookStatus = (value: string): value is BookStatus =>
  (BOOK_STATUSES as readonly string[]).includes(value);
