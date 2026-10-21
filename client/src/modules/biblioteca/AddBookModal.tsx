import {
  BOOK_STATUS_LABELS,
  BOOK_STATUSES,
  type BookInput,
  type BookSearchResult,
  type BookStatus,
} from '@polaris/shared';
import { Loader2, PenLine, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useBookSearch, useCreateBook } from './api';
import { BookCover } from './BookCover';

/** Adicionar livro: busca na Open Library (título, autor ou ISBN) ou cadastro à mão. */
export function AddBookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'busca' | 'manual'>('busca');
  return (
    <Modal open={open} onClose={onClose} title="Adicionar livro" className="max-w-2xl">
      <Tabs
        className="mb-4"
        value={mode}
        onChange={setMode}
        tabs={[
          { id: 'busca', label: 'Buscar na Open Library' },
          { id: 'manual', label: 'Cadastrar à mão' },
        ]}
      />
      {mode === 'busca' ? <SearchPanel onAdded={onClose} /> : <ManualForm onAdded={onClose} />}
    </Modal>
  );
}

function SearchPanel({ onAdded }: { onAdded: () => void }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<BookStatus>('quero_ler');
  const search = useBookSearch(debounced);
  const create = useCreateBook();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 500);
    return () => clearTimeout(id);
  }, [query]);

  const add = async (result: BookSearchResult) => {
    await create.mutateAsync({
      title: result.title,
      subtitle: result.subtitle,
      authors: result.authors,
      isbn: result.isbn,
      openLibraryKey: result.key,
      coverUrl: result.coverUrl,
      pageCount: result.pageCount,
      subjects: result.subjects,
      publishYear: result.publishYear,
      status,
    });
    onAdded();
  };

  const results = search.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
            aria-hidden
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Título, autor ou ISBN…"
            className="pl-9"
            aria-label="Buscar livro"
          />
          {search.isFetching && (
            <Loader2
              className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-primary"
              aria-hidden
            />
          )}
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as BookStatus)}
          aria-label="Adicionar como"
          className="w-auto"
        >
          {BOOK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOK_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {search.data && search.data.state !== 'ok' && search.data.error && (
        <p className="text-sm text-danger">{search.data.error}</p>
      )}
      {debounced.length >= 2 && search.isSuccess && results.length === 0 && (
        <p className="text-sm text-text-dim">Nenhum livro encontrado. Tente outro termo ou cadastre à mão.</p>
      )}

      <ul className="grid max-h-[50vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {results.map((r) => (
          <li key={r.key} className="flex gap-3 rounded-xl border border-border/60 p-3">
            <BookCover
              url={r.coverUrl?.replace('-L.jpg', '-M.jpg') ?? null}
              title={r.title}
              className="w-16 shrink-0"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="line-clamp-2 text-sm font-semibold">{r.title}</p>
              <p className="truncate text-xs text-text-dim">{r.authors.join(', ') || 'Autor desconhecido'}</p>
              <p className="text-xs text-text-dim">
                {[r.publishYear, r.pageCount && `${r.pageCount} páginas`].filter(Boolean).join(' · ')}
              </p>
              <Button
                size="sm"
                variant="primary"
                icon={Plus}
                className="mt-auto self-start"
                loading={create.isPending && create.variables?.openLibraryKey === r.key}
                onClick={() => void add(r)}
              >
                Adicionar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ManualForm({ onAdded }: { onAdded: () => void }) {
  const create = useCreateBook();
  const [form, setForm] = useState({
    title: '',
    authors: '',
    pageCount: '',
    publishYear: '',
    status: 'quero_ler' as BookStatus,
  });
  const submit = async () => {
    const input: BookInput = {
      title: form.title,
      authors: form.authors
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      pageCount: form.pageCount ? Number(form.pageCount) : null,
      publishYear: form.publishYear ? Number(form.publishYear) : null,
      subjects: [],
      status: form.status,
    };
    await create.mutateAsync(input);
    onAdded();
  };
  return (
    <div className="space-y-4">
      <Field label="Título">
        {(id) => (
          <Input id={id} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        )}
      </Field>
      <Field label="Autores" hint="Separe por vírgula.">
        {(id) => (
          <Input
            id={id}
            value={form.authors}
            onChange={(e) => setForm({ ...form, authors: e.target.value })}
          />
        )}
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Páginas">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={1}
              value={form.pageCount}
              onChange={(e) => setForm({ ...form, pageCount: e.target.value })}
            />
          )}
        </Field>
        <Field label="Ano">
          {(id) => (
            <Input
              id={id}
              type="number"
              value={form.publishYear}
              onChange={(e) => setForm({ ...form, publishYear: e.target.value })}
            />
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select
              id={id}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
            >
              {BOOK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BOOK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Button
        variant="primary"
        icon={PenLine}
        loading={create.isPending}
        disabled={!form.title.trim()}
        onClick={() => void submit()}
      >
        Cadastrar livro
      </Button>
    </div>
  );
}
