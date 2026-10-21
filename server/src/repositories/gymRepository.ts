import type {
  ActivityFields,
  BodyMeasurement,
  BodyMeasurementInput,
  Exercise,
  ExerciseInput,
  ModalityId,
  PersonalRecord,
  PrType,
  Routine,
  RoutineInput,
  WorkoutSession,
  WorkoutSessionSummary,
  WorkoutSet,
} from '@polaris/shared';
import { and, asc, count, desc, eq, gte, inArray, isNotNull, isNull, lte } from 'drizzle-orm';
import { db } from '../db/client';
import {
  bodyMeasurements,
  exercises,
  personalRecords,
  routineExercises,
  workoutRoutines,
  workoutSessions,
  workoutSets,
} from '../db/schema';

// ===== Exercícios =====

const toExercise = (row: typeof exercises.$inferSelect): Exercise => ({
  id: row.id,
  name: row.name,
  modality: row.modality,
  muscleGroup: row.muscleGroup,
  equipment: row.equipment,
  measure: row.measure,
  notes: row.notes,
  isCustom: row.isCustom,
});

export function listExercises(): Exercise[] {
  return db
    .select()
    .from(exercises)
    .orderBy(asc(exercises.modality), asc(exercises.muscleGroup), asc(exercises.name))
    .all()
    .map(toExercise);
}

export function getExercise(id: string): Exercise | undefined {
  const row = db.select().from(exercises).where(eq(exercises.id, id)).get();
  return row ? toExercise(row) : undefined;
}

export function createExercise(input: ExerciseInput): Exercise {
  return toExercise(
    db
      .insert(exercises)
      .values({ ...input, notes: input.notes ?? null, isCustom: true })
      .returning()
      .get(),
  );
}

export function updateExercise(id: string, input: Partial<ExerciseInput>): Exercise | undefined {
  const row = db.update(exercises).set(input).where(eq(exercises.id, id)).returning().get();
  return row ? toExercise(row) : undefined;
}

export function countSetsForExercise(exerciseId: string): number {
  return (
    db.select({ total: count() }).from(workoutSets).where(eq(workoutSets.exerciseId, exerciseId)).get()
      ?.total ?? 0
  );
}

export function deleteExercise(id: string): boolean {
  return db.delete(exercises).where(eq(exercises.id, id)).run().changes > 0;
}

// ===== Fichas =====

function loadRoutineExercises(routineIds: string[]) {
  if (routineIds.length === 0) return [];
  return db
    .select({ item: routineExercises, exercise: exercises })
    .from(routineExercises)
    .innerJoin(exercises, eq(exercises.id, routineExercises.exerciseId))
    .where(inArray(routineExercises.routineId, routineIds))
    .orderBy(asc(routineExercises.position))
    .all();
}

function toRoutines(rows: (typeof workoutRoutines.$inferSelect)[]): Routine[] {
  const items = loadRoutineExercises(rows.map((r) => r.id));
  return rows.map((row) => ({
    id: row.id,
    modality: row.modality,
    name: row.name,
    description: row.description,
    weekdays: row.weekdays,
    sortOrder: row.sortOrder,
    sessionType: row.sessionType,
    targetMinutes: row.targetMinutes,
    targetDistanceKm: row.targetDistanceKm,
    exercises: items
      .filter(({ item }) => item.routineId === row.id)
      .map(({ item, exercise }) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        measure: exercise.measure,
        position: item.position,
        targetSets: item.targetSets,
        targetReps: item.targetReps,
        targetWeight: item.targetWeight,
        restSeconds: item.restSeconds,
        notes: item.notes,
      })),
  }));
}

export function listRoutines(): Routine[] {
  const rows = db
    .select()
    .from(workoutRoutines)
    .where(eq(workoutRoutines.archived, false))
    .orderBy(asc(workoutRoutines.sortOrder), asc(workoutRoutines.name))
    .all();
  return toRoutines(rows);
}

export function getRoutine(id: string): Routine | undefined {
  const row = db.select().from(workoutRoutines).where(eq(workoutRoutines.id, id)).get();
  return row ? toRoutines([row])[0] : undefined;
}

