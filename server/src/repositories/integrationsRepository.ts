import type { LogLevel } from '@polaris/shared';
import { and, desc, eq, inArray, lt } from 'drizzle-orm';
import { db } from '../db/client';
import { integrationLogs, integrations } from '../db/schema';

export type IntegrationState = typeof integrations.$inferSelect;
export type IntegrationStatePatch = Partial<Omit<IntegrationState, 'id' | 'integrationId' | 'createdAt'>>;

export function listIntegrationStates(): IntegrationState[] {
  return db.select().from(integrations).all();
}

export function getIntegrationState(integrationId: string): IntegrationState | undefined {
  return db.select().from(integrations).where(eq(integrations.integrationId, integrationId)).get();
}

/** Cria ou atualiza o estado de uma integração. */
export function saveIntegrationState(integrationId: string, patch: IntegrationStatePatch): IntegrationState {
  const existing = getIntegrationState(integrationId);
  if (existing) {
    return db
      .update(integrations)
      .set(patch)
      .where(eq(integrations.integrationId, integrationId))
      .returning()
      .get();
  }
  return db
    .insert(integrations)
    .values({ integrationId, ...patch })
    .returning()
    .get();
}

export function addIntegrationLog(
  integrationId: string,
  level: LogLevel,
  action: string,
  message: string,
  details?: unknown,
): void {
  db.insert(integrationLogs).values({ integrationId, level, action, message, details }).run();
}

export function listIntegrationLogs(integrationId: string, limit = 100) {
  return db
    .select()
    .from(integrationLogs)
    .where(eq(integrationLogs.integrationId, integrationId))
    .orderBy(desc(integrationLogs.createdAt))
    .limit(limit)
    .all();
}

/** Mantém só os últimos `keep` eventos de cada integração. */
export function pruneIntegrationLogs(integrationId: string, keep = 300): void {
  const ids = db
    .select({ id: integrationLogs.id })
    .from(integrationLogs)
    .where(eq(integrationLogs.integrationId, integrationId))
    .orderBy(desc(integrationLogs.createdAt))
    .all()
    .slice(keep)
    .map((row) => row.id);
  for (let i = 0; i < ids.length; i += 500) {
    db.delete(integrationLogs)
      .where(
        and(
          eq(integrationLogs.integrationId, integrationId),
          inArray(integrationLogs.id, ids.slice(i, i + 500)),
        ),
      )
      .run();
  }
}

/** Apaga eventos mais antigos que a data informada. */
export function deleteLogsBefore(isoDate: string): void {
  db.delete(integrationLogs).where(lt(integrationLogs.createdAt, isoDate)).run();
}
