import {
  activityInputSchema,
  addDays,
  bodyMeasurementInputSchema,
  DEFAULT_FITNESS_SETTINGS,
  epley1RM,
  exerciseInputSchema,
  finishSessionSchema,
  fitnessSettingsSchema,
  getModality,
  isStrengthModality,
  modalityIdSchema,
  paceOf,
  routineInputSchema,
  setInputSchema,
  setUpdateSchema,
  startOfDay,
  startSessionSchema,
  toDateKey,
  type ActivityLogResult,
  type ActivityRecord,
  type ActivityRecordType,
  type ActivityTotals,
  type ExerciseProgress,
  type FinishSessionResult,
  type FitnessSettings,
  type ModalityId,
  type ModalityStats,
  type PersonalRecord,
  type PrType,
  type TodayWorkout,
  type WorkoutSession,
} from '@polaris/shared';
import { badRequest, notFound, parseInput, parsePatch } from '../lib/http';
import * as repo from '../repositories/gymRepository';
import { getSetting, setSetting } from '../repositories/settingsRepository';
import { autoMarkHabit } from './habitService';

// ===== Modalidades que o usuário pratica =====

export function getFitnessSettings(): FitnessSettings {
  const stored = fitnessSettingsSchema.safeParse(getSetting('fitness'));
  return stored.success ? stored.data : DEFAULT_FITNESS_SETTINGS;
}

export function updateFitnessSettings(input: unknown): FitnessSettings {
  const data = parseInput(fitnessSettingsSchema, input);
  const settings = { modalities: [...new Set(data.modalities)] };
  setSetting('fitness', settings);
  return settings;
}

function requireStrength(modality: ModalityId) {
  if (!isStrengthModality(modality)) {
    throw badRequest(`${getModality(modality).name} não usa exercícios e séries.`);
  }
}

// ===== Exercícios =====

export const listExercises = () => repo.listExercises();

export function createExercise(input: unknown) {
  const data = parseInput(exerciseInputSchema, input);
  requireStrength(data.modality);
  return repo.createExercise(data);
}

export function updateExercise(id: string, input: unknown) {
  const patch = parsePatch(exerciseInputSchema.partial(), input);
  if (patch.modality) requireStrength(patch.modality);
  const exercise = repo.updateExercise(id, patch);
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
  const modality = getModality(data.modality);
  // Força usa a lista de exercícios; as outras modalidades usam tipo de treino e metas.
  const routineId = repo.saveRoutine(
    id,
    modality.kind === 'forca'
      ? { ...data, sessionType: null, targetMinutes: null, targetDistanceKm: null }
      : {
          ...data,
          exercises: [],
          targetDistanceKm: modality.kind === 'distancia' ? data.targetDistanceKm : null,
        },
  );
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

/**
 * Inicia um treino de força (de uma ficha ou livre, na modalidade escolhida).
 * Se já houver um em andamento, devolve ele.
 */
export function startSession(input: unknown, now: Date = new Date()): WorkoutSession {
  const { routineId, modality = 'academia' } = parseInput(startSessionSchema, input);
  const activeId = repo.getActiveSessionId();
  if (activeId) return requireSession(activeId);

  const routine = routineId ? repo.getRoutine(routineId) : undefined;
  if (routineId && !routine) throw notFound('Ficha não encontrada.');
  const sessionModality = routine?.modality ?? modality;
  requireStrength(sessionModality);

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
      modality: sessionModality,
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
    if (set.done && set.reps > 0) {
      byExercise.set(set.exerciseId, [...(byExercise.get(set.exerciseId) ?? []), set]);
    }
  }
  for (const [exerciseId, all] of byExercise) {
    const candidates: Array<{ type: PrType; value: number; set: (typeof all)[number] }> = [];
    // Séries com peso (carga ou lastro): carga máxima, 1RM e volume. Isometrias não entram aqui.
    const sets = all.filter((s) => s.weight > 0 && s.measure === 'reps');
    if (sets.length) {
      const heaviest = sets.reduce((a, b) =>
        b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a,
      );
      candidates.push({ type: 'max_weight', value: heaviest.weight, set: heaviest });
      const best1rm = sets.reduce((a, b) =>
        epley1RM(b.weight, b.reps) > epley1RM(a.weight, a.reps) ? b : a,
      );
      candidates.push({ type: 'max_1rm', value: epley1RM(best1rm.weight, best1rm.reps), set: best1rm });
      const bestVolume = sets.reduce((a, b) => (b.weight * b.reps > a.weight * a.reps ? b : a));
      candidates.push({ type: 'max_volume', value: bestVolume.weight * bestVolume.reps, set: bestVolume });
    }
    // Séries só com o peso do corpo: mais repetições (ou mais segundos, nas isometrias).
    const bodyweight = all.filter((s) => s.weight === 0);
    if (bodyweight.length) {
      const most = bodyweight.reduce((a, b) => (b.reps > a.reps ? b : a));
      candidates.push({ type: 'max_reps', value: most.reps, set: most });
    }

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
          measure: candidate.set.measure,
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
  // Volume = carga × repetições (isometrias em segundos não somam volume).
  const totalVolume = doneSets
    .filter((s) => s.measure === 'reps')
    .reduce((sum, s) => sum + s.weight * s.reps, 0);
  const durationSeconds = Math.max(
    1,
    Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000),
  );
  repo.updateSession(id, { finishedAt, totalVolume, durationSeconds, notes: notes ?? null });

  const newRecords = detectRecords(requireSession(id), finishedAt);
  autoMarkHabit('treino', now);
  return { session: requireSession(id), newRecords };
}

