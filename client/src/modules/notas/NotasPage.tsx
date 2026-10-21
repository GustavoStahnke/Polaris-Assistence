import type { Note } from '@polaris/shared';
import { BookOpen, ListTodo, Pin, Search, StickyNote } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatRelative } from '../../lib/format';
import { useNotes } from './api';
import { NoteForm } from './NoteForm';

export function NotasPage() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();
  const notes = useNotes(debounced);
  const list = useMemo(() => notes.data ?? [], [notes.data]);
  const openId = params.get('abrir');
  const editing = list.find((n) => n.id === openId) ?? null;

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const tags = useMemo(() => [...new Set(list.flatMap((n) => n.tags))].sort(), [list]);
  const visible = list.filter((n) => !tag || n.tags.includes(tag));
  const pinned = visible.filter((n) => n.pinned);
  const others = visible.filter((n) => !n.pinned);

  return (
    <>
      <PageHeader label="Segundo cérebro · Notas" title="Notas" />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <PolarisCard
          icon={StickyNote}
          label="Notas · Captura rápida"
          title="Nova nota"
          className="self-start"
        >
          <NoteForm />
        </PolarisCard>

        <div className="min-w-0 space-y-5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar em todas as notas (título, texto e tags)…"
              className="pl-9"
              aria-label="Buscar notas"
            />
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Button variant="pill" active={tag === null} onClick={() => setTag(null)}>
                Todas
              </Button>
              {tags.map((t) => (
                <Button
                  key={t}
                  variant="pill"
                  active={tag === t}
                  onClick={() => setTag(tag === t ? null : t)}
                >
                  #{t}
                </Button>
              ))}
            </div>
          )}

          {visible.length === 0 && !notes.isPending && (
            <div className="glass">
              <EmptyState
                icon={StickyNote}
                title={debounced ? 'Nada encontrado' : 'Seu segundo cérebro está vazio'}
                message={
                  debounced
                    ? 'Tente outras palavras.'
                    : 'Capture ideias, listas e lembretes soltos. A busca encontra tudo depois.'
                }
              />
            </div>
          )}

          {pinned.length > 0 && (
            <section>
              <p className="label-mono mb-3 flex items-center gap-1.5 text-primary">
                <Pin className="h-3.5 w-3.5" /> Fixadas
              </p>
              <NotesGrid notes={pinned} onOpen={(id) => setParams({ abrir: id })} />
            </section>
          )}
          {others.length > 0 && (
            <section>
              {pinned.length > 0 && <p className="label-mono mb-3 text-text-dim">Outras</p>}
              <NotesGrid notes={others} onOpen={(id) => setParams({ abrir: id })} />
            </section>
          )}
        </div>
      </div>

      <Modal open={editing !== null} onClose={() => setParams({})} title="Editar nota" className="max-w-2xl">
        {editing && <NoteForm key={editing.id} note={editing} onDone={() => setParams({})} />}
      </Modal>
    </>
  );
}

function NotesGrid({ notes, onOpen }: { notes: Note[]; onOpen: (id: string) => void }) {
  return (
    <div className="gap-4 md:columns-2 2xl:columns-3">
      {notes.map((note, i) => (
        <motion.button
          key={note.id}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i, 12) * 0.03 }}
          onClick={() => onOpen(note.id)}
          className="glass mb-4 block w-full break-inside-avoid p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50"
        >
          {note.title && <p className="font-semibold">{note.title}</p>}
          {note.snippet ? (
            <p className="mt-1 text-sm text-text-dim">
              {note.snippet.split(/(«[^»]*»)/).map((part, j) =>
                part.startsWith('«') ? (
                  <mark key={j} className="rounded bg-primary/25 px-0.5 text-star">
                    {part.slice(1, -1)}
                  </mark>
                ) : (
                  part
                ),
              )}
            </p>
          ) : (
            note.content && (
              <p className="mt-1 line-clamp-6 text-sm whitespace-pre-wrap text-text-dim">{note.content}</p>
            )
          )}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {note.tags.map((t) => (
              <Badge key={t} tone="muted">
                #{t}
              </Badge>
            ))}
            {note.bookTitle && (
              <Badge tone="star">
                <BookOpen className="h-3 w-3" /> {note.bookTitle}
              </Badge>
            )}
            {note.taskTitle && (
              <Badge tone="primary">
                <ListTodo className="h-3 w-3" /> {note.taskTitle}
              </Badge>
            )}
            <span className="label-mono ml-auto text-[10px] text-text-dim">
              {formatRelative(note.updatedAt)}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
