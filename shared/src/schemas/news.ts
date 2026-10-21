import { z } from 'zod';

export const NEWS_CATEGORIES_SUGGESTED = [
  'Brasil',
  'Tecnologia',
  'IA',
  'Economia',
  'Mundo',
  'Ciência',
  'Esportes',
];

export interface NewsFeed {
  id: string;
  title: string;
  url: string;
  category: string;
  enabled: boolean;
  lastFetchedAt: string | null;
  lastError: string | null;
}

export const newsFeedInputSchema = z.object({
  title: z.string().trim().min(1, 'Dê um nome ao feed.').max(80),
  url: z.url('Informe um endereço válido (começando com https://).'),
  category: z.string().trim().min(1, 'Escolha uma categoria.').max(40),
  enabled: z.boolean().default(true),
});
export type NewsFeedInput = z.infer<typeof newsFeedInputSchema>;

export interface NewsItem {
  /** Identificador estável (derivado do link). */
  id: string;
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string | null;
  source: string;
  category: string;
  feedId: string;
}

export interface NewsFeedValidation {
  ok: boolean;
  title: string | null;
  items: number;
  message: string;
}

/** Notícia com o estado do usuário (lida / salva). */
export interface NewsItemView extends NewsItem {
  read: boolean;
  saved: boolean;
}

export interface NewsResponse {
  state: 'ok' | 'stale' | 'error' | 'not_configured' | 'disabled';
  error: string | null;
  fetchedAt: string | null;
  categories: string[];
  items: NewsItemView[];
}

export interface SavedArticle {
  id: string;
  link: string;
  title: string;
  source: string | null;
  category: string | null;
  imageUrl: string | null;
  summary: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export const saveArticleSchema = z.object({
  link: z.url(),
  title: z.string().trim().min(1).max(500),
  source: z.string().max(200).nullish(),
  category: z.string().max(60).nullish(),
  imageUrl: z.string().max(2000).nullish(),
  summary: z.string().max(2000).nullish(),
  publishedAt: z.string().nullish(),
});
export type SaveArticleInput = z.infer<typeof saveArticleSchema>;
