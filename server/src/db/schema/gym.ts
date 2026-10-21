import type { PrType } from '@polaris/shared';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { idColumn, timestamps } from './common';

export const exercises = sqliteTable('exercises', {
  id: idColumn(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  equipment: text('equipment').notNull(),
  notes: text('notes'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
});

/** Fichas de treino (A, B, C...). weekdays: 0 = domingo ... 6 = sábado. */
export const workoutRoutines = sqliteTable('workout_routines', {
  id: idColumn(),
  name: text('name').notNull(),
  description: text('description'),
  weekdays: text('weekdays', { mode: 'json' }).$type<number[]>().notNull().default([]),
  sortOrder: integer('sort_order').notNull().default(0),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
});

export const routineExercises = sqliteTable(
  'routine_exercises',
  {
    id: idColumn(),
    routineId: text('routine_id')
      .notNull()
      .references(() => workoutRoutines.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull().default(0),
    targetSets: integer('target_sets').notNull().default(3),
    targetReps: text('target_reps').notNull().default('10'),
    targetWeight: real('target_weight'),
    restSeconds: integer('rest_seconds').notNull().default(90),
    notes: text('notes'),
    ...timestamps(),
  },
  (t) => [index('routine_exercises_routine_idx').on(t.routineId)],
);

export const workoutSessions = sqliteTable(
  'workout_sessions',
  {
    id: idColumn(),
    routineId: text('routine_id').references(() => workoutRoutines.id, { onDelete: 'set null' }),
    /** Nome da ficha no momento do treino (continua aparecendo se a ficha for apagada). */
    routineName: text('routine_name'),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    durationSeconds: integer('duration_seconds'),
    totalVolume: real('total_volume'),
    notes: text('notes'),
    ...timestamps(),
  },
  (t) => [index('workout_sessions_started_idx').on(t.startedAt)],
);

export const workoutSets = sqliteTable(
  'workout_sets',
  {
    id: idColumn(),
    sessionId: text('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    setNumber: integer('set_number').notNull(),
    weight: real('weight').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index('workout_sets_session_idx').on(t.sessionId),
    index('workout_sets_exercise_idx').on(t.exerciseId),
  ],
);

export const personalRecords = sqliteTable(
  'personal_records',
  {
    id: idColumn(),
    exerciseId: text('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'cascade' }),
    type: text('type').$type<PrType>().notNull(),
    value: real('value').notNull(),
    weight: real('weight').notNull(),
    reps: integer('reps').notNull(),
    sessionId: text('session_id').references(() => workoutSessions.id, { onDelete: 'set null' }),
    achievedAt: text('achieved_at').notNull(),
    ...timestamps(),
  },
  (t) => [index('personal_records_exercise_idx').on(t.exerciseId, t.type)],
);

/** Peso corporal e medidas (cm), todos opcionais. */
export const bodyMeasurements = sqliteTable('body_measurements', {
  id: idColumn(),
  date: text('date').notNull(),
  weightKg: real('weight_kg'),
  bodyFatPercent: real('body_fat_percent'),
  chestCm: real('chest_cm'),
  waistCm: real('waist_cm'),
  hipsCm: real('hips_cm'),
  armCm: real('arm_cm'),
  thighCm: real('thigh_cm'),
  notes: text('notes'),
  ...timestamps(),
});
