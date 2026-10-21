import type { Book } from '@polaris/shared';
import { BookOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { useCurrentReading } from './api';
import { BookCover } from './BookCover';
import { LogReadingModal } from './LogReadingModal';

/** Card "Leitura atual" do Painel: capa, progresso e "+ páginas". */
export function CurrentReadingCard({ index, className }: { index?: number; className?: string }) {
  const current = useCurrentReading();
  const [logging, setLogging] = useState<Book | null>(null);
  const book = current.data?.[0];
  const others = current.data?.length ? current.data.length - 1 : 0;

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={BookOpen}
      label="Biblioteca · Leitura"
      title={book?.title ?? 'Nenhuma leitura em andamento'}
      state={current.isPending ? 'loading' : current.isError ? 'error' : book ? 'ready' : 'empty'}
      emptyTitle="Que tal começar um livro?"
      emptyMessage="Marque um livro como “Lendo” e acompanhe o progresso por aqui."
      emptyAction={
        <Link to="/biblioteca" className="label-mono text-primary hover:text-star">
          Abrir estante →
        </Link>
      }
      errorMessage="Não foi possível carregar a leitura."
      footer={
        book
          ? `Página ${book.currentPage}${book.pageCount ? ` de ${book.pageCount}` : ''}${others ? ` · +${others} em leitura` : ''}`
          : undefined
      }
      to={book ? `/biblioteca/livro/${book.id}` : '/biblioteca'}
    >
      {book && (
        <div className="flex gap-4">
          <BookCover url={book.coverUrl} title={book.title} className="w-20 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm text-text-dim">{book.authors.join(', ')}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-2 to-primary shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                style={{ width: `${book.progress}%` }}
              />
            </div>
            <p className="mt-1.5 font-mono text-sm text-star">{book.progress}% lido</p>
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              className="mt-auto self-start"
              onClick={() => setLogging(book)}
            >
              Páginas
            </Button>
          </div>
        </div>
      )}
      <LogReadingModal book={logging} onClose={() => setLogging(null)} />
    </PolarisCard>
  );
}
