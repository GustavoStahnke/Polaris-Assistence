import type { AiRole } from '@polaris/shared';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { idColumn, timestamps } from './common';

export const aiConversations = sqliteTable('ai_conversations', {
  id: idColumn(),
  title: text('title').notNull().default('Nova conversa'),
  ...timestamps(),
});

export const aiMessages = sqliteTable(
  'ai_messages',
  {
    id: idColumn(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: text('role').$type<AiRole>().notNull(),
    content: text('content').notNull(),
    model: text('model'),
    ...timestamps(),
  },
  (t) => [index('ai_messages_conversation_idx').on(t.conversationId, t.createdAt)],
);
