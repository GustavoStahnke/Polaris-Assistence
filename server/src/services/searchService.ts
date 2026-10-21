import type { SearchResult } from '@polaris/shared';
import { formatInTimeZone } from './textFormat';
import * as repo from '../repositories/productivityRepository';

/** Busca global da paleta Ctrl+K: notas (texto completo), livros, tarefas, exercícios e lembretes. */
export function searchEverything(query: string): SearchResult[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const results: SearchResult[] = [];
  for (const note of repo.searchNotes(q, 5)) {
    results.push({
      type: 'nota',
      id: note.id,
      title: note.title || note.content.slice(0, 60),
      subtitle: note.snippet?.replace(/[«»]/g, '') ?? null,
      to: `/notas?abrir=${note.id}`,
    });
  }
  for (const book of repo.searchBooksByText(q)) {
    results.push({
      type: 'livro',
      id: book.id,
      title: book.title,
      subtitle: book.authors.join(', '),
      to: `/biblioteca/livro/${book.id}`,
    });
  }
  for (const task of repo.searchTasksByText(q)) {
    results.push({
      type: 'tarefa',
      id: task.id,
      title: task.title,
      subtitle:
        task.status === 'concluida'
          ? 'Concluída'
          : task.dueDate
            ? `Prazo ${task.dueDate.split('-').reverse().join('/')}`
            : null,
      to: '/tarefas',
    });
  }
  for (const reminder of repo.searchRemindersByText(q)) {
    results.push({
      type: 'lembrete',
      id: reminder.id,
      title: reminder.title,
      subtitle: formatInTimeZone(reminder.remindAt),
      to: '/tarefas?aba=lembretes',
    });
  }
  for (const exercise of repo.searchExercisesByText(q)) {
    results.push({
      type: 'exercicio',
      id: exercise.id,
      title: exercise.name,
      subtitle: exercise.muscleGroup,
      to: '/academia?aba=exercicios',
    });
  }
  return results;
}
