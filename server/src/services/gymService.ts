import {
  addDays,
  bodyMeasurementInputSchema,
  epley1RM,
  exerciseInputSchema,
  finishSessionSchema,
  routineInputSchema,
  setInputSchema,
  setUpdateSchema,
  startOfDay,
  startSessionSchema,
  toDateKey,
  type ExerciseProgress,
  type FinishSessionResult,
  type PersonalRecord,
  type PrType,
  type TodayWorkout,
  type WorkoutSession,
} from '@polaris/shared';
import { badRequest, notFound, parseInput, parsePatch } from '../lib/http';
import * as repo from '../repositories/gymRepository';
import { autoMarkHabit } from './habitService';

// ===== Exercícios =====

export const listExercises = () => repo.listExercises();

export function createExercise(input: unknown) {
  return repo.createExercise(parseInput(exerciseInputSchema, input));
}

export function updateExercise(id: string, input: unknown) {
  const exercise = repo.updateExercise(id, parsePatch(exerciseInputSchema.partial(), input));
  if (!exercise) throw notFound('Exercício não encontrado.');
  return exercise;
}

export function deleteExercise(id: string) {
  if (repo.countSetsForExercise(id) > 0) {
    throw badRequest('Esse exercício já tem treinos registrados e não pode ser apagado.');
  }
  if (!repo.deleteExercise(id)) throw notFound('Exercício não encontrado.');
}

// ===== Fichas =====

export const listRoutines = () => repo.listRoutines();

export function saveRoutine(id: string | null, input: unknown) {
  const data = parseInput(routineInputSchema, input);
  if (id && !repo.getRoutine(id)) throw notFound('Ficha não encontrada.');
  const routineId = repo.saveRoutine(id, data);
  return repo.getRoutine(routineId)!;
}

export function deleteRoutine(id: string) {
  if (!repo.deleteRoutine(id)) throw notFound('Ficha não encontrada.');
}

// ===== Sessões =====

function requireSession(id: string): WorkoutSession {
  const session = repo.getSession(id);
  if (!session) throw notFound('Treino não encontrado.');
  return session;
}

/** Primeiro número de "8-12" → 8. */
const firstNumber = (text: string) => Number(/\d+/.exec(text)?.[0] ?? 0);

/** Inicia um treino (de uma ficha ou livre). Se já houver um em andamento, devolve ele. */
export function startSession(input: unknown, now: Date = new Date()): WorkoutSession {
  const { routineId } = parseInput(startSessionSchema, input);
  const activeId = repo.getActiveSessionId();
  if (activeId) return requireSession(activeId);

  const routine = routineId ? repo.getRoutine(routineId) : undefined;
  if (routineId && !routine) throw notFound('Ficha não encontrada.');

  const sets = (routine?.exercises ?? []).flatMap((item) =>
    Array.from({ length: item.targetSets }, (_, i) => ({
      exerciseId: item.exerciseId,
      setNumber: i + 1,
      weight: item.targetWeight ?? repo.lastWeightFor(item.exerciseId) ?? 0,
      reps: firstNumber(item.targetReps),
    })),
  );
  const id = repo.createSession(
    {
      routineId: routine?.id ?? null,
      routineName: routine?.name ?? 'Treino livre',
      startedAt: now.toISOString(),
    },
    sets,
  );
  return requireSession(id);
}

export const getSession = requireSession;

export function getActiveSession(): WorkoutSession | null {
  const id = repo.getActiveSessionId();
  return id ? requireSession(id) : null;
}

export function addSet(sessionId: string, input: unknown): WorkoutSession {
  const session = requireSession(sessionId);
  if (session.finishedAt) throw badRequest('Este treino já foi finalizado.');
  const data = parseInput(setInputSchema, input);
  const sameExercise = session.sets.filter((s) => s.exerciseId === data.exerciseId);
  const last = sameExercise.at(-1);
  repo.insertSet({
    sessionId,
    exerciseId: data.exerciseId,
    setNumber: (last?.setNumber ?? 0) + 1,
    weight: data.weight || last?.weight || repo.lastWeightFor(data.exerciseId) || 0,
    reps: data.reps || last?.reps || 0,
    done: data.done,
  });
  return requireSession(sessionId);
}

export function updateSet(setId: string, input: unknown): WorkoutSession {
  const row = repo.getSetRow(setId);
  if (!row) throw notFound('Série não encontrada.');
  repo.updateSet(setId, parseInput(setUpdateSchema, input));
  return requireSession(row.sessionId);
}

export function deleteSet(setId: string): WorkoutSession {
  const row = repo.getSetRow(setId);
  if (!row) throw notFound('Série não encontrada.');
  repo.deleteSet(setId);
  return requireSession(row.sessionId);
}