/** Cria ou substitui uma ficha inteira (dados + lista de exercícios), numa transação. */
export function saveRoutine(id: string | null, input: RoutineInput): string {
  return db.transaction((tx) => {
    let routineId = id;
    const data = {
      modality: input.modality,
      name: input.name,
      description: input.description ?? null,
      weekdays: input.weekdays,
      sessionType: input.sessionType ?? null,
      targetMinutes: input.targetMinutes ?? null,
      targetDistanceKm: input.targetDistanceKm ?? null,
    };
    if (routineId) {
      tx.update(workoutRoutines).set(data).where(eq(workoutRoutines.id, routineId)).run();
      tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId)).run();
    } else {
      const total = tx.select({ total: count() }).from(workoutRoutines).get()?.total ?? 0;
      routineId = tx
        .insert(workoutRoutines)
        .values({ ...data, sortOrder: total })
        .returning({ id: workoutRoutines.id })
        .get().id;
    }
    if (input.exercises.length) {
      tx.insert(routineExercises)
        .values(
          input.exercises.map((e, position) => ({
            routineId: routineId!,
            exerciseId: e.exerciseId,
            position,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            targetWeight: e.targetWeight ?? null,
            restSeconds: e.restSeconds,
            notes: e.notes ?? null,
          })),
        )
        .run();
    }
    return routineId!;
  });
}

export function deleteRoutine(id: string): boolean {
  return db.delete(workoutRoutines).where(eq(workoutRoutines.id, id)).run().changes > 0;
}

// ===== Sessões de treino =====

function loadSets(sessionIds: string[], restByExercise: Map<string, number> = new Map()) {
  if (sessionIds.length === 0) return [];
  return db
    .select({ set: workoutSets, exercise: exercises })
    .from(workoutSets)
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(inArray(workoutSets.sessionId, sessionIds))
    .orderBy(asc(workoutSets.createdAt), asc(workoutSets.setNumber))
    .all()
    .map(({ set, exercise }) => ({
      sessionId: set.sessionId,
      value: {
        id: set.id,
        exerciseId: set.exerciseId,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        measure: exercise.measure,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
        done: set.done,
        restSeconds: restByExercise.get(set.exerciseId) ?? 90,
      } satisfies WorkoutSet,
    }));
}

export function getSession(id: string): WorkoutSession | undefined {
  const row = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  if (!row) return undefined;
  const rest = new Map<string, number>();
  if (row.routineId) {
    for (const item of db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, row.routineId))
      .all()) {
      rest.set(item.exerciseId, item.restSeconds);
    }
  }
  return {
    id: row.id,
    modality: row.modality,
    routineId: row.routineId,
    routineName: row.routineName,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    durationSeconds: row.durationSeconds,
    totalVolume: row.totalVolume,
    ...activityFields(row),
    notes: row.notes,
    sets: loadSets([row.id], rest).map((s) => s.value),
  };
}

const activityFields = (row: typeof workoutSessions.$inferSelect): ActivityFields => ({
  sessionType: row.sessionType,
  distanceKm: row.distanceKm,
  rounds: row.rounds,
  intensity: row.intensity,
  avgHeartRate: row.avgHeartRate,
});

export function getActiveSessionId(): string | undefined {
  return db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(isNull(workoutSessions.finishedAt))
    .orderBy(desc(workoutSessions.startedAt))
    .get()?.id;
}

export function createSession(
  data: { modality: ModalityId; routineId: string | null; routineName: string | null; startedAt: string },
  sets: Array<{ exerciseId: string; setNumber: number; weight: number; reps: number }>,
): string {
  return db.transaction((tx) => {
    const id = tx.insert(workoutSessions).values(data).returning({ id: workoutSessions.id }).get().id;
    // Horários sequenciais (1 ms de diferença) mantêm a ordem da ficha ao listar as séries.
    const base = new Date(data.startedAt).getTime();
    const at = (i: number) => new Date(base + i).toISOString();
    if (sets.length) {
      tx.insert(workoutSets)
        .values(sets.map((s, i) => ({ ...s, sessionId: id, createdAt: at(i), updatedAt: at(i) })))
        .run();
    }
    return id;
  });
}

