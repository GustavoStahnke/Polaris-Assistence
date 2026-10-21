import { newsFeedInputSchema, saveArticleSchema, type NewsFeed, type NewsResponse } from '@polaris/shared';
import { badRequest, notFound, parseInput, parsePatch } from '../lib/http';
import { clearCachePrefix } from '../repositories/cacheRepository';
import * as newsRepository from '../repositories/newsRepository';
import { getNews, validateFeedUrl } from './integrationService';

// Notícias: os feeds ficam no banco; a busca das notícias passa pelo hub (integração RSS).

export const listFeeds = () => newsRepository.listFeeds();

/** Adiciona um feed depois de validar que ele responde. */
export async function addFeed(input: unknown): Promise<NewsFeed> {
  const data = parseInput(newsFeedInputSchema, input);
  if (newsRepository.getFeedByUrl(data.url)) throw badRequest('Esse feed já está na lista.');
  const validation = await validateFeedUrl(data.url);
  if (!validation.ok) throw badRequest(`Feed inválido: ${validation.message}`);
  const feed = newsRepository.createFeed(data);
  clearCachePrefix('news:');
  return feed;
}

export function updateFeed(id: string, input: unknown): NewsFeed {
  const patch = parsePatch(newsFeedInputSchema.partial(), input);
  const feed = newsRepository.updateFeed(id, patch);
  if (!feed) throw notFound('Feed não encontrado.');
  clearCachePrefix('news:');
  return feed;
}

export function removeFeed(id: string): void {
  if (!newsRepository.deleteFeed(id)) throw notFound('Feed não encontrado.');
  clearCachePrefix('news:');
}

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Notícias de todos os feeds, com filtro por categoria e palavra-chave. */
export async function getNewsFeed(
  filter: { category?: string; query?: string; unreadOnly?: boolean; force?: boolean } = {},
): Promise<NewsResponse> {
  const hub = await getNews({ force: filter.force });
  const read = newsRepository.listReadLinks();
  const saved = new Set(newsRepository.listSaved().map((s) => s.link));
  const all = hub.data ?? [];
  const query = filter.query ? normalize(filter.query.trim()) : '';
  const items = all
    .filter((item) => !filter.category || item.category === filter.category)
    .filter((item) => !query || normalize(`${item.title} ${item.summary}`).includes(query))
    .filter((item) => !filter.unreadOnly || !read.has(item.link))
    .map((item) => ({ ...item, read: read.has(item.link), saved: saved.has(item.link) }));
  return {
    state: hub.state,
    error: hub.error,
    fetchedAt: hub.fetchedAt,
    categories: [...new Set(all.map((i) => i.category))].sort(),
    items,
  };
}

export function markRead(link: unknown, read = true): void {
  if (typeof link !== 'string' || !link) throw badRequest('Informe o link da notícia.');
  if (read) newsRepository.markRead(link);
  else newsRepository.unmarkRead(link);
}

export const listSaved = () => newsRepository.listSaved();

export function saveArticle(input: unknown) {
  return newsRepository.saveArticle(parseInput(saveArticleSchema, input));
}

export function removeSaved(id: string) {
  if (!newsRepository.deleteSaved(id)) throw notFound('Notícia salva não encontrada.');
}