/** Compara as séries feitas com os recordes anteriores e registra os novos. */
function detectRecords(session: WorkoutSession, achievedAt: string): PersonalRecord[] {
  const created: PersonalRecord[] = [];
  const byExercise = new Map<string, typeof session.sets>();
  for (const set of session.sets) {
    if (set.done && set.weight > 0 && set.reps > 0) {
      byExercise.set(set.exerciseId, [...(byExercise.get(set.exerciseId) ?? []), set]);
    }
  }
  for (const [exerciseId, sets] of byExercise) {
    const candidates: Array<{ type: PrType; value: number; set: (typeof sets)[number] }> = [];
    const heaviest = sets.reduce((a, b) =>
      b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a,
    );
    candidates.push({ type: 'max_weight', value: heaviest.weight, set: heaviest });
    const best1rm = sets.reduce((a, b) => (epley1RM(b.weight, b.reps) > epley1RM(a.weight, a.reps) ? b : a));
    candidates.push({ type: 'max_1rm', value: epley1RM(best1rm.weight, best1rm.reps), set: best1rm });
    const bestVolume = sets.reduce((a, b) => (b.weight * b.reps > a.weight * a.reps ? b : a));
    candidates.push({ type: 'max_volume', value: bestVolume.weight * bestVolume.reps, set: bestVolume });

    for (const candidate of candidates) {
      if (candidate.value > repo.bestRecord(exerciseId, candidate.type)) {
        const id = repo.insertRecord({
          exerciseId,
          type: candidate.type,
          value: candidate.value,
          weight: candidate.set.weight,
          reps: candidate.set.reps,
          sessionId: session.id,
          achievedAt,
        });
        created.push({
          id,
          exerciseId,
          exerciseName: candidate.set.exerciseName,
          type: candidate.type,
          value: candidate.value,
          weight: candidate.set.weight,
          reps: candidate.set.reps,
          achievedAt,
        });
      }
    }
  }
  return created;
}

/** Finaliza: calcula duração e volume, detecta recordes e marca o hábito "Treino". */
export function finishSession(id: string, input: unknown, now: Date = new Date()): FinishSessionResult {
  const session = requireSession(id);
  if (session.finishedAt) throw badRequest('Este treino já foi finalizado.');
  const { notes } = parseInput(finishSessionSchema, input);
  const doneSets = session.sets.filter((s) => s.done);
  if (doneSets.length === 0) throw badRequest('Marque pelo menos uma série como feita antes de finalizar.');

  const finishedAt = now.toISOString();
  const totalVolume = doneSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const durationSeconds = Math.max(
    1,
    Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000),
  );
  repo.updateSession(id, { finishedAt, totalVolume, durationSeconds, notes: notes ?? null });

  const newRecords = detectRecords(requireSession(id), finishedAt);
  autoMarkHabit('treino', now);
  return { session: requireSession(id), newRecords };
}

/** Descarta um treino (ex.: começou sem querer). */
export function deleteSession(id: string) {
  if (!repo.deleteSession(id)) throw notFound('Treino não encontrado.');
}

export const listSessions = (options: { from?: string; to?: string; limit?: number }) =>
  repo.listSessionSummaries(options);

/** Dados do card "Treino de hoje". */
export function getToday(now: Date = new Date()): TodayWorkout {
  const weekday = now.getDay();
  const todayStart = startOfDay(now);
  const weekStart = addDays(todayStart, -((weekday + 6) % 7)); // segunda-feira
  const recent = repo.listSessionSummaries({ from: weekStart.toISOString() });
  const doneToday = recent.find((s) => toDateKey(new Date(s.startedAt)) === toDateKey(now)) ?? null;
  return {
    planned: repo.listRoutines().filter((r) => r.weekdays.includes(weekday)),
    activeSession: getActiveSession(),
    doneToday,
    weekCount: recent.length,
    lastSession: repo.listSessionSummaries({ limit: 1 })[0] ?? null,
  };
}

// ===== Evolução =====

export function getExerciseProgress(exerciseId: string): ExerciseProgress {
  const exercise = repo.getExercise(exerciseId);
  if (!exercise) throw notFound('Exercício não encontrado.');
  const byDay = new Map<string, { maxWeight: number; volume: number; oneRm: number }>();
  for (const set of repo.listDoneSetsForExercise(exerciseId)) {
    const date = toDateKey(new Date(set.startedAt));
    const point = byDay.get(date) ?? { maxWeight: 0, volume: 0, oneRm: 0 };
    point.maxWeight = Math.max(point.maxWeight, set.weight);
    point.volume += set.weight * set.reps;
    point.oneRm = Math.max(point.oneRm, epley1RM(set.weight, set.reps));
    byDay.set(date, point);
  }
  return {
    exercise,
    points: [...byDay.entries()].map(([date, p]) => ({ date, ...p })),
    records: repo.listBestRecords(exerciseId),
  };
}

export const listRecords = () => repo.listBestRecords();
export const listRecordsForSession = (sessionId: string) => repo.listRecordsForSession(sessionId);

// ===== Medidas =====

export const listMeasurements = () => repo.listMeasurements();

export function createMeasurement(input: unknown) {
  return repo.createMeasurement(parseInput(bodyMeasurementInputSchema, input));
}

export function deleteMeasurement(id: string) {
  if (!repo.deleteMeasurement(id)) throw notFound('Medida não encontrada.');
}
