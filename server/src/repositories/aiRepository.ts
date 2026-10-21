import type { AiConversation, AiMessage, AiRole } from '@polaris/shared';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { aiConversations, aiMessages } from '../db/schema';

const toMessage = (row: typeof aiMessages.$inferSelect): AiMessage => ({
  id: row.id,
  conversationId: row.conversationId,
  role: row.role,
  content: row.content,
  createdAt: row.createdAt,
});

export function listConversations(): AiConversation[] {
  return db
    .select()
    .from(aiConversations)
    .orderBy(desc(aiConversations.updatedAt))
    .all()
    .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }));
}

export function getConversation(id: string): AiConversation | undefined {
  const row = db.select().from(aiConversations).where(eq(aiConversations.id, id)).get();
  if (!row) return undefined;
  return { id: row.id, title: row.title, updatedAt: row.updatedAt, messages: listMessages(id) };
}

export function createConversation(title: string): string {
  return db.insert(aiConversations).values({ title }).returning({ id: aiConversations.id }).get().id;
}

export function touchConversation(id: string): void {
  db.update(aiConversations)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(aiConversations.id, id))
    .run();
}

export function deleteConversation(id: string): boolean {
  return db.delete(aiConversations).where(eq(aiConversations.id, id)).run().changes > 0;
}

export function listMessages(conversationId: string): AiMessage[] {
  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt))
    .all()
    .map(toMessage);
}

export function addMessage(
  conversationId: string,
  role: AiRole,
  content: string,
  model: string | null = null,
): AiMessage {
  return toMessage(db.insert(aiMessages).values({ conversationId, role, content, model }).returning().get());
}
