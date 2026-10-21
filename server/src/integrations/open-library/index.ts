import type { BookSearchResult } from '@polaris/shared';
import { z } from 'zod';
import { defineIntegration, type DataSource } from '../types';
import { searchBooks, searchBySubject } from './api';

export const openLibraryConfigSchema = z.object({});
export type OpenLibraryConfig = z.infer<typeof openLibraryConfigSchema>;

/** Busca de livros (cache de 1 dia por pesquisa). */
export const bookSearchSource: DataSource<OpenLibraryConfig, BookSearchResult[], string> = {
  key: (_config, query) => `books:search:${query.trim().toLowerCase()}`,
  ttlMinutes: 24 * 60,
  fetch: (_ctx, query) => searchBooks(query),
};

/** Livros por assunto (cache de 1 semana). */
export const subjectSource: DataSource<OpenLibraryConfig, BookSearchResult[], string> = {
  key: (_config, subject) => `books:subject:${subject.trim().toLowerCase()}`,
  ttlMinutes: 7 * 24 * 60,
  fetch: (_ctx, subject) => searchBySubject(subject),
};

export const openLibrary = defineIntegration<OpenLibraryConfig>({
  id: 'open-library',
  name: 'Open Library',
  category: 'livros',
  description: 'Catálogo aberto de livros: capas, páginas e assuntos para a sua estante.',
  icon: 'Library',
  authType: 'none',
  availability: 'available',
  free: true,
  configSchema: openLibraryConfigSchema,
  defaultEnabled: true,
  async test() {
    const results = await searchBooks('Machado de Assis', 3);
    return {
      ok: results.length > 0,
      message:
        results.length > 0
          ? `Conectado: a busca encontrou "${results[0]!.title}".`
          : 'A busca não retornou livros.',
    };
  },
});
