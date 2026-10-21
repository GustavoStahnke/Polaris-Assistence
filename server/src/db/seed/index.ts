import { getModality, type ModalityId } from '@polaris/shared';
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

  // Por modalidade: assim uma modalidade nova ganha seus exercícios mesmo num banco já em uso.
  for (const modality of Object.keys(SEED_EXERCISES) as ModalityId[]) {
    const items = SEED_EXERCISES[modality] ?? [];
    const existing =
      db.select({ total: count() }).from(exercises).where(eq(exercises.modality, modality)).get()?.total ?? 0;
    if (items.length && existing === 0) {
      db.insert(exercises)
        .values(items.map((e) => ({ ...e, modality })))
        .run();
      done.push(`${items.length} exercícios de ${getModality(modality).name}`);
    }
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