/** Descarta um treino em andamento ou apaga um do histórico. */
export function deleteSession(id: string) {
  if (!repo.deleteSession(id)) throw notFound('Treino não encontrado.');
}

export function listSessions(options: { from?: string; to?: string; limit?: number; modality?: string }) {
  const modality = modalityIdSchema.safeParse(options.modality);
  return repo.listSessionSummaries({ ...options, modality: modality.success ? modality.data : undefined });
}

/** Segunda-feira da semana da data (início do dia). */
const weekStartOf = (date: Date) => addDays(startOfDay(date), -((date.getDay() + 6) % 7));

/** Dados do card "Treino de hoje". */
export function getToday(now: Date = new Date()): TodayWorkout {
  const weekday = now.getDay();
  const enabled = new Set(getFitnessSettings().modalities);
  const recent = repo.listSessionSummaries({ from: weekStartOf(now).toISOString() });
  const doneToday = recent.filter((s) => toDateKey(new Date(s.startedAt)) === toDateKey(now));
  const doneRoutines = new Set(doneToday.map((s) => s.routineId));

  const week = new Map<ModalityId, TodayWorkout['week'][number]>();
  for (const s of recent) {
    const item = week.get(s.modality) ?? {
      modality: s.modality,
      sessions: 0,
      durationSeconds: 0,
      distanceKm: 0,
    };
    item.sessions += 1;
    item.durationSeconds += s.durationSeconds ?? 0;
    item.distanceKm += s.distanceKm ?? 0;
    week.set(s.modality, item);
  }
  return {
    planned: repo
      .listRoutines()
      .filter((r) => r.weekdays.includes(weekday) && enabled.has(r.modality) && !doneRoutines.has(r.id)),
    activeSession: getActiveSession(),
    doneToday,
    weekCount: recent.length,
    week: [...week.values()].sort((a, b) => b.sessions - a.sessions),
    lastSession: repo.listSessionSummaries({ limit: 1 })[0] ?? null,
  };
}

// ===== Corrida, caminhada e lutas (registro pelo formulário) =====

