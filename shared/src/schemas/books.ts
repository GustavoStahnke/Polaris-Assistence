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
