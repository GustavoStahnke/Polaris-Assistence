import { z } from 'zod';
import { EXERCISE_MEASURES, type ActivityRecordType, type ExerciseMeasure, type PrType } from '../enums';
import { modalityIdSchema, type ModalityId } from '../modalities';

export const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Panturrilha',
  'Abdômen',
  'Cardio',
  'Corpo inteiro',
] as const;

export const EQUIPMENT = [
  'Barra',
  'Halteres',
  'Máquina',
  'Polia',
  'Peso corporal',
  'Barra fixa',
  'Paralelas',
  'Argolas',
  'Kettlebell',
  'Elástico',
  'Outro',
] as const;

/** 1RM estimado pela fórmula de Epley: peso × (1 + repetições / 30). */
export const epley1RM = (weight: number, reps: number) =>
  reps <= 0 || weight <= 0 ? 0 : reps === 1 ? weight : Math.round(weight * (1 + reps / 30) * 10) / 10;

export interface Exercise {
  id: string;
  name: string;
  /** Modalidade de força a que o exercício pertence (academia, calistenia...). */
  modality: ModalityId;
  muscleGroup: string;
  equipment: string;
  measure: ExerciseMeasure;
  notes: string | null;
  isCustom: boolean;
}

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(2, 'Dê um nome ao exercício.').max(80),
  modality: modalityIdSchema.default('academia'),
  muscleGroup: z.string().trim().min(1, 'Escolha o grupo muscular.'),
  equipment: z.string().trim().min(1, 'Escolha o equipamento.'),
  measure: z.enum(EXERCISE_MEASURES).default('reps'),
  notes: z.string().trim().max(500).nullish(),
});
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  measure: ExerciseMeasure;
  position: number;
  targetSets: number;
  targetReps: string;
  targetWeight: number | null;
  restSeconds: number;
  notes: string | null;
}

/**
 * Ficha (modalidades de força, com exercícios) ou plano (as outras modalidades,
 * com tipo de treino e metas de duração e distância).
 */
export interface Routine {
  id: string;
  modality: ModalityId;
  name: string;
  description: string | null;
  /** 0 = domingo ... 6 = sábado */
  weekdays: number[];
  sortOrder: number;
  sessionType: string | null;
  targetMinutes: number | null;
  targetDistanceKm: number | null;
  exercises: RoutineExercise[];
}

export const routineInputSchema = z.object({
  modality: modalityIdSchema.default('academia'),
  name: z.string().trim().min(1, 'Dê um nome à ficha.').max(60),
  description: z.string().trim().max(300).nullish(),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
  sessionType: z.string().trim().max(40).nullish(),
  targetMinutes: z.number().int().min(1).max(1440).nullish(),
  targetDistanceKm: z.number().min(0).max(1000).nullish(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        targetSets: z.number().int().min(1, 'Pelo menos 1 série.').max(20),
        targetReps: z.string().trim().min(1, 'Informe as repetições.').max(20),
        targetWeight: z.number().min(0).max(1000).nullish(),
        restSeconds: z.number().int().min(0).max(900),
        notes: z.string().trim().max(300).nullish(),
      }),
    )
    .max(40),
});
export type RoutineInput = z.infer<typeof routineInputSchema>;

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  measure: ExerciseMeasure;
  setNumber: number;
  weight: number;
  reps: number;
  done: boolean;
  restSeconds: number;
}

/** Campos das modalidades sem séries (corrida, caminhada, lutas). Ficam nulos na força. */
export interface ActivityFields {
  sessionType: string | null;
  distanceKm: number | null;
  rounds: number | null;
  /** Esforço percebido de 1 a 10. */
  intensity: number | null;
  avgHeartRate: number | null;
}

