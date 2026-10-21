import type { NewsItem } from '@polaris/shared';
import { z } from 'zod';
import { listFeeds, markFeedFetch } from '../../repositories/newsRepository';
import { describeError, ExternalServiceError } from '../http';
import { defineIntegration, type DataSource } from '../types';
import { fetchFeed, mergeNews, toNewsItems } from './api';

export const rssConfigSchema = z.object({
  maxPerFeed: z
    .number()
    .int()
    .min(5)
    .max(50)
    .default(20)
    .meta({ title: 'Notícias por feed', description: 'Quantas notícias pegar de cada feed (5 a 50).' }),
});
export type RssConfig = z.infer<typeof rssConfigSchema>;

/** Busca todos os feeds ativos. Se só alguns falharem, segue com os outros. */
async function fetchAllNews(config: RssConfig): Promise<NewsItem[]> {
  const feeds = listFeeds({ enabledOnly: true });
  if (feeds.length === 0)
    throw new ExternalServiceError('Nenhum feed ativo. Adicione feeds em Integrações › RSS.');
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const parsed = await fetchFeed(feed.url);
      return toNewsItems(feed, parsed.items, config.maxPerFeed);
    }),
  );
  const lists: NewsItem[][] = [];
  results.forEach((result, i) => {
    const feed = feeds[i]!;
    if (result.status === 'fulfilled') {
      lists.push(result.value);
      markFeedFetch(feed.id, null);
    } else {
      markFeedFetch(feed.id, describeError(result.reason));
    }
  });
  if (lists.length === 0) throw new ExternalServiceError('Nenhum feed respondeu. Verifique a internet.');
  return mergeNews(lists).slice(0, 400);
}

/** Todas as notícias juntas (cache de 60 minutos). */
export const newsSource: DataSource<RssConfig, NewsItem[]> = {
  key: (config) => `news:all:${config.maxPerFeed}`,
  ttlMinutes: 60,
  fetch: ({ config }) => fetchAllNews(config),
};

export const rss = defineIntegration<RssConfig>({
  id: 'rss',
  name: 'Feeds de notícias (RSS)',
  category: 'noticias',
  description: 'Junta as notícias dos seus sites favoritos, organizadas por categoria.',
  icon: 'Rss',
  authType: 'none',
  availability: 'available',
  free: true,
  configSchema: rssConfigSchema,
  syncIntervalMinutes: 60,
  defaultEnabled: true,
  panels: ['feed-list'],
  async test() {
    const feeds = listFeeds({ enabledOnly: true });
    if (feeds.length === 0) return { ok: false, message: 'Nenhum feed ativo para testar.' };
    const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed.url)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    results.forEach((r, i) =>
      markFeedFetch(feeds[i]!.id, r.status === 'rejected' ? describeError(r.reason) : null),
    );
    if (ok === 0) return { ok: false, message: 'Nenhum feed respondeu.' };
    return { ok: true, message: `${ok} de ${feeds.length} feeds respondendo.` };
  },
  async sync(ctx) {
    const news = await ctx.refresh(newsSource, undefined);
    return { message: `${news.length} notícias atualizadas.`, items: news.length };
  },
});
