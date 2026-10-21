import type { NewsFeed, NewsFeedInput } from '@polaris/shared';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { newsFeeds } from '../db/schema';

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
