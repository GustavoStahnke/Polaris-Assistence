import { newsFeedInputSchema, type NewsFeed } from '@polaris/shared';
import { badRequest, notFound, parseInput, parsePatch } from '../lib/http';
import { clearCachePrefix } from '../repositories/cacheRepository';
import * as newsRepository from '../repositories/newsRepository';
import { validateFeedUrl } from './integrationService';

// Feeds de notícias (a lista fica no banco; a busca das notícias passa pelo hub).

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
