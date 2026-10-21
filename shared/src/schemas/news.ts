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
