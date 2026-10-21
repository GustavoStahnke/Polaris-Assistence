import type { Note } from '@polaris/shared';
import { Pin, PinOff, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { useBooks } from '../biblioteca/api';
import { useTasks } from '../tarefas/api';
import { useNoteMutations } from './api';

/** Formulário de nota (nova ou edição). Ctrl+Enter salva. */
export function NoteForm({
  note,
  onDone,
  autoFocus,
}: {
  note?: Note;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const { create, update, remove } = useNoteMutations();
  const books = useBooks();
  const tasks = useTasks();
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '');
  const [pinned, setPinned] = useState(note?.pinned ?? false);
  const [bookId, setBookId] = useState(note?.bookId ?? '');
  const [taskId, setTaskId] = useState(note?.taskId ?? '');

  const submit = async () => {
    if (!title.trim() && !content.trim()) return;
    const input = {
      title: title.trim(),
      content: content.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
      pinned,
      bookId: bookId || null,
      taskId: taskId || null,
    };
    if (note) await update.mutateAsync({ id: note.id, ...input });
    else await create.mutateAsync(input);
    if (!note) {
      setTitle('');
      setContent('');
      setTags('');
      setPinned(false);
      setBookId('');
      setTaskId('');
    }
    onDone?.();
  };

  return (
    <div
      className="@container space-y-3"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          void submit();
        }
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Título (opcional)"
        aria-label="Título"
      />
      <Textarea
        autoFocus={autoFocus}
        rows={6}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Solte a ideia aqui…"
        aria-label="Conteúdo da nota"
      />
      <div className="grid gap-3 @lg:grid-cols-3">
        <Field label="Tags">
          {(id) => (
            <Input
              id={id}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ideias, trabalho"
            />
          )}
        </Field>
        <Field label="Livro (opcional)">
          {(id) => (
            <Select id={id} value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">Nenhum</option>
              {books.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Tarefa (opcional)">
          {(id) => (
            <Select id={id} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
              <option value="">Nenhuma</option>
              {tasks.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          icon={Save}
          loading={create.isPending || update.isPending}
          disabled={!title.trim() && !content.trim()}
          onClick={() => void submit()}
        >
          Salvar
        </Button>
        <Button
          variant="ghost"
          icon={pinned ? PinOff : Pin}
          onClick={() => setPinned(!pinned)}
          aria-pressed={pinned}
        >
          {pinned ? 'Desafixar' : 'Fixar'}
        </Button>
        <span className="label-mono hidden text-[10px] text-text-dim sm:inline">Ctrl + Enter salva</span>
        {note && (
          <Button
            variant="ghost"
            icon={Trash2}
            className="ml-auto"
            onClick={() => {
              if (window.confirm('Apagar esta nota?')) remove.mutate(note.id, { onSuccess: onDone });
            }}
          >
            Apagar
          </Button>
        )}
      </div>
    </div>
  );
}
