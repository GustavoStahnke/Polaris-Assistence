import {
  addDays,
  bookInputSchema,
  bookNoteInputSchema,
  bookUpdateSchema,
  computeStreak,
  isBookStatus,
  readingGoalSchema,
  readingLogSchema,
  toDateKey,
  type Book,
  type BookDetail,
  type BookRecommendation,
  type BookSearchResult,
  type ReadingGoal,
  type ReadingStats,
  type RememberItem,
} from '@polaris/shared';
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../config/paths';
import { badRequest, notFound, parseInput, parsePatch } from '../lib/http';
import * as repo from '../repositories/libraryRepository';
import { getSetting, setSetting } from '../repositories/settingsRepository';
import { autoMarkHabit } from './habitService';
import { fetchBookCover, fetchBookDescription, getBooksBySubject, searchBooks } from './integrationService';

export const COVERS_DIR = path.join(DATA_DIR, 'covers');

// ===== Livros =====

export function listBooks(filter: { status?: string; query?: string }): Book[] {
  return repo.listBooks({
    status: filter.status && isBookStatus(filter.status) ? filter.status : undefined,
    query: filter.query?.trim() || undefined,
  });
}

export function getBookDetail(id: string): BookDetail {
  const book = repo.getBook(id);
  if (!book) throw notFound('Livro não encontrado.');
  return {
    book,
    notes: repo.listNotes(id),
    sessions: repo.listReadingSessions(id),
    summary: repo.getIdeaSummary(id),
  };
}

/** Salva a capa em data/covers para funcionar offline. */
async function storeCover(bookId: string, url: string): Promise<string | null> {
  const image = await fetchBookCover(url);
  if (!image || image.length < 1000) return null; // a Open Library devolve um GIF minúsculo quando não há capa
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  const fileName = `${bookId}.jpg`;
  fs.writeFileSync(path.join(COVERS_DIR, fileName), image);
  return fileName;
}

export async function createBook(input: unknown, today: Date = new Date()): Promise<Book> {
  const data = parseInput(bookInputSchema, input);
  if (
    data.openLibraryKey &&
    repo.findBookByKeyOrTitle(data.openLibraryKey, data.title)?.openLibraryKey === data.openLibraryKey
  ) {
    throw badRequest('Esse livro já está na sua estante.');
  }
  const description =
    data.description ?? (data.openLibraryKey ? await fetchBookDescription(data.openLibraryKey) : null);
  const row = repo.createBook({ ...data, description });
  const patch: Parameters<typeof repo.updateBook>[1] = {};
  if (data.status === 'lendo') patch.startedAt = toDateKey(today);
  if (data.status === 'lido') {
    patch.finishedAt = toDateKey(today);
    patch.currentPage = data.pageCount ?? 0;
  }
  if (data.coverUrl) {
    const coverFile = await storeCover(row.id, data.coverUrl);
    if (coverFile) patch.coverFile = coverFile;
  }
  if (Object.keys(patch).length) repo.updateBook(row.id, patch);
  return repo.getBook(row.id)!;
}

export function updateBook(id: string, input: unknown, today: Date = new Date()): Book {
  const row = repo.getBookRow(id);
  if (!row) throw notFound('Livro não encontrado.');
  const data = parsePatch(bookUpdateSchema, input);
  const patch: Parameters<typeof repo.updateBook>[1] = { ...data };
  delete (patch as { coverUrl?: unknown }).coverUrl;

  // Mudanças de status ajustam datas e página atual automaticamente.
  if (data.status && data.status !== row.status) {
    if (data.status === 'lendo' && !row.startedAt && data.startedAt === undefined)
      patch.startedAt = toDateKey(today);
    if (data.status === 'lido') {
      if (!row.finishedAt && data.finishedAt === undefined) patch.finishedAt = toDateKey(today);
      if (row.pageCount && data.currentPage === undefined) patch.currentPage = row.pageCount;
      if (!row.startedAt && data.startedAt === undefined) patch.startedAt = toDateKey(today);
    }
  }
  const pageCount = data.pageCount ?? row.pageCount;
  if (patch.currentPage !== undefined && pageCount)
    patch.currentPage = Math.min(patch.currentPage, pageCount);
  repo.updateBook(id, patch);
  return repo.getBook(id)!;
}

