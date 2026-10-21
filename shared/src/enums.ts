// Listas de valores fixos usados pelo banco, pelo servidor e pela interface.

export const BOOK_STATUSES = ['quero_ler', 'lendo', 'lido', 'abandonado'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];
export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  quero_ler: 'Quero ler',
  lendo: 'Lendo',
  lido: 'Lido',
  abandonado: 'Abandonado',
};

export const BOOK_NOTE_TYPES = ['ideia', 'citacao', 'duvida', 'aplicacao'] as const;
export type BookNoteType = (typeof BOOK_NOTE_TYPES)[number];
export const BOOK_NOTE_TYPE_LABELS: Record<BookNoteType, string> = {
  ideia: 'Ideia',
  citacao: 'Citação',
  duvida: 'Dúvida',
  aplicacao: 'Aplicação prática',
};

export const TASK_PRIORITIES = ['alta', 'media', 'baixa'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const TASK_STATUSES = ['pendente', 'em_andamento', 'concluida'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};

export const REMINDER_RECURRENCES = ['nenhuma', 'diaria', 'semanal'] as const;
export type ReminderRecurrence = (typeof REMINDER_RECURRENCES)[number];
export const REMINDER_RECURRENCE_LABELS: Record<ReminderRecurrence, string> = {
  nenhuma: 'Não repete',
  diaria: 'Todo dia',
  semanal: 'Toda semana',
};

export const EMAIL_CATEGORIES = ['urgente', 'responder', 'pode_esperar', 'ignorar'] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  urgente: 'Urgente',
  responder: 'Responder',
  pode_esperar: 'Pode esperar',
  ignorar: 'Ignorar',
};

export const TRIAGE_SOURCES = ['regra', 'ia', 'usuario'] as const;
export type TriageSource = (typeof TRIAGE_SOURCES)[number];

export const PR_TYPES = ['max_weight', 'max_1rm', 'max_volume', 'max_reps'] as const;
export type PrType = (typeof PR_TYPES)[number];
export const PR_TYPE_LABELS: Record<PrType, string> = {
  max_weight: 'Carga máxima',
  max_1rm: '1RM estimado',
  max_volume: 'Maior volume na série',
  max_reps: 'Mais repetições na série',
};

/** Como a série de um exercício é medida: repetições ou segundos (isometrias, como a prancha). */
export const EXERCISE_MEASURES = ['reps', 'tempo'] as const;
export type ExerciseMeasure = (typeof EXERCISE_MEASURES)[number];
export const EXERCISE_MEASURE_LABELS: Record<ExerciseMeasure, string> = {
  reps: 'Repetições',
  tempo: 'Tempo (segundos)',
};

/** Recordes das modalidades sem séries (corrida, caminhada, lutas). */
export const ACTIVITY_RECORD_TYPES = ['max_distance', 'best_pace', 'max_duration', 'max_rounds'] as const;
export type ActivityRecordType = (typeof ACTIVITY_RECORD_TYPES)[number];
export const ACTIVITY_RECORD_LABELS: Record<ActivityRecordType, string> = {
  max_distance: 'Maior distância',
  best_pace: 'Melhor pace',
  max_duration: 'Treino mais longo',
  max_rounds: 'Mais rounds num treino',
};

export const HABIT_AUTO_KEYS = ['treino', 'leitura'] as const;
export type HabitAutoKey = (typeof HABIT_AUTO_KEYS)[number];

export const LOG_LEVELS = ['info', 'success', 'warning', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const AI_ROLES = ['system', 'user', 'assistant'] as const;
export type AiRole = (typeof AI_ROLES)[number];

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;
