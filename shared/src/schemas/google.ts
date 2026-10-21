import { z } from 'zod';
import { EMAIL_CATEGORIES, type EmailCategory, type TriageSource } from '../enums';

export interface CalendarInfo {
  id: string;
  name: string;
  color: string | null;
  primary: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  calendarName: string | null;
  color: string | null;
  title: string;
  /** ISO (com hora) ou YYYY-MM-DD quando é o dia inteiro. */
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  link: string | null;
}

/** Item da agenda: evento do Google ou lembrete local do Polaris. */
export interface AgendaItem {
  id: string;
  source: 'google' | 'lembrete';
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  location: string | null;
  color: string | null;
  link: string | null;
  calendarName: string | null;
}

export interface AgendaResponse {
  state: 'ok' | 'stale' | 'error' | 'not_configured' | 'disabled';
  error: string | null;
  fetchedAt: string | null;
  from: string;
  to: string;
  items: AgendaItem[];
  next: AgendaItem | null;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  important: boolean;
  isVip: boolean;
  hasUnsubscribe: boolean;
  labels: string[];
  link: string;
}

export interface TriagedEmail extends EmailMessage {
  category: EmailCategory;
  triageSource: TriageSource;
  reason: string | null;
}

export interface EmailResponse {
  state: 'ok' | 'stale' | 'error' | 'not_configured' | 'disabled';
  error: string | null;
  fetchedAt: string | null;
  emails: TriagedEmail[];
  counts: Record<EmailCategory, number>;
}

export const triageUpdateSchema = z.object({ category: z.enum(EMAIL_CATEGORIES) });

export interface VipSender {
  id: string;
  email: string;
  name: string | null;
}

export const vipSenderInputSchema = z.object({
  email: z.email('E-mail inválido.').transform((e) => e.toLowerCase()),
  name: z.string().trim().max(80).nullish(),
});