export interface WorkoutSession extends ActivityFields {
  id: string;
  modality: ModalityId;
  routineId: string | null;
  routineName: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalVolume: number | null;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutSessionSummary extends ActivityFields {
  id: string;
  modality: ModalityId;
  routineId: string | null;
  routineName: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalVolume: number | null;
  /** Soma das repetições feitas (exercícios medidos em repetições). */
  totalReps: number;
  exercises: number;
  sets: number;
  records: number;
}

/** Inicia um treino de força: de uma ficha ou livre (na modalidade escolhida). */
export const startSessionSchema = z.object({
  routineId: z.string().nullish(),
  modality: modalityIdSchema.optional(),
});

export const setInputSchema = z.object({
  exerciseId: z.string().min(1),
  weight: z.number().min(0).max(1000).default(0),
  reps: z.number().int().min(0).max(500).default(0),
  done: z.boolean().default(false),
});
export const setUpdateSchema = z.object({
  weight: z.number().min(0).max(1000).optional(),
  reps: z.number().int().min(0).max(500).optional(),
  done: z.boolean().optional(),
});

export const finishSessionSchema = z.object({ notes: z.string().trim().max(1000).nullish() });

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  measure: ExerciseMeasure;
  type: PrType;
  value: number;
  weight: number;
  reps: number;
  achievedAt: string;
}

export interface FinishSessionResult {
  session: WorkoutSession;
  newRecords: PersonalRecord[];
}

export interface ExerciseProgress {
  exercise: Exercise;
  points: Array<{
    date: string;
    maxWeight: number;
    volume: number;
    oneRm: number;
    /** Mais repetições (ou segundos) numa série. */
    maxReps: number;
    totalReps: number;
  }>;
  records: PersonalRecord[];
}

export interface TodayWorkout {
  /** Fichas e planos de hoje que ainda não foram feitos (só das modalidades ativas). */
  planned: Routine[];
  activeSession: WorkoutSession | null;
  /** Treinos finalizados hoje. */
  doneToday: WorkoutSessionSummary[];
  weekCount: number;
  /** Resumo da semana por modalidade. */
  week: Array<{ modality: ModalityId; sessions: number; durationSeconds: number; distanceKm: number }>;
  lastSession: WorkoutSessionSummary | null;
}

// ===== Modalidades sem séries (corrida, caminhada, lutas) =====

/** Registro de um treino já feito, pelo formulário. */
export const activityInputSchema = z.object({
  modality: modalityIdSchema,
  routineId: z.string().nullish(),
  startedAt: z.iso.datetime({ message: 'Data e hora inválidas.' }),
  durationSeconds: z
    .number()
    .int()
    .min(60, 'O treino precisa ter pelo menos 1 minuto.')
    .max(24 * 3600),
  sessionType: z.string().trim().max(40).nullish(),
  distanceKm: z.number().min(0).max(1000).nullish(),
  rounds: z.number().int().min(0).max(200).nullish(),
  intensity: z.number().int().min(1).max(10).nullish(),
  avgHeartRate: z.number().int().min(30).max(250).nullish(),
  notes: z.string().trim().max(1000).nullish(),
});
export type ActivityInput = z.infer<typeof activityInputSchema>;

export interface ActivityRecord {
  type: ActivityRecordType;
  /** Distância em km, pace em segundos por km, duração em segundos ou número de rounds. */
  value: number;
  sessionId: string;
  achievedAt: string;
}

export interface ActivityLogResult {
  session: WorkoutSession;
  newRecords: ActivityRecord[];
}

export interface ActivityTotals {
  sessions: number;
  durationSeconds: number;
  distanceKm: number;
  rounds: number;
}

/** Números de uma modalidade para a aba Evolução. */
export interface ModalityStats {
  modality: ModalityId;
  total: ActivityTotals;
  month: ActivityTotals;
  /** Últimas 12 semanas (começando na segunda-feira, data YYYY-MM-DD). */
  weeks: Array<{ weekStart: string; sessions: number; minutes: number; distanceKm: number }>;
  /** Últimos treinos, do mais antigo ao mais novo (para o gráfico de linha). */
  recent: Array<{
    id: string;
    date: string;
    durationSeconds: number;
    distanceKm: number | null;
    paceSeconds: number | null;
    rounds: number | null;
    intensity: number | null;
  }>;
  byType: Array<{ type: string; count: number }>;
  records: ActivityRecord[];
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  notes: string | null;
}

const optionalMeasure = z.number().min(0).max(500).nullish();
export const bodyMeasurementInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),
  weightKg: optionalMeasure,
  bodyFatPercent: z.number().min(0).max(100).nullish(),
  chestCm: optionalMeasure,
  waistCm: optionalMeasure,
  hipsCm: optionalMeasure,
  armCm: optionalMeasure,
  thighCm: optionalMeasure,
  notes: z.string().trim().max(300).nullish(),
});
export type BodyMeasurementInput = z.infer<typeof bodyMeasurementInputSchema>;