function parseActivity(input: unknown, now: Date) {
  const data = parseInput(activityInputSchema, input);
  if (isStrengthModality(data.modality)) {
    throw badRequest('Treinos de força são registrados série por série: use "Iniciar treino".');
  }
  const startedAt = new Date(data.startedAt);
  if (startedAt.getTime() > now.getTime() + 5 * 60_000) {
    throw badRequest('A data do treino não pode estar no futuro.');
  }
  if (data.routineId && !repo.getRoutine(data.routineId)) throw notFound('Plano não encontrado.');
  const kind = getModality(data.modality).kind;
  return {
    modality: data.modality,
    routineId: data.routineId ?? null,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date(startedAt.getTime() + data.durationSeconds * 1000).toISOString(),
    durationSeconds: data.durationSeconds,
    sessionType: data.sessionType || null,
    distanceKm: kind === 'distancia' ? (data.distanceKm ?? null) : null,
    rounds: kind === 'sessao' ? (data.rounds ?? null) : null,
    intensity: data.intensity ?? null,
    avgHeartRate: data.avgHeartRate ?? null,
    notes: data.notes || null,
  };
}

/** Nome mostrado no histórico: o plano, senão o tipo de treino, senão a modalidade. */
function activityName(data: ReturnType<typeof parseActivity>) {
  const routine = data.routineId ? repo.getRoutine(data.routineId) : undefined;
  return routine?.name ?? data.sessionType ?? getModality(data.modality).name;
}

type SessionRow = ReturnType<typeof repo.listFinishedSessionRows>[number];

/** O que cada tipo de recorde mede (null = esse treino não conta para ele). */
const RECORD_METRICS: Record<
  ActivityRecordType,
  { value: (s: SessionRow) => number | null; lower?: boolean }
> = {
  max_distance: { value: (s) => s.distanceKm || null },
  // Pace só vale a partir de 1 km, para um trecho curto não virar recorde.
  best_pace: {
    value: (s) => ((s.distanceKm ?? 0) >= 1 ? paceOf(s.durationSeconds ?? 0, s.distanceKm) : null),
    lower: true,
  },
  max_duration: { value: (s) => s.durationSeconds || null },
  max_rounds: { value: (s) => s.rounds || null },
};

const RECORDS_BY_KIND: Record<'distancia' | 'sessao', ActivityRecordType[]> = {
  distancia: ['max_distance', 'best_pace', 'max_duration'],
  sessao: ['max_duration', 'max_rounds'],
};

/** Melhor marca de cada tipo. Em caso de empate, vale quem chegou primeiro. */
function computeActivityRecords(modality: ModalityId, rows: SessionRow[]): ActivityRecord[] {
  const kind = getModality(modality).kind;
  if (kind === 'forca') return [];
  const records: ActivityRecord[] = [];
  for (const type of RECORDS_BY_KIND[kind]) {
    const metric = RECORD_METRICS[type];
    let best: ActivityRecord | null = null;
    for (const row of rows) {
      const value = metric.value(row);
      if (value === null) continue;
      if (!best || (metric.lower ? value < best.value : value > best.value)) {
        best = { type, value, sessionId: row.id, achievedAt: row.startedAt };
      }
    }
    if (best) records.push(best);
  }
  return records;
}

/** Recordes que este treino bateu (o primeiro treino da modalidade não conta como recorde). */
function newRecordsFor(sessionId: string, modality: ModalityId): ActivityRecord[] {
  const rows = repo.listFinishedSessionRows(modality);
  if (rows.length < 2) return [];
  return computeActivityRecords(modality, rows).filter((r) => r.sessionId === sessionId);
}

/** Registra um treino já feito e marca o hábito "Treino" no dia dele. */
export function logActivity(input: unknown, now: Date = new Date()): ActivityLogResult {
  const data = parseActivity(input, now);
  const id = repo.insertFinishedSession({ ...data, routineName: activityName(data) });
  autoMarkHabit('treino', new Date(data.startedAt));
  return { session: requireSession(id), newRecords: newRecordsFor(id, data.modality) };
}

