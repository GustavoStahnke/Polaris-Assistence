import { z } from 'zod';
import {
  REMINDER_RECURRENCES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type HabitAutoKey,
  type ReminderRecurrence,
  type TaskPriority,
  type TaskStatus,
} from '../enums';

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.');
const tagList = z.array(z.string().trim().min(1).max(40)).max(20).default([]);

// ===== Notas =====

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  bookId: string | null;
  bookTitle: string | null;
  taskId: string | null;
  taskTitle: string | null;
  /** Trecho com o termo buscado em destaque (só na busca). */
  snippet?: string;
  createdAt: string;
  updatedAt: string;
}

export const noteInputSchema = z
  .object({
    title: z.string().trim().max(200).default(''),
    content: z.string().trim().max(50000).default(''),
    tags: tagList,
    pinned: z.boolean().default(false),
    bookId: z.string().nullish(),
    taskId: z.string().nullish(),
  })
  .refine((n) => n.title.length > 0 || n.content.length > 0, 'A nota está vazia.');
export type NoteInput = z.infer<typeof noteInputSchema>;
export const noteUpdateSchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().trim().max(50000).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  pinned: z.boolean().optional(),
  bookId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
});

// ===== Tarefas =====

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, 'Dê um título à tarefa.').max(200),
  description: z.string().trim().max(5000).nullish(),
  priority: z.enum(TASK_PRIORITIES).default('media'),
  status: z.enum(TASK_STATUSES).default('pendente'),
  dueDate: dateKey.nullish(),
});
export type TaskInput = z.infer<typeof taskInputSchema>;

// ===== Lembretes =====

export interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  remindAt: string;
  recurrence: ReminderRecurrence;
  done: boolean;
  lastFiredAt: string | null;
  taskId: string | null;
}

export const reminderInputSchema = z.object({
  title: z.string().trim().min(1, 'Dê um título ao lembrete.').max(200),
  notes: z.string().trim().max(2000).nullish(),
  remindAt: z.iso.datetime({ offset: true, message: 'Data e hora inválidas.' }),
  recurrence: z.enum(REMINDER_RECURRENCES).default('nenhuma'),
  taskId: z.string().nullish(),
});
export type ReminderInput = z.infer<typeof reminderInputSchema>;

// ===== Hábitos =====

export interface Habit {
  id: string;
  name: string;
  icon: string;
  autoKey: HabitAutoKey | null;
  sortOrder: number;
  doneToday: boolean;
  streak: number;
  /** Últimos 7 dias, do mais antigo para hoje. */
  last7: Array<{ date: string; done: boolean }>;
  totalDays: number;
}

export const habitInputSchema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao hábito.').max(60),
  icon: z.string().trim().max(40).default('Target'),
});
export type HabitInput = z.infer<typeof habitInputSchema>;

export interface HabitHeatmap {
  year: number;
  habits: number;
  /** Dia → quantos hábitos foram marcados. */
  days: Record<string, number>;
}

// ===== Busca global e painel =====

export type SearchResultType = 'nota' | 'livro' | 'tarefa' | 'exercicio' | 'lembrete';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string | null;
  to: string;
}

export interface TodayAgenda {
  tasks: Task[];
  overdue: number;
  reminders: Reminder[];
}

export const HABIT_ICON_OPTIONS = [
  'Target',
  'Droplets',
  'BookOpen',
  'Dumbbell',
  'Moon',
  'Brain',
  'Flame',
  'HeartPulse',
  'Music',
  'Sun',
] as const;
