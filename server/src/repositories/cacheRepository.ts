import { eq, like } from 'drizzle-orm';
import { db } from '../db/client';
import { cacheEntries } from '../db/schema';

export interface CacheEntry<T> {
  value: T;
  fetchedAt: string;
  expiresAt: string;
}

export function readCache<T>(key: string): CacheEntry<T> | null {
  const row = db.select().from(cacheEntries).where(eq(cacheEntries.key, key)).get();
  if (!row) return null;
  return { value: row.value as T, fetchedAt: row.fetchedAt, expiresAt: row.expiresAt };
}

export function writeCache(key: string, value: unknown, fetchedAt: string, expiresAt: string): void {
  db.insert(cacheEntries)
    .values({ key, value, fetchedAt, expiresAt })
    .onConflictDoUpdate({
      target: cacheEntries.key,
      set: { value, fetchedAt, expiresAt, updatedAt: new Date().toISOString() },
    })
    .run();
}

/** Apaga as entradas cuja chave começa com o prefixo (ex.: 'weather:'). */
export function clearCachePrefix(prefix: string): void {
  db.delete(cacheEntries)
    .where(like(cacheEntries.key, `${prefix}%`))
    .run();
}