export function deleteBook(id: string): void {
  const row = repo.getBookRow(id);
  if (!row) throw notFound('Livro não encontrado.');
  repo.deleteBook(id);
  if (row.coverFile) fs.rmSync(path.join(COVERS_DIR, row.coverFile), { force: true });
}

export function getCoverPath(id: string): string {
  const row = repo.getBookRow(id);
  if (!row?.coverFile) throw notFound('Capa não encontrada.');
  const file = path.join(COVERS_DIR, row.coverFile);
  if (!fs.existsSync(file)) throw notFound('Capa não encontrada.');
  return file;
}

// ===== Leitura =====

/** Registra leitura ("+ páginas" ou "parei na página X") e marca o hábito "Leitura". */
export function logReading(bookId: string, input: unknown, now: Date = new Date()): BookDetail {
  const row = repo.getBookRow(bookId);
  if (!row) throw notFound('Livro não encontrado.');
  const data = parseInput(readingLogSchema, input);
  const fromPage = row.currentPage;
  let toPage = data.toPage ?? fromPage + (data.pagesRead ?? 0);
  if (row.pageCount) toPage = Math.min(toPage, row.pageCount);
  const pagesRead = data.pagesRead ?? Math.max(toPage - fromPage, 0);
  if (pagesRead <= 0) throw badRequest('Nenhuma página nova para registrar.');

  const date = data.date ?? toDateKey(now);
  repo.addReadingSession({ bookId, date, pagesRead, fromPage, toPage, minutes: data.minutes ?? null });

  const patch: Parameters<typeof repo.updateBook>[1] = { currentPage: toPage };
  if (row.status === 'quero_ler' || row.status === 'abandonado') patch.status = 'lendo';
  if (!row.startedAt) patch.startedAt = date;
  if (row.pageCount && toPage >= row.pageCount) {
    patch.status = 'lido';
    patch.finishedAt = date;
  }
  repo.updateBook(bookId, patch);
  autoMarkHabit('leitura', now);
  return getBookDetail(bookId);
}

export function deleteReadingSession(id: string): void {
  const removed = repo.deleteReadingSession(id);
  if (!removed) throw notFound('Registro não encontrado.');
}

/** Livros sendo lidos agora (card "Leitura atual"). */
export function getCurrentReading(): Book[] {
  return repo.listBooks({ status: 'lendo' });
}

// ===== Anotações =====

export function createNote(bookId: string, input: unknown) {
  if (!repo.getBookRow(bookId)) throw notFound('Livro não encontrado.');
  return repo.createNote(bookId, parseInput(bookNoteInputSchema, input));
}

export function updateNote(id: string, input: unknown) {
  const note = repo.updateNote(id, parsePatch(bookNoteInputSchema.partial(), input));
  if (!note) throw notFound('Anotação não encontrada.');
  return note;
}

export function deleteNote(id: string) {
  if (!repo.deleteNote(id)) throw notFound('Anotação não encontrada.');
}

/**
 * "Relembrar": 2 anotações antigas por dia (revisão espaçada simples).
 * Sorteia entre as que estão há mais tempo sem aparecer e guarda a escolha do dia.
 */
export function getRemember(now: Date = new Date()): RememberItem[] {
  const today = toDateKey(now);
  const stored = getSetting<{ date: string; ids: string[] }>('library:remember');
  if (stored?.date === today) {
    const items = repo.getNotesWithBook(stored.ids);
    if (items.length === stored.ids.length) return items.map(toRememberItem);
  }
  const pool = repo.listNotesForReview(8);
  const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, 2);
  const ids = picked.map((p) => p.note.id);
  repo.markNotesShown(ids, now.toISOString());
  setSetting('library:remember', { date: today, ids });
  return picked.map(toRememberItem);
}