/** Grava um treino já finalizado, sem séries (corrida, caminhada, lutas). */
export function insertFinishedSession(data: typeof workoutSessions.$inferInsert): string {
  return db.insert(workoutSessions).values(data).returning({ id: workoutSessions.id }).get().id;
}

export function updateSession(id: string, patch: Partial<typeof workoutSessions.$inferInsert>): void {
  db.update(workoutSessions).set(patch).where(eq(workoutSessions.id, id)).run();
}

/** Apaga o treino e os recordes que ele tinha batido (os anteriores voltam a valer). */
export function deleteSession(id: string): boolean {
  return db.transaction((tx) => {
    tx.delete(personalRecords).where(eq(personalRecords.sessionId, id)).run();
    return tx.delete(workoutSessions).where(eq(workoutSessions.id, id)).run().changes > 0;
  });
}

export function getSetRow(id: string) {
  return db.select().from(workoutSets).where(eq(workoutSets.id, id)).get();
}

export function insertSet(data: typeof workoutSets.$inferInsert): string {
  return db.insert(workoutSets).values(data).returning({ id: workoutSets.id }).get().id;
}

export function updateSet(id: string, patch: { weight?: number; reps?: number; done?: boolean }): void {
  db.update(workoutSets).set(patch).where(eq(workoutSets.id, id)).run();
}

export function deleteSet(id: string): boolean {
  return db.delete(workoutSets).where(eq(workoutSets.id, id)).run().changes > 0;
}

/** Última carga usada num exercício (para sugerir na próxima sessão). */
export function lastWeightFor(exerciseId: string): number | null {
  const row = db
    .select({ weight: workoutSets.weight })
    .from(workoutSets)
    .where(and(eq(workoutSets.exerciseId, exerciseId), eq(workoutSets.done, true)))
    .orderBy(desc(workoutSets.updatedAt))
    .get();
  return row?.weight ?? null;
}

/** Sessões finalizadas (mais recentes primeiro), com resumo. */
export function listSessionSummaries(
  options: { from?: string; to?: string; limit?: number; modality?: ModalityId } = {},
): WorkoutSessionSummary[] {
  const conditions = [isNotNull(workoutSessions.finishedAt)];
  if (options.from) conditions.push(gte(workoutSessions.startedAt, options.from));
  if (options.to) conditions.push(lte(workoutSessions.startedAt, options.to));
  if (options.modality) conditions.push(eq(workoutSessions.modality, options.modality));
  const rows = db
    .select()
    .from(workoutSessions)
    .where(and(...conditions))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(options.limit ?? 500)
    .all();
  const ids = rows.map((r) => r.id);
  const sets = ids.length
    ? db
        .select({
          sessionId: workoutSets.sessionId,
          exerciseId: workoutSets.exerciseId,
          done: workoutSets.done,
          reps: workoutSets.reps,
          measure: exercises.measure,
        })
        .from(workoutSets)
        .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
        .where(inArray(workoutSets.sessionId, ids))
        .all()
    : [];
  const records = ids.length
    ? db
        .select({ sessionId: personalRecords.sessionId })
        .from(personalRecords)
        .where(inArray(personalRecords.sessionId, ids))
        .all()
    : [];
  return rows.map((row) => {
    const own = sets.filter((s) => s.sessionId === row.id && s.done);
    return {
      id: row.id,
      modality: row.modality,
      routineId: row.routineId,
      routineName: row.routineName,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt,
      durationSeconds: row.durationSeconds,
      totalVolume: row.totalVolume,
      ...activityFields(row),
      totalReps: own.filter((s) => s.measure === 'reps').reduce((sum, s) => sum + s.reps, 0),
      exercises: new Set(own.map((s) => s.exerciseId)).size,
      sets: own.length,
      records: records.filter((r) => r.sessionId === row.id).length,
    };
  });
}

/** Treinos finalizados de uma modalidade, do mais antigo ao mais novo (estatísticas e recordes). */
export function listFinishedSessionRows(modality: ModalityId) {
  return db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.modality, modality), isNotNull(workoutSessions.finishedAt)))
    .orderBy(asc(workoutSessions.startedAt))
    .all();
}

