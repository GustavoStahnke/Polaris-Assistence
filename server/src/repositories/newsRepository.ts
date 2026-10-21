import type { NewsFeed, NewsFeedInput, SaveArticleInput, SavedArticle } from '@polaris/shared';
import { asc, desc, eq, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { newsFeeds, readArticles, savedArticles } from '../db/schema';

const toFeed = (row: typeof newsFeeds.$inferSelect): NewsFeed => ({
  id: row.id,
  title: row.title,
  url: row.url,
  category: row.category,
  enabled: row.enabled,
  lastFetchedAt: row.lastFetchedAt,
  lastError: row.lastError,
});

export function listFeeds(options: { enabledOnly?: boolean } = {}): NewsFeed[] {
  const rows = db.select().from(newsFeeds).orderBy(asc(newsFeeds.category), asc(newsFeeds.title)).all();
  return rows.map(toFeed).filter((feed) => !options.enabledOnly || feed.enabled);
}

export function getFeedByUrl(url: string): NewsFeed | undefined {
  const row = db.select().from(newsFeeds).where(eq(newsFeeds.url, url)).get();
  return row ? toFeed(row) : undefined;
}

export function getFeed(id: string): NewsFeed | undefined {
  const row = db.select().from(newsFeeds).where(eq(newsFeeds.id, id)).get();
  return row ? toFeed(row) : undefined;
}

export function createFeed(input: NewsFeedInput): NewsFeed {
  return toFeed(db.insert(newsFeeds).values(input).returning().get());
}

export function updateFeed(id: string, patch: Partial<NewsFeedInput>): NewsFeed | undefined {
  const row = db.update(newsFeeds).set(patch).where(eq(newsFeeds.id, id)).returning().get();
  return row ? toFeed(row) : undefined;
}

export function deleteFeed(id: string): boolean {
  return db.delete(newsFeeds).where(eq(newsFeeds.id, id)).run().changes > 0;
}

export function markFeedFetch(id: string, error: string | null, at: string = new Date().toISOString()): void {
  db.update(newsFeeds).set({ lastFetchedAt: at, lastError: error }).where(eq(newsFeeds.id, id)).run();
}

// ===== Lidas e salvas =====

export function listReadLinks(): Set<string> {
  return new Set(
    db
      .select({ link: readArticles.link })
      .from(readArticles)
      .all()
      .map((r) => r.link),
  );
}

export function markRead(link: string): void {
  db.insert(readArticles).values({ link }).onConflictDoNothing().run();
}

export function unmarkRead(link: string): void {
  db.delete(readArticles).where(eq(readArticles.link, link)).run();
}

const toSaved = (row: typeof savedArticles.$inferSelect): SavedArticle => ({
  id: row.id,
  link: row.link,
  title: row.title,
  source: row.source,
  category: row.category,
  imageUrl: row.imageUrl,
  summary: row.summary,
  publishedAt: row.publishedAt,
  createdAt: row.createdAt,
});

export function listSaved(): SavedArticle[] {
  return db.select().from(savedArticles).orderBy(desc(savedArticles.createdAt)).all().map(toSaved);
}

export function saveArticle(input: SaveArticleInput): SavedArticle {
  const row = db
    .insert(savedArticles)
    .values({
      link: input.link,
      title: input.title,
      source: input.source ?? null,
      category: input.category ?? null,
      imageUrl: input.imageUrl ?? null,
      summary: input.summary ?? null,
      publishedAt: input.publishedAt ?? null,
    })
    .onConflictDoNothing()
    .returning()
    .get();
  return row
    ? toSaved(row)
    : toSaved(db.select().from(savedArticles).where(eq(savedArticles.link, input.link)).get()!);
}

export function deleteSaved(id: string): boolean {
  return db.delete(savedArticles).where(eq(savedArticles.id, id)).run().changes > 0;
}

/** Limpa registros de "lida" com mais de 60 dias (as notícias já saíram dos feeds). */
export function pruneReadBefore(isoDate: string): void {
  db.delete(readArticles).where(lt(readArticles.createdAt, isoDate)).run();
}