const toRememberItem = (item: ReturnType<typeof repo.getNotesWithBook>[number]): RememberItem => ({
  note: item.note,
  bookId: item.note.bookId,
  bookTitle: item.bookTitle,
  coverUrl: item.coverUrl,
});

// ===== Metas e estatísticas =====

export function getGoal(year: number): ReadingGoal {
  return { year, targetBooks: repo.getGoal(year), finishedBooks: repo.countFinishedInYear(year) };
}

export function setGoal(input: unknown): ReadingGoal {
  const data = parseInput(readingGoalSchema, input);
  repo.setGoal(data.year, data.targetBooks);
  return getGoal(data.year);
}

/** Assuntos "limpos" (a Open Library mistura códigos como "nyt:..." e frases longas). */
const cleanSubjects = (subjects: string[]) =>
  subjects.filter((s) => s.length > 2 && s.length <= 40 && !s.includes(':') && !/^\d/.test(s));

function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function getStats(year: number, now: Date = new Date()): ReadingStats {
  const rows = repo.listAllBookRows();
  const read = rows.filter((b) => b.status === 'lido');
  const yearDays = repo.pagesByDay(`${year}-01-01`, `${year}-12-31`);
  const last30 = repo.pagesByDay(toDateKey(addDays(now, -29)), toDateKey(now));
  const days = repo.allReadingDays();

  const byYear = new Map<number, number>();
  for (const b of read) {
    if (b.finishedAt)
      byYear.set(Number(b.finishedAt.slice(0, 4)), (byYear.get(Number(b.finishedAt.slice(0, 4))) ?? 0) + 1);
  }
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);

  return {
    year,
    booksFinished: repo.countFinishedInYear(year),
    pagesRead: yearDays.reduce((sum, d) => sum + d.pages, 0),
    pagesPerDay: Math.round((last30.reduce((sum, d) => sum + d.pages, 0) / 30) * 10) / 10,
    streak: computeStreak(days, now),
    readingToday: days.includes(toDateKey(now)),
    booksByYear: [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([y, count]) => ({ year: y, count })),
    pagesByMonth: months.map((month) => ({
      month,
      pages: yearDays.filter((d) => d.date.startsWith(month)).reduce((sum, d) => sum + d.pages, 0),
    })),
    topSubjects: topCounts(
      rows.filter((b) => b.status !== 'quero_ler').flatMap((b) => cleanSubjects(b.subjects).slice(0, 6)),
      8,
    ),
    topAuthors: topCounts(
      read.flatMap((b) => b.authors),
      8,
    ),
  };
}

// ===== Busca e recomendações =====

export const searchCatalog = (query: string) => {
  if (query.trim().length < 2) throw badRequest('Digite pelo menos 2 letras.');
  return searchBooks(query.trim());
};

export const listRecommendations = () => repo.listRecommendations();

const GENRE_WORDS = [
  'fiction',
  'fantasy',
  'romance',
  'history',
  'science',
  'biography',
  'mystery',
  'thriller',
  'philosophy',
  'psychology',
  'business',
  'poetry',
  'horror',
  'classic',
  'adventure',
  'self-help',
  'ficção',
  'história',
  'romance',
];

const normalizeTitle = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

/**
 * Recomendações sem IA: usa os assuntos dos livros com nota 4 ou 5 para buscar
 * outros livros na Open Library, sem repetir o que já está na estante.
 */