/** Séries feitas de um exercício em sessões finalizadas (para os gráficos de evolução). */
export function listDoneSetsForExercise(exerciseId: string) {
  return db
    .select({ weight: workoutSets.weight, reps: workoutSets.reps, startedAt: workoutSessions.startedAt })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .where(
      and(
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.done, true),
        isNotNull(workoutSessions.finishedAt),
      ),
    )
    .orderBy(asc(workoutSessions.startedAt))
    .all();
}

// ===== Recordes pessoais =====

export function bestRecord(exerciseId: string, type: PrType): number {
  const row = db
    .select({ value: personalRecords.value })
    .from(personalRecords)
    .where(and(eq(personalRecords.exerciseId, exerciseId), eq(personalRecords.type, type)))
    .orderBy(desc(personalRecords.value))
    .get();
  return row?.value ?? 0;
}

export function insertRecord(data: typeof personalRecords.$inferInsert): string {
  return db.insert(personalRecords).values(data).returning({ id: personalRecords.id }).get().id;
}

/** Melhor recorde de cada tipo, por exercício. */
export function listBestRecords(exerciseId?: string): PersonalRecord[] {
  const rows = db
    .select({ record: personalRecords, name: exercises.name, measure: exercises.measure })
    .from(personalRecords)
    .innerJoin(exercises, eq(exercises.id, personalRecords.exerciseId))
    .where(exerciseId ? eq(personalRecords.exerciseId, exerciseId) : undefined)
    .orderBy(desc(personalRecords.value))
    .all();
  const best = new Map<string, PersonalRecord>();
  for (const { record, name, measure } of rows) {
    const key = `${record.exerciseId}:${record.type}`;
    if (!best.has(key)) {
      best.set(key, {
        id: record.id,
        exerciseId: record.exerciseId,
        exerciseName: name,
        measure,
        type: record.type,
        value: record.value,
        weight: record.weight,
        reps: record.reps,
        achievedAt: record.achievedAt,
      });
    }
  }
  return [...best.values()].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
}

export function listRecordsForSession(sessionId: string): PersonalRecord[] {
  return db
    .select({ record: personalRecords, name: exercises.name, measure: exercises.measure })
    .from(personalRecords)
    .innerJoin(exercises, eq(exercises.id, personalRecords.exerciseId))
    .where(eq(personalRecords.sessionId, sessionId))
    .all()
    .map(({ record, name, measure }) => ({
      id: record.id,
      exerciseId: record.exerciseId,
      exerciseName: name,
      measure,
      type: record.type,
      value: record.value,
      weight: record.weight,
      reps: record.reps,
      achievedAt: record.achievedAt,
    }));
}

// ===== Medidas corporais =====

const toMeasurement = (row: typeof bodyMeasurements.$inferSelect): BodyMeasurement => ({
  id: row.id,
  date: row.date,
  weightKg: row.weightKg,
  bodyFatPercent: row.bodyFatPercent,
  chestCm: row.chestCm,
  waistCm: row.waistCm,
  hipsCm: row.hipsCm,
  armCm: row.armCm,
  thighCm: row.thighCm,
  notes: row.notes,
});

export function listMeasurements(): BodyMeasurement[] {
  return db.select().from(bodyMeasurements).orderBy(desc(bodyMeasurements.date)).all().map(toMeasurement);
}

export function createMeasurement(input: BodyMeasurementInput): BodyMeasurement {
  return toMeasurement(
    db
      .insert(bodyMeasurements)
      .values({
        date: input.date,
        weightKg: input.weightKg ?? null,
        bodyFatPercent: input.bodyFatPercent ?? null,
        chestCm: input.chestCm ?? null,
        waistCm: input.waistCm ?? null,
        hipsCm: input.hipsCm ?? null,
        armCm: input.armCm ?? null,
        thighCm: input.thighCm ?? null,
        notes: input.notes ?? null,
      })
      .returning()
      .get(),
  );
}

export function deleteMeasurement(id: string): boolean {
  return db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id)).run().changes > 0;
}
