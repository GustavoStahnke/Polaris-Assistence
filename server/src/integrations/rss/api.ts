import type { NewsFeed, NewsFeedValidation, NewsItem } from '@polaris/shared';
import { createHash } from 'node:crypto';
import Parser from 'rss-parser';
import { describeError, ExternalServiceError, getText } from '../http';

interface MediaNode {
  $?: { url?: string; medium?: string; type?: string };
}

interface CustomItem {
  mediaContent?: MediaNode[];
  mediaThumbnail?: MediaNode | MediaNode[];
  contentEncoded?: string;
}

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

type ParsedItem = Parser.Item & CustomItem;

/** Baixa e interpreta um feed RSS/Atom. */
export async function fetchFeed(url: string): Promise<{ title: string; items: ParsedItem[] }> {
  const xml = await getText(url, {
    timeoutMs: 15_000,
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
  });
  try {
    const feed = await parser.parseString(xml);
    return { title: feed.title?.trim() ?? '', items: feed.items };
  } catch {
    throw new ExternalServiceError('O endereço respondeu, mas não é um feed RSS válido.');
  }
}

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)(\?|$)/i;

function extractImage(item: ParsedItem): string | null {
  if (
    item.enclosure?.url &&
    (item.enclosure.type?.startsWith('image') || IMAGE_EXT.test(item.enclosure.url))
  ) {
    return item.enclosure.url;
  }
  const media = item.mediaContent?.find(
    (m) => m.$?.url && (m.$.medium === 'image' || m.$.type?.startsWith('image') || IMAGE_EXT.test(m.$.url)),
  );
  if (media?.$?.url) return media.$.url;
  const thumbs = Array.isArray(item.mediaThumbnail)
    ? item.mediaThumbnail
    : item.mediaThumbnail
      ? [item.mediaThumbnail]
      : [];
  if (thumbs[0]?.$?.url) return thumbs[0].$.url;
  const html = item.contentEncoded ?? item.content ?? '';
  const img = /<img[^>]+src=["']([^"']+)["']/i.exec(html);
  return img?.[1] && img[1].startsWith('http') ? img[1] : null;
}

const stripHtml = (text: string) =>
  text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Link sem parâmetros de rastreamento (utm_...), para comparar duplicadas. */
export function normalizeLink(link: string): string {
  try {
    const url = new URL(link);
    for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return link.trim();
  }
}

const normalizeTitle = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const articleId = (link: string) =>
  createHash('sha1').update(normalizeLink(link)).digest('hex').slice(0, 16);

/** Converte os itens de um feed para o formato do Polaris. */
export function toNewsItems(feed: NewsFeed, items: ParsedItem[], max: number): NewsItem[] {
  return items
    .filter((item) => item.link && item.title)
    .slice(0, max)
    .map((item) => {
      const summary = stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? '');
      const date = item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null);
      return {
        id: articleId(item.link!),
        title: stripHtml(item.title!),
        link: normalizeLink(item.link!),
        summary: summary.length > 240 ? `${summary.slice(0, 237)}…` : summary,
        imageUrl: extractImage(item),
        publishedAt: date && !Number.isNaN(Date.parse(date)) ? date : null,
        source: feed.title,
        category: feed.category,
        feedId: feed.id,
      };
    });
}

/** Junta as notícias, remove repetidas (mesmo link ou mesmo título) e ordena pela mais recente. */
export function mergeNews(lists: NewsItem[][]): NewsItem[] {
  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: NewsItem[] = [];
  for (const item of lists.flat()) {
    const titleKey = normalizeTitle(item.title);
    if (seenLinks.has(item.link) || seenTitles.has(titleKey)) continue;
    seenLinks.add(item.link);
    seenTitles.add(titleKey);
    merged.push(item);
  }
  return merged.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

/** Testa um endereço de feed antes de salvar. */
export async function validateFeed(url: string): Promise<NewsFeedValidation> {
  try {
    const feed = await fetchFeed(url);
    if (feed.items.length === 0) {
      return { ok: false, title: feed.title || null, items: 0, message: 'O feed respondeu, mas está vazio.' };
    }
    return {
      ok: true,
      title: feed.title || null,
      items: feed.items.length,
      message: `Feed válido: ${feed.items.length} notícias encontradas.`,
    };
  } catch (error) {
    return { ok: false, title: null, items: 0, message: describeError(error) };
  }
}
