import type { EmailCategory, TriageSource, VipSender } from '@polaris/shared';
import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client';
import { emailTriage, vipSenders } from '../db/schema';

export function listVipSenders(): VipSender[] {
  return db
    .select()
    .from(vipSenders)
    .orderBy(asc(vipSenders.email))
    .all()
    .map((v) => ({ id: v.id, email: v.email, name: v.name }));
}

export const listVipEmails = () => listVipSenders().map((v) => v.email);

export function addVipSender(email: string, name: string | null): VipSender {
  const row = db
    .insert(vipSenders)
    .values({ email, name })
    .onConflictDoUpdate({ target: vipSenders.email, set: { name } })
    .returning()
    .get();
  return { id: row.id, email: row.email, name: row.name };
}

export function deleteVipSender(id: string): boolean {
  return db.delete(vipSenders).where(eq(vipSenders.id, id)).run().changes > 0;
}

export function getTriages(messageIds: string[]) {
  if (messageIds.length === 0)
    return new Map<string, { category: EmailCategory; source: TriageSource; reason: string | null }>();
  const rows = db.select().from(emailTriage).where(inArray(emailTriage.messageId, messageIds)).all();
  return new Map(
    rows.map((r) => [r.messageId, { category: r.category, source: r.source, reason: r.reason }]),
  );
}

export function saveTriage(
  messageId: string,
  category: EmailCategory,
  source: TriageSource,
  reason: string | null,
): void {
  db.insert(emailTriage)
    .values({ messageId, category, source, reason })
    .onConflictDoUpdate({
      target: emailTriage.messageId,
      set: { category, source, reason, updatedAt: new Date().toISOString() },
    })
    .run();
}
