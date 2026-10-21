import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { settings } from '../db/schema';

/** Lê uma configuração (valor JSON). */
export function getSetting<T>(key: string): T | undefined {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value as T | undefined;
}

/** Grava (ou atualiza) uma configuração. */
export function setSetting(key: string, value: unknown): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date().toISOString() } })
    .run();
}
