import {
  BOOK_NOTE_TYPE_LABELS,
  BOOK_NOTE_TYPES,
  BOOK_STATUS_LABELS,
  BOOK_STATUSES,
  type BookNote,
  type BookNoteInput,
  type BookNoteType,
  type BookStatus,
  type BookUpdate,
} from '@polaris/shared';
import { ArrowLeft, BookOpenCheck, NotebookPen, Pencil, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { StarRating } from '../../components/ui/StarRating';
import { Tabs } from '../../components/ui/Tabs';
import { formatDateTime, formatShortDate } from '../../lib/format';
import {
  useBook,
  useCreateNote,
  useDeleteBook,
  useDeleteNote,
  useDeleteReading,
  useUpdateBook,
  useUpdateNote,
} from './api';
import { BookCover } from './BookCover';
import { IdeaSummaryPanel } from './IdeaSummaryPanel';
import { LogReadingModal } from './LogReadingModal';

const NOTE_TONES: Record<BookNoteType, BadgeTone> = {
  ideia: 'primary',
  citacao: 'star',
  duvida: 'warning',
  aplicacao: 'success',
};

export function BookDetailPage() {
  const { bookId } = useParams();
  const query = useBook(bookId);
  const update = useUpdateBook();
  const remove = useDeleteBook();
  const removeReading = useDeleteReading();
  const navigate = useNavigate();
  const [logging, setLogging] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (query.isPending) return <PolarisCard label="Biblioteca · Livro" state="loading" />;
  if (!query.data) {
    return (
      <EmptyState
        title="Livro não encontrado"
        action={
          <Link to="/biblioteca" className="label-mono text-primary">
            Voltar para a estante
          </Link>
        }
      />
    );
  }

  const { book, notes, sessions, summary } = query.data;
  const patch = (data: BookUpdate) => update.mutate({ id: book.id, ...data });

  return (
    <>
      <Link
        to="/biblioteca"
        className="label-mono mb-4 inline-flex items-center gap-1 text-text-dim hover:text-star"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Estante
      </Link>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <BookCover
            url={book.coverUrl}
            title={book.title}
            className="mx-auto max-w-[220px] shadow-[0_0_40px_rgba(56,189,248,0.25)]"
          />
          <div className="glass space-y-4 p-4">
            <Field label="Status">
              {(id) => (
                <Select
                  id={id}
                  value={book.status}
                  onChange={(e) => patch({ status: e.target.value as BookStatus })}
                >
                  {BOOK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {BOOK_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div>
              <p className="label-mono mb-1 text-text-dim">Avaliação</p>
              <StarRating value={book.rating} onChange={(rating) => patch({ rating })} />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <Field label="Início">
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    value={book.startedAt ?? ''}
                    onChange={(e) => patch({ startedAt: e.target.value || null })}
                  />
                )}
              </Field>
              <Field label="Fim">
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    value={book.finishedAt ?? ''}
                    onChange={(e) => patch({ finishedAt: e.target.value || null })}
                  />
                )}
              </Field>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              className="w-full justify-center"
              onClick={() => {
                if (
                  window.confirm(`Remover "${book.title}" da estante? As anotações também serão apagadas.`)
                ) {
                  remove.mutate(book.id, { onSuccess: () => navigate('/biblioteca') });
                }
              }}
            >
              Remover da estante
            </Button>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div>
            <p className="label-mono text-primary">Biblioteca · {BOOK_STATUS_LABELS[book.status]}</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{book.title}</h1>
            {book.subtitle && <p className="text-text-dim">{book.subtitle}</p>}
            <p className="mt-1 text-sm text-text-dim">
              {[book.authors.join(', '), book.publishYear, book.pageCount && `${book.pageCount} páginas`]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {book.subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {book.subjects.slice(0, 8).map((s) => (
                  <Badge key={s} tone="muted">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
            {book.description && (
              <div className="mt-4 text-sm leading-relaxed text-text-dim">
                <p className={showFullDescription ? undefined : 'line-clamp-4'}>{book.description}</p>
                <button
                  type="button"
                  className="label-mono mt-1 text-primary"
                  onClick={() => setShowFullDescription((v) => !v)}
                >
                  {showFullDescription ? 'Mostrar menos' : 'Ler mais'}
                </button>
              </div>
            )}
          </div>

          <PolarisCard
            icon={BookOpenCheck}
            label="Leitura · Progresso"
            title={`Página ${book.currentPage}${book.pageCount ? ` de ${book.pageCount}` : ''}`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-2.5 min-w-52 flex-1 overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-2 to-primary shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
              <span className="font-mono text-star">{book.progress}%</span>
              <Button
                variant="primary"
                icon={BookOpenCheck}
                onClick={() => setLogging(true)}
                disabled={book.status === 'lido'}
              >
                + páginas
              </Button>
            </div>
            {sessions.length > 0 && (
              <ul className="mt-4 max-h-48 divide-y divide-border/40 overflow-y-auto">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="font-mono text-text-dim">{formatShortDate(`${s.date}T12:00:00`)}</span>
                    <span className="flex-1">
                      +{s.pagesRead} páginas
                      {s.toPage !== null && <span className="text-text-dim"> (até a {s.toPage})</span>}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      icon={X}
                      aria-label="Apagar registro"
                      onClick={() => removeReading.mutate(s.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </PolarisCard>

          <IdeaSummaryPanel bookId={book.id} summary={summary} notesCount={notes.length} />

          <NotesSection bookId={book.id} notes={notes} />
        </div>
      </div>

      <LogReadingModal book={logging ? book : null} onClose={() => setLogging(false)} />
    </>
  );
}

function NotesSection({ bookId, notes }: { bookId: string; notes: BookNote[] }) {
  const [filter, setFilter] = useState<'todas' | BookNoteType>('todas');
  const [editing, setEditing] = useState<string | null>(null);
  const remove = useDeleteNote();
  const visible = notes.filter((n) => filter === 'todas' || n.type === filter);

  return (
    <PolarisCard icon={NotebookPen} label="Biblioteca · Anotações" title={`${notes.length} anotação(ões)`}>
      <NoteForm bookId={bookId} />
      <Tabs
        className="my-4"
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'todas', label: 'Todas', count: notes.length },
          ...BOOK_NOTE_TYPES.map((t) => ({
            id: t,
            label: BOOK_NOTE_TYPE_LABELS[t],
            count: notes.filter((n) => n.type === t).length,
          })),
        ]}
      />
      {visible.length === 0 ? (
        <p className="text-sm text-text-dim">
          Nenhuma anotação aqui. Registre ideias, citações, dúvidas e aplicações práticas.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((note) =>
            editing === note.id ? (
              <li key={note.id}>
                <NoteForm bookId={bookId} note={note} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={note.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={NOTE_TONES[note.type]}>{BOOK_NOTE_TYPE_LABELS[note.type]}</Badge>
                  {(note.chapter || note.page !== null) && (
                    <span className="label-mono text-[10px] text-text-dim">
                      {[note.chapter, note.page !== null && `p. ${note.page}`].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  <span className="ml-auto flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      icon={Pencil}
                      aria-label="Editar anotação"
                      onClick={() => setEditing(note.id)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      icon={Trash2}
                      aria-label="Apagar anotação"
                      onClick={() => window.confirm('Apagar esta anotação?') && remove.mutate(note.id)}
                    />
                  </span>
                </div>
                <p
                  className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${note.type === 'citacao' ? 'border-l-2 border-star/60 pl-3 italic' : ''}`}
                >
                  {note.content}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {note.tags.map((t) => (
                    <Badge key={t} tone="muted">
                      #{t}
                    </Badge>
                  ))}
                  <span className="label-mono ml-auto text-[10px] text-text-dim">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </PolarisCard>
  );
}

function NoteForm({ bookId, note, onDone }: { bookId: string; note?: BookNote; onDone?: () => void }) {
  const create = useCreateNote();
  const update = useUpdateNote();
  const empty: BookNoteInput = { type: 'ideia', content: '', chapter: '', page: null, tags: [] };
  const [form, setForm] = useState<BookNoteInput>(
    note
      ? {
          type: note.type,
          content: note.content,
          chapter: note.chapter ?? '',
          page: note.page,
          tags: note.tags,
        }
      : empty,
  );
  const [tags, setTags] = useState(note?.tags.join(', ') ?? '');

  const submit = async () => {
    const input = {
      ...form,
      chapter: form.chapter || null,
      tags: tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
    };
    if (note) {
      await update.mutateAsync({ id: note.id, ...input });
      onDone?.();
    } else {
      await create.mutateAsync({ bookId, ...input });
      setForm(empty);
      setTags('');
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Tipo">
          {(id) => (
            <Select
              id={id}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as BookNoteType })}
            >
              {BOOK_NOTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BOOK_NOTE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Capítulo">
          {(id) => (
            <Input
              id={id}
              value={form.chapter ?? ''}
              onChange={(e) => setForm({ ...form, chapter: e.target.value })}
            />
          )}
        </Field>
        <Field label="Página">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              value={form.page ?? ''}
              onChange={(e) =>
                setForm({ ...form, page: e.target.value === '' ? null : Number(e.target.value) })
              }
            />
          )}
        </Field>
        <Field label="Tags">
          {(id) => (
            <Input
              id={id}
              value={tags}
              placeholder="foco, hábitos"
              onChange={(e) => setTags(e.target.value)}
            />
          )}
        </Field>
      </div>
      <Textarea
        rows={3}
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder={form.type === 'citacao' ? 'Copie o trecho que marcou você…' : 'Escreva sua ideia…'}
        aria-label="Anotação"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          icon={Save}
          disabled={!form.content.trim()}
          loading={create.isPending || update.isPending}
          onClick={() => void submit()}
        >
          {note ? 'Salvar' : 'Adicionar anotação'}
        </Button>
        {note && (
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
