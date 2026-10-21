import { z } from 'zod';
import type { AiRole } from '../enums';

export interface OllamaModel {
  name: string;
  sizeBytes: number | null;
  parameterSize: string | null;
}

export interface AiStatus {
  available: boolean;
  model: string | null;
  message: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiRole;
  content: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages?: AiMessage[];
}

export const chatInputSchema = z.object({
  conversationId: z.string().nullish(),
  message: z.string().trim().min(1, 'Escreva uma mensagem.').max(4000),
});

export interface ChatResponse {
  conversationId: string;
  userMessage: AiMessage;
  reply: AiMessage;
}

/** Resumo do dia usado no Núcleo, no Canal Polaris e nos alertas. */
export interface Briefing {
  /** Frase-resumo montada por modelo de texto (sem IA). */
  sentence: string;
  greetingName: string;
  parts: Array<{ key: string; label: string; to: string }>;
}

export interface AiBriefing {
  available: boolean;
  sentence: string | null;
  generatedAt: string | null;
}
