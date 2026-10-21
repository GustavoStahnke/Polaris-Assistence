import type { LogLevel } from '@polaris/shared';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { idColumn, timestamps } from './common';

/** Configurações gerais em chave/valor (o valor é JSON). */
export const settings = sqliteTable('settings', {
  id: idColumn(),
  key: text('key').notNull().unique(),
  value: text('value', { mode: 'json' }).$type<unknown>(),
  ...timestamps(),
});

/** Estado de cada integração do Hub. Configuração e tokens ficam criptografados. */
export const integrations = sqliteTable('integrations', {
  id: idColumn(),
  integrationId: text('integration_id').notNull().unique(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  configEncrypted: text('config_encrypted'),
  tokensEncrypted: text('tokens_encrypted'),
  lastSyncAt: text('last_sync_at'),
  lastTestAt: text('last_test_at'),
  lastSuccessAt: text('last_success_at'),
  lastError: text('last_error'),
  lastErrorAt: text('last_error_at'),
  /** true quando o token expirou e é preciso reconectar (ex.: Google em modo teste). */
  needsReconnect: integer('needs_reconnect', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
});

/** Histórico de testes, sincronizações e erros das integrações. */
export const integrationLogs = sqliteTable(
  'integration_logs',
  {
    id: idColumn(),
    integrationId: text('integration_id').notNull(),
    level: text('level').$type<LogLevel>().notNull(),
    action: text('action').notNull(),
    message: text('message').notNull(),
    details: text('details', { mode: 'json' }).$type<unknown>(),
    ...timestamps(),
  },
  (t) => [index('integration_logs_integration_idx').on(t.integrationId, t.createdAt)],
);

/** Cache das respostas das integrações, com validade. */
export const cacheEntries = sqliteTable('cache_entries', {
  id: idColumn(),
  key: text('key').notNull().unique(),
  value: text('value', { mode: 'json' }).$type<unknown>(),
  fetchedAt: text('fetched_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  ...timestamps(),
});
