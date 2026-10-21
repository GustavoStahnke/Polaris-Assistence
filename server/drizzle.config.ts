import { defineConfig } from 'drizzle-kit';

// Configuração do drizzle-kit (gerar migrações e abrir o visualizador do banco).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: '../data/polaris.db' },
});
