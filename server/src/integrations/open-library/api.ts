import type { BookSearchResult } from '@polaris/shared';
import { getJson, httpRequest } from '../http';

const BASE = 'https://openlibrary.org';
const FIELDS =
  'key,title,subtitle,author_name,first_publish_year,number_of_pages_median,cover_i,isbn,subject';

interface SearchDoc {
  key: string;
  title: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  isbn?: string[];
  subject?: string[];
}

export const coverUrlFromId = (coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M') =>
  coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : null;

const toResult = (doc: SearchDoc): BookSearchResult => ({
  key: doc.key,
  title: doc.title,
  subtitle: doc.subtitle ?? null,
  authors: doc.author_name?.slice(0, 4) ?? [],
  publishYear: doc.first_publish_year ?? null,
  pageCount: doc.number_of_pages_median ?? null,
  coverUrl: coverUrlFromId(doc.cover_i, 'L'),
  isbn: doc.isbn?.find((i) => i.length === 13) ?? doc.isbn?.[0] ?? null,
  subjects: (doc.subject ?? []).slice(0, 12),
});

/** Busca por título, autor ou ISBN. */
export async function searchBooks(query: string, limit = 12): Promise<BookSearchResult[]> {
  const digits = query.replace(/[-\s]/g, '');
  const isIsbn = /^(\d{9}[\dXx]|\d{13})$/.test(digits);
  const url = new URL(`${BASE}/search.json`);
  url.searchParams.set('q', isIsbn ? `isbn:${digits}` : query);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields', FIELDS);
  const data = await getJson<{ docs: SearchDoc[] }>(url.toString(), { timeoutMs: 20_000 });
  return data.docs.map(toResult);
}

/** Livros de um assunto (usado nas recomendações). */
export async function searchBySubject(subject: string, limit = 20): Promise<BookSearchResult[]> {
  const url = new URL(`${BASE}/search.json`);
  url.searchParams.set('subject', subject);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('sort', 'rating');
  url.searchParams.set('fields', FIELDS);
  const data = await getJson<{ docs: SearchDoc[] }>(url.toString(), { timeoutMs: 20_000 });
  return data.docs.map(toResult);
}

/** Sinopse de uma obra (quando existir). */
export async function fetchWorkDescription(workKey: string): Promise<string | null> {
  if (!/^\/works\/OL\d+W$/.test(workKey)) return null;
  const data = await getJson<{ description?: string | { value?: string } }>(`${BASE}${workKey}.json`);
  const description = typeof data.description === 'string' ? data.description : data.description?.value;
  return description?.trim() || null;
}

/** Baixa a imagem de uma capa. */
export async function downloadCover(url: string): Promise<Buffer> {
  const response = await httpRequest(url, { timeoutMs: 20_000 });
  return Buffer.from(await response.arrayBuffer());
}
