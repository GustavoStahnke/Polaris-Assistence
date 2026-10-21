import { z } from 'zod';

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
  muscleGroup: string;
  equipment: string;
  notes: string | null;
  isCustom: boolean;
}

export const exerciseInputSchema = z.object({
  name: z.string().trim().min(2, 'Dê um nome ao exercício.').max(80),
  muscleGroup: z.string().trim().min(1, 'Escolha o grupo muscular.'),
  equipment: z.string().trim().min(1, 'Escolha o equipamento.'),
  notes: z.string().trim().max(500).nullish(),
});
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  position: number;
  targetSets: number;
  targetReps: string;
  targetWeight: number | null;
  restSeconds: number;
  notes: string | null;
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  /** 0 = domingo ... 6 = sábado */
  weekdays: number[];
  sortOrder: number;
  exercises: RoutineExercise[];
}

export const routineInputSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome à ficha.').max(60),
  description: z.string().trim().max(300).nullish(),
  weekdays: z.array(z.number().int().min(0).max(6)).max(7),
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
  setNumber: number;
  weight: number;
  reps: number;
  done: boolean;
  restSeconds: number;
}

export interface WorkoutSession {
  id: string;
  routineId: string | null;
  routineName: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalVolume: number | null;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface WorkoutSessionSummary {
  id: string;
  routineName: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  totalVolume: number | null;
  exercises: number;
  sets: number;
  records: number;
}

export const startSessionSchema = z.object({ routineId: z.string().nullish() });

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
  type: 'max_weight' | 'max_1rm' | 'max_volume';
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
  points: Array<{ date: string; maxWeight: number; volume: number; oneRm: number }>;
  records: PersonalRecord[];
}

export interface TodayWorkout {
  /** Fichas planejadas para hoje. */
  planned: Routine[];
  activeSession: WorkoutSession | null;
  /** Treino já finalizado hoje (se houver). */
  doneToday: WorkoutSessionSummary | null;
  weekCount: number;
  lastSession: WorkoutSessionSummary | null;
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