export async function refreshRecommendations(): Promise<{ items: BookRecommendation[]; message: string }> {
  const rows = repo.listAllBookRows();
  const favorites = rows.filter((b) => (b.rating ?? 0) >= 4);
  const base = favorites.length ? favorites : rows.filter((b) => b.status === 'lido' || b.status === 'lendo');
  if (base.length === 0) {
    return {
      items: [],
      message: 'Avalie com 4 ou 5 estrelas alguns livros que você leu e a Polaris encontra outros parecidos.',
    };
  }

  const subjectBooks = new Map<string, string[]>();
  for (const book of base) {
    for (const subject of cleanSubjects(book.subjects).slice(0, 8)) {
      const key = subject.toLowerCase();
      subjectBooks.set(key, [...(subjectBooks.get(key) ?? []), book.title]);
    }
  }
  // Assuntos de gênero ("fantasy", "romance"...) rendem sugestões melhores que detalhes da história.
  const genreBonus = (subject: string) => (GENRE_WORDS.some((w) => subject.includes(w)) ? 5 : 0);
  const subjects = [...subjectBooks.entries()]
    .sort((a, b) => b[1].length * 10 + genreBonus(b[0]) - (a[1].length * 10 + genreBonus(a[0])))
    .slice(0, 4);
  if (subjects.length === 0) {
    return {
      items: [],
      message:
        'Seus livros favoritos ainda não têm assuntos cadastrados. Adicione livros pela busca da Open Library.',
    };
  }

  const shelfKeys = new Set(rows.map((b) => b.openLibraryKey).filter(Boolean));
  const shelfTitles = new Set(rows.map((b) => normalizeTitle(b.title)));
  const dismissed = repo.dismissedRecommendationKeys();
  const candidates = new Map<string, { result: BookSearchResult; score: number; reason: string }>();
  let failures = 0;

  for (const [subject, titles] of subjects) {
    const hub = await getBooksBySubject(subject);
    if (!hub.data) {
      failures += 1;
      continue;
    }
    for (const result of hub.data) {
      if (
        shelfKeys.has(result.key) ||
        shelfTitles.has(normalizeTitle(result.title)) ||
        dismissed.has(result.key)
      )
        continue;
      const current = candidates.get(result.key);
      const reason = `Porque você gostou de "${titles[0]}" e de livros sobre ${subject}.`;
      candidates.set(result.key, {
        result,
        score: (current?.score ?? 0) + titles.length * 10 + (result.coverUrl ? 2 : 0),
        reason: current?.reason ?? reason,
      });
    }
  }

  if (candidates.size === 0 && failures === subjects.length) {
    return {
      items: repo.listRecommendations(),
      message: 'A Open Library não respondeu agora. Tente de novo mais tarde.',
    };
  }

  const top = [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, 12);
  repo.replaceRecommendations(
    top.map(({ result, score, reason }) => ({
      title: result.title,
      authors: result.authors,
      openLibraryKey: result.key,
      coverUrl: result.coverUrl,
      publishYear: result.publishYear,
      pageCount: result.pageCount,
      subjects: result.subjects,
      reason,
      source: 'openlibrary' as const,
      score,
    })),
  );
  const items = repo.listRecommendations();
  return { items, message: `${items.length} sugestões encontradas a partir dos seus livros favoritos.` };
}

export function dismissRecommendation(id: string): void {
  if (!repo.dismissRecommendation(id)) throw notFound('Recomendação não encontrada.');
}

/** "Adicionar à estante" a partir de uma recomendação. */
export async function addRecommendationToShelf(id: string): Promise<Book> {
  const rec = repo.getRecommendation(id);
  if (!rec) throw notFound('Recomendação não encontrada.');
  const book = await createBook({
    title: rec.title,
    authors: rec.authors,
    openLibraryKey: rec.openLibraryKey,
    coverUrl: rec.coverUrl,
    pageCount: rec.pageCount,
    subjects: rec.subjects,
    publishYear: rec.publishYear,
    status: 'quero_ler',
  });
  repo.dismissRecommendation(id);
  return book;
}
