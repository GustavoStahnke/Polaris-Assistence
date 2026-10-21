import type { BookRecommendation } from '@polaris/shared';
import * as libraryRepo from '../repositories/libraryRepository';
import { extractJson } from './aiPrompts';
import { askAI, isAiAvailable } from './integrationService';

/**
 * Com a IA conectada, cada sugestão ganha um motivo personalizado
 * ("porque você gostou de X e anotou muito sobre Y").
 */
export async function explainRecommendations(items: BookRecommendation[]): Promise<number> {
  if (!isAiAvailable() || items.length === 0) return 0;
  const books = libraryRepo.listAllBookRows().filter((b) => (b.rating ?? 0) >= 4 || b.status === 'lido');
  const favorites = books
    .slice(0, 8)
    .map((b) => {
      const notes = libraryRepo.listNotes(b.id);
      const tags = [...new Set(notes.flatMap((n) => n.tags))].slice(0, 6);
      return `- "${b.title}" (nota ${b.rating ?? 'sem nota'}; ${notes.length} anotações${tags.length ? `; temas anotados: ${tags.join(', ')}` : ''})`;
    })
    .join('\n');
  const candidates = items
    .map(
      (r) =>
        `{"id":"${r.id}","titulo":${JSON.stringify(r.title)},"autores":${JSON.stringify(r.authors.join(', '))},"assuntos":${JSON.stringify(r.subjects.slice(0, 5).join(', '))}}`,
    )
    .join(',\n');
  try {
    const { content } = await askAI(
      [
        {
          role: 'system',
          content:
            'Você é a Polaris e recomenda livros em português do Brasil. Para cada sugestão, escreva um motivo curto (até 20 palavras) ligando a sugestão aos livros favoritos e aos temas que o usuário anotou. Responda SOMENTE com JSON: {"items":[{"id":"...","reason":"..."}]}.',
        },
        { role: 'user', content: `Meus livros favoritos:\n${favorites}\n\nSugestões:\n[${candidates}]` },
      ],
      { json: true, temperature: 0.5 },
    );
    const parsed = extractJson<{ items?: Array<{ id?: string; reason?: string }> }>(content);
    let updated = 0;
    for (const item of parsed?.items ?? []) {
      if (item.id && item.reason && items.some((r) => r.id === item.id)) {
        libraryRepo.updateRecommendationReason(item.id, item.reason.slice(0, 200));
        updated += 1;
      }
    }
    return updated;
  } catch {
    return 0;
  }
}
