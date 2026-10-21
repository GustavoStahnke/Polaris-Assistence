import { count, eq } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { db } from '../client';
import { exercises, habits, newsFeeds, settings } from '../schema';
import { SEED_EXERCISES } from './exercises';
import { SEED_FEEDS } from './feeds';

const SEED_HABITS = [
  { name: 'Beber água', icon: 'Droplets', autoKey: null, sortOrder: 0 },
  { name: 'Leitura', icon: 'BookOpen', autoKey: 'leitura' as const, sortOrder: 1 },
  { name: 'Treino', icon: 'Dumbbell', autoKey: 'treino' as const, sortOrder: 2 },
  { name: 'Dormir bem', icon: 'Moon', autoKey: null, sortOrder: 3 },
  { name: 'Meditação', icon: 'Brain', autoKey: null, sortOrder: 4 },
];

const isEmpty = (table: SQLiteTable) => (db.select({ total: count() }).from(table).get()?.total ?? 0) === 0;

/**
 * Dados iniciais. Só insere quando a tabela está vazia, então pode rodar a cada start
 * sem duplicar nada e sem mexer no que o usuário já cadastrou.
 */
export function runSeed(): string[] {
  const done: string[] = [];

  if (isEmpty(exercises)) {
    db.insert(exercises).values(SEED_EXERCISES).run();
    done.push(`${SEED_EXERCISES.length} exercícios`);
  }
  if (isEmpty(habits)) {
    db.insert(habits).values(SEED_HABITS).run();
    done.push(`${SEED_HABITS.length} hábitos`);
  }
  if (isEmpty(newsFeeds)) {
    db.insert(newsFeeds).values(SEED_FEEDS).run();
    done.push(`${SEED_FEEDS.length} feeds de notícias`);
  }
  if (!db.select().from(settings).where(eq(settings.key, 'profile')).get()) {
    db.insert(settings)
      .values({ key: 'profile', value: { name: '', callName: '', city: '' } })
      .run();
    done.push('perfil');
  }
  return done;
}
