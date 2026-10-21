import type { EmailCategory, TriageSource } from '@polaris/shared';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { idColumn, timestamps } from './common';

export const newsFeeds = sqliteTable('news_feeds', {
  id: idColumn(),
  title: text('title').notNull(),
  url: text('url').notNull().unique(),
  category: text('category').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  lastFetchedAt: text('last_fetched_at'),
  lastError: text('last_error'),
  ...timestamps(),
});

export const savedArticles = sqliteTable('saved_articles', {
  id: idColumn(),
  link: text('link').notNull().unique(),
  title: text('title').notNull(),
  source: text('source'),
  category: text('category'),
  imageUrl: text('image_url'),
  summary: text('summary'),
  publishedAt: text('published_at'),
  ...timestamps(),
});

export const readArticles = sqliteTable('read_articles', {
  id: idColumn(),
  link: text('link').notNull().unique(),
  ...timestamps(),
});

/** Classificação de cada e-mail (ID da mensagem do Gmail). */
export const emailTriage = sqliteTable('email_triage', {
  id: idColumn(),
  messageId: text('message_id').notNull().unique(),
  category: text('category').$type<EmailCategory>().notNull(),
  source: text('source').$type<TriageSource>().notNull(),
  reason: text('reason'),
  ...timestamps(),
});

export const vipSenders = sqliteTable('vip_senders', {
  id: idColumn(),
  email: text('email').notNull().unique(),
  name: text('name'),
  ...timestamps(),
});
