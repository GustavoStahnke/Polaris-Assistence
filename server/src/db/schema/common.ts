import { text } from 'drizzle-orm/sqlite-core';

/** Data e hora atual em ISO 8601 UTC (texto, portátil para o Postgres na Fase 3). */
export const nowIso = () => new Date().toISOString();

/** Coluna id: UUID em texto, gerado automaticamente. */
export const idColumn = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

/** Colunas created_at e updated_at, presentes em todas as tabelas. */
export const timestamps = () => ({
  createdAt: text('created_at').notNull().$defaultFn(nowIso),
  updatedAt: text('updated_at').notNull().$defaultFn(nowIso).$onUpdateFn(nowIso),
});
