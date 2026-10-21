import { BOOK_STATUS_LABELS, BOOK_STATUSES, type Book, type BookStatus } from '@polaris/shared';
import { Library, Plus, Search, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { StarRating } from '../../components/ui/StarRating';
import { Tabs } from '../../components/ui/Tabs';
import { normalizeText } from '../../lib/text';
import { useBooks, useGoal, useSetGoal } from './api';
import { BookCover } from './BookCover';
import { LogReadingModal } from './LogReadingModal';

type Filter = 'todos' | BookStatus;

export function ShelfTab({ onAdd }: { onAdd: () => void }) {
  const books = useBooks();
  const [filter, setFilter] = useState<Filter>('todos');
  const [query, setQuery] = useState('');
  const [logging, setLogging] = useState<Book | null>(null);
  const list = useMemo(() => books.data ?? [], [books.data]);

  const visible = useMemo(() => {
    const q = normalizeText(query.trim());
    return list.filter(
      (b) =>
        (filter === 'todos' || b.status === filter) &&
        (!q || normalizeText(`${b.title} ${b.authors.join(' ')}`).includes(q)),
    );
  }, [list, filter, query]);

  const count = (s: BookStatus) => list.filter((b) => b.status === s).length;

  return (
    <div className="space-y-5">
      <GoalCard />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: 'todos', label: 'Todos', count: list.length },
            ...BOOK_STATUSES.map((s) => ({ id: s, label: BOOK_STATUS_LABELS[s], count: count(s) })),
          ]}
        />
        <div className="relative min-w-52 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar na estante…"
            className="pl-9"
            aria-label="Buscar na estante"
          />
        </div>
      </div>

      {books.isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-[2/3]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="glass">
          <EmptyState
            icon={Library}
            title={list.length === 0 ? 'Sua estante está vazia' : 'Nenhum livro neste filtro'}
            message={
              list.length === 0
                ? 'Adicione o livro que você está lendo e a Polaris acompanha seu progresso.'
                : undefined
            }
            action={
              list.length === 0 && (
                <Button variant="primary" icon={Plus} onClick={onAdd}>
                  Adicionar livro
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {visible.map((book, i) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.04 }}
              className="group"
            >
              <Link to={`/biblioteca/livro/${book.id}`} className="block">
                <div className="relative transition-transform duration-300 group-hover:-translate-y-1">
                  <BookCover
                    url={book.coverUrl}
                    title={book.title}
                    className="group-hover:shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                  />
                  {book.status === 'lendo' && (
                    <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-bg-deep/80">
                      <div
                        className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold">{book.title}</p>
                <p className="truncate text-xs text-text-dim">{book.authors.join(', ')}</p>
              </Link>
              <div className="mt-1 flex items-center justify-between gap-2">
                {book.status === 'lendo' ? (
                  <button
                    type="button"
                    className="label-mono text-[10px] text-primary hover:text-star"
                    onClick={() => setLogging(book)}
                  >
                    + páginas · {book.progress}%
                  </button>
                ) : book.rating ? (
                  <StarRating value={book.rating} size="sm" />
                ) : (
                  <span className="label-mono text-[10px] text-text-dim">
                    {BOOK_STATUS_LABELS[book.status]}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <LogReadingModal book={logging} onClose={() => setLogging(null)} />
    </div>
  );
}

/** Meta anual de livros com barra de progresso. */
function GoalCard() {
  const year = new Date().getFullYear();
  const goal = useGoal(year);
  const save = useSetGoal();
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState('');
  const data = goal.data;
  const percent = data?.targetBooks
    ? Math.min(100, Math.round((data.finishedBooks / data.targetBooks) * 100))
    : 0;

  return (
    <PolarisCard
      icon={Target}
      label={`Biblioteca · Meta ${year}`}
      title={
        data?.targetBooks ? `${data.finishedBooks} de ${data.targetBooks} livros` : 'Defina sua meta do ano'
      }
    >
      {data?.targetBooks && !editing ? (
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-2.5 min-w-52 flex-1 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-2 to-primary shadow-[0_0_10px_rgba(56,189,248,0.7)]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-sm text-star">{percent}%</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setTarget(String(data.targetBooks));
              setEditing(true);
            }}
          >
            Alterar
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Quantos livros?"
            className="w-40"
            aria-label="Meta de livros"
          />
          <Button
            size="sm"
            variant="primary"
            disabled={!Number(target)}
            loading={save.isPending}
            onClick={() =>
              save.mutate({ year, targetBooks: Number(target) }, { onSuccess: () => setEditing(false) })
            }
          >
            Salvar meta
          </Button>
        </div>
      )}
    </PolarisCard>
  );
}