export function updateActivity(id: string, input: unknown, now: Date = new Date()): ActivityLogResult {
  const session = requireSession(id);
  if (isStrengthModality(session.modality)) throw badRequest('Este treino é editado pelas séries.');
  const data = parseActivity(input, now);
  repo.updateSession(id, { ...data, routineName: activityName(data) });
  autoMarkHabit('treino', new Date(data.startedAt));
  return { session: requireSession(id), newRecords: newRecordsFor(id, data.modality) };
}

const emptyTotals = (): ActivityTotals => ({ sessions: 0, durationSeconds: 0, distanceKm: 0, rounds: 0 });
function addTotals(totals: ActivityTotals, row: SessionRow) {
  totals.sessions += 1;
  totals.durationSeconds += row.durationSeconds ?? 0;
  totals.distanceKm += row.distanceKm ?? 0;
  totals.rounds += row.rounds ?? 0;
}

/** Totais, semanas, últimos treinos, tipos e recordes de uma modalidade. */
export function getModalityStats(modalityId: string, now: Date = new Date()): ModalityStats {
  const parsed = modalityIdSchema.safeParse(modalityId);
  if (!parsed.success) throw notFound('Modalidade não encontrada.');
  const modality = parsed.data;
  const rows = repo.listFinishedSessionRows(modality);

  const total = emptyTotals();
  const month = emptyTotals();
  const monthKey = toDateKey(now).slice(0, 7);
  const firstWeek = addDays(weekStartOf(now), -7 * 11);
  const weeks = Array.from({ length: 12 }, (_, i) => ({
    weekStart: toDateKey(addDays(firstWeek, i * 7)),
    sessions: 0,
    minutes: 0,
    distanceKm: 0,
  }));
  const byType = new Map<string, number>();

  for (const row of rows) {
    const started = new Date(row.startedAt);
    addTotals(total, row);
    if (toDateKey(started).startsWith(monthKey)) addTotals(month, row);
    const week = weeks.find((w) => w.weekStart === toDateKey(weekStartOf(started)));
    if (week) {
      week.sessions += 1;
      week.minutes += Math.round((row.durationSeconds ?? 0) / 60);
      week.distanceKm = Math.round((week.distanceKm + (row.distanceKm ?? 0)) * 100) / 100;
    }
    if (row.sessionType) byType.set(row.sessionType, (byType.get(row.sessionType) ?? 0) + 1);
  }

  return {
    modality,
    total,
    month,
    weeks,
    recent: rows.slice(-30).map((row) => ({
      id: row.id,
      date: toDateKey(new Date(row.startedAt)),
      durationSeconds: row.durationSeconds ?? 0,
      distanceKm: row.distanceKm,
      paceSeconds: paceOf(row.durationSeconds ?? 0, row.distanceKm),
      rounds: row.rounds,
      intensity: row.intensity,
    })),
    byType: [...byType.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    records: computeActivityRecords(modality, rows),
  };
}

// ===== Evolução =====

export function getExerciseProgress(exerciseId: string): ExerciseProgress {
  const exercise = repo.getExercise(exerciseId);
  if (!exercise) throw notFound('Exercício não encontrado.');
  type Point = Omit<ExerciseProgress['points'][number], 'date'>;
  const byDay = new Map<string, Point>();
  for (const set of repo.listDoneSetsForExercise(exerciseId)) {
    const date = toDateKey(new Date(set.startedAt));
    const point = byDay.get(date) ?? { maxWeight: 0, volume: 0, oneRm: 0, maxReps: 0, totalReps: 0 };
    point.maxWeight = Math.max(point.maxWeight, set.weight);
    point.maxReps = Math.max(point.maxReps, set.reps);
    point.totalReps += set.reps;
    if (exercise.measure === 'reps') {
      point.volume += set.weight * set.reps;
      point.oneRm = Math.max(point.oneRm, epley1RM(set.weight, set.reps));
    }
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
