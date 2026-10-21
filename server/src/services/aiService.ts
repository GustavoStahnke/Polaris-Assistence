import {
  chatInputSchema,
  displayName,
  type AiBriefing,
  type BookIdeaSummary,
  type ChatResponse,
} from '@polaris/shared';
import { badRequest, notFound, parseInput } from '../lib/http';
import * as aiRepo from '../repositories/aiRepository';
import * as libraryRepo from '../repositories/libraryRepository';
import { polarisSystemPrompt } from './aiPrompts';
import { getBriefingContext } from './briefingService';
import { getOrFetch } from './cacheService';
import { askAI, getAiStatus, isAiAvailable } from './integrationService';
import { getProfile } from './settingsService';

export const getStatus = getAiStatus;

// ===== Canal Polaris =====

export const listConversations = () => aiRepo.listConversations();

export function getConversation(id: string) {
  const conversation = aiRepo.getConversation(id);
  if (!conversation) throw notFound('Conversa não encontrada.');
  return conversation;
}

export function deleteConversation(id: string) {
  if (!aiRepo.deleteConversation(id)) throw notFound('Conversa não encontrada.');
}

/** Conversa com a Polaris. O briefing do dia vai junto como contexto; o histórico fica salvo. */
export async function chat(input: unknown): Promise<ChatResponse> {
  const { conversationId, message } = parseInput(chatInputSchema, input);
  let id = conversationId ?? null;
  if (id && !aiRepo.getConversation(id)) throw notFound('Conversa não encontrada.');
  if (!isAiAvailable()) throw badRequest('Conecte a IA em Integrações para conversar com a Polaris.');
  if (!id) id = aiRepo.createConversation(message.length > 60 ? `${message.slice(0, 57)}…` : message);

  const userMessage = aiRepo.addMessage(id, 'user', message);
  const history = aiRepo.listMessages(id).slice(-20);
  const system = polarisSystemPrompt(displayName(getProfile()), await getBriefingContext());
  try {
    const { content, model } = await askAI([
      { role: 'system', content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]);
    const reply = aiRepo.addMessage(id, 'assistant', content, model);
    aiRepo.touchConversation(id);
    return { conversationId: id, userMessage, reply };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'erro desconhecido';
    const reply = aiRepo.addMessage(
      id,
      'assistant',
      `Não consegui pensar agora (${reason}). Confira se o Ollama está aberto.`,
    );
    return { conversationId: id, userMessage, reply };
  }
}

// ===== Frase do briefing (Núcleo) =====

/** Frase do briefing escrita pela IA (guardada por 1 hora). */
export async function getAiBriefing(
  options: { force?: boolean } = {},
  now: Date = new Date(),
): Promise<AiBriefing> {
  if (!isAiAvailable()) return { available: false, sentence: null, generatedAt: null };
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  try {
    const result = await getOrFetch(
      `briefing:ai:${hourKey}`,
      60,
      async () => {
        const context = await getBriefingContext(now);
        const { content } = await askAI(
          [
            { role: 'system', content: polarisSystemPrompt(displayName(getProfile()), context) },
            {
              role: 'user',
              content:
                'Escreva UMA frase curta (até 25 palavras), sem saudação, que resuma o meu dia de forma útil e motivadora, destacando o mais importante. Responda só com a frase.',
            },
          ],
          { temperature: 0.7 },
        );
        return content.replace(/^["“]|["”]$/g, '').trim();
      },
      options,
    );
    return { available: true, sentence: result.data, generatedAt: result.fetchedAt };
  } catch {
    return { available: true, sentence: null, generatedAt: null };
  }
}

// ===== "Minhas ideias sobre o livro" =====

/** Resume as IDEIAS DO USUÁRIO a partir das anotações dele (não é um resumo do livro). */
export async function generateBookSummary(bookId: string): Promise<BookIdeaSummary> {
  const book = libraryRepo.getBook(bookId);
  if (!book) throw notFound('Livro não encontrado.');
  const notes = libraryRepo.listNotes(bookId);
  if (notes.length === 0)
    throw badRequest('Escreva algumas anotações primeiro: o resumo é sobre as suas ideias.');
  if (!isAiAvailable()) throw badRequest('Conecte a IA em Integrações para gerar o resumo.');

  const notesText = notes
    .map(
      (n) =>
        `- [${n.type}${n.chapter ? `, ${n.chapter}` : ''}${n.page !== null ? `, p. ${n.page}` : ''}] ${n.content}${n.tags.length ? ` (tags: ${n.tags.join(', ')})` : ''}`,
    )
    .join('\n');
  const { content, model } = await askAI(
    [
      {
        role: 'system',
        content:
          'Você é a Polaris. Escreva em português do Brasil. Sua tarefa é organizar as ideias do PRÓPRIO usuário sobre um livro, a partir das anotações dele. Não resuma o livro e não acrescente ideias que não estejam nas anotações.',
      },
      {
        role: 'user',
        content: `Livro: "${book.title}"${book.authors.length ? ` de ${book.authors.join(', ')}` : ''}.\nMinhas anotações:\n${notesText}\n\nEscreva "Minhas ideias sobre o livro" em 3 a 6 tópicos curtos (use "- " no início de cada um), agrupando ideias parecidas e terminando com um tópico "Para aplicar:" com as ações práticas que eu anotei (se houver).`,
      },
    ],
    { temperature: 0.4 },
  );
  return libraryRepo.saveIdeaSummary(bookId, content, model, false);
}

/** O usuário edita o resumo gerado. */
export function updateBookSummary(bookId: string, content: unknown): BookIdeaSummary {
  if (typeof content !== 'string' || !content.trim()) throw badRequest('O resumo não pode ficar vazio.');
  if (!libraryRepo.getBookRow(bookId)) throw notFound('Livro não encontrado.');
  return libraryRepo.saveIdeaSummary(bookId, content.trim(), null, true);
}
